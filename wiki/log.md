---
type: Reference
title: Registro de Cambios Semánticos - Wiki Prometeo
description: Bitácora cronológica inversa de modificaciones semánticas de la base de conocimiento.
timestamp: 2026-08-29T22:00:00-05:00
---

2026-08-29: [fix(inventario): loadData no enviaba Authorization → listado vacío]
  - **Causa raíz (bug de UI)**: el dashboard hacía `fetch` a `/api/opportunities/stats` y `/api/opportunities` SIN el header `Authorization` (solo el sync lo enviaba). El backend responde 401 (token no proporcionado) → el listado y los contadores se mostraban vacíos aunque el sync traía datos ("941 total").
  - **Fix**: loadData ahora construye `authHeaders = { Authorization: Bearer <token> }` y lo envía en ambos fetch (stats + listado). Verificado en el bundle de producción: `{headers:s}` presente en ambas llamadas.
  - **Resultado verificado end-to-end** (token fresco del tenant real):
    - Stats: disponibles 941, descartadas 1121
    - Listado espejo: 904 oportunidades activas en área "Servicios Tecnología" (1 grupo, 19 UNSPSC)
    - Sin token: 401 (confirma el bug original)
  - Frontend desplegado (prometeo-app Built), dashboard 200.

2026-08-29: [fix(inventario): Sync acotado por áreas + solo oportunidades ACTIVAS + agrupación por área]
  - Sync consulta SECOP acotada por segmentos UNSPSC de áreas activas; filtro de actividad (adjudicado='No', apertura='Abierto', fase ofertable); listado agrupado por área.

2026-08-29: [feat(espejo-secop): Áreas de interés espejo SECOP + limpieza BD]
2026-08-29: [feat(enriquecimiento): Benchmark alicia.services + diferenciadores A-E]
2026-08-28: [feat(desarrollo-modulos): Módulos 2-6 + modal registro + header + cambio password]
2026-08-27: [deploy(prometeo): PUBLICADO en producción https://prometeo.cidesolutions.com]
2026-08-27: [init(prometeo): Fundación de la wiki OKF]
