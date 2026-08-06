# Shelf

Organização de cozinha: estoque, receitas, coleções, lista de compras, uma
comunidade de receitas e um roadmap público — mobile first, mas responsivo em
telas maiores. Dá pra **compartilhar o estoque com a casa em tempo real**,
receber **avisos de validade**, e o app é **instalável e funciona offline**
(PWA). Todo o app é bilíngue (português e inglês).

## Estrutura

- `frontend/` — React 19 + TypeScript, Vite, Tailwind CSS v4, React Router, Better Auth (client), PWA (vite-plugin-pwa)
- `backend/` — Node.js + TypeScript, Express 5, MongoDB Atlas (Mongoose), Better Auth (server)
- `.claude/agents/` — subagentes de desenvolvimento do Claude Code (revisor, tester, i18n, db, pesquisador, migrador)

## Como rodar

Instale as dependências em `frontend/` e `backend/`, copie os `.env.example` para `.env`
em cada pasta (preenchendo `MONGODB_URI` e `BETTER_AUTH_SECRET` no backend) e, na raiz:

```bash
npm install
npm run dev
```

Isso sobe frontend e backend juntos:

- Backend: `http://localhost:4001`
- Frontend: `http://localhost:5183`

Portas escolhidas de propósito fora dos defaults comuns (4000/5173) para não
conflitar com outros projetos rodando na mesma máquina.

### Variáveis de ambiente (backend)

- `MONGODB_URI` — string de conexão do MongoDB Atlas (obrigatória).
- `BETTER_AUTH_SECRET` — segredo aleatório pra assinar sessões, ex: `openssl rand -base64 32` (obrigatória).
- `CLIENT_URL` — origem do frontend (aceita lista separada por vírgula pra autorizar
  produção + localhost ao mesmo tempo). Padrão: `http://localhost:5183`.
- `BETTER_AUTH_URL` — URL pública do próprio backend. Padrão: `http://localhost:4001`.
- `NODE_ENV=production` — em produção, ativa cookies de sessão `sameSite=none; secure`
  (necessário quando frontend e backend ficam em domínios diferentes).

No frontend, `VITE_API_URL` aponta pra URL pública do backend (padrão `http://localhost:4001`).

## Idiomas (i18n)

- **Português (padrão) e inglês**, com troca instantânea. Camada própria em React Context
  (sem dependência externa); o idioma escolhido é salvo no navegador e, na primeira
  visita, segue o idioma do próprio navegador.
- Seletor de idioma (toggle de pílulas) nas **Configurações**, no **footer** e na sidebar
  quando deslogado.
- Vocabulários armazenados no banco (tags de receita e categorias de estoque) ficam
  em português e são traduzidos **só na exibição** — os filtros continuam funcionando
  pelo valor salvo.

## Funcionalidades

### Autenticação

- Cadastro/login por e-mail e senha (Better Auth).
- Checkbox "Manter conectado" — controla se a sessão persiste (7 dias) ou expira
  ao fechar o navegador.

### Estoque

- CRUD de itens: nome, marca, categoria, **local** (despensa/geladeira/freezer),
  tamanho da embalagem, quantidade, unidade, código de barras, foto.
- **Escanear código de barras** pela câmera (mobile) — funciona também no **app
  instalado** (PWA); se o produto já existe no estoque, só soma na quantidade; se é
  novo, busca nome/marca/categoria/foto na Open Food Facts e pré-preenche o cadastro.
- **Buscar produto** ao adicionar item: usa a busca da **Open Food Facts filtrada pelo
  país/idioma** do usuário (Brasil no PT, EUA no EN, com nomes localizados) e os itens
  do seu próprio estoque. Ao abrir sem digitar, mostra o **seu estoque** (nada de lista
  aleatória); as categorias bagunçadas da OFF são normalizadas pra um vocabulário fixo.
- **Locais de estoque**: separe despensa, geladeira e freezer; a sidebar tem uma
  **subpágina por local** e a página filtra por local com chips.
- Lista em cards, com busca por nome/marca e chips de filtro por categoria (com ícone
  por tipo de produto). Unidades de medida são exibidas traduzidas (ex.: `xícara`→`cup`).
