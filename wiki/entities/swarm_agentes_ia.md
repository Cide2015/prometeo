---
type: Entity
title: Swarm de Agentes de IA — Prometeo
description: Equipo de 5 agentes (Scout, Auditor, Costing, Drafter, Commander) que orquesta el ciclo de vida licitatorio.
timestamp: 2026-08-27T20:10:00-05:00
tags:
  - prometeo
  - agentes
  - swarm
  - ia
---

# Swarm de Agentes de IA

Orquestación del ciclo completo: prospección → viabilidad → estructuración → gobernanza → control financiero.

| Agente | Nombre | Modelo asignado | Responsabilidad |
|---|---|---|---|
| Agent-1 | **Scout** | gpt-4o-mini / claude-3-haiku | Consume APIs SECOP II/TVEC, extrae metadatos, filtra por UNSPSC del tenant |
| Agent-2 | **Auditor** | claude-3-5-sonnet | Analiza pliegos PDF con RAG, evalúa requisitos jurídicos, financieros y experiencia |
| Agent-3 | **Costing** | gpt-4o / deepseek-chat | Estructura propuesta económica, costos directos/indirectos, impuestos territoriales, margen |
| Agent-4 | **Drafter** | claude-3-5-sonnet | Redacta propuestas técnicas, planes metodológicos, diligencia formatos Colombia Compra Eficiente |
| Agent-5 | **Commander** | claude-3-5-sonnet | Orquesta comunicación entre agentes, máquina de estados del funnel, Human-in-the-Loop |

## Pipeline de análisis de pliegos (per PDF)
El orquestador divide el análisis en sub-agentes especializados:
(a) **Agente Legal/Documental**, (b) **Agente Técnico**, (c) **Agente Financiero**.

## Rutas de modelos IA
- Enrutamiento dinámico por OpenRouter, OpenAI, Anthropic o DeepSeek con fallback inteligente y cuotas de consumo por token (Módulo 7).
- Embeddings de pliegos → pgvector → RAG para consultas de negocio (ej. "¿Exigen ingenieros certificados en Kubernetes?").
