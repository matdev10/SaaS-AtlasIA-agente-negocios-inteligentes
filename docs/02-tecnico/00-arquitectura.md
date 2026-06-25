# Arquitectura General - AtlasIA

## Objetivo

Definir la arquitectura de alto nivel del sistema AtlasIA.

El sistema estará compuesto por diferentes módulos independientes que trabajarán de forma integrada.

---

# Componentes

Internet
│
│
▼

Landing Web (Next.js)

│

▼

Panel Administrativo (Next.js)

│

▼

API REST (NestJS)

│

├── Auth

├── Empresas

├── Usuarios

├── Agentes IA

├── Documentos

├── Conversaciones

├── Planes

├── Suscripciones

├── Analytics

│

▼

PostgreSQL

│

▼

pgvector

│

▼

OpenAI API

---

## Flujo principal

Empresa

↓

Panel AtlasIA

↓

Sube documentos

↓

AtlasIA procesa documentos

↓

Genera embeddings

↓

Guarda información

↓

Cliente conversa

↓

AtlasIA busca contexto

↓

OpenAI genera respuesta

↓

Respuesta al visitante

---

## Principios de arquitectura

- Arquitectura modular
- Multi-tenant
- API First
- Escalable
- Separación de responsabilidades
- Seguridad por diseño