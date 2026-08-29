---
type: Reference
title: Registro de Cambios Semánticos - Wiki Prometeo
description: Bitácora cronológica inversa de modificaciones semánticas de la base de conocimiento.
timestamp: 2026-08-29T21:20:00-05:00
---

2026-08-29: [fix(inventario): Sync acotado por áreas + solo oportunidades ACTIVAS + agrupación por área]
  - **Causa raíz**: el sync filtroba por los 15 códigos UNSPSC del bootstrap (unspsc_profiles), no por las Áreas de Interés del usuario (search_profiles con 19 códigos). El listado además no agrupaba por área y no filtraba activas.
  - **Sync = consulta acotada por áreas de interés**: ahora consulta SECOP con los segmentos UNSPSC (4 dígitos) de las áreas ACTIVAS del tenant (codigo_principal_de_categoria like 'V1.8111%' OR categorias_adicionales like '%8111%'), hasta 1000 procesos recientes (fecha DESC).
  - **Filtro de oportunidades ACTIVAS**: solo procesos vigentes Y activos: `estado in (Abierto,Publicado)` + `adjudicado='No'` + `estado_de_apertura_del_proceso='Abierto'` + `fase in (fases ofertables)`. Excluye cancelados, adjudicados, cerrados, borrador, observaciones.
  - **metadataJson enriquezido**: adjudicado, estadoApertura, activa (bool). Reconciliación: los existentes se sincronizan a su estado real (disponible si activa, descartada si no).
  - **Listado agrupado por área**: `useProfiles=true` filtra SOLO oportunidades disponibles y agrupa por área de interés (match segmento 4 dígitos). Devuelve `grupos[]` (área, códigos, items) para render por tarjeta.
  - **Frontend**: inventario muestra tarjetas por área de interés (🎯 nombre + códigos + N oportunidades), contadores dinámicos (áreas, UNSPSC configurados, coincidencias).
  - **Resultado en producción**: 852 disponibles / 1124 descartadas. Área "Servicios Tecnología" → 817 oportunidades activas (todas activa=true, disponibles).
  - Pitfall: la interfaz SecopProcess no tenía adjudicado/estado_de_apertura → build fallaba; agregados.
  - QA: sync 16 nuevas/984 skipped, listado agrupado 817 solo disponibles ✓.

2026-08-29: [feat(espejo-secop): Áreas de interés espejo SECOP + limpieza BD]
  - Tab Áreas de Interés restaurado, validación de conexión SECOP online, inventario = 2º paso del flujo concatenado.

2026-08-29: [feat(enriquecimiento): Benchmark alicia.services + diferenciadores A-E]
2026-08-28: [feat(desarrollo-modulos): Módulos 2-6 + modal registro + header + cambio password]
2026-08-27: [deploy(prometeo): PUBLICADO en producción https://prometeo.cidesolutions.com]
2026-08-27: [init(prometeo): Fundación de la wiki OKF]
