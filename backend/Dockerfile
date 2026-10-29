FROM node:22-bookworm-slim

WORKDIR /app

RUN apt-get update \
  && apt-get install -y --no-install-recommends openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/*

COPY package.json package-lock.json ./
COPY prisma ./prisma
COPY prisma.config.ts ./

RUN npm ci && npm install --no-save tsx

COPY . .

# prisma.config.ts exige DATABASE_URL al generar el cliente. En runtime Railway la reemplaza.
ENV DATABASE_URL="postgresql://postgres:postgres@127.0.0.1:5432/atlasia"
RUN npx prisma generate && npm run build

ENV NODE_ENV=production
EXPOSE 3000

CMD ["sh", "-c", "npx prisma migrate deploy && npx tsx prisma/seed.ts && node dist/src/main.js"]
