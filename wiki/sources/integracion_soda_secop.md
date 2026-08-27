---
type: Source
title: Integración SODA API SECOP II
description: Endpoints de Datos Abiertos de Colombia Compra Eficiente, sintaxis SOQL y filtros de oportunidades vigentes.
timestamp: 2026-08-27T20:20:00-05:00
tags:
  - prometeo
  - secop
  - soda
  - soql
  - datos-abiertos
---

# Integración SODA API — SECOP II / TVEC

## Endpoints (Datos Abiertos Colombia Compra Eficiente)
| Dataset | ID |
|---|---|
| SECOP II Procesos | `p6dx-8zbt` |
| SECOP II Contratos | `jbjy-vk9h` |
| Tienda Virtual Consolidado | `rgxm-mmea` |

## Sintaxis SOQL
```
GET https://www.datos.gov.co/resource/p6dx-8zbt.json?$where=estado_del_proceso='Presentación de ofertas' AND valor_...
```
- Header: `X-App-Token: [TENANT_REGISTERED_TOKEN]` (por tenant, configurable en Módulo 7).
- Filtro de oportunidad vigente: `estado_del_proceso='Presentación de ofertas'`.

## Consumo asíncrono
- n8n hace polling programado; el backend procesa la cola (BullMQ) y puebla `opportunities` del tenant.
- Filtros: códigos UNSPSC del tenant, rangos presupuestales en SMMLV, ubicación geográfica, modalidad de selección.
- Caché de respuestas en Redis para no saturar el API.
