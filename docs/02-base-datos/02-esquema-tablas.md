# Esquema de Tablas

Este documento define la estructura inicial de las tablas principales de AtlasIA.

Incluye columnas, tipos de datos, restricciones, relaciones, reglas de negocio e índices recomendados.

---

# Tabla: empresas

## Descripción

Almacena la información de cada empresa que utiliza AtlasIA.

Cada registro representa un cliente del SaaS.

La empresa es la entidad principal del modelo multi-tenant, ya que permite separar los datos de cada organización.

---

## Columnas

| Columna | Tipo PostgreSQL | Restricciones | Descripción |
|----------|-----------------|---------------|-------------|
| id | UUID | PK | Identificador único de la empresa |
| nombre | VARCHAR(150) | NOT NULL | Nombre comercial |
| email_contacto | VARCHAR(255) | NOT NULL | Correo principal |
| telefono | VARCHAR(30) | NULL | Teléfono de contacto |
| rubro | VARCHAR(100) | NULL | Área o sector del negocio |
| sitio_web | VARCHAR(255) | NULL | Dirección del sitio web |
| estado | VARCHAR(30) | NOT NULL | Estado actual de la empresa |
| fecha_creacion | TIMESTAMP | NOT NULL | Fecha y hora de creación |
| fecha_actualizacion | TIMESTAMP | NOT NULL | Fecha y hora de la última modificación |

---

## Clave primaria

```text
PK → id
```

La columna `id` identifica de forma única a cada empresa.

---

## Relaciones

```text
Empresa (1) → (N) Usuario

Empresa (1) → (N) Cliente

Empresa (1) → (N) Conversación

Empresa (1) → (N) Documento

Empresa (1) → (N) API Key

Empresa (1) → (1) Configuración Widget

Empresa (1) → (1) Suscripción
```

Una empresa puede tener muchos usuarios, clientes, conversaciones, documentos y API Keys.

Para el MVP, una empresa tendrá una configuración principal del widget y una suscripción activa.

---

## Estados posibles

- `prueba`
- `activa`
- `suspendida`
- `inactiva`
- `cancelada`

---

## Reglas de negocio

- El nombre de la empresa es obligatorio.
- El correo de contacto debe tener un formato válido.
- El estado debe pertenecer a la lista de estados permitidos.
- Los datos de una empresa no deben mezclarse con los datos de otra empresa.
- Toda consulta multi-tenant debe filtrar por el identificador de la empresa.
- No debe eliminarse una empresa con información asociada sin una estrategia definida.
- Se recomienda utilizar borrado lógico en lugar de eliminar físicamente la información inmediatamente.

---

## Índices recomendados

- `PK(id)`
- `INDEX(nombre)`
- `INDEX(email_contacto)`
- `INDEX(estado)`

---

# Tabla: usuarios

## Descripción

Almacena las cuentas de las personas que utilizan el panel administrativo de AtlasIA.

Cada usuario pertenece a una empresa y solo debe acceder a la información de esa empresa.

Ejemplos de usuarios:

- Propietario del negocio.
- Administrador.
- Agente de atención.
- Usuario con acceso de solo lectura.

---

## Columnas

| Columna | Tipo PostgreSQL | Restricciones | Descripción |
|----------|-----------------|---------------|-------------|
| id | UUID | PK | Identificador único del usuario |
| empresa_id | UUID | FK, NOT NULL | Empresa a la que pertenece |
| nombre | VARCHAR(150) | NOT NULL | Nombre completo del usuario |
| email | VARCHAR(255) | NOT NULL | Correo utilizado para iniciar sesión |
| password_hash | VARCHAR(255) | NOT NULL | Contraseña almacenada de forma segura |
| rol | VARCHAR(30) | NOT NULL | Rol del usuario dentro de la empresa |
| estado | VARCHAR(30) | NOT NULL | Estado actual de la cuenta |
| ultimo_acceso | TIMESTAMP | NULL | Fecha y hora del último inicio de sesión |
| fecha_creacion | TIMESTAMP | NOT NULL | Fecha y hora de creación |
| fecha_actualizacion | TIMESTAMP | NOT NULL | Fecha y hora de la última modificación |

---

## Clave primaria

```text
PK → id
```

La columna `id` identifica de forma única a cada usuario.

---

## Clave foránea

```text
FK → empresa_id referencia a empresas.id
```

La columna `empresa_id` permite saber a qué empresa pertenece cada usuario.

También es una de las claves principales para implementar el modelo multi-tenant.

---

## Relación

```text
Empresa (1) → (N) Usuario
```

Una empresa puede tener muchos usuarios.

Un usuario pertenece a una sola empresa.

---

## Roles iniciales

- `owner`: propietario de la empresa.
- `admin`: administra usuarios, documentos y configuración.
- `agent`: revisa conversaciones y atiende clientes.
- `viewer`: solo puede consultar información.

---

## Estados posibles

- `activo`
- `inactivo`
- `bloqueado`
- `pendiente`

---

## Reglas de negocio