- Cada item mostra `− quantidade +` pra ajustar o estoque na hora, direto na lista.
- Quando o item está **vencido** ou **sem estoque**, o card mostra um botão de carrinho
  (adicionar à lista de compras). Excluir/editar ficam na página de detalhes do item.
- Clicar num item abre a página de detalhes (foto grande, infos, nutrição, ações), com
  botão de editar e confirmação antes de excluir.

### Receitas

- CRUD de receitas: nome, foto do prato, modo de preparo em passos numerados,
  tempo de preparo, porções e uma **tag fixa** de categoria (você escolhe a que melhor
  representa entre uma lista fixa — Café da manhã, Almoço, Massas, Sobremesa, etc.).
- Ingredientes vêm dos itens do estoque **ou** de uma busca de produto (que cria o item
  com quantidade 0 se ainda não existir), com quantidade e unidade próprias por receita.
- Indicador **"Dá pra fazer?"**: compara os ingredientes com o estoque atual (convertendo
  g/kg e ml/L) e mostra "Dá pra fazer" ou "Falta N" no card.
- Excluir um item do estoque **não** apaga ele da receita: o nome do ingrediente fica
  salvo na própria receita.
- Busca por nome/ingrediente e um popup de filtros (origem: minhas/salvas, e categoria).
- Paginação ("Carregar mais") e um FAB que abre "Explorar receitas" ou "Adicionar receita".

### Receitas públicas & comunidade

- Cada receita pode ser **pública ou privada** (switch no formulário). Privada só o dono vê.
- Toda receita tem uma **página compartilhável** (`/receita/:id`) que funciona por link,
  sem login. Só o dono vê o botão de editar; os demais têm um botão "Voltar ao Explorar".
- **Explorar** (`/explorar`): página pública onde qualquer um busca e navega pelas receitas
  públicas de todos, filtrando por tag. Os cards mostram foto, autor, média de estrelas e,
  com ícone, o **nº de comentários**, quantas pessoas **fizeram** e quantas **salvaram**.
- Interações na página da receita:
  - **Avaliar de 1 a 6 estrelas** (usuário logado que não é o autor; uma avaliação por
    pessoa, a média aparece pra todos).
  - **Comentar** (com data) e apagar os próprios comentários.
  - **Salvar** na própria lista — vira uma referência de leitura; abrir a receita salva
    leva à página original (com as avaliações e comentários dela). A página mostra quantas
    pessoas salvaram.
  - **"Fiz esta receita"** — qualquer pessoa logada (o autor incluído) marca que preparou,
    e a página mostra o total da comunidade ("N pessoas fizeram").
  - **Ajustar porções** — um stepper escala os ingredientes na hora, arredondando por
    tipo de unidade (contáveis em inteiros, métricas em decimais limpos, medidas de
    cozinha em frações tipo "1 ½").
  - **Cozinhar agora** — pra quem está logado, casa os ingredientes com o seu estoque
    (por nome): marca o que você **tem** (✓) e o que **falta** (🛒), e adiciona os
    faltantes à lista de compras de uma vez.

### Coleções

- Agrupe receitas em **coleções** (pastas por tema), públicas ou privadas
  (`/colecoes`), criadas por um botão flutuante com popup.
- A capa usa a foto de uma receita com efeito de "pilha de cartas". Cada receita
  tem um botão pra **adicionar/remover de coleções** direto no card.
- Coleção pública ganha uma **página compartilhável** (`/colecao/:id`) que expõe só
  as receitas públicas dentro dela; compartilhar copia o link e publica automaticamente.

### Roadmap

- Página pública (`/roadmap`) no formato de "cardápio", **sem datas**, bilíngue.
- Duas seções que **encolhem/expandem**: **"No forno"** (features planejadas) e
  **"Já no cardápio"** (features prontas, exibidas riscadas).
- Cada feature é um card com ícone próprio. Os planejados **expandem** pra mostrar
  objetivo, tarefas e "como funciona".
