# Shelf

Organização de cozinha: estoque, receitas, lista de compras e uma comunidade de
receitas — mobile first, mas responsivo em telas maiores.

## Estrutura

- `frontend/` — React 19 + TypeScript, Vite, Tailwind CSS v4, React Router, Better Auth (client)
- `backend/` — Node.js + TypeScript, Express 5, MongoDB Atlas (Mongoose), Better Auth (server)

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

## Funcionalidades

### Autenticação

- Cadastro/login por e-mail e senha (Better Auth).
- Checkbox "Manter conectado" — controla se a sessão persiste (7 dias) ou expira
  ao fechar o navegador.

### Estoque

- CRUD de itens: nome, marca, categoria, tamanho da embalagem, quantidade, unidade,
  código de barras, foto.
- **Escanear código de barras** pela câmera (celular ou webcam) — se o produto já
  existe no estoque, só soma na quantidade; se é novo, busca nome/marca/categoria/foto
  na Open Food Facts e pré-preenche o cadastro.
- **Buscar produto** ao adicionar item: procura primeiro nos itens que você já cadastrou
  (instantâneo) e depois na Open Food Facts. As categorias bagunçadas da OFF são
  normalizadas pra um vocabulário fixo em português, e resultados sem foto/categoria
  ficam por último pra reduzir duplicatas.
- Lista em cards, com busca por nome/marca e chips de filtro por categoria (com ícone
  por tipo de produto).
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
  sem login. Só o dono vê o botão de editar.
- **Explorar** (`/explorar`): página pública onde qualquer um busca e navega pelas receitas
  públicas de todos, filtrando por tag, com foto, autor, média de estrelas e nº de comentários.
- Usuários logados (que não são o autor) podem, na página da receita:
  - **Avaliar de 1 a 6 estrelas** (uma avaliação por pessoa; a média aparece pra todos).
  - **Comentar** (com data) e apagar os próprios comentários.
  - **Salvar** na própria lista — vira uma referência de leitura pra encontrar a receita
    depois; abrir a receita salva leva à página original (com as avaliações e comentários dela).

### Lista de compras

- Ícone de carrinho no header abre um painel lateral (direita) com os itens marcados
  pra comprar.
- Adicionar um item à lista **não** depende dele continuar existindo no estoque — a lista
  guarda seu próprio registro (nome, unidade, foto).
- Funciona como uma lista de mercado: você **risca** os itens que comprou (toque no item),
  ajusta a quantidade de cada um, e no final o botão **"Compra concluída"** soma ao estoque
  o que foi riscado e remove da lista; o que não foi riscado continua pra próxima vez.

### Dashboard

- Seção "Vencendo em breve": todos os produtos com validade em até 7 dias (ou já
  vencidos), ordenados do mais urgente pro menos urgente.
- Se o controle de validade estiver desligado, mostra um link direto pra ativar em
  Configurações.

### Configurações

- **Conta**: editar o nome, ver o e-mail (somente leitura) e excluir a conta (remove
  estoque, receitas, lista de compras, avaliações, comentários e preferências junto).
- **Preferências** (switches independentes, cada um liga um campo extra no estoque):
  - **Data de validade** — adiciona validade no item, badge de aviso na lista e
    alimenta o Dashboard.
  - **Informações nutricionais** — ao ativar, abre um popup pra escolher quais campos
    quer acompanhar (calorias, carboidratos, açúcares, proteínas, gorduras totais,
    gorduras saturadas, fibra alimentar, sódio); só os escolhidos aparecem no item.
  - **Sem glúten** / **Vegano** — marcações no item.

### Navegação & visual

- Header com logo centralizado, menu (☰) à esquerda e carrinho à direita.
- Sidebar com Dashboard, Estoque, Receitas, Explorar, Configurações e Sair.
- Tema visual sálvia/mostarda com tipografia Bricolage Grotesque + Karla (fontes
  self-hosted), ilustrações nos estados vazios, ícones consistentes e suporte a tema
  claro/escuro do sistema.

## Scripts úteis

- `backend/scripts/seed-public-recipes.mjs` — injeta receitas públicas de exemplo (com
  autores fake, avaliações e comentários) pra visualizar o layout do Explorar:

  ```bash
  cd backend
  node scripts/seed-public-recipes.mjs          # inserir dados de exemplo
  node scripts/seed-public-recipes.mjs --clean  # remover (só toca no que ele criou)
  ```

## Status

Estoque, receitas, lista de compras, dashboard de validade, preferências configuráveis e
uma camada de comunidade (receitas públicas, busca em Explorar, avaliações, comentários e
salvar). Próximos módulos entram por aqui conforme forem pedidos.
