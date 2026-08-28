---
type: Reference
title: Registro de Cambios Semánticos - Wiki Prometeo
description: Bitácora cronológica inversa de modificaciones semánticas de la base de conocimiento.
timestamp: 2026-08-28T01:00:00-05:00
---

2026-08-28: [feat(desarrollo-modulos): Módulos 2-6 funcionales + modal registro + header + cambio password + config SECOP/IA]
  - **Modal de registro de empresa**: /login detecta si no hay tenant y abre modal que crea empresa + admin (POST /setup/init). Verificado.
  - **Cambio de contraseña obligatorio**: login devuelve mustChangePassword; modal en header obliga a cambiar en primer ingreso (POST /auth/change-password). Verificado.
  - **Header tipo Argos-RMM**: navbar con avatar, rol, dropdown usuario (cambiar contraseña, logout), nombre de empresa. Carga /auth/me.
  - **Configuración → API SECOP**: el usuario coloca endpoint SODA, datasets (p6dx-8zbt, jbjy-vk9h, rgxm-mmea), App Token de su cuenta, estados a vigilar y frecuencia. GET/PUT /config/secop.
  - **Configuración → Modelos de IA** (patrón cide-ia-config): proveedor configurable (OpenRouter/Gemini), selector con "✨ Usar modelo por defecto", keys enmascaradas. GET/PUT /config/ia.
  - **Módulo 1 (Inventario)**: dashboard con filtros del usuario (entidad, cuantía min/max, modalidad) + botón sincronizar SECOP con JWT. 14 oportunidades ingeridas.
  - **Módulo 2 (RFI/RFP)**: CRUD + Aplicar (→bid) + Rechazar con elegancia (motivo + respuesta institucional). Verificado: 1 invitación creada.
  - **Módulo 3 (Go/No-Go)**: motor financiero (liquidez 1.39, endeudamiento 0.71, ROE, ROA de la línea base CIDE), estimación de costos paramétrica, P_win ponderado. Verificado: P_win 88 → GO.
  - **Módulo 4 (Ofertas)**: funnel Kanban 5 etapas (Borrador→Análisis→Documental→Firma→Presentada), crear oferta desde oportunidad, mover fase.
  - **Módulo 5 (Ganadas)**: crear proyecto desde oferta presentada, hitos automáticos (acta inicio, entregables, liquidación), documentos contractuales.
  - **Módulo 6 (Financiero)**: registro flujo de caja (ingreso/egreso), resumen márgenes reales vs proyectados, liquidación impositiva (Retefuente 2.5%, ReteICA 0.4%, ReteIVA, estampillas).
  - **QA funcional (cide-pruebas-funcionales)**: login→me→config secop→sync SECOP→RFI/RFP→análisis→ofertas→proyectos→financiero→config IA. Todos OK.
  - Pitfalls resueltos: ConfigModule duplicado (alias EnvConfigModule), JwtService global vía AuthModule @Global, controllers necesitan método resolve(), relaciones Prisma Analysis-bid (bidId @unique) y RfiRfp-analyses.

2026-08-27: [feat(secop+auth): Login real, registro inicial de empresa desde cero y conexión SECOP II]
  - Registro inicial (estilo Argos-RMM): bootstrap.ts limpia BD y crea tenant CIDE SAS + admin@cidesas.com + 15 UNSPSC + API key Hermes (guardada en /opt/data/keys/hermes_prometeo.txt).
  - Login real: POST /api/auth/login (JWT). Dashboard con stats + tabla oportunidades + botón sincronizar.
  - SECOP II: SecopService ingesta SODA p6dx-8zbt filtrado por UNSPSC del tenant (14 oportunidades).
  - Pitfalls: esquema real dataset (estado_del_procedimiento, precio_base), match por primeros 4 dígitos UNSPSC, n8n BD propia.

2026-08-27: [deploy(prometeo): PUBLICADO en producción https://prometeo.cidesolutions.com]
  - Túnel Cloudflare (creado por Mario) + proxy host NPM id=3 + 7 contenedores Up. Verificado 200.

2026-08-27: [init(prometeo): Fundación de la wiki OKF y arquitectura base]
  - Fusión de specs (SRS + PDF), stack decidido (Next.js + NestJS + PG16/pgvector + Redis7 + n8n + Nginx), APP004 en Admin con 3 planes.
