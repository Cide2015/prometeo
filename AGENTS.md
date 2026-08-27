# AGENTS.md — Prometeo

Guía para agentes de IA que trabajen en este repositorio (CIDE SAS).

## Contexto
- **Prometeo** es una plataforma SaaS multi-tenant de licitaciones SECOP II/TVEC con swarm de agentes IA.
- Convención CIDE: desarrollo en WSL2 (`/mnt/c/Users/meciz/dockers/Prometeo`), push a GitHub (org `Cide2015`), deploy en `/apps/prometeo` (SRV01).
- Despliegue: `docker-compose.prod.yml` (Docker Compose). NUNCA renombrar este archivo.

## CRLF (crítico)
- Los archivos de repos CIDE usan CRLF (Windows/WSL2). No reescribir con Python (rompe el diff).
- Verificar: `git diff -w --stat`; restaurar con `sed -i 's/\r$//; s/$/\r/' <archivo>`.

## OKF
- La wiki (`wiki/`) es la fuente de verdad. Actualizar `wiki/log.md` con cada cambio significativo.
- Estructura: `index.md` (mapa maestro), `entities/` (componentes), `concepts/` (reglas de negocio), `sources/` (resúmenes), `raw/` (documentos inmutables).

## Reglas de seguridad
- Cero puertos expuestos; solo Cloudflare Tunnel → NPM → nginx interno.
- RLS multi-tenant: `app.current_tenant_id` desde el JWT, nunca del body.
- Secretos SOLO en `.env` / Docker secrets; nunca commitear.
- Webhooks entrantes con HMAC-SHA256 + `timingSafeEqual`.

## Stack
- Next.js 14 (frontend) · NestJS (backend) · PostgreSQL 16 + pgvector · Redis 7 · n8n · Nginx.

## Flujo de deploy (convención Mario)
1. Editar en WSL2 → validar sintaxis (`node --check`, OKF lint).
2. Commit + push a GitHub (rama feature o main).
3. En SRV01 `/apps/prometeo`: `git pull` + `docker compose -f docker-compose.prod.yml build --no-cache <svc>` + `up -d`.
4. Verificar: `curl -sI https://prometeo.cidesolutions.com/health` → 200, login real, endpoint del cambio.
