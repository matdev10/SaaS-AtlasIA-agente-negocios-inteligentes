# AtlasIA

AtlasIA es una plataforma SaaS que permite a pequeñas y medianas empresas crear agentes de inteligencia artificial entrenados con el conocimiento de su propio negocio.

## Estado

🚧 En desarrollo — base API + panel mínimo listos para onboarding local.

## Tecnologías

- NestJS
- Next.js
- PostgreSQL
- Prisma
- pgvector (preparado; retrieval MVP por keywords)

## Arranque local

### Backend

```bash
cd backend
cp .env.example .env
docker compose -f ../docker-compose.yml up -d
npx prisma migrate deploy
npm run start:dev
```

API en `http://localhost:3000`

### Frontend

```bash
cd frontend
cp .env.example .env.local
npm install
npm run dev
```

Panel en `http://localhost:3001`

## Flujo MVP actual

1. Registro / login
2. Configurar agente
3. Cargar documento (texto/FAQ)
4. Entrenar (chunking)
5. Chat de prueba
6. Publicar widget (`PUT /agents/:id/widget`)

## Roadmap

- Embeddings reales (OpenAI + pgvector)
- Upload de PDF/DOCX
- Respuestas LLM con grounding
- Widget embed script
- Analytics
