---
type: Reference
title: Registro de Cambios Semánticos - Wiki Prometeo
description: Bitácora cronológica inversa de modificaciones semánticas de la base de conocimiento.
timestamp: 2026-08-31T17:10:00-05:00
---

2026-08-31: [feat(inventario): Ajustes de usabilidad y fidelidad de datos]
  - **Favorito visual claro**: la estrella ⭐ ahora se muestra a color (ámbar) cuando el proceso está marcado, y en gris/desaturada cuando no — distinción visual inmediata. El modal también tiene su selector.
  - **Filtro Modalidad corregido**: el dropdown ahora se puebla dinámicamente con las modalidades REALES del tenant (`GET /opportunities` devuelve `modalidades[]` distintas de la BD: 'Concurso de méritos abierto', 'Contratación Directa (con ofertas)', 'Selección abreviada subasta inversa', etc.). Antes el filtro tenía valores hardcodeados que NO coincidían con los datos → no filtraba nada. Verificado: filtrar por 'Concurso de méritos abierto' devuelve solo esa modalidad.
  - **Separador de miles en cuantía**: fmtCOP usa Intl.NumberFormat('es-CO') → $ 1.234.567.890 (ya era así, confirmado).
  - **Fechas importantes**: columnas Publicación y Últ. publicación (de SECOP cuando existen). **Hallazgo**: el dataset SECOP II no trae `fecha_de_publicacion_del` para los procesos activos (viene null) → se añadió columna **Ingresado** (createdAt, fecha en que Prometeo capturó el proceso) que siempre tiene valor. El modal muestra las 3 fechas SECOP + ingreso.
  - **Modal de detalle**: doble clic en el N° Proceso abre un modal completo SIN truncar: entidad (con NIT/código/unidad), cuantía, objeto completo, fechas, ubicación, duración, lotes, respuestas, vistas, UNSPSC, tipo/subtipo contrato, estado de actividad, enlace SECOP + selector de favorito.
  - **Sync preserva favoritos y solo actualiza si hay cambios**: la reconciliación NUNCA toca `favorito`; compara entidad/objeto/cuantía/modalidad/fecha y solo actualiza si cambió. Migración automática de metadata enriquecido (fechaPublicacion, tipoContrato, etc.) para registros antiguos. Verificado: 2 favoritos conservados tras sync, 934 registros con tipoContrato migrado.
  - Metadata enriquecido del sync: fechaPublicacion, fechaUltimaPublicacion, fechaPublicacionFase3, estadoResumen, tipoContrato, subtipoContrato, duracion, unidadDuracion, numeroLotes, respuestas, visualizaciones, codigoEntidad, nitEntidad, unidadCompra.

2026-08-29: [feat(inventario): Inventario funcional - paginación, ordenamiento, favoritos, filtros]
2026-08-29: [fix(inventario): loadData no enviaba Authorization → listado vacío]
2026-08-29: [fix(inventario): Sync acotado por áreas + solo oportunidades ACTIVAS + agrupación por área]
2026-08-29: [feat(espejo-secop): Áreas de interés espejo SECOP + limpieza BD]
2026-08-29: [feat(enriquecimiento): Benchmark alicia.services + diferenciadores A-E]
2026-08-28: [feat(desarrollo-modulos): Módulos 2-6 + modal registro + header + cambio password]
2026-08-27: [deploy(prometeo): PUBLICADO en producción https://prometeo.cidesolutions.com]
2026-08-27: [init(prometeo): Fundación de la wiki OKF]
