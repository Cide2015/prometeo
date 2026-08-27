---
type: Entity
title: Orquestador n8n — Prometeo
description: n8n self-hosted para ingesta periódica SECOP, webhooks de correo RFI/RFP, alertas tempranas y flujos ETL.
timestamp: 2026-08-27T20:20:00-05:00
tags:
  - prometeo
  - n8n
  - workflows
  - etl
  - secop
---

# Orquestador n8n

## Roles (per PDF)
- **Scraping/polling SECOP**: ingesta periódica de oportunidades vigentes desde SODA API.
- **Ingesta de correos RFP**: procesamiento de bandejas comerciales (IMAP/Graph API) para invitaciones directas.
- **Distribución de notificaciones**: alertas a Telegram/Slack.
- **Alerta temprana de adendas**: monitoreo cada 30 minutos de modificaciones a pliegos para evitar descalificaciones por cambios extemporáneos.
- Webhooks entrantes con verificación HMAC-SHA256.

## Configuración
- n8n self-hosted en la red interna `prometeo-internal-network`.
- Acceso al webhook vía NGINX gateway (sin exponer puerto 5678 al host).
- Credenciales IMAP/Graph API y tokens desde Docker secrets / `.env`.
