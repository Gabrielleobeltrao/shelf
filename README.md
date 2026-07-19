# Shelf

Organização de cozinha: estoque, receitas, lista de compras e mais, mobile first.

## Estrutura

- `frontend/` — React + TypeScript, Tailwind CSS v4, React Router, Better Auth (client)
- `backend/` — Node.js + TypeScript, Express, MongoDB Atlas (Mongoose), Better Auth (server)

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
- Lista única (sem separar por categoria), com busca por nome/marca e um popup de
  filtro por categoria (ícone no canto da busca).
- Cada item mostra `− quantidade +` pra ajustar o estoque na hora, direto na lista.
- Quando o item está **vencido** (com controle de validade ativo), o `− +` vira três
  botões: excluir, editar e adicionar à lista de compras.

### Receitas

- CRUD de receitas: nome, foto do prato, modo de preparo.
- Ingredientes são escolhidos a partir dos itens do estoque (não texto livre), com
  quantidade e unidade próprias por receita — não precisa ser a mesma unidade em que
  o item está armazenado. Não deixa repetir o mesmo ingrediente na receita.
- Excluir um item do estoque **não** apaga ele da receita: o nome do ingrediente fica
  salvo na própria receita, mostrando "(removido do estoque)" se for editar depois.
- Busca por nome da receita ou nome de ingrediente.

### Lista de compras (carrinho)

- Ícone de carrinho no header abre um painel lateral (direita) com os itens marcados
  pra comprar.
- Adicionar um item à lista de compras **não** depende do item continuar existindo no
  estoque — a lista guarda seu próprio registro, então excluir o item do estoque não
  tira ele do carrinho.
- Cada item tem um `− quantidade +` pra definir quanto comprar; o botão "Comprado"
  soma essa quantidade no estoque (se o item ainda existir) e tira da lista.

### Dashboard

- Seção "Vencendo em breve": todos os produtos com validade em até 7 dias (ou já
  vencidos), ordenados do mais urgente pro menos urgente.
- Se o controle de validade estiver desligado, mostra um link direto pra ativar em
  Configurações.

### Configurações

- **Conta**: editar nome e e-mail, trocar senha, excluir conta (remove estoque,
  receitas, lista de compras e preferências junto).
- **Preferências** (switches independentes, cada um liga um campo extra no estoque):
  - **Data de validade** — adiciona validade no item, badge de aviso na lista e
    alimenta o Dashboard.
  - **Informações nutricionais** — ao ativar, abre um popup pra escolher quais campos
    quer acompanhar (calorias, carboidratos, açúcares, proteínas, gorduras totais,
    gorduras saturadas, fibra alimentar, sódio); só os escolhidos aparecem no item.
    Um botão "Editar campos" deixa mudar a seleção depois.
  - **Sem glúten** — checkbox no item.
  - **Vegano** — checkbox no item.

### Navegação

- Sidebar (ícone ☰ no header) com Dashboard, Estoque, Receitas, Configurações e Sair.
- Ícone de carrinho no header abre a lista de compras.

## Status

MVP completo com estoque, receitas, lista de compras, dashboard de validade e
preferências configuráveis. Próximos módulos entram por aqui conforme forem pedidos.
