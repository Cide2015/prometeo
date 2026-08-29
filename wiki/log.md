---
type: Reference
title: Registro de Cambios Semánticos - Wiki Prometeo
description: Bitácora cronológica inversa de modificaciones semánticas de la base de conocimiento.
timestamp: 2026-08-29T16:30:00-05:00
---

2026-08-29: [feat(enriquecimiento): Benchmark alicia.services + diferenciadores A-E implementados]
  - **Benchmark**: alicia.services (landing + blog) + podcast YouTube nyjc_eIMGcU (Gabriel, cofundador). Documentado en wiki/sources/benchmark_alicia.md.
  - **Nivelación con Alicia (P1-P3)**:
    - P1 Búsqueda por palabras clave (q) + filtros avanzados (cuantía min/max, departamento) en /api/opportunities. Verificado: 8 resultados para "energía".
    - P1 Fechas clave / alertas de vencimiento: /api/insights/fechas-clave (cierres en 30 días + próximas 24h).
    - P1 Notificaciones diarias por correo: /api/notifications/diaria (resumen por perfiles de búsqueda, log en BD).
    - P2 Perfiles de búsqueda (hasta 3 por tenant): /api/search-profiles CRUD. Verificado: perfil "Línea Energía" creado.
    - P2 Resumen IA del pliego: /api/pliegos/resumen (requisitos habilitantes + indicadores financieros).
    - P3 Análisis de competencia: /api/insights/competencia (dataset jbjy-vk9h, agregado por proveedor).
    - P3 Sugerencia de uniones temporales: /api/insights/uniones-temporales (cuando capacidad < 100%).
  - **Diferenciadores A-E**:
    - B Agente Drafter: /api/drafter (carta presentación, formato experiencia, inhabilidades) + UI en ofertas. Verificado.
    - C Monitor de adendas: /api/adendas (check 30min + alertas, modelo AdendaAlert).
    - D Copilot RAG: /api/pliegos (indexar PDF, chat con citas, resumen). pgvector listo para embeddings reales.
    - E BI ejecutivo: /api/insights/bi (pipeline, win-rate, funnel, Go/No-Go, rentabilidad).
  - **Frontend**: nueva página /dashboard/insights con 8 tabs (BI, Fechas, Competencia, Uniones, Copilot, Perfiles, Adendas, Notificaciones) + Drafter en ofertas + búsqueda keywords en inventario. Verificado HTTP 200.
  - **Modelos Prisma nuevos**: SearchProfile, PliegoDocument (pgvector), NotificationLog, AdendaAlert.
  - QA funcional (cide-pruebas-funcionales): perfiles ✅, BI ✅, fechas ✅, competencia ✅, uniones ✅, copilot ✅, drafter ✅, notificaciones ✅ (9 relevantes), adendas ✅, keywords ✅, sync SECOP ✅ (14).
  - Pitfall: bootstrap.ts escribía sodaEndpoint con .json incrustado → corregido a endpoint base + datasets.

2026-08-28: [feat(desarrollo-modulos): Módulos 2-6 funcionales + modal registro + header + cambio password + config SECOP/IA]
  - Modal registro empresa, cambio contraseña obligatorio, header tipo Argos, config SECOP por usuario (endpoint/dataset/token del video guía), tab Modelos de IA (patrón cide-ia-config).
  - Módulos 2-6 completos (RFI/RFP, Go/No-Go con P_win 88→GO, Ofertas funnel, Ganadas con hitos, Financiero con impuestos).

2026-08-27: [deploy(prometeo): PUBLICADO en producción https://prometeo.cidesolutions.com]
  - Túnel Cloudflare + proxy NPM + 7 contenedores. APP004 en Admin con 3 planes. Login real + SECOP II (14 oportunidades).

2026-08-27: [init(prometeo): Fundación de la wiki OKF y arquitectura base]
  - Fusión de specs (SRS + PDF), stack decidido (Next.js + NestJS + PG16/pgvector + Redis7 + n8n + Nginx).