- **Voto da comunidade (joinha)**: 1 voto por dispositivo (chave anônima guardada no
  navegador), salvo no backend. Os cards se **reordenam por votos** e os 3 primeiros
  ganham um badge de posição (#1–#3).

### Lista de compras

- Ícone de carrinho no header abre um painel lateral (direita) com os itens marcados
  pra comprar.
- **Adicionar produto** direto no carrinho: abre a mesma busca do "Adicionar item" do
  estoque (Open Food Facts + seu estoque). Escolher um item que você já tem o vincula
  (a compra repõe aquele item); um produto novo vira item no estoque ao comprar.
- Adicionar um item à lista **não** depende dele continuar existindo no estoque — a lista
  guarda seu próprio registro (nome, unidade, foto).
- Funciona como uma lista de mercado: você **risca** os itens que comprou (toque no item),
  ajusta a quantidade de cada um, e no final o botão **"Compra concluída"** soma ao estoque
  o que foi riscado e remove da lista; o que não foi riscado continua pra próxima vez.

### Dashboard

- Abre com o **espaço ativo** (seu estoque pessoal ou o compartilhado, com nº de membros).
- **Cards de números**: itens no estoque, vencendo, vencidos, itens na lista de compras e
  quantas **receitas dá pra fazer agora** (casando os ingredientes com o estoque, por nome).
- **Por local**: contagem em despensa / geladeira / freezer.
- **Vencendo em breve**: produtos dentro do prazo de aviso escolhido (ou já vencidos), do
  mais urgente pro menos. Se o controle de validade estiver desligado, um link ativa em
  Configurações.
- **Atividade recente** da casa ("Fulano adicionou X"). Os números atualizam **ao vivo**.

### Estoque compartilhado

- Cada usuário tem um **espaço pessoal**; o estoque e a lista de compras são desse espaço.
- Convide gente com um **código**; quem entra passa a ver e editar o **mesmo estoque**.
  Você fica em **um espaço por vez** — "Sair" te devolve pro seu, com seus itens intactos.
- O dono renomeia o espaço, gera novo código e remove membros (com travas de permissão).
- **Tempo real**: uma alteração de alguém aparece pros outros na hora (via SSE), sem recarregar.
- **Histórico**: cada adição/remoção/entrada/saída fica registrada, com quem fez, na tela
  de "Estoque compartilhado" nas Configurações.

### Notificações & validade

- Um **sino** no header (com contador) lista o que está **vencido** ou **vencendo** dentro
  do prazo que você escolher, com o produto e há quanto tempo.
- **Repor** joga o item na lista de compras — e pergunta se você **já descartou** o produto;
  se sim, também **remove do estoque**.
- Dá pra **dispensar** um aviso ou **limpar tudo** (lembrado por dispositivo).

### Configurações

- **Conta**: editar o nome, ver o e-mail (somente leitura) e excluir a conta (remove
  estoque, receitas, lista de compras, avaliações, comentários e preferências junto).
- **Instalar o app**: botão que dispara a instalação do PWA (no Android/desktop) ou
  mostra o passo a passo no iPhone (Compartilhar → Adicionar à Tela de Início).
- **Estoque compartilhado**: nome do espaço, membros, código de convite, entrar/sair e
  o histórico de alterações.
- **Idioma**: alternar entre português e inglês.
- **Preferências** (switches independentes, cada um liga um campo extra no estoque):
  - **Data de validade** — adiciona validade no item, deixa você escolher **quantos dias
    antes** avisar, e alimenta o sino de notificações e o Dashboard.
  - **Informações nutricionais** — ao ativar, abre um popup pra escolher quais campos
    quer acompanhar (calorias, carboidratos, açúcares, proteínas, gorduras totais,
    gorduras saturadas, fibra alimentar, sódio); só os escolhidos aparecem no item.
  - **Sem glúten** / **Vegano** — marcações no item.

### Navegação & visual

- **Landing page** (`/`) para visitantes deslogados; quem já está logado vai pro Dashboard.
- **Header fixo** (sticky) em todas as telas. Logado, ele traz à direita o **sino de
  notificações** (com badge) e o **carrinho**. O logo leva ao **Dashboard** (logado) ou à
  landing (deslogado).
  - No **mobile** é a barra do topo (menu ☰, logo, ações), que abre a sidebar como painel.
  - No **desktop** é uma barra fina no topo do conteúdo (só as ações) — a navegação fica na
    sidebar.
- **Sidebar**: no desktop, um **trilho fixo** de ícones que **expande ao passar o mouse**.
  Logado: Dashboard, o sino, **Estoque** (seção que abre/fecha, com "Todos os itens" + uma
  subpágina por local) e **Receitas** (com "Minhas receitas", "Coleções" e "Explorar");
  embaixo, Roadmap, Configurações, a conta (avatar + e-mail) e Sair. As seções **lembram**
  se você as deixou abertas ou fechadas. Deslogado: Início, Explorar, Roadmap, Entrar e o
  seletor de idioma.
- **Footer** com marca + links (Início, Explorar, Roadmap, Entrar/Criar conta) e o seletor
  de idioma — na landing, no Explorar e no Roadmap.
- **Offline**: uma barrinha embaixo avisa quando você está sem conexão (mostrando os dados
  salvos).
- Tema visual sálvia/mostarda com tipografia Bricolage Grotesque + Karla (fontes
  self-hosted), ilustrações nos estados vazios, ícones consistentes, tema claro/escuro do
  sistema e respeito às **safe areas do iOS** (nada escondido atrás da barra do Safari).

### Instalável & offline (PWA)

- O Shelf é um **PWA**: dá pra **instalar** (ícone na tela inicial, abre em janela própria)
  e ele **abre sem internet**. O service worker (vite-plugin-pwa/Workbox) faz precache da
  casca do app e cacheia as leituras da API — estoque, lista, receitas e a sessão — então
  offline você **vê** seus dados do último carregamento (leitura offline). Editar ainda
  exige conexão.
- Requer **HTTPS** (ou `localhost`) — service worker não roda em `http` pela rede.

## API (backend)

Rotas montadas em `backend/src/index.ts`. As rotas autenticadas de estoque e lista de
compras são **escopadas por household** (o espaço ativo do usuário), não por usuário:

- `POST /api/auth/*` — Better Auth (cadastro, login, sessão).
- `GET/POST/PATCH/DELETE /api/items` — estoque (escopado por household).
- `GET/POST/DELETE /api/shopping-list` — lista de compras (escopada por household).
- `GET/POST/PATCH/DELETE /api/recipes` — receitas do usuário.
- `GET/POST/PATCH/DELETE /api/collections` — coleções (+ adicionar/remover receitas).
- `GET /api/settings`, `PATCH /api/settings` — preferências (inclui prazo de aviso de validade).
- `GET /api/product-search` — proxy de busca na Open Food Facts (filtrado por país/idioma).
- `/api/household` — espaço compartilhado: dados/membros, renomear, código, entrar, sair,
  remover membro; `GET /stream` (SSE de tempo real) e `GET /activity` (histórico).
- `/api/public/recipes` — receitas públicas (listar/buscar, página por id) e interações
  autenticadas: avaliar, comentar, salvar e **"fiz esta receita"** (`POST /:id/cooked`).
- `/api/public/collections/:id` — página pública de uma coleção.
- `/api/roadmap/votes` — contagem de votos por feature e toggle do voto por dispositivo.

## Scripts úteis

- `backend/scripts/seed-public-recipes.mjs` — injeta receitas públicas de exemplo (com
  autores fake, avaliações e comentários) pra visualizar o layout do Explorar:

  ```bash
  cd backend
  node scripts/seed-public-recipes.mjs          # inserir dados de exemplo
  node scripts/seed-public-recipes.mjs --clean  # remover (só toca no que ele criou)
  ```

## Status

Estoque (com locais), receitas (com ajustar porções e "cozinhar agora"), coleções, lista
de compras, dashboard, **notificações de validade** e preferências configuráveis;
**estoque compartilhado** com convite, tempo real e histórico; uma camada de comunidade
(receitas públicas, Explorar, avaliações, comentários, salvar e "fiz esta receita" com
contadores); app **bilíngue** (PT/EN), **instalável e com leitura offline** (PWA); landing
page e navegação unificada; e um roadmap público com votação da comunidade. Próximos
módulos entram por aqui conforme forem pedidos.
