# Shelf

Organização de cozinha: estoque e receitas, mobile first.

## Estrutura

- `frontend/` — React + TypeScript, Tailwind CSS, React Router, Better Auth (client)
- `backend/` — Node.js + TypeScript, Express, MongoDB Atlas, Better Auth (server)

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

## Status

MVP: autenticação (e-mail/senha), CRUD de estoque e CRUD de receitas.
Próximos módulos (lista de compras, alerta de validade, vínculo receita → estoque) entram depois.
