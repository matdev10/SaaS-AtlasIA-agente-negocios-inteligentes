# Bitácora de desarrollo

---

## 25-06-2026 · Sprint 0 · Foundation

### Objetivo

Preparar la base del proyecto y definir la visión inicial de AtlasIA.

### Logros

- Se definió la idea del producto.
- Se decidió construir una plataforma SaaS para agentes IA.
- Se creó la estructura del repositorio.
- Se inicializó el backend con NestJS.
- Se organizó la documentación del proyecto.
- Se decidió trabajar con documentación antes de comenzar el desarrollo.

### Resultado

Proyecto preparado para iniciar el diseño funcional.

---

## 25-06-2026 · Sprint 1 · Arquitectura Funcional

### Objetivo

Definir el producto y el dominio antes de implementar la solución técnica.

### Logros

#### Producto

- PRD consolidado.
- Roadmap del producto.
- Modelo de negocio.
- Funcionalidades principales.
- Flujo general del producto.

#### Arquitectura

- Modelo de dominio versión 1.1.
- Definición de Company como raíz del dominio.
- Definición de los agregados principales.
- Definición del modelo Multi-Tenant.
- Reglas globales del dominio.
- Relación entre Agente IA, Base de Conocimiento y Conversaciones.

#### Organización

- Se incorporó la carpeta ADR para registrar decisiones de arquitectura.
- Se estableció un proceso de revisión documental utilizando Codex como apoyo.
- Se definió que toda decisión de arquitectura deberá estar respaldada por la documentación.

### Estado actual

La arquitectura funcional del producto se considera estable.

El proyecto está preparado para comenzar el diseño técnico.

### Próximo paso

- Diseñar el ERD.
- Diseñar PostgreSQL.
- Diseñar el esquema de Prisma.
- Definir la arquitectura del backend.

### Aprendizajes

- Diferencia entre negocio, dominio y base de datos.
- Importancia del Domain Model antes del diseño relacional.
- Diseño de un SaaS utilizando un enfoque incremental.
- Uso de documentación como fuente de verdad del proyecto.