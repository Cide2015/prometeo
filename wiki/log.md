---
type: Reference
title: Registro de Cambios Semánticos - Wiki Prometeo
description: Bitácora cronológica inversa de modificaciones semánticas de la base de conocimiento.
timestamp: 2026-08-29T17:05:00-05:00
---

2026-08-29: [feat(espejo-secop): Áreas de interés espejo SECOP + limpieza BD para prueba desde cero]
  - **Espejo SECOP replicado**: el SECOP de CIDE SAS define "Áreas de interés" → dentro de cada una registra códigos UNSPSC → el tablero muestra solo las oportunidades que coinciden. Ahora Prometeo lo simula igual.
  - **Configuración de empresa → nuevo tab "Áreas de Interés"**: crear área (nombre + códigos UNSPSC + palabras clave), activar/desactivar, eliminar (máx 3 por tenant). Verificado: área "Energía" creada.
  - **Tablero de oportunidades → toggle "🎯 Solo mis áreas de interés"**: activa el filtro espejo `useProfiles=true`, que devuelve solo oportunidades cuyos UNSPSC coinciden con los de las áreas ACTIVAS. Verificado: de 14 oportunidades → 1 con el área Energía (81111800/81111500).
  - **Backend**: GET /opportunities?useProfiles=true → filtra por códigos UNSPSC de perfiles activos (match por segmento, 4 dígitos). Respuesta incluye `filtroEspejo` (cantidad de códigos activos).
  - **Limpieza BD**: truncadas todas las tablas (tenants, users, opportunities, search_profiles, etc.) para que la prueba empiece desde el registro de empresa. Backup: prometeo_backup_espejo_20260829_165940.sql en SRV01.
  - setup/status → initialized:false (lista para el modal de registro).

2026-08-29: [feat(enriquecimiento): Benchmark alicia.services + diferenciadores A-E implementados]
  - Benchmark documentado en wiki/sources/benchmark_alicia.md.
  - P1-P3: búsqueda keywords, fechas clave, notificaciones diarias, perfiles de búsqueda, resumen IA pliego, competencia, uniones temporales.
  - Dif B-E: Drafter (carta/experiencia/inhabilidades), monitor adendas 30min, Copilot RAG con citas, BI ejecutivo.
  - Frontend: página Insights & BI (8 tabs) + Drafter en ofertas + keywords en inventario.

2026-08-28: [feat(desarrollo-modulos): Módulos 2-6 funcionales + modal registro + header + cambio password + config SECOP/IA]
  - Modal registro empresa, cambio contraseña obligatorio, header tipo Argos, config SECOP por usuario, tab Modelos de IA (patrón cide-ia-config).
  - Módulos 2-6 completos (RFI/RFP, Go/No-Go, Ofertas funnel, Ganadas, Financiero).

2026-08-27: [deploy(prometeo): PUBLICADO en producción https://prometeo.cidesolutions.com]
  - Túnel Cloudflare + proxy NPM + 7 contenedores. APP004 en Admin con 3 planes. Login real + SECOP II.

2026-08-27: [init(prometeo): Fundación de la wiki OKF y arquitectura base]
  - Fusión de specs (SRS + PDF), stack decidido (Next.js + NestJS + PG16/pgvector + Redis7 + n8n + Nginx).
