# Registro de decisiones

---

## 25-06-2026

### Decisión

Se utilizará NestJS como framework principal del backend.

### Motivo

Necesitamos una arquitectura escalable, modular y preparada para múltiples empresas (multi-tenant).

NestJS ofrece una excelente organización del código, soporte para TypeScript y una estructura adecuada para proyectos SaaS.

---

## 25-06-2026

### Decisión

La base de datos será PostgreSQL.

### Motivo

Necesitamos una base de datos relacional robusta, con soporte para pgvector y consultas complejas.

## 25-06-2026

### Decisión

El backend de AtlasIA utilizará una arquitectura Modular + Clean.

### Motivo

Se busca mantener una estructura organizada, escalable y fácil de comprender, aprovechando la organización por módulos de NestJS e incorporando principios de Arquitectura Limpia sin aumentar innecesariamente la complejidad.

Cada funcionalidad importante será un módulo independiente.

Ejemplos:

- Empresas
- Usuarios
- Agentes
- Documentos
- Conversaciones
- Suscripciones

Cada módulo encapsulará sus controladores, servicios, DTOs e interfaces.