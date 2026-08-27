---
type: Entity
title: Frontend SaaS Hub — Prometeo
description: Frontend Next.js + Tailwind: landing pública comercial, autenticación, dashboard reactivo y sidebar de 7 módulos operativos.
timestamp: 2026-08-27T20:20:00-05:00
tags:
  - prometeo
  - frontend
  - nextjs
  - landing
  - sidebar
---

# Frontend SaaS Hub

## Tecnología
- **Next.js 14 + Tailwind CSS** (Clean Theme), alineado con el patrón Fenix/Armonia/Admin del ecosistema.
- Dockerfile multi-stage (deps → builder → runner) con output `standalone`, patrón Armonia.
- Landing pública comercial + portal autenticado.

## Módulos de la sidebar (7)
1. **Inventario de Oportunidades** — espejo SECOP II / TVEC, filtros UNSPSC/SMMLV/ubicación/modalidad, acciones Aplicar/Descartar/Borrar.
2. **Invitaciones RFI/RFP** — bandeja de cotizaciones, Aplicar / Smart Decline.
3. **Análisis IA (Go/No-Go)** — matriz de cumplimiento, validación financiera, estimación de costos, P_win.
4. **Generador de Ofertas** — funnel Kanban (Borrador → Análisis → Documental → Firma → Presentada), generar expediente, firmar.
5. **Ganadas (Project Delivery)** — proyectos, entregables, hitos, SLAs, documental contractual.
6. **Control Financiero** — flujo de caja, facturación, liquidación impositiva, márgenes reales vs proyectados.
7. **Configuraciones** — conectividad API (SODA token, IA), API propia/webhooks, usuarios/roles (RBAC), biblioteca maestra de documentos.

## Roles (RBAC)
Admin, Evaluador Técnico, Evaluador Financiero, Operador de Proyecto, Auditor.

## Marca y SEO
- Título: "Prometeo | Inteligencia de Licitaciones Públicas y Privadas".
- Descripción meta con beneficio principal; author "CIDE SAS"; locale `es_LA`.
- OG tags presentes; favicon propio de producto.
