# Modelo de Entidades — AtlasIA

## Objetivo

Este documento define las entidades principales del sistema AtlasIA, sus responsabilidades, atributos, relaciones y reglas de negocio.

El objetivo es entender cómo se organizarán los datos antes de comenzar a construir la base de datos y el backend.

---

# Entidades principales del sistema

AtlasIA tendrá las siguientes entidades base:

1. Empresa
2. Usuario
3. Cliente
4. Conversación
5. Mensaje
6. Documento
7. Plan
8. Suscripción
9. API Key
10. Configuración del Widget

---

# 1. Empresa

## Definición

Una empresa representa a cada negocio que usa AtlasIA.

Ejemplo:

- Una clínica dental
- Una inmobiliaria
- Una tienda online
- Un estudio jurídico
- Un restaurante

En un SaaS multi-tenant, la empresa es una entidad central porque permite separar los datos de cada cliente.

## Responsabilidad

La empresa agrupa usuarios, clientes, conversaciones, documentos, configuración del widget y suscripción.

## Atributos posibles

- id
- nombre
- email_contacto
- telefono
- rubro
- sitio_web
- estado
- fecha_creacion
- fecha_actualizacion

## Relaciones

Una empresa puede tener muchos usuarios.

Una empresa puede tener muchos clientes.

Una empresa puede tener muchas conversaciones.

Una empresa puede tener muchos documentos.

Una empresa puede tener una suscripción activa.

Una empresa puede tener una configuración de widget.

## Reglas de negocio

Cada empresa debe tener un nombre.

Cada empresa debe tener un estado.

Los datos de una empresa no deben mezclarse con los datos de otra empresa.

---

# 2. Usuario

## Definición

Un usuario es una persona que trabaja dentro de una empresa y usa el panel de administración de AtlasIA.

Ejemplo:

- Dueño del negocio
- Ejecutivo de ventas
- Soporte
- Administrador

## Responsabilidad

El usuario inicia sesión, administra documentos, revisa conversaciones y configura el sistema.

## Atributos posibles

- id
- empresa_id
- nombre
- email
- password_hash
- rol
- estado
- fecha_creacion
- fecha_actualizacion

## Relaciones

Un usuario pertenece a una empresa.

Una empresa puede tener muchos usuarios.

## Reglas de negocio

Cada usuario debe pertenecer a una empresa.

El email del usuario debe ser único.

El usuario no debe guardar contraseñas en texto plano.

---

# 3. Cliente

## Definición

Un cliente es la persona que conversa con el asistente IA desde el widget.

Ejemplo:

- Visitante de una página web
- Potencial comprador
- Paciente interesado
- Cliente que necesita soporte

## Responsabilidad

Representa al usuario final que interactúa con el chat de IA.

## Atributos posibles

- id
- empresa_id
- nombre
- email
- telefono
- identificador_externo
- fecha_creacion
- fecha_actualizacion

## Relaciones

Un cliente pertenece a una empresa.

Un cliente puede tener muchas conversaciones.

## Reglas de negocio

Un cliente siempre debe estar asociado a una empresa.

Un cliente puede existir aunque no entregue nombre o email.

---

# 4. Conversación

## Definición

Una conversación representa una sesión de chat entre un cliente y el asistente IA.

## Responsabilidad

Agrupa todos los mensajes enviados durante una interacción.

## Atributos posibles

- id
- empresa_id
- cliente_id
- estado
- canal
- fecha_inicio
- fecha_fin
- fecha_creacion

## Relaciones

Una conversación pertenece a una empresa.

Una conversación puede pertenecer a un cliente.

Una conversación tiene muchos mensajes.

## Reglas de negocio

Toda conversación debe pertenecer a una empresa.

Una conversación puede estar abierta, cerrada o pendiente.

---

# 5. Mensaje

## Definición

Un mensaje es cada texto enviado dentro de una conversación.

Puede ser enviado por:

- Cliente
- IA
- Usuario humano

## Responsabilidad

Guardar el historial completo de una conversación.

## Atributos posibles

- id
- conversacion_id
- remitente
- contenido
- tipo
- fecha_creacion

## Relaciones

