# Shelf → Rede social de comida · Roadmap

> Plano da virada do Shelf: de app de organização de cozinha para uma **rede
> social focada em comida**, sem perder o núcleo (estoque, validade, receitas,
> lista de compras) — é a rede social que também te ajuda a cozinhar.

---

## 1. Visão

As pessoas usam o Shelf para:

- **Compartilhar comida**: o que cozinharam, onde estão comendo, o que provaram.
- **Seguir** outras pessoas e ver tudo isso num **feed**.
- **Interagir**: curtir, comentar, salvar.
- **Avaliar restaurantes e pratos** (notas, reviews, fotos).
- **Abrir a cozinha**: deixar o estoque público pra quem quiser ver o que tem em casa.

O diferencial vs. Instagram/TikTok de comida: o Shelf **conecta o social ao que
você realmente tem e cozinha** (estoque, receitas, validade). Ninguém mais faz
isso.

---

## 2. O que já existe (reaproveitar, não refazer)

| Já pronto | Vira base para |
|---|---|
| Auth + usuários (Better Auth) | Perfis, follow |
| Receitas públicas + link compartilhável | Posts de receita, feed |
| **Avaliações (estrelas) + comentários** em receitas (`RecipeRating`, `RecipeComment`) | Mesmo padrão para restaurantes/pratos e curtidas/comentários de post |
| "Fiz esta receita" (`RecipeCook`) | Post "cozinhei isso" no feed |
| Coleções públicas/privadas (`RecipeCollection`) | Guias/listas ("meus lugares favoritos") |
| Pantry compartilhada (`Household`, SSE, atividade) | Estoque público, "coma junto" |
| Explorar comunidade | Descoberta (pessoas, restaurantes) |
| Sino de notificações (validade) | Notificações sociais (seguiu/curtiu/comentou) |
| i18n PT/EN, PWA offline, design system | Tudo herda de graça |

**Conclusão:** metade da camada social já existe para receitas. O pivot é
generalizar esse padrão (avaliar + comentar + público/privado) para **perfis,
feed, restaurantes e estoque**.

---

## 3. Modelo de dados

### Novas coleções

- **`Follow`** — `{ followerId, followingId, status: "accepted" | "pending", createdAt }`.
  `pending` cobre perfis privados (solicitação de seguir).
- **`Post`** — a unidade do feed. `{ authorId, type, visibility, text?, photos?[], refs, place?, createdAt, editedAt? }`.
  - `type`: `"cooked" | "recipe" | "checkin" | "pantry" | "text" | "review"`.
  - `refs`: ids ligados conforme o tipo (`recipeId`, `itemIds`, `placeId`, `checkinId`).
  - `visibility`: `"public" | "followers" | "private"`.
- **`PostLike`** — `{ postId, userId, createdAt }` (único por par).
- **`PostComment`** — `{ postId, authorId, text, createdAt }` (mesmo padrão do `RecipeComment`).
- **`Place`** — restaurante/lugar. `{ name, address?, geo?: {lat,lng}, city?, categories?[], createdBy, source? }`.
  Pode começar manual (usuário digita) e depois integrar um provedor de lugares.
- **`CheckIn`** — "onde estou comendo". `{ userId, placeId, rating?, review?, dish?, photos?[], visibility, createdAt }`.
  Gera um `Post` do tipo `checkin`/`review`.
- **`PlaceRating`** — nota agregável por lugar (ou derivar de `CheckIn.rating`). Decidir: nota vive no check-in e o lugar mostra a média.

### Mudanças em modelos existentes

- **`User`/perfil** (via coleção de perfil ou campos): `handle` (username único, `@fulano`),
  `displayName`, `bio`, `avatarUrl`, `coverUrl?`, `isPrivate: boolean`, `city?`, `dietTags?[]`,
  contadores desnormalizados (`followers`, `following`, `posts`).
