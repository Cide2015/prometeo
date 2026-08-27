---
type: Concept
title: Motor Go / No-Go — Prometeo
description: Algoritmo de decisión de licitación basado en matriz de cumplimiento técnico, validación financiera automática y puntaje de éxito P_win.
timestamp: 2026-08-27T20:15:00-05:00
tags:
  - prometeo
  - go-nogo
  - financiero
  - pwin
  - scoring
---

# Motor Go / No-Go

Decisión sugerida de participar (GO) o descartar (NO-GO) una oportunidad, con justificación.

## 1. Matriz de Cumplimiento Técnico
Extracción de requisitos mediante agentes RAG (Auditor) y comparación semántica contra la biblioteca de experiencia del tenant.

## 2. Validación Financiera Automática (fórmulas del pliego)
Evaluación contra la línea base financiera del tenant (CIDE SAS, corte 31/12/2025):

| Indicador | Fórmula | Criterio | Valor CIDE |
|---|---|---|---|
| Liquidez | Activo Corriente / Pasivo Corriente | ≥ Exigido | 1,39 |
| Endeudamiento | Pasivo Total / Activo Total | ≤ Exigido | 0,71 |
| ROE | Utilidad Operacional / Patrimonio | ≥ Exigido | 0,42 |
| ROA | Utilidad Operacional / Activo Total | ≥ Exigido | 0,12 |
| Cobertura de Intereses | Utilidad Operacional / Gastos de Intereses | Cumple si ≥ 1 | Indeterminado (cumple: sin pasivo financiero) |

## 3. Estimación de Costos y Margen
Desglose paramétrico: costos de personal, viáticos, infraestructura cloud y margen neto esperado (agente Costing).

## 4. Puntaje de Éxito (P_win)
Algoritmo de ponderación (0-100%) que combina:
- Cumplimiento técnico (RAG vs experiencia)
- Cumplimiento financiero (matriz)
- Presupuesto estimado vs. margen objetivo
- Capacidad operativa

**Salida:** `GO` (viable para licitar) o `NO-GO` (descartar con justificación), con Human-in-the-Loop del Commander.
