---
type: Reference
title: Registro de Cambios Semánticos - Wiki Prometeo
description: Bitácora cronológica inversa de modificaciones semánticas de la base de conocimiento.
timestamp: 2026-08-29T19:50:00-05:00
---

2026-08-29: [fix(config): Restaurado tab Áreas de Interés + validación de conexión SECOP online + flujo concatenado]
  - **Tab "Áreas de Interés" restaurado** en Configuración (se había perdido al reescribir la página): CRUD completo (crear con nombre + códigos UNSPSC + palabras clave, activar/desactivar, eliminar, máx 3 por tenant).
  - **Tab API SECOP → validación de conexión online**: reemplazada la consulta cruda a la tabla de procesos SECOP por el endpoint `GET /api/config/secop/test` que verifica la conexión a Datos Abiertos Colombia (endpoint + dataset configurados). Muestra: 🟢 ONLINE / 🔴 OFFLINE, mensaje, latencia ms, endpoint, estado del App Token.
  - **Inventario de Oportunidades = 2º paso del flujo concatenado**: ahora filtra por áreas de interés ACTIVAS por defecto (`useProfiles=true`). Flujo confirmado por Mario: **Registro → Áreas de Interés → Inventario → Análisis → Ofertas → Ganadas → Financiero**. Mensaje guía del flujo en el header.
  - QA funcional: conexión SECOP ONLINE (278ms) ✓, área "Energía" creada ✓, sync SECOP 14 oportunidades ✓, inventario con espejo filtra 14→1 ✓, bundle actualizado (tab restaurado + validación) ✓.
  - BD dejada vacía para prueba desde registro (setup/status → initialized:false).

2026-08-29: [feat(configuracion): Tabs Empresa, API SECOP mejorado, fix persistencia IA, Usuarios y Roles, API propia]
  - Tab Empresa (patrón Fenix-SGCN), fix persistencia key OpenRouter/Gemini (openrouterApiKey literal *** → nextOpenrouter), tab Usuarios y Roles + API propia (patrón Argos-RMM).

2026-08-29: [feat(espejo-secop): Áreas de interés espejo SECOP + limpieza BD]
2026-08-29: [feat(enriquecimiento): Benchmark alicia.services + diferenciadores A-E]
2026-08-28: [feat(desarrollo-modulos): Módulos 2-6 + modal registro + header + cambio password]
2026-08-27: [deploy(prometeo): PUBLICADO en producción https://prometeo.cidesolutions.com]
2026-08-27: [init(prometeo): Fundación de la wiki OKF]
