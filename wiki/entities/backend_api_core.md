---
type: Entity
title: Backend API Core — Prometeo
description: Backend NestJS con lógica multi-tenant, CRUD de oportunidades, orquestación de agentes y webhooks.
timestamp: 2026-08-27T20:20:00-05:00
tags:
  - prometeo
  - backend
  - nestjs
  - api
  - multitenant
---

# Backend API Core

## Tecnología
- **NestJS (Node.js)** — por consistencia con el ecosistema CIDE (Fenix, Admin, Argos usan NestJS).
- Prisma ORM + PostgreSQL 16/pgvector.
- Redis 7 + BullMQ para colas de inferencia IA asíncronas.

## Responsabilidades
- Lógica de negocio y gestión multi-tenant (RLS).
- CRUD de oportunidades, bids, contract_projects, financial_ledgers.
- Orquestación de agentes (Commander) y máquina de estados del funnel.
- Webhooks entrantes (n8n, correo RFI/RFP) con verificación HMAC-SHA256 (`x-webhook-signature`) + `timingSafeEqual` (patrón ecosistema).
- API propia con API keys (patrón Fenix: tabla `api_keys`, keyHash sha256, x-api-key).

## Endpoints de integración con Admin (patrón Fenix)
- `GET /admin/tenants` (+ filtros status/plan/search)
- `GET /admin/tenants/global-stats`
- `GET /admin/tenants/:id`
- `GET /PATCH /admin/tenants/:id/subscription`
- `POST /admin/tenants/:id/suspend` | `/reactivate`
- `POST /license-status/webhooks/activated` | `/status-changed`

## Seguridad
- JWT con tenant_id inyectado (fuente del RLS).
- bcrypt/argon2 para passwords.
- Rate limiting global (ThrottlerGuard).
- Sin fallback de JWT secret hardcodeado (lección Fenix).