Un mensaje pertenece a una conversación.

Una conversación puede tener muchos mensajes.

## Reglas de negocio

Todo mensaje debe pertenecer a una conversación.

El remitente debe indicar si el mensaje viene del cliente, IA o usuario humano.

---

# 6. Documento

## Definición

Un documento contiene información que la IA usará para responder preguntas.

Ejemplo:

- Preguntas frecuentes
- Políticas de devolución
- Catálogo de productos
- Horarios de atención
- Información de servicios

## Responsabilidad

Servir como fuente de conocimiento para el sistema RAG.

## Atributos posibles

- id
- empresa_id
- nombre
- tipo
- url_archivo
- contenido_texto
- estado_procesamiento
- fecha_creacion
- fecha_actualizacion

## Relaciones

Un documento pertenece a una empresa.

Una empresa puede tener muchos documentos.

## Reglas de negocio

Todo documento debe pertenecer a una empresa.

Un documento puede estar pendiente, procesando, procesado o con error.

---

# 7. Plan

## Definición

Un plan representa una opción comercial del SaaS.

Ejemplo:

- Gratis
- Básico
- Pro
- Empresa

## Responsabilidad

Definir límites y características disponibles para una empresa.

## Atributos posibles

- id
- nombre
- precio
- limite_usuarios
- limite_documentos
- limite_mensajes
- incluye_rag
- incluye_widget
- estado

## Relaciones

Un plan puede estar asociado a muchas suscripciones.

## Reglas de negocio

Cada plan debe tener un nombre y un precio.

Un plan puede estar activo o inactivo.

---

# 8. Suscripción

## Definición

Una suscripción representa el plan contratado por una empresa.

## Responsabilidad

Controlar el acceso de una empresa a las funcionalidades del sistema.

## Atributos posibles

- id
- empresa_id
- plan_id
- estado
- fecha_inicio
- fecha_fin
- fecha_renovacion
- proveedor_pago

## Relaciones

Una suscripción pertenece a una empresa.

Una suscripción pertenece a un plan.

Una empresa puede tener una suscripción activa.

## Reglas de negocio

Una empresa solo debería tener una suscripción activa a la vez.

Si la suscripción está vencida, se pueden limitar funcionalidades.

---

# 9. API Key

## Definición

Una API Key es una clave que permite a una empresa conectarse con AtlasIA desde sistemas externos.

## Responsabilidad

Permitir integraciones seguras con otros sistemas.

## Atributos posibles

- id
- empresa_id
- nombre
- clave_hash
- estado
- fecha_creacion
- fecha_expiracion

## Relaciones

Una API Key pertenece a una empresa.

Una empresa puede tener muchas API Keys.

## Reglas de negocio

La clave real no debe guardarse directamente.

Solo se debe guardar una versión protegida o hasheada.

---

# 10. Configuración del Widget

## Definición

La configuración del widget define cómo se verá y comportará el chat instalado en la web de una empresa.

## Responsabilidad

Personalizar la experiencia del asistente IA para cada empresa.

## Atributos posibles

- id
- empresa_id
- color_principal
- mensaje_bienvenida
- nombre_asistente
- posicion
- logo_url
- activo
- fecha_creacion
- fecha_actualizacion

## Relaciones

Una configuración de widget pertenece a una empresa.

Una empresa puede tener una configuración de widget.

## Reglas de negocio

Cada empresa debería tener una sola configuración activa del widget.

El widget solo debe funcionar si está activo.

---

# Resumen de relaciones

Empresa tiene muchos usuarios.

Empresa tiene muchos clientes.

Empresa tiene muchas conversaciones.

Empresa tiene muchos documentos.

Empresa tiene muchas API Keys.

Empresa tiene una configuración de widget.

Empresa tiene una suscripción activa.

Cliente tiene muchas conversaciones.

Conversación tiene muchos mensajes.

Plan tiene muchas suscripciones.

Suscripción pertenece a una empresa y a un plan.

---

# Pendientes

- Definir tipos exactos de datos.
- Definir claves primarias y foráneas.
- Crear el ERD.
- Definir tablas SQL.
- Definir migraciones iniciales.