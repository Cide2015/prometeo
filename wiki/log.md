---
type: Reference
title: Registro de Cambios Semánticos - Wiki Prometeo
description: Bitácora cronológica inversa de modificaciones semánticas de la base de conocimiento.
timestamp: 2026-08-29T23:20:00-05:00
---

2026-08-29: [feat(inventario): Inventario funcional - paginación, ordenamiento, favoritos, filtros]
  - **Campo `favorito`** en Opportunity (Boolean default false) + `prisma db push`.
  - **Listado con paginación**: `page` + `pageSize` (10/20/30/all), devuelve `total`, `totalPages`, `page`, `pageSize`. Verificado: 941 total, 95 páginas de 10.
  - **Ordenamiento por columnas**: `sortBy` (secopId, entidad, objeto, cuantiaCop, fechaCierre, estado, createdAt) + `sortOrder` (asc/desc). Verificado por entidad asc.
  - **N° Proceso visible**: columna secopId (la llave SECOP, ej. 009103C-26) en la tabla.
  - **Favoritos**: `PATCH /opportunities/:id/favorito` (toggle) + stats.favoritas. ⭐ en cada fila. Verificado: favorito:true persistido.
  - **Filtros efectivos**: q (objeto/entidad/secopId), entidad, departamento, cuantiaMin/Max, modalidad, areaId (selector de área de interés), favorito=true, useProfiles. Verificado: q=servicios → 224.
  - **Selector de área de interés**: el dropdown de filtros carga las áreas activas del tenant y filtra por segmento UNSPSC de esa área. Verificado: área → 904.
  - **Análisis IA integrado**: el listado de /api/analysis devuelve `pendientes` = oportunidades favoritas SIN análisis aún. Frontend de Análisis muestra sección "⭐ Favoritas por analizar" con botón Analizar.
  - QA completo: paginación, sort, filtro área, búsqueda, toggle favorito, stats, analysis pendientes (1) ✓. Frontend desplegado (bundle con paginación/favoritos).

2026-08-29: [fix(inventario): loadData no enviaba Authorization → listado vacío]
2026-08-29: [fix(inventario): Sync acotado por áreas + solo oportunidades ACTIVAS + agrupación por área]
2026-08-29: [feat(espejo-secop): Áreas de interés espejo SECOP + limpieza BD]
2026-08-29: [feat(enriquecimiento): Benchmark alicia.services + diferenciadores A-E]
2026-08-28: [feat(desarrollo-modulos): Módulos 2-6 + modal registro + header + cambio password]
2026-08-27: [deploy(prometeo): PUBLICADO en producción https://prometeo.cidesolutions.com]
2026-08-27: [init(prometeo): Fundación de la wiki OKF]
