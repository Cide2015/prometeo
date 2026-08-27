---
type: Source
title: Fusión de Especificaciones SRS + Técnica
description: Síntesis unificada de Prometeo_spec_ago2026.md (SRS) y Especificacion_Tecnica_SECOP_AI_CIDE.pdf — alcance consolidado, stack decidido, modelo de agentes y funcionalidades de alto valor.
timestamp: 2026-08-27T20:05:00-05:00
tags:
  - prometeo
  - especificaciones
  - fusion
  - stack
---

# Fusión de Especificaciones — Prometeo

Ambos documentos son **complementarios** y describen el mismo sistema: la plataforma multi-tenant de inteligencia de licitaciones con agentes de IA. Esta fuente consolida la mejor opción de cada uno.

## Alcance consolidado
- **Propósito:** Automatizar prospección, viabilidad técnica-financiera, estructuración documental de propuestas, gobernanza contractual y control financiero de procesos licitatorios SECOP II, TVEC y sector corporativo privado.
- **Modelo:** SaaS multi-tenant, comercializable, con RLS por tenant.
- **Tenant semilla:** CIDE SAS (NIT 900.858.048-0), línea base financiera auditada al 31/12/2025.

## Stack decidido (mejor opción de ambos docs)
| Capa | Tecnología | Fuente |
|---|---|---|
| Frontend / SaaS Hub | Next.js + Tailwind (Clean Theme) | ambos |
| Backend API Core | NestJS (Node.js) — por consistencia con ecosistema CIDE (Fenix, Admin, Argos) | SRS ofrece FastAPI o NestJS; PDF idem |
| Base de Datos | PostgreSQL 16 + pgvector | ambos |
| Caché & Colas | Redis 7 + BullMQ | ambos |
| Orquestador | n8n self-hosted | ambos |
| Proxy | NGINX + TLS 1.3 + security headers | ambos |

## Módulos (7 de la sidebar, según SRS; PDF los detalla)
1. Inventario de Oportunidades (espejo SECOP II / TVEC)
2. Gestión de Invitaciones RFI/RFP
3. Análisis Inteligente IA (motor Go / No-Go)
4. Generador de Ofertas (funnel & assembly)
5. Gestión de Ganadas (project delivery)
6. Control Financiero Contractual
7. Configuraciones del Sistema e Integraciones

## Swarm de agentes (5)
Scout, Auditor, Costing, Drafter, Commander — modelos: gpt-4o-mini/claude-3-haiku (Scout), claude-3-5-sonnet (Auditor/Drafter/Commander), gpt-4o/deepseek-chat (Costing).

## Funcionalidades de alto valor (del PDF, enriquecen el SRS)
- **RAG de pliegos con pgvector** (embeddings de PDFs y adendas).
- **Alerta temprana de adendas** (monitoreo cada 30 min).
- **Inteligencia competitiva** (patrones de puja, competidores recurrentes, descuentos promedio).
- **Anti-rechazo documental** (coherencia formularios vs PDF).
- **Smart Decline** (rechazo elegante de RFI/RFP con PDF institucional).
- **Monitor de vencimiento y liquidación** (alertas 30 días antes del cierre).

## Integración SODA API (datos SECOP)
- SECOP II Procesos: `p6dx-8zbt` · SECOP II Contratos: `jbjy-vk9h` · TVEC Consolidado: `rgxm-mmea`
- Sintaxis: `GET https://www.datos.gov.co/resource/{id}.json?$where=...` con header `X-App-Token: [TENANT_REGISTERED_TOKEN]`.
- Filtro de oportunidad vigente: `estado_del_proceso='Presentación de ofertas'`.

## Decisión de despliegue
- Servidor: **SRV01** (100.70.173.34) — mayor RAM libre (8.9Gi vs 7.6Gi) y menor carga (0.97 vs 1.60) que SRV02; ya aloja el patrón Next.js+NestJS (Fenix, Armonia).
- Dominio público: `https://prometeo.cidesolutions.com` vía NPM (proxy host) + Cloudflare Tunnel.
- Orquestación: **Docker Compose** con `docker-compose.prod.yml` (convención CIDE, archivo de despliegue productivo).
