---
type: Concept
title: Aislamiento Multi-Tenant — Prometeo
description: Row-Level Security en PostgreSQL basado en el tenant_id inyectado en el JWT, y segmentación de redes Docker.
timestamp: 2026-08-27T20:15:00-05:00
tags:
  - prometeo
  - multitenant
  - rls
  - seguridad
---

# Aislamiento Multi-Tenant

## RLS en PostgreSQL (per PDF)
- Implementar **Row-Level Security (RLS)** en PostgreSQL basado en el `tenant_id` inyectado en el **JWT** del usuario autenticado.
- Variable de sesión: `app.current_tenant_id` en todas las consultas relacionales.
- Esquemas de particionamiento lógico para clientes de alto volumen.
- El backend (NestJS) establece `SET app.current_tenant_id = '<uuid>'` por conexión/tenant antes de ejecutar consultas.

## Patrón en el ecosistema CIDE
- **Fenix-SGCN** usa schema-per-tenant; **Argos** usa RLS; **Armonía** usa esquemas dedicados por tenant.
- Prometeo adopta **RLS** (alineado con SRS y PDF), la opción más escalable para N tenants en una sola BD.

## Reglas de seguridad
- Toda consulta que lea datos de tenant pasa por políticas RLS (`USING (tenant_id = current_setting('app.current_tenant_id')::uuid)`).
- El `tenant_id` NUNCA se toma del body del cliente; siempre del token autenticado.
- Rate limit por tenant en Redis.

## Segmentación de red Docker
- `red_publica` (external): nginx ↔ NPM/Cloudflare.
- `prometeo-internal-network`: nginx ↔ app ↔ backend ↔ db ↔ redis ↔ n8n. Sin exposición directa al host de db/redis.
