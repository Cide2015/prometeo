---
type: Source
title: Benchmark Competitivo — alicia.services
description: Análisis de la competencia (alicia.services + podcast de Gabriel) para enriquecer Prometeo con funcionalidades de alto valor.
timestamp: 2026-08-28T16:00:00-05:00
tags:
  - prometeo
  - benchmark
  - competencia
  - alicia
  - secop
  - roadmap
---

# Benchmark Competitivo: alicia.services → Prometeo

Fuente: https://alicia.services/ (landing + 2 artículos blog) y podcast YouTube `nyjc_eIMGcU` (44:50, Gabriel cofundador de Alicia).

## Qué hace alicia.services (la competencia)
- IA entrenada especializada en licitaciones públicas que trabaja 24/7.
- Rastrea miles de procesos SECOP al día y los analiza en minutos.
- Centraliza oportunidades de distintas fuentes, facilita trabajo en equipo, control total del proceso.

## Funcionalidades de alicia.services (las que Prometeo debe superar)
1. **Búsqueda Inteligente** — filtros avanzados + palabras clave según perfil de la empresa (sector, experiencia, indicadores financieros, ubicación).
2. **Análisis de Procesos con IA** — lee los pliegos y entrega resumen: requisitos habilitantes, indicadores financieros exigidos, experiencia requerida.
3. **Notificaciones Diarias** — correo diario con nuevos procesos SECOP que coinciden con tus criterios.
4. **Fechas Clave** — visualiza y controla las fechas clave de los procesos (cierre, apertura, publicación) para no perder plazos.
5. **Análisis de Competencia (BETA)** — historial de contratistas y consorcios para entender el contexto competitivo de un proceso.
6. **Múltiples Perfiles** — hasta 3 perfiles de búsqueda por empresa según líneas de negocio o equipos.
7. **Chat interactivo con los pliegos (RAG)** — preguntas tipo: "¿cuál es el objeto?", "¿qué experiencia exigen?", "¿cumplimos los indicadores financieros?".
8. **Comparación automática de indicadores financieros** — dice si cumples o no, y sugiere estrategias (unión temporal).
9. **Sugerencia de Uniones Temporales / Consorcios** — detecta oportunidades para conformar UT cuando no se cumple solo.
10. **Correo diario con oportunidades relevantes** + **tablero centralizado** (menos estrés, todo en un lugar).

## Del podcast (Gabriel, cofundador)
- Identificar procesos que sí convienen a la capacidad real de la empresa.
- Qué preguntas hacerle a la IA para entender los pliegos de condiciones.
- La nueva forma de trabajar licitaciones: tecnología como aliada activa (no solo repositorio de datos).
- La automatización no es solo alertas o Excel: es transformar procesos repetitivos en flujos asistidos por IA.

## Limitaciones del SECOP (que las herramientas como Prometeo resuelven)
- Búsqueda y lectura manual proceso por proceso.
- No prioriza ni clasifica según características de la empresa.
- No interpreta pliegos ni evalúa cumplimiento.
- No emite alertas personalizadas ni predicciones de viabilidad.
- No está diseñado para facilitar decisiones empresariales.

## Qué Prometeo YA tiene (vs. alicia)
| Capacidad | Prometeo | alicia |
|---|---|---|
| Filtrado SECOP por UNSPSC/cuantía/modalidad | ✅ Módulo 1 (básico) | ✅ |
| Análisis IA Go/No-Go (indicadores financieros) | ✅ Módulo 3 | ✅ (comparación) |
| Filtro por palabras clave | ❌ Falta | ✅ |
| Notificaciones diarias por correo | ❌ Falta (n8n listo) | ✅ |
| Fechas clave / alertas de vencimiento | ❌ Falta | ✅ |
| Múltiples perfiles de búsqueda por empresa | ❌ Falta | ✅ (hasta 3) |
| Chat con los pliegos (RAG interactivo) | ❌ Falta (pgvector listo) | ✅ |
| Resumen IA del pliego (requisitos habilitantes) | ❌ Falta | ✅ |
| Análisis de competencia (historial contratistas) | ❌ Falta | ✅ (BETA) |
| Sugerencia uniones temporales | ❌ Falta | ✅ |

## Plan de enriquecimiento propuesto (priorizado)
- **P1 — Búsqueda por palabras clave** (Módulo 1): campo texto en objeto + filtros avanzados (departamento, modalidad, rango cuantía). Rápido y alto impacto.
- **P1 — Notificaciones diarias por correo** (n8n + SMTP CIDE): resumen diario de nuevos procesos que coinciden con el perfil. n8n ya desplegado.
- **P1 — Fechas Clave**: tablero/calendario con fechas de cierre/apertura + alertas de vencimiento (Módulo 1/5).
- **P2 — Chat con los pliegos (RAG)**: subir pliego PDF → pgvector → preguntas en lenguaje natural (Agente Auditor). pgvector ya listo.
- **P2 — Resumen IA del pliego**: requisitos habilitantes + indicadores financieros exigidos + experiencia (conecta con Go/No-Go).
- **P2 — Múltiples perfiles de búsqueda**: hasta 3 perfiles por tenant (líneas de negocio), cada uno con sus UNSPSC/filtros.
- **P3 — Análisis de Competencia (BETA)**: consulta dataset SECOP II Contratos (jbjy-vk9h) → quién gana, montos, frecuencia.
- **P3 — Sugerencia de Uniones Temporales**: cuando no cumple solo, sugerir UT/consorcio.

## Estado
- Benchmark documentado 2026-08-28. Pendiente de aprobación de alcance por Mario.
