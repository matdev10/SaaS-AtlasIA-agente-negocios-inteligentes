# Relaciones del modelo de datos

## Empresa

- Empresa (1) → (N) Usuario
- Empresa (1) → (N) Cliente
- Empresa (1) → (N) Documento
- Empresa (1) → (N) API Key
- Empresa (1) → (1) Configuración Widget
- Empresa (1) → (1) Suscripción

---

## Cliente

- Cliente (1) → (N) Conversación

---

## Conversación

- Conversación (1) → (N) Mensaje

---

## Plan

- Plan (1) → (N) Suscripción