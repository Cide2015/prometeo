---
type: Concept
title: Anti-Rechazo Documental — Prometeo
description: Validación cruzada entre cifras digitadas en formularios web y certificaciones físicas en PDF para evitar descalificaciones.
timestamp: 2026-08-27T20:20:00-05:00
tags:
  - prometeo
  - anti-rechazo
  - validacion
  - documentos
---

# Validador de Coherencia Documental (Anti-Rechazo)

## Propósito
Evitar inconsistencias entre las cifras numéricas digitadas en formularios web y las certificaciones físicas en PDF que motiven la **descalificación de ofertas**.

## Mecanismo
- El agente Auditor extrae cifras de los PDFs certificados (estados financieros, RUT, certificados).
- Verificación cruzada automática contra lo digitado en los formularios del Módulo 4.
- Alertas de discrepancia antes de la presentación (Human-in-the-Loop del Commander).

## Impacto
- Reduce rechazos por error formal.
- Complementa el Monitor de Vencimiento y Liquidación Contractual (alertas 30 días antes del cierre).
