# Modelo de Dominio - AtlasIA

## Objetivo

Definir las entidades principales de AtlasIA antes de crear tablas, migraciones o código de base de datos.

AtlasIA será una plataforma SaaS multiempresa. Esto significa que cada empresa tendrá sus propios usuarios, documentos, agentes, conversaciones, mensajes, planes y métricas.

---

## Entidades principales

### Empresa

Representa una organización que utiliza AtlasIA.

Toda la información crítica del sistema estará asociada a una empresa.

Campos iniciales propuestos:

- id
- nombre
- rut
- correo
- telefono
- direccion
- logo
- estado
- fecha_creacion
- fecha_actualizacion

---

### Usuario

Representa a una persona que administra una empresa dentro de AtlasIA.

Campos iniciales propuestos:

- id
- empresa_id
- nombre
- correo
- password
- rol
- estado
- fecha_creacion

---

### Agente IA

Representa el asistente inteligente configurado por una empresa.

Campos iniciales propuestos:

- id
- empresa_id
- nombre
- descripcion
- tono
- mensaje_bienvenida
- estado
- fecha_creacion

---

### Documento

Representa una fuente de conocimiento utilizada por el agente IA.

Campos iniciales propuestos:

- id
- empresa_id
- agente_id
- nombre
- tipo
- url_archivo
- contenido_extraido
- estado_procesamiento
- fecha_creacion

---

### Fragmento de documento

Representa una parte procesada de un documento para búsqueda semántica.

Campos iniciales propuestos:

- id
- documento_id
- empresa_id
- contenido
- embedding
- orden
- fecha_creacion

---

### Conversación

Representa una conversación entre un visitante y un agente IA.

Campos iniciales propuestos:

- id
- empresa_id
- agente_id
- canal
- estado
- visitante_nombre
- visitante_contacto
- fecha_inicio
- fecha_fin

---

### Mensaje

Representa cada mensaje dentro de una conversación.

Campos iniciales propuestos:

- id
- conversacion_id
- empresa_id
- rol
- contenido
- tokens_usados
- fecha_creacion

---

### Plan

Representa un plan comercial disponible dentro de AtlasIA.

Campos iniciales propuestos:

- id
- nombre
- precio
- limite_conversaciones
- limite_documentos
- limite_agentes
- activo

---

### Suscripción

Representa el plan contratado por una empresa.

Campos iniciales propuestos:

- id
- empresa_id
- plan_id
- estado
- fecha_inicio
- fecha_fin
- renovacion_automatica

---

## Relaciones principales

- Una empresa puede tener muchos usuarios.
- Una empresa puede tener muchos agentes.
- Un agente puede tener muchos documentos.
- Un documento puede tener muchos fragmentos.
- Un agente puede tener muchas conversaciones.
- Una conversación puede tener muchos mensajes.
- Una empresa tiene una suscripción activa.
- Una suscripción pertenece a un plan.

---

## Decisión inicial

La arquitectura de datos se diseñará pensando en multi-tenant desde el inicio.

Cada entidad crítica tendrá una relación directa o indirecta con `empresa_id` para asegurar separación de datos entre empresas.