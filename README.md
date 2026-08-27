# Prometeo — Inteligencia de Licitaciones Públicas y Privadas

Plataforma **SaaS multi-tenant** que automatiza la prospección, análisis de viabilidad técnica y financiera, estructuración documental de propuestas, gobernanza contractual y control financiero de procesos licitatorios en **SECOP II**, **Tienda Virtual del Estado Colombiano (TVEC)** y el sector corporativo privado. Orquestada por un equipo de **agentes de IA** (Swarm Core).

- **Dominio:** https://prometeo.cidesolutions.com
- **Tenant semilla:** CIDE SAS (NIT 900.858.048-0)
- **Código de sistema:** PROMETEO · v1.0.0-PROD

## Stack

| Capa | Tecnología |
|---|---|
| Frontend / SaaS Hub | Next.js 14 + Tailwind CSS |
| Backend API | NestJS (Node.js) + Prisma |
| Base de datos | PostgreSQL 16 + pgvector (RLS multi-tenant) |
| Caché & colas | Redis 7 + BullMQ |
| Orquestador | n8n self-hosted |
| Proxy | NGINX + Cloudflare Tunnel |

## Módulos (sidebar)

1. **Inventario de Oportunidades** — espejo SECOP II / TVEC (SODA API).
2. **Invitaciones RFI/RFP** — bandeja comercial + Smart Decline.
3. **Análisis IA (Go/No-Go)** — matriz técnica, validación financiera, P_win.
4. **Generador de Ofertas** — funnel Kanban + expediente + firma.
5. **Ganadas (Project Delivery)** — proyectos, entregables, hitos, SLAs.
6. **Control Financiero** — flujo de caja, liquidación impositiva, márgenes.
7. **Configuraciones** — conectores API, IA, usuarios/roles, biblioteca documental.

## Agentes de IA

| Agente | Rol |
|---|---|
| Scout | Filtra oportunidades por UNSPSC del tenant |
| Auditor | Analiza pliegos PDF con RAG |
| Costing | Estructura propuesta económica y margen |
| Drafter | Redacta propuestas y diligenciar formatos oficiales |
| Commander | Orquesta el funnel y valida con humanos |

## Despliegue

```bash
cp .env.example .env   # completar secretos
# generar secrets:
mkdir -p secrets && \
  openssl rand -hex 32 > secrets/jwt_secret && \
  openssl rand -hex 32 > secrets/postgres_password && \
  openssl rand -hex 32 > secrets/admin_api_key && \
  openssl rand -hex 32 > secrets/license_sync_secret

docker compose -f docker-compose.prod.yml build --no-cache
docker compose -f docker-compose.prod.yml up -d
docker compose -f docker-compose.prod.yml ps
```

**Nota SRV01:** usar `TMPDIR=$HOME/tmpbuild` (mkdir previo) si `/tmp` no permite build.

## Documentación (OKF)

- [Mapa maestro de conocimiento (wiki)](./wiki/index.md)
- [Bitácora de cambios](./wiki/log.md)

## Integración con Admin Hub

- Producto: **APP004** · Planes sincronizados en línea: `GET {ADMIN}/api/integration/public-plans/APP004`.
- Validación de licencia contra Admin con degradación elegante (patrón Hub-Spoke CIDE).