- Todo usuario debe pertenecer a una empresa.
- El nombre es obligatorio.
- El correo debe tener un formato válido.
- La contraseña nunca debe almacenarse en texto plano.
- El rol debe pertenecer a la lista de roles permitidos.
- El estado debe pertenecer a la lista de estados permitidos.
- Un usuario bloqueado no puede iniciar sesión.
- Un usuario inactivo no puede utilizar el panel administrativo.
- El propietario de una empresa no debería eliminarse sin transferir antes la propiedad.
- El correo no debe repetirse dentro de una misma empresa.
- Las consultas realizadas por el usuario deben limitarse a los datos de su empresa.

---

## Restricciones recomendadas

```text
UNIQUE (empresa_id, email)
```

Esta restricción impide que dos usuarios de una misma empresa tengan el mismo correo electrónico.

Ejemplo válido:

```text
Empresa A → usuario@email.com

Empresa B → usuario@email.com
```

Ejemplo no válido:

```text
Empresa A → usuario@email.com

Empresa A → usuario@email.com
```

---

## Índices recomendados

- `PK(id)`
- `INDEX(empresa_id)`
- `INDEX(email)`
- `INDEX(estado)`
- `UNIQUE(empresa_id, email)`

---

# Tabla: clientes

# Tabla: clientes

## Descripción

Almacena la información de las personas que interactúan con el asistente de una empresa.

Un cliente puede ser un visitante anónimo del sitio web, un posible comprador, un paciente, un usuario que solicita soporte o cualquier persona que converse mediante el widget.

Cada cliente pertenece a una empresa.

---

## Columnas

| Columna | Tipo PostgreSQL | Restricciones | Descripción |
|----------|-----------------|---------------|-------------|
| id | UUID | PK | Identificador único del cliente |
| empresa_id | UUID | FK, NOT NULL | Empresa a la que pertenece |
| nombre | VARCHAR(150) | NULL | Nombre del cliente |
| email | VARCHAR(255) | NULL | Correo electrónico |
| telefono | VARCHAR(30) | NULL | Número telefónico |
| identificador_externo | VARCHAR(255) | NULL | Identificador proveniente de otro sistema |
| origen | VARCHAR(50) | NOT NULL | Canal desde el cual llegó el cliente |
| estado | VARCHAR(30) | NOT NULL | Estado actual del cliente |
| fecha_creacion | TIMESTAMP | NOT NULL | Fecha y hora de creación |
| fecha_actualizacion | TIMESTAMP | NOT NULL | Fecha y hora de la última modificación |

---

## Clave primaria

```text
PK → id
```

La columna `id` identifica de forma única a cada cliente.

---

## Clave foránea

```text
FK → empresa_id referencia a empresas.id
```

La columna `empresa_id` indica a qué empresa pertenece el cliente.

Esta relación es fundamental para mantener el aislamiento de datos entre empresas.

---

## Relación con empresa

```text
Empresa (1) → (N) Cliente
```

Una empresa puede tener muchos clientes.

Un cliente pertenece a una sola empresa.

---

## Relación con conversaciones

```text
Cliente (1) → (N) Conversación
```

Un cliente puede iniciar varias conversaciones.

Cada conversación puede estar asociada a un cliente.

---

## Orígenes posibles

- `widget`
- `whatsapp`
- `instagram`
- `facebook`
- `api`
- `manual`

Para el MVP, el origen principal será `widget`.

---

## Estados posibles

- `anonimo`
- `identificado`
- `prospecto`
- `cliente`
- `bloqueado`

---

## Reglas de negocio

- Todo cliente debe pertenecer a una empresa.
- Un cliente puede registrarse sin nombre, correo ni teléfono.
- El campo `origen` es obligatorio.
- El estado debe pertenecer a la lista de estados permitidos.
- El correo debe tener un formato válido cuando sea informado.
- El teléfono debe almacenarse en un formato consistente.
- Los datos del cliente no deben ser visibles para otras empresas.
- Un cliente anónimo puede convertirse posteriormente en un cliente identificado.
- No deben crearse duplicados innecesarios cuando el cliente ya pueda identificarse mediante correo, teléfono o identificador externo.
- La eliminación de un cliente debe considerar qué ocurrirá con sus conversaciones anteriores.

---

## Restricciones recomendadas

```text
UNIQUE (empresa_id, identificador_externo)
```

Esta restricción evita registrar dos veces el mismo identificador externo dentro de una empresa.

Como `identificador_externo` puede ser nulo, la estrategia exacta deberá definirse al implementar PostgreSQL.

---

## Índices recomendados

- `PK(id)`
- `INDEX(empresa_id)`
- `INDEX(email)`
- `INDEX(telefono)`
- `INDEX(estado)`
- `INDEX(origen)`
- `UNIQUE(empresa_id, identificador_externo)`

---

---

# Tabla: conversaciones

Pendiente de completar.

---

# Tabla: mensajes

Pendiente de completar.

---

# Tabla: documentos

Pendiente de completar.

---

# Tabla: planes

Pendiente de completar.

---

# Tabla: suscripciones

Pendiente de completar.

---

# Tabla: api_keys

Pendiente de completar.

---

# Tabla: configuracion_widget

Pendiente de completar.