- **`Settings`**: `pantryVisibility: "private" | "followers" | "public"` (estoque público).
- **`Recipe`**: já tem `isPublic`; alinhar com o novo `visibility` (public/followers/private).
- **`Item`**: nada obrigatório; a visibilidade do estoque é no perfil/settings, não por item (v1).

### Índices importantes

- `Follow`: `{followerId, followingId}` único; `{followingId}` (quem me segue).
- `Post`: `{authorId, createdAt}`, `{visibility, createdAt}`, e um caminho para o feed (ver §5).
- `Place`: geo index (`2dsphere`) quando entrar mapa/"perto de mim".

---

## 4. Privacidade (transversal — decidir cedo)

Três níveis, reutilizados em tudo:

| Recurso | public | followers | private |
|---|---|---|---|
| **Perfil** | qualquer um vê posts públicos | seguidores veem tudo | só posts públicos; seguir exige aprovação |
| **Post** | todos | só seguidores | só você |
| **Estoque** | todos veem o que você tem | só seguidores | só você (hoje) |
| **Check-in** | vira review público do lugar | só seguidores | diário pessoal |

Regras:

- Perfil **privado** → seguir vira **solicitação** (`Follow.status = pending`); o dono aprova/recusa.
- Toda query de leitura de conteúdo alheio passa por um **guard de visibilidade** central
  (`canView(viewer, resource)`), nunca espalhado nas rotas.
- Bloqueio/mute (fase posterior) e denúncia de conteúdo entram aqui.
- **LGPD/consentimento**: tornar algo público é opt-in explícito; nada vaza por padrão.

---

## 5. Fases

Ordem pensada para entregar valor cedo e destravar o resto. Cada feature tem
**Objetivo · Dados · API · UI · Privacidade · Pronto quando**.

### Fase 1 — Fundação social (perfil + follow)

**1.1 Perfil pessoal**
- *Objetivo*: dar identidade a cada pessoa e mover pra cá as infos "minhas" que hoje moram no Dashboard.
- *Dados*: campos de perfil (`handle`, `displayName`, `bio`, `avatarUrl`, `isPrivate`, contadores).
- *API*: `GET /api/profile/:handle`, `PATCH /api/profile` (editar o meu), upload/URL de avatar.
- *UI*: página `/@handle` — capa/avatar, bio, contadores (seguidores/seguindo/posts), abas
  (Posts · Receitas · Coleções · Estoque se público · Check-ins). Editar perfil.
- *Privacidade*: `isPrivate` esconde conteúdo de não-seguidores.
- *Pronto quando*: dá pra ver o próprio perfil e o de outra pessoa por `@handle`.

**1.2 Seguir / deixar de seguir**
- *Objetivo*: base de todo o feed e da privacidade.
- *Dados*: `Follow` (+ contadores desnormalizados).
- *API*: `POST /api/follow/:userId`, `DELETE /api/follow/:userId`, `GET /api/:handle/followers|following`,
  aprovar/recusar solicitação (perfil privado).
- *UI*: botão Seguir/Seguindo/Solicitado no perfil e no feed; listas de seguidores/seguindo.
- *Pronto quando*: seguir muda o feed e respeita perfis privados.

**1.3 Migrar "minhas infos" do Dashboard → Perfil**
- *Objetivo*: liberar o Dashboard pra virar feed sem perder as métricas de cozinha.
- *O que move*: itens no estoque, vencendo/vencidos, "dá pra fazer", carrinho, locais, atividade recente.
- *UI*: essas informações viram a aba **"Minha cozinha"** do perfil (privada por padrão).
- *Pronto quando*: nada foi perdido — só mudou de lugar.

### Fase 2 — Feed & publicações

**2.1 Dashboard vira Feed**
- *Objetivo*: a home passa a ser o feed social (cronológico) de quem você segue + seus posts.
- *Dados*: `Post`. Estratégia de feed: **fan-out on read** no v1 (buscar posts de quem sigo,
  ordenar por data, paginar) — simples e suficiente pra base pequena; migrar pra fan-out on write se escalar.
- *API*: `GET /api/feed?cursor=` (paginação por cursor).
- *UI*: lista de cards de post (autor, conteúdo por tipo, curtir/comentar/salvar), pull-to-refresh,
  estado vazio ("siga pessoas / explore").
- *Pronto quando*: seguir alguém faz o post dela aparecer na sua home.

**2.2 Publicar (compose)**
- *Objetivo*: criar posts.
- *Tipos no v1*: texto + foto; "cozinhei isso" (liga receita/itens); check-in (fase 3); receita (compartilha uma receita sua).
- *API*: `POST /api/posts`, `DELETE /api/posts/:id`, `PATCH` (editar).
- *UI*: botão compor (FAB/feed), sheet de composição com seletor de tipo, visibilidade e mídia.
- *Privacidade*: escolher visibilidade por post.

**2.3 Curtir**
- *Dados*: `PostLike`. *API*: `POST/DELETE /api/posts/:id/like`. *UI*: coração + contador (otimista).

**2.4 Comentar**
- *Dados*: `PostComment` (padrão do `RecipeComment`). *API*: CRUD de comentário. *UI*: thread no post, contador.

**2.5 Salvar post** *(opcional aqui)*
- Salvar posts/receitas de posts numa coleção pessoal (reaproveita coleções).

### Fase 3 — Comida no mundo (restaurantes & check-ins)

**3.1 Lugares/Restaurantes**
- *Objetivo*: ter entidades de lugar pra avaliar e fazer check-in.
- *Dados*: `Place`. v1 manual (digitar nome/cidade); v2 provedor de lugares (autocomplete + geo).
- *API*: `GET /api/places?q=`, `POST /api/places` (criar se não existe), `GET /api/places/:id`.
- *UI*: busca de lugar, página do lugar (média de nota, reviews, fotos, "quem foi").

**3.2 Check-in "onde estou comendo"**
- *Objetivo*: o coração da rede — compartilhar onde/o que está comendo.
- *Dados*: `CheckIn` (+ gera `Post`).
- *API*: `POST /api/checkins` (place, nota, review, prato, fotos, visibilidade).
- *UI*: fluxo "Fazer check-in" (buscar lugar → nota → foto/prato → publicar); aparece no feed e no lugar.

**3.3 Avaliar restaurante / prato**
- *Objetivo*: notas e reviews agregadas por lugar.
- *Dados*: nota vive no `CheckIn`; `Place` mostra média e distribuição.
- *UI*: estrelas + texto no check-in; página do lugar lista reviews; ranking por cidade (fase 5).

### Fase 4 — Cozinha social

**4.1 Estoque público**
- *Objetivo*: deixar outras pessoas verem o que você tem em casa.
- *Dados*: `Settings.pantryVisibility`.
- *API*: `GET /api/profile/:handle/pantry` (respeitando visibilidade).
- *UI*: aba "Estoque" no perfil (quando permitido); toggle de visibilidade nas Configurações.
- *Ideias que isso destrava*: "receitas que essa pessoa consegue fazer", "peça emprestado", comparar despensas.

**4.2 Post "cozinhei isso" ligado a receita/estoque**
- Publicar uma receita feita, com foto e o que usou do estoque; entra no feed e no histórico.

**4.3 Compartilhar receita como post**
- Botão "Publicar" numa receita → vira card no feed (reaproveita receitas públicas + link).

### Fase 5 — Descoberta & engajamento

- **Explorar 2.0**: abas Pessoas · Restaurantes · Receitas · Perto de mim; busca global; sugestões de quem seguir.
- **Notificações sociais**: seguiu, curtiu, comentou, aprovou solicitação, marcou você. (Estende o sino atual.)
- **Menções e tags**: `@handle` e `#hashtag`/tags de comida (vegano, doce, churrasco…).
- **Mapa de check-ins** e **ranking de restaurantes** por região (usa geo do `Place`).
- **Feed "para você"** (opcional): mistura de quem você segue + populares perto/afins (algorítmico).

### Fase 6 — Retenção & extras (ver backlog §7)

