---
type: Index
title: Mapa Maestro de Conocimiento Semántico - Proyecto Prometeo
description: Índice jerárquico del grafo de conocimiento OKF v0.1 para la navegación y revelación progresiva del proyecto Prometeo (SaaS multi-tenant de licitaciones SECOP II / TVEC con agentes de IA).
timestamp: 2026-08-27T20:00:00-05:00
tags:
  - okf
  - index
  - mapa-maestro
  - prometeo
  - licitaciones
  - secop
---

# Mapa Maestro de Conocimiento Semántico - Proyecto Prometeo (OKF v0.1)

Bienvenido a la base de conocimiento semántica del proyecto **Prometeo**. Plataforma SaaS multi-tenant para la prospección, análisis de viabilidad técnica y financiera, estructuración documental de propuestas, gobernanza contractual y control financiero de procesos licitatorios en SECOP II, Tienda Virtual del Estado Colombiano (TVEC) y sector corporativo privado, orquestada por un equipo de agentes de IA.

---

## 1. Insumos Brutos e Inmutables (`/wiki/raw/`)
*Documentos de origen inmutables en los que se fundamenta la memoria técnica.*
- `/wiki/raw/Prometeo_spec_ago2026.md`: Documento de Especificaciones Técnicas y Arquitectura de Software (SRS) v1.0.0-PROD — 7 módulos funcionales, swarm de 5 agentes, modelo de datos PostgreSQL+pgvector, cronograma 13 semanas.
- `/wiki/raw/Especificacion_Tecnica_SECOP_AI_CIDE.pdf`: Especificación Técnica de Sistema v1.0.0 — plataforma multi-tenant de inteligencia de licitaciones, vigilancia SECOP II y gestión integral de ofertas con agentes de IA. Aporta stack contenerizado, SODA API/SOQL y funcionalidades de alto valor (RAG de pliegos, alerta temprana de adendas, inteligencia competitiva).

---

## 2. Resúmenes de Fuentes (`/wiki/sources/`)
*Análisis condensados de los documentos brutos de especificaciones.*
- [Fusión de Especificaciones SRS + Técnica](/sources/fusion_especificaciones.md): Síntesis unificada de ambos documentos — alcance consolidado, stack decidido, modelo de agentes y funcionalidades de alto valor.
- [Integración SODA API SECOP II](/sources/integracion_soda_secop.md): Endpoints de Datos Abiertos (p6dx-8zbt, jbjy-vk9h, rgxm-mmea), sintaxis SOQL, filtros por estado y cuantía.

---

## 3. Entidades de Arquitectura y Sistema (`/wiki/entities/`)
*Representación semántica de componentes físicos, servicios y modelos de datos.*
- [Arquitectura de Red y Zero Trust](/entities/arquitectura_red_zerotrust.md): Topología VPS, Cloudflare Tunnel, NGINX gateway, aislamiento de redes Docker (edge/app/data) y headers de seguridad.
- [Frontend SaaS Hub](/entities/frontend_saas_hub.md): Next.js + Tailwind, landing pública, autenticación, dashboard reactivo y sidebar de 7 módulos.
- [Backend API Core](/entities/backend_api_core.md): NestJS, lógica multi-tenant, CRUD de oportunidades, orquestación de agentes y webhooks.
- [Base de Datos Multi-Tenant](/entities/base_de_datos_multitenant.md): PostgreSQL 16 + pgvector, RLS con `app.current_tenant_id`, esquemas de particionamiento.
- [Redis Cache & Cola](/entities/redis_cache_cola.md): Redis 7, sesiones distribuidas, rate limit por tenant y colas BullMQ de inferencia IA.
- [Orquestador n8n](/entities/orquestador_n8n.md): Ingesta periódica SECOP, webhooks de correo RFI/RFP, alertas y ETL.
- [Swarm de Agentes de IA](/entities/swarm_agentes_ia.md): Scout, Auditor, Costing, Drafter y Commander con modelos asignados.
- [Integración con Admin Hub](/entities/integracion_admin_hub.md): Producto APP004, planes, API keys y sincronización de licencias.

---

## 4. Conceptos y Reglas de Negocio (`/wiki/concepts/`)
*Lógicas de procesamiento, reglas financieras, flujos y políticas del sistema.*
- [Motor Go / No-Go](/concepts/motor_go_nogo.md): Matriz de cumplimiento técnico, validación financiera automática (liquidez, endeudamiento, ROE, ROA), estimación de costos y P_win (0-100%).
- [Pipeline de Análisis de Pliegos](/concepts/pipeline_analisis_pliegos.md): Orquestador que divide el análisis en sub-agentes (legal/documental, técnico, financiero) con RAG + pgvector.
- [Inteligencia Competitiva](/concepts/inteligencia_competitiva.md): Análisis histórico de adjudicaciones, patrones de puja y márgenes de descuento por entidad.
- [Anti-Rechazo Documental](/concepts/anti_rechazo_documental.md): Validación cruzada entre formularios web y certificaciones PDF.
- [Aislamiento Multi-Tenant](/concepts/aislamiento_multitenant.md): RLS PostgreSQL, variable de sesión por tenant y particionamiento lógico.
- [Liquidación Impositiva Territorial](/concepts/liquidacion_impositiva.md): Retefuente, ReteICA, ReteIVA y estampillas departamentales/municipales.

---

## 5. Bitácora Cronológica de Cambios (`/wiki/log.md`)
- [Registro Cronológico de Decisiones](/log.md): Historial cronológico inverso de modificaciones, refactorizaciones y decisiones del proyecto.
