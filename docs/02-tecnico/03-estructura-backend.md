# Estructura del Backend

## Objetivo

Organizar el backend de AtlasIA de forma modular, escalable y mantenible.

---

src/

modules/

shared/

config/

database/

common/

main.ts

app.module.ts

---

## Módulos

### auth

Autenticación y autorización.

---

### companies

Gestión de empresas.

---

### users

Usuarios de cada empresa.

---

### agents

Configuración de agentes IA.

---

### knowledge

Base de conocimiento.

---

### documents

Carga de documentos.

---

### conversations

Conversaciones.

---

### messages

Mensajes.

---

### analytics

Métricas.

---

### subscriptions

Planes y suscripciones.

---

### billing

Pagos.

---

### integrations

WhatsApp, Web, API.

---

## Carpetas compartidas

shared/

Componentes reutilizables.

common/

Filtros, Guards, Decorators, Pipes.

config/

Configuraciones.

database/

Prisma y conexión PostgreSQL.