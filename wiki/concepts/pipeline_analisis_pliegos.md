---
type: Concept
title: Pipeline de Análisis de Pliegos — Prometeo
description: Orquestador que divide el análisis del pliego en sub-agentes especializados con RAG + pgvector.
timestamp: 2026-08-27T20:20:00-05:00
tags:
  - prometeo
  - pipeline
  - pliegos
  - rag
  - pgvector
---

# Pipeline de Análisis de Pliegos

## Enfoque (per PDF)
Diseñar un orquestador (Commander) que divida el análisis del pliego en sub-agentes especializados:
1. **Agente Legal/Documental**: requisitos jurídicos, inhabilidades, pólizas, documentos.
2. **Agente Técnico**: requerimientos de equipo, perfiles habilitantes, certificaciones, SLA.
3. **Agente Financiero**: costos directos/indirectos, flujo de caja, margen.

## RAG con pgvector
- Indexación de PDFs y adendas con **embeddings** en pgvector.
- Consultas de negocio: "¿Exigen ingenieros certificados en Kubernetes o experiencia específica de 5 años?"
- Matriz de cumplimiento técnico por comparación semántica contra la biblioteca de experiencia del tenant.

## Flujo
1. Descarga de pliegos (Módulo 1 → Aplicar).
2. Extracción de texto + embeddings → pgvector.
3. Sub-agentes evalúan en paralelo → alimentan el motor Go/No-Go.
