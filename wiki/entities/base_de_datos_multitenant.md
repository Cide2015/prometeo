---
type: Entity
title: Base de Datos Multi-Tenant — Prometeo
description: PostgreSQL 16 + pgvector, aislamiento por Row-Level Security (app.current_tenant_id), modelo de datos principal y esquemas de particionamiento.
timestamp: 2026-08-27T20:10:00-05:00
tags:
  - prometeo
  - postgres
  - pgvector
  - multitenant
  - rls
---

# Base de Datos Multi-Tenant

## Motor
- **PostgreSQL 16+** con extensión **pgvector** para almacenamiento vectorial de pliegos y bases de conocimiento RAG.
- PostgreSQL 16 oficial (imagen `postgres:16-alpine`) con `pgvector/pgvector:pg16`.

## Aislamiento multi-tenant
- **Row-Level Security (RLS)** basado en la variable de sesión `app.current_tenant_id` en todas las consultas relacionales.
- Esquemas de particionamiento lógico para clientes de alto volumen.
- El `tenant_id` se inyecta en el JWT del usuario autenticado (per PDF) → la API establece la variable de sesión por conexión/tenant.

## Modelo de datos principal
| Tabla | Campos clave |
|---|---|
| `tenants` | id (UUID PK), nombre_comercial, nit, configuraciones_json, created_at |
| `users` | id (UUID PK), tenant_id (FK), email, password_hash, nombre, rol, is_active |
| `unspsc_profiles` | id (UUID PK), tenant_id (FK), codigo_unspsc (VARCHAR 8), descripcion |
| `opportunities` | id (UUID PK), tenant_id (FK), secop_id (VARCHAR), entidad, objeto, cuantia_cop, fecha_cierre, estado, metadata_json |
| `bids` | id (UUID PK), tenant_id (FK), opportunity_id (FK), fase_funnel, valor_ofertado, margen_estimado, p_win, documento_url |
| `contract_projects` | id (UUID PK), tenant_id (FK), bid_id (FK), numero_contrato, fecha_inicio, fecha_fin, valor_total, estado |
| `financial_ledgers` | id (UUID PK), tenant_id (FK), project_id (FK), tipo_movimiento, concepto, monto_cop, fecha_registro |

## Tablas adicionales del proyecto
- `api_keys` (patrón Fenix): keyHash sha256, prefix, lastUsedAt, expiresAt, revokedAt — para API propia.
- `ai_configurations` (Módulo 7): proveedor IA (OpenRouter/OpenAI/Anthropic/Ollama), modelo, api_key ref.
- `document_library` (Módulo 7): RUT, Cámara de Comercio, Estados Financieros, certificados.

## Seguridad de datos
- Contraseñas: hash bcrypt/argon2.
- Logs sin PII.
- Backups diarios (patrón Armonia: pg_dump + retención 7 días).
