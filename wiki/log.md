---
type: Reference
title: Registro de Cambios Semánticos - Wiki Prometeo
description: Bitácora cronológica inversa de modificaciones semánticas de la base de conocimiento.
timestamp: 2026-08-29T18:45:00-05:00
---

2026-08-29: [feat(configuracion): Tabs Empresa, API SECOP mejorado, fix persistencia IA, Usuarios y Roles, API propia]
  - **Tab Empresa** (patrón Fenix-SGCN): datos importantes de la empresa (sector, representante legal, dirección, ciudad, teléfono, correo, web, descripción). GET/PUT /api/config/empresa. Verificado: sector + representante persisten.
  - **Tab API SECOP mejorado**: en la parte inferior muestra los códigos UNSPSC de las **Áreas de Interés** definidas (de search_profiles), con **selector** de códigos para el filtro espejo. Añadida **tabla de procesos SECOP II en vivo** desde Datos Abiertos (dataset p6dx-8zbt) con filtro por entidad. Verificado: unspscAreas=['81111800','81111500'] desde área "Energía".
  - **Fix persistencia key OpenRouter/Gemini (BUG)**: el config.controller.ts tenía `openrouterApiKey: *** literal (líneas 152-153) en vez de `nextOpenrouter`/`nextGemini` → la key NO persistía. Corregido. Verificado: keySet=True, masked='sk-o••••cdef', se conserva al guardar vacío.
  - **Tab Usuarios y Roles** (patrón Argos-RMM): CRUD usuarios con roles (admin, evaluador_tecnico, evaluador_financiero, operador_proyecto, auditor). GET/POST/PUT/DELETE /api/config/users. Verificado: usuario evaluador_tecnico creado.
  - **Tab API Propia** (patrón Argos-RMM): crear/revocar API keys (keyHash sha256, prefix pko_, raw se muestra UNA sola vez). GET/POST/DELETE /api/config/api-keys. Verificado: key 'pko_22d57361.5a...' creada.
  - Frontend: configuracion/page.tsx reescrito con 5 tabs. Verificado HTTP 200 y strings en bundle.
  - QA funcional completo (cide-pruebas-funcionales): los 5 tabs ✓.

2026-08-29: [feat(espejo-secop): Áreas de interés espejo SECOP + limpieza BD para prueba desde cero]
  - Configuración → tab Áreas de Interés (espejo SECOP): crear área con UNSPSC, activar/desactivar, eliminar (máx 3).
  - Tablero → toggle "Solo mis áreas de interés" (useProfiles=true) filtra por UNSPSC de áreas activas.

2026-08-29: [feat(enriquecimiento): Benchmark alicia.services + diferenciadores A-E]
  - P1-P3 + Dif B-E (Drafter, adendas, Copilot RAG, BI) + página Insights & BI.

2026-08-28: [feat(desarrollo-modulos): Módulos 2-6 + modal registro + header + cambio password]
2026-08-27: [deploy(prometeo): PUBLICADO en producción https://prometeo.cidesolutions.com]
2026-08-27: [init(prometeo): Fundación de la wiki OKF]
