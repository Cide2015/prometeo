---
type: Entity
title: Integración con Admin Hub — Prometeo
description: Registro del producto APP004 en Admin, planes, API keys, CORS y sincronización de licencias Hub-Spoke.
timestamp: 2026-08-27T20:15:00-05:00
tags:
  - prometeo
  - admin
  - hub-spoke
  - licencias
  - app004
---

# Integración con Admin Hub

## Registro del producto
- Producto: **APP004** (Prometeo) en Admin (SRV02).
- Genera: `code`, `apiKey` (producto), `webhookSecret`.
- Landing consulta planes en tiempo real: `GET {ADMIN}/api/integration/public-plans/APP004`.

## Planes propuestos (a confirmar con Admin)
Modelo SaaS multi-tenant de licitaciones. Propuesta inicial (los precios finales los define Mario en Admin):
- **Starter** — inventario SECOP + filtros UNSPSC básicos.
- **Professional** — + motor Go/No-Go y análisis de pliegos RAG.
- **Enterprise** — + agentes completos, API, multi-usuario, soporte dedicado.

## Credenciales
- En Admin `.env`: `PROMETEO_API_URL`, `PROMETEO_API_KEY` (Admin → Prometeo).
- En Prometeo `.env`: `ADMIN_API_URL=https://admin.cidesolutions.com/api`, `ADMIN_API_KEY`, `ADMIN_APP_PRODUCT_CODE=APP004`.
- `ALLOWED_INTEGRATION_IPS` en Admin: agregar IP de SRV01 (100.70.173.34) si aplica.
- CORS de Admin: agregar origen `https://prometeo.cidesolutions.com`.

## API keys de Hermes (patrón ecosistema)
- Key por app para gestión vía API con alcance por tenant (Mario crea los clientes y pasa la key a Hermes).

## Verificación end-to-end
1. `POST /api/integration/licenses/validate` con tenant de CIDE SAS → `valid:true`.
2. Landing muestra planes reales de Admin (cache no-store + `?t=`).
3. Sincronización en logs de Admin (`docker logs admin_backend_prod | grep -i sincroniz`).