---

## 6. Dashboard → Feed + Perfil (migração sem perda)

| Hoje no Dashboard | Vai para |
|---|---|
| Saudação + espaço ativo | Topo do **Feed** (leve) |
| Stat cards (itens, vencendo, vencido, carrinho, dá pra fazer) | Aba **"Minha cozinha"** do **Perfil** |
| Chips por local | Perfil › Minha cozinha (ou Estoque) |
| Vencendo em breve | Perfil › Minha cozinha + sino de notificações (já existe) |
| Atividade recente (household) | Perfil › Minha cozinha (privado) |
| — (novo) | **Feed social** vira o conteúdo principal da home |

Deep-links atuais (`?canMake=1`, `?status=expiring`) continuam apontando pro estoque —
só mudam de origem (do perfil, não do dashboard).

---

## 7. Backlog de ideias (mais features pra escolher)

**Social**
- Stories de comida (24h): "almoço de hoje".
- DMs / mensagens diretas.
- Grupos/comunidades (ex.: "confeitaria caseira", "low carb").
- Bloquear / silenciar / denunciar.
- Repost / "salvar e recompartilhar".
- Convidar amigos (contatos/link).

**Restaurantes & lugares**
- Listas/guias curados ("meus 10 lugares de brunch") — reaproveita coleções.
- "Quero ir" (wishlist de lugares) + lembrete quando estiver perto.
- Filtros: preço, tipo de cozinha, dieta, distância.
- Selo de "verificado" pra restaurantes; página oficial do restaurante.
- Cardápio + prato mais avaliado do lugar.

**Cozinha (o diferencial)**
- "Receitas que consigo fazer agora" no perfil público.
- Desafios/receita da semana da comunidade.
- Menu da semana (já no roadmap atual) + gera lista de compras.
- Trocar/pedir emprestado itens do estoque entre vizinhos/seguidores.
- Metas/dieta no perfil (calorias, restrições) e filtro de conteúdo por dieta.

**Engajamento & gamificação**
- Badges/conquistas (100 check-ins, "explorador de X cozinhas", "sem desperdício").
- Ranking local / entre amigos.
- Resumo semanal ("sua semana em comida").
- Anti-desperdício: pontos por usar itens antes de vencer.

**Descoberta**
- Feed algorítmico opcional; trending de pratos/lugares; "perto de mim".
- Busca por ingrediente ("quem cozinhou com abóbora?").

**Monetização (futuro, sinalizar cedo)**
- Perfis/restaurantes verificados pagos; destaque patrocinado; parcerias com delivery/mercado;
  premium (estoque ilimitado, insights). Só planejar — não construir agora.

---

## 8. Decisões em aberto (resolver antes de codar cada fase)

1. **Handle/username**: obrigatório no cadastro? migração dos usuários atuais (gerar handle a partir do nome/e-mail).
2. **Feed**: cronológico puro no v1 (recomendado) vs. algorítmico. Fan-out on read vs. on write.
3. **Lugares**: base manual no v1 ou já integrar provedor externo (custo/limite de API + termos).
4. **Fotos**: onde hospedar (upload próprio? serviço de storage? só URL?). Hoje o app usa `imageUrl`.
5. **Households vs. perfis**: como convivem estoque compartilhado (casa) e estoque público (social)?
   Sugestão: household continua privado; "estoque público" é uma projeção opt-in do seu espaço.
6. **Moderação**: denúncia, bloqueio e remoção mínimos antes de abrir posts públicos.
7. **Notificações**: push (PWA já dá base) vs. só in-app no começo.

---

## 9. Sugestão de MVP (primeiro corte pra validar a virada)

Fase 1 completa + Fase 2 (feed, compor texto+foto, curtir, comentar) + Fase 3.2 (check-in simples).
Isso já entrega o loop social central: **seguir → ver no feed → postar comida/check-in → curtir/comentar**,
mantendo o núcleo de cozinha intacto. Restaurantes avançados, estoque público e descoberta vêm depois.
