# Modelo de Dominio

# AtlasIA

Versión: 1.1

Estado: Estable

---

# Objetivo

Definir las entidades principales del dominio de AtlasIA, sus relaciones y reglas de negocio.

Este documento conecta la visión del producto con el futuro diseño técnico, la base de datos, la API y el backend.

No representa un modelo de base de datos; representa el funcionamiento del negocio.

---

# Descripción del dominio

AtlasIA es una plataforma SaaS B2B multiempresa (Multi-Tenant) que permite a cada empresa crear un agente de inteligencia artificial entrenado con su propio conocimiento.

Cada empresa administra su información de forma completamente aislada del resto de organizaciones.

---

# Agregados del dominio

El dominio se organiza alrededor de cuatro agregados principales:

- Company
- AI Agent
- Knowledge Base
- Subscription

El resto de entidades pertenecen a alguno de estos agregados.

---

# Entidades principales

## Company (Raíz del dominio)

Representa una empresa cliente de AtlasIA.

Es la entidad principal del sistema.

Todo recurso privado pertenece a una empresa.

Una empresa administra:

- usuarios
- agente IA
- base de conocimiento
- conversaciones
- widget
- suscripción
- consumo
- métricas

### Reglas

- Toda empresa debe tener al menos un administrador.
- Toda empresa posee un espacio aislado (tenant).
- Ningún dato puede compartirse entre empresas.
- Una empresa suspendida no puede utilizar la plataforma.

### Estados

- TRIAL
- ACTIVE
- SUSPENDED
- ARCHIVED

---

## User

Representa una persona que utiliza el panel administrativo.

### Roles del MVP

- SUPER_ADMIN
- COMPANY_ADMIN
- COMPANY_USER

### Reglas

- Todo usuario pertenece a una empresa, excepto SUPER_ADMIN.
- Los permisos dependen del rol.
- Los usuarios solo pueden acceder a recursos de su empresa.

---

## AI Agent

Representa el asistente inteligente de la empresa.

Durante el MVP:

Una empresa posee un único agente IA operativo.

Las versiones futuras permitirán múltiples agentes.

### Responsabilidades

- responder consultas
- utilizar la base de conocimiento
- generar respuestas
- publicar el widget

### Estados

- DRAFT
- TRAINING
- ACTIVE
- PAUSED
- ARCHIVED

---

## Knowledge Base

Representa el conocimiento disponible para un agente IA.

En el MVP existe una relación uno a uno entre el agente y su base de conocimiento.

Una base contiene:

- documentos
- chunks
- trabajos de entrenamiento

### Reglas

- Todo el conocimiento pertenece exclusivamente a una empresa.
- El conocimiento nunca podrá compartirse entre empresas.
- Solo podrá responder utilizando conocimiento disponible.

---

## Training Job

Representa un proceso de entrenamiento.

Responsabilidades

- procesar documentos
- generar chunks
- generar embeddings
- registrar errores
- registrar progreso

### Estados

- PENDING
- RUNNING
- COMPLETED
- FAILED

---

## Document

Representa una fuente de conocimiento.

Puede ser:

- PDF
- DOCX
- TXT
- FAQ
- Manual
- Política
- Página web

### Reglas

- Todo documento pertenece a una empresa.
- Todo documento pertenece a una base de conocimiento.
- Puede ser reprocesado.
- Puede archivarse.

### Estados

- UPLOADED
- PROCESSING
- PROCESSED
- FAILED
- ARCHIVED

---

## Chunk

Representa una sección procesada de un documento.

Los chunks permiten realizar búsqueda semántica sobre documentos extensos.

### Reglas

- Todo chunk pertenece a un documento.
- Todo chunk conserva referencia al documento original.

---

## Conversation

Representa una conversación entre un visitante y un agente IA.

### Reglas

- Pertenece a una empresa.
- Pertenece a un agente.
- Puede comenzar sin autenticación.
- Debe conservar historial.

### Estados

- OPEN
- CLOSED

---

## Message

Representa un mensaje dentro de una conversación.

Tipos

- USER
- ASSISTANT
- SYSTEM

### Reglas

- Todo mensaje pertenece a una conversación.
- Debe conservar orden cronológico.
- Debe registrar la fecha de creación.

---

## Widget

Representa el componente embebible del agente IA.

Durante el MVP existe un widget por agente.

### Reglas

- Pertenece a una empresa.
- Se encuentra asociado a un agente.
- Puede activarse o desactivarse.

---

## Plan

Representa la definición comercial de AtlasIA.

Cada plan define límites de:

- usuarios
- documentos
- conversaciones
- almacenamiento
- consumo IA

Ejemplos

- Starter
- Professional
- Enterprise

---

## Subscription

Representa la relación entre una empresa y un plan.

Una empresa puede tener varias suscripciones históricas.

Solo una puede estar activa.

### Estados

- TRIAL
- ACTIVE
- PAST_DUE
- CANCELLED

---

## Usage Period

Representa el consumo de una empresa durante un período determinado.

Registra:

- conversaciones
- mensajes
- documentos
- consumo IA
- costo estimado

Cada período pertenece a una suscripción.

---

## Usage Metric

Representa métricas utilizadas por Analytics.

Ejemplos

- conversaciones
- mensajes
- documentos procesados
- errores
- tiempo de respuesta

Estas métricas podrán utilizarse para:

- dashboards
- analytics
- monitoreo
- facturación futura

---

# Relaciones del dominio

```text
Company
│
├── Users
│
├── AI Agent
│   │
│   ├── Knowledge Base
│   │   │
│   │   ├── Documents
│   │   ├── Chunks
│   │   └── Training Jobs
│   │
│   ├── Widget
│   │
│   └── Conversations
│       └── Messages
│
├── Subscription
│   │
│   ├── Plan
│   └── Usage Period
│
└── Usage Metrics
```

---

# Reglas globales del dominio

## Multi-tenancy

Toda entidad privada debe pertenecer a una empresa.

Toda consulta privada deberá filtrar utilizando `companyId`.

Nunca podrán mezclarse datos entre empresas.

---

## Consistencia

Un agente únicamente podrá responder utilizando la base de conocimiento perteneciente a su empresa.

---

## Seguridad

Una empresa suspendida:

- no puede acceder al panel
- no puede entrenar agentes
- no puede recibir conversaciones

---

## Publicación

Un widget solamente podrá responder cuando:

- la empresa esté activa
- el agente esté activo
- exista una suscripción válida

---

# Entidades fuera del MVP

Las siguientes entidades se incorporarán en futuras versiones:

- Integration
- Webhook
- Notification
- Payment
- Invoice
- Audit Log
- Human Handoff
- CRM Contact
- Multi Agent

---

# Criterio de estabilidad

Este documento se considera estable cuando:

- el modelo refleja el negocio definido en el PRD;
- las relaciones son consistentes con el MVP;
- no existen contradicciones con el Roadmap, Modelo de Negocio ni Funcionalidades;
- sirve como base para diseñar el ERD, PostgreSQL, Prisma y el backend.