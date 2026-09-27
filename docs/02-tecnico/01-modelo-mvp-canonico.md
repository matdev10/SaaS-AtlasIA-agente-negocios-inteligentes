# Modelo MVP Canonico - AtlasIA

## Objetivo

Definir el modelo de dominio canónico para el MVP de AtlasIA.

Este documento alinea el PRD, roadmap, flujos de producto, modelo de datos y arquitectura técnica en un único punto de referencia antes de diseñar Prisma, migraciones o módulos de backend.

El modelo usa nombres conceptuales en inglés para facilitar su futura traducción a NestJS y Prisma, pero describe las reglas en español.

Este documento no es un esquema de base de datos y no define tipos, columnas, índices ni migraciones.

---

## Alcance del MVP

El MVP debe permitir que una empresa pueda:

- registrarse;
- iniciar sesión;
- crear y configurar uno o más agentes desde el modelo;
- entrenar un agente con documentos;
- generar chunks y embeddings;
- conversar con el agente;
- publicar un widget;
- consultar conversaciones y métricas básicas derivadas del uso;
- operar bajo un plan y una suscripción.

Aunque la interfaz inicial puede limitar a una empresa a un solo agente operativo, el dominio se modela desde el inicio para soportar múltiples agentes por empresa.

---

## Entidades

### Company

Representa una empresa cliente que utiliza AtlasIA.

Responsabilidad:

- actuar como raíz multi-tenant del sistema;
- agrupar usuarios, agentes, conversaciones y suscripción;
- asegurar que los datos de una empresa no se mezclen con los de otra;
- definir el estado operativo de la organización dentro de AtlasIA.

Reglas principales:

- toda entidad privada del MVP debe poder rastrearse de forma segura hasta una `Company`;
- una `Company` debe tener al menos un `User` administrador;
- una `Company` puede tener múltiples `Agent`;
- una `Company` puede tener múltiples `Conversation`;
- una `Company` puede tener múltiples `Subscription` históricas, pero solo una activa;
- si una `Company` está suspendida, no debe poder entrenar agentes ni recibir nuevas conversaciones desde widgets.

---

### User

Representa una persona que accede al panel administrativo de AtlasIA.

Responsabilidad:

- autenticarse en la plataforma;
- administrar recursos de su empresa según su rol;
- configurar agentes, documentos, widget y revisar conversaciones.

Reglas principales:

- un `User` pertenece a una sola `Company`;
- el email de `User` es único globalmente para simplificar autenticación;
- un `User` solo puede acceder a recursos rastreables hasta su propia `Company`;
- las contraseñas nunca deben almacenarse en texto plano;
- los permisos dependen del rol definido para el usuario.

---

### Agent

Representa un asistente inteligente configurado por una empresa.

Responsabilidad:

- definir la identidad, personalidad, tono e instrucciones del asistente;
- responder conversaciones usando su `KnowledgeBase`;
- conectar el conocimiento de la empresa con el widget y el chat;
- actuar como eje funcional entre entrenamiento, conversación y publicación.

Reglas principales:

- un `Agent` pertenece a una sola `Company`;
- una `Company` puede tener múltiples `Agent`;
- durante el MVP la UI puede limitar a un solo `Agent` operativo por `Company`, pero el modelo no debe impedir múltiples agentes;
- un `Agent` debe usar únicamente conocimiento rastreable a su misma `Company`;
- un `Agent` debe estar activo para responder desde un `Widget`.

---

### KnowledgeBase

Representa el conjunto de conocimiento disponible para un agente.

Responsabilidad:

- agrupar los documentos utilizados para entrenar al agente;
- contener indirectamente los chunks usados para búsqueda semántica;
- representar la fuente de contexto que el agente puede usar para responder.

Reglas principales:

- una `KnowledgeBase` pertenece a un solo `Agent`;
- un `Agent` tiene una `KnowledgeBase` principal en el MVP;
- todo contenido de una `KnowledgeBase` debe poder rastrearse hasta la `Company` del `Agent`;
- una `KnowledgeBase` no puede compartirse entre empresas ni agentes de empresas distintas.

---

### Document

Representa una fuente de conocimiento cargada o ingresada por una empresa para entrenar un agente.

Responsabilidad:

- almacenar la referencia al contenido original;
- representar documentos como PDF, DOCX, TXT, FAQ, manuales o políticas;
- servir como entrada del procesamiento de conocimiento;
- mantener el estado de procesamiento del contenido.

Reglas principales:

- un `Document` pertenece a una sola `KnowledgeBase`;
- un `Document` debe poder rastrearse hasta una `Company` a través de `KnowledgeBase -> Agent -> Company`;
- un `Document` puede generar múltiples `Chunk`;
- un `Document` puede ser procesado por uno o más `TrainingJob` a lo largo del tiempo;
- un `Document` puede estar pendiente, procesando, procesado, fallido o archivado.

---

### Chunk

Representa una sección procesada de un documento.

Responsabilidad:

- almacenar fragmentos de texto preparados para búsqueda semántica;
- conservar la referencia al documento original;
- permitir recuperación de contexto para responder conversaciones;
- contener o asociarse al embedding generado para el fragmento.

Reglas principales:

- un `Chunk` pertenece a un solo `Document`;
- un `Document` puede tener múltiples `Chunk`;
- un `Chunk` debe poder rastrearse hasta una `Company` a través de `Document -> KnowledgeBase -> Agent -> Company`;
- un `Chunk` no debe usarse como contexto para agentes de otra empresa;
- los chunks deben conservar orden o referencia suficiente para reconstruir contexto.

---

### TrainingJob

Representa un proceso de entrenamiento o reprocesamiento de un documento.

Responsabilidad:

- validar el documento;
- extraer texto;
- limpiar contenido;
- dividir contenido en chunks;
- generar embeddings;
- registrar estado, errores y progreso del procesamiento.

Reglas principales:

- un `TrainingJob` procesa un solo `Document`;
- un `Document` puede tener múltiples `TrainingJob` históricos;
- un `TrainingJob` debe poder rastrearse hasta una `Company` a través de `Document -> KnowledgeBase -> Agent -> Company`;
- un `TrainingJob` puede estar pendiente, ejecutándose, completado o fallido;
- un error de entrenamiento no debe romper el documento original ni mezclar conocimiento entre empresas.

---

### Conversation

Representa una sesión de conversación entre un visitante y un agente IA.

Responsabilidad:

- agrupar mensajes de una interacción;
- registrar el canal de origen, estado e información mínima del visitante;
- permitir historial y analítica básica;
- conectar el chat con la empresa y el agente que respondió.

Reglas principales:

- una `Conversation` pertenece a una sola `Company`;
- una `Conversation` pertenece a un solo `Agent`;
- un `Agent` puede tener múltiples `Conversation`;
- una `Company` puede tener múltiples `Conversation`;
- una `Conversation` puede iniciarse desde un visitante no autenticado mediante widget;
- una `Conversation` debe conservar historial mediante `Message`;
- el `Agent` asociado debe pertenecer a la misma `Company` de la conversación.

---

### Message

Representa cada mensaje dentro de una conversación.

Responsabilidad:

- guardar el historial cronológico de la conversación;
- distinguir mensajes del visitante, del asistente y del sistema;
- permitir trazabilidad de respuestas, consumo y análisis básico.

Reglas principales:

- un `Message` pertenece a una sola `Conversation`;
- una `Conversation` puede tener múltiples `Message`;
- un `Message` debe poder rastrearse hasta una `Company` a través de `Conversation -> Company`;
- los mensajes deben conservar orden temporal;
- el contenido generado por IA debe estar asociado a la conversación y agente que lo originaron.

---

### Widget

Representa el componente embebible que permite conversar con un agente desde un sitio web.

Responsabilidad:

- exponer el agente en canales web;
- almacenar configuración visual y de comportamiento del widget;
- controlar si el agente está publicado o disponible para visitantes.

Reglas principales:

- un `Widget` pertenece a un solo `Agent`;
- un `Agent` tiene un `Widget` principal en el MVP;
- un `Widget` debe poder rastrearse hasta una `Company` a través de `Agent -> Company`;
- un `Widget` solo debe responder si está activo;
- un `Widget` solo debe responder si la `Company` tiene una `Subscription` válida y el `Agent` está activo.

---

### Plan

Representa una oferta comercial disponible en AtlasIA.

Responsabilidad:

- definir límites y capacidades disponibles;
- permitir plan gratuito y planes pagados;
- servir como base para controlar uso y acceso.

Reglas principales:

- un `Plan` puede estar asociado a múltiples `Subscription`;
- un `Plan` define límites como usuarios, documentos, agentes, conversaciones y consumo IA;
- un `Plan` puede estar activo o inactivo;
- cambiar un `Plan` no debe borrar el historial de suscripciones existentes.

---

### Subscription

Representa la relación entre una empresa y un plan contratado o asignado.

Responsabilidad:

- controlar el acceso de una empresa a funcionalidades del MVP;
- registrar estado de la suscripción;
- habilitar límites del plan;
- permitir historial comercial básico.

Reglas principales:

- una `Subscription` pertenece a una sola `Company`;
- una `Subscription` pertenece a un solo `Plan`;
- una `Company` puede tener múltiples `Subscription` históricas;
- una `Company` solo debe tener una `Subscription` activa a la vez;
- una `Subscription` válida es requisito para que un `Widget` atienda conversaciones;
- la facturación avanzada queda fuera del MVP, pero el modelo debe permitir evolucionar hacia ella.

---

## Relaciones y cardinalidades

```text
Company (1) -> (N) User
Company (1) -> (N) Agent
Company (1) -> (N) Conversation
Company (1) -> (N) Subscription

Agent (1) -> (1) KnowledgeBase
Agent (1) -> (N) Conversation
Agent (1) -> (1) Widget

KnowledgeBase (1) -> (N) Document

Document (1) -> (N) Chunk
Document (1) -> (N) TrainingJob

Conversation (1) -> (N) Message

Plan (1) -> (N) Subscription
```

---

## Reglas de negocio principales

- `Company` es la raíz de aislamiento multi-tenant.
- Toda entidad privada debe poder rastrearse hasta una `Company`.
- Las consultas privadas del backend deben filtrar por `companyId` directo o derivado.
- `User.email` es único globalmente.
- `User` pertenece siempre a una `Company` en el MVP.
- `Agent` pertenece a `Company`.
- El modelo soporta múltiples `Agent` por `Company`, aunque la UI inicial pueda limitar a uno.
- `KnowledgeBase` pertenece a `Agent`.
- `Document` pertenece a `KnowledgeBase`.
- `Chunk` pertenece a `Document`.
- `TrainingJob` procesa un `Document`.
- `Conversation` pertenece a `Company` y `Agent`.
- `Message` pertenece a `Conversation`.
- `Widget` pertenece a `Agent`.
- `Subscription` pertenece a `Company` y `Plan`.
- Un agente solo puede responder usando chunks provenientes de documentos de su propia `KnowledgeBase`.
- Un widget solo puede responder si la empresa, el agente, el widget y la suscripción están en estados válidos.
- Analytics básico del MVP puede derivarse inicialmente desde `Conversation`, `Message`, `TrainingJob`, `Document` y `Subscription`, sin crear una entidad canónica adicional.

---

## Diagrama textual general

```text
Company
|
+-- Users
|
+-- Agents
|   |
|   +-- KnowledgeBase
|   |   |
|   |   +-- Documents
|   |       |
|   |       +-- Chunks
|   |       |
|   |       +-- TrainingJobs
|   |
|   +-- Widget
|   |
|   +-- Conversations
|       |
|       +-- Messages
|
+-- Conversations
|
+-- Subscriptions
    |
    +-- Plan
```

Nota: `Conversation` cuelga conceptualmente de `Company` y de `Agent`. Se muestra bajo ambos contextos porque debe poder filtrarse por empresa y analizarse por agente.

---

## Entidades fuera del MVP

Las siguientes entidades no forman parte del modelo canónico MVP:

- Customer o Client
- API Key
- Integration
- Webhook
- Notification
- Payment
- Invoice
- AuditLog
- HumanHandoff
- CRMContact
- UsagePeriod
- UsageMetric
- BillingAccount
- Team
- Role avanzado
- Permission granular
- Public API Consumer

Algunas capacidades asociadas, como analytics básico, control de consumo y estado de suscripción, sí existen en el MVP, pero deben resolverse inicialmente con las entidades canónicas definidas en este documento.

---

## Decisiones que este documento reemplaza o aclara

- Aclara que el modelo canónico usa nombres conceptuales en inglés: `Company`, `User`, `Agent`, `KnowledgeBase`, `Document`, `Chunk`, `TrainingJob`, `Conversation`, `Message`, `Widget`, `Plan` y `Subscription`.
- Reemplaza la idea de que `Document` pertenece directamente a `Company` o `Agent`: en el MVP canónico pertenece a `KnowledgeBase`, y se rastrea a `Company` por `KnowledgeBase -> Agent -> Company`.
- Reemplaza la relación de widget por empresa: en el MVP canónico `Widget` pertenece a `Agent`.
- Aclara que `Conversation` pertenece explícitamente a `Company` y `Agent`.
- Aclara que `Message` no necesita `Company` como relación conceptual directa si puede rastrearse por `Conversation -> Company`.
- Aclara que `Chunk` y `TrainingJob` son parte del MVP porque el producto requiere procesamiento, fragmentación y embeddings.
- Aclara que `Customer` o `Client` queda fuera del MVP canónico; el visitante puede representarse como información de la `Conversation` hasta que el producto requiera una entidad propia.
- Aclara que `User.email` será único globalmente, no único solo dentro de una empresa.
- Aclara que una `Company` puede tener múltiples `Agent` desde el modelo, aunque la UI inicial limite a uno.
- Aclara que `UsagePeriod` y `UsageMetric` quedan fuera del MVP canónico; analytics básico puede derivarse desde conversaciones, mensajes y eventos de procesamiento.
- Aclara que facturación avanzada, pagos e invoices quedan fuera del MVP; `Plan` y `Subscription` bastan para el control inicial de acceso y límites.
- Mantiene la decisión arquitectónica aceptada de usar NestJS como backend modular, alineando el dominio con futuros módulos de NestJS sin implementar código todavía.
