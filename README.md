# Shelf

Organização de cozinha: estoque e receitas, mobile first.

## Estrutura

- `frontend/` — React + TypeScript, Tailwind CSS, React Router, Better Auth (client)
- `backend/` — Node.js + TypeScript, Express, MongoDB Atlas, Better Auth (server)

## Como rodar

### Backend

```bash
cd backend
cp .env.example .env   # preencher MONGODB_URI e BETTER_AUTH_SECRET
npm install
npm run dev
```

Servidor sobe em `http://localhost:4000`.

### Frontend

```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```

App sobe em `http://localhost:5173`.

## Status

MVP: autenticação (e-mail/senha), CRUD de estoque e CRUD de receitas.
Próximos módulos (lista de compras, alerta de validade, vínculo receita → estoque) entram depois.
