# Flujo 03 · Entrenamiento del Agente IA

## Objetivo

Transformar la información proporcionada por la empresa en conocimiento que pueda utilizar el Agente IA para responder preguntas.

---

## Actor principal

Sistema AtlasIA.

---

## Estado inicial

La empresa ya cargó documentos o preguntas frecuentes.

---

## Entradas

- Documentos PDF
- Documentos DOCX
- Archivos TXT
- Preguntas frecuentes (FAQ)

---

## Proceso

### Paso 1 · Recepción

El sistema recibe los documentos enviados por la empresa.

---

### Paso 2 · Validación

Se verifica:

- Tipo de archivo
- Tamaño
- Integridad

---

### Paso 3 · Extracción

Se obtiene el texto del documento.

---

### Paso 4 · Limpieza

El sistema elimina:

- Espacios innecesarios
- Caracteres inválidos
- Formato innecesario

---

### Paso 5 · Fragmentación

El contenido se divide en pequeños bloques de información.

---

### Paso 6 · Generación de Embeddings

Cada fragmento se convierte en un vector utilizando un modelo de IA.

---

### Paso 7 · Almacenamiento

Los embeddings y los fragmentos se almacenan en la Base de Conocimiento.

---

### Paso 8 · Finalización

El Agente IA queda actualizado con el nuevo conocimiento.

---

## Resultado esperado

El agente puede utilizar la nueva información para responder preguntas.

---

## Posibles errores

- Archivo corrupto.
- Documento vacío.
- Error generando embeddings.
- Error almacenando información.