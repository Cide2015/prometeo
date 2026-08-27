---
type: Reference
title: Registro de Cambios Semánticos - Wiki Prometeo
description: Bitácora cronológica inversa de modificaciones semánticas de la base de conocimiento.
timestamp: 2026-08-27T23:05:00-05:00
---

2026-08-27: [feat(secop+auth): Login real, registro inicial de empresa desde cero y conexión SECOP II]
  - **Registro inicial (estilo Argos-RMM)**: script `bootstrap.ts` limpia la BD y crea la empresa desde cero: tenant CIDE SAS (NIT 900.858.048-0), usuario admin@cidesas.com (password Prometeo2026!, cambiar en primer ingreso), 15 perfiles UNSPSC, API key Hermes regenerada (guardada en /opt/data/keys/hermes_prometeo.txt SRV02).
  - **Login real**: página /login ahora es client-side con POST /api/auth/login (JWT). Verificado: emite token 273 chars.
  - **SECOP II conectado**: SecopService ingesta SODA API dataset p6dx-8zbt (SECOP II Procesos) filtrado por UNSPSC del tenant. Endpoint POST /api/opportunities/sync. Verificado: 14 oportunidades ingeridas (energía, infraestructura, MSP — coincidencia por segmento UNSPSC).
  - **Dashboard real**: muestra stats del tenant (disponibles/aplicadas/descartadas) + tabla de oportunidades con cuantía en COP + botón sincronizar.
  - **Pitfalls resueltos**:
    - Esquema real dataset: `estado_del_procedimiento` (no estado_del_proceso), `precio_base` (no valor_del_contrato), `entidad` (no nombre_de_la_entidad), `fecha_de_publicacion_del`.
    - Estados vigentes: 'Abierto' y 'Publicado'.
    - UNSPSC del dataset viene con prefijo `V1.` y a nivel de segmento (4 dígitos + 0000); match por primeros 4 dígitos.
    - `SecopService` debe registrarse como provider en OpportunitiesModule (error Nest DI).
    - n8n requiere BD propia `prometeo_n8n` (se creó con CREATE DATABASE).
  - Frontend con `NEXT_PUBLIC_API_URL` como build arg = https://prometeo.cidesolutions.com (client components).

2026-08-27: [deploy(prometeo): PUBLICADO en producción https://prometeo.cidesolutions.com]
  - Túnel Cloudflare creado por Mario: prometeo.cidesolutions.com → http://nginx-infra-vps1:80. DNS resuelve a Cloudflare (188.114.97.2).
  - Proxy host NPM en SRV01 (id=3): prometeo.cidesolutions.com → prometeo-nginx:80. Conf 3.conf generada manualmente (NPM no la regenera solo; patrón Armonia).
  - Contenedores levantados con docker-compose.prod.yml: prometeo-nginx, prometeo-app, prometeo-backend, prometeo-db (pgvector pg16, healthy), prometeo-db-backup, prometeo-redis, prometeo-n8n. Todos Up.
  - Verificado público: GET https://prometeo.cidesolutions.com/ → 200 (landing); /api/health → {"status":"ok","db":"ok"}; /login → 200; x-api-key Hermes en /api/opportunities → responde.
  - Headers de seguridad activos: HSTS, CSP, nosniff, SAMEORIGIN, referrer-policy, permissions-policy; server: cloudflare.
  - Seed ejecutado: tenant CIDE SAS, admin@cidesas.com, 15 perfiles UNSPSC, API key Hermes.

2026-08-27: [fix(infra): debugging de build y runtime Prometeo]
  - nginx: `limit_req_zone` debe ir a nivel http (no dentro de server) → crash loop corregido.
  - backend: node:18-alpine sin openssl rompía Prisma (libssl/openssl-1.1 vs 3.0) → cambiado a node:18-slim + openssl.
  - prisma: `previewFeatures` va en generator block; `postgresqlExtensions` requerido para pgvector; extensión real se llama `vector` (map: "vector").
  - @nestjs/throttler 5.2.1 no existe → 5.2.0.

2026-08-27: [init(prometeo): Fundación de la wiki OKF y arquitectura base]
  - Creado el proyecto Prometeo: plataforma SaaS multi-tenant de licitaciones SECOP II / TVEC con swarm de 5 agentes de IA.
  - Documentos fuente integrados en /wiki/raw/ (Prometeo_spec_ago2026.md SRS v1.0.0-PROD + Especificacion_Tecnica_SECOP_AI_CIDE.pdf v1.0.0).
  - Fusión de especificaciones documentada en /wiki/sources/fusion_especificaciones.md (stack decidido: Next.js + NestJS + PostgreSQL 16/pgvector + Redis 7 + n8n + Nginx).
  - Entidades: arquitectura de red zero-trust, base de datos multi-tenant (RLS), swarm de agentes, integración con Admin (APP004).
  - Conceptos: motor Go/No-Go (matriz financiera + P_win), aislamiento multi-tenant.
  - Stack de despliegue: Docker Compose con docker-compose.prod.yml; servidor destino SRV01 (100.70.173.34); dominio prometeo.cidesolutions.com.
