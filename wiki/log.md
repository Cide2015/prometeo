---
type: Reference
title: Registro de Cambios Semánticos - Wiki Prometeo
description: Bitácora cronológica inversa de modificaciones semánticas de la base de conocimiento.
timestamp: 2026-08-27T20:20:00-05:00
---

2026-08-27: [init(prometeo): Fundación de la wiki OKF y arquitectura base]
  - Creado el proyecto Prometeo: plataforma SaaS multi-tenant de licitaciones SECOP II / TVEC con swarm de 5 agentes de IA.
  - Documentos fuente integrados en /wiki/raw/ (Prometeo_spec_ago2026.md SRS v1.0.0-PROD + Especificacion_Tecnica_SECOP_AI_CIDE.pdf v1.0.0).
  - Fusión de especificaciones documentada en /wiki/sources/fusion_especificaciones.md (stack decidido: Next.js + NestJS + PostgreSQL 16/pgvector + Redis 7 + n8n + Nginx).
  - Entidades: arquitectura de red zero-trust, base de datos multi-tenant (RLS), swarm de agentes, integración con Admin (APP004).
  - Conceptos: motor Go/No-Go (matriz financiera + P_win), aislamiento multi-tenant.
  - Stack de despliegue: Docker Compose con docker-compose.prod.yml; servidor destino SRV01 (100.70.173.34); dominio prometeo.cidesolutions.com.
  - Pendiente: registro de producto APP004 en Admin, planes, credenciales, despliegue inicial.
