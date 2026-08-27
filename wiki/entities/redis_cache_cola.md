---
type: Entity
title: Redis Cache & Cola — Prometeo
description: Redis 7 para sesiones distribuidas, rate limit por tenant y colas de inferencia de IA asíncronas con BullMQ.
timestamp: 2026-08-27T20:20:00-05:00
tags:
  - prometeo
  - redis
  - cache
  - bullmq
  - colas
---

# Redis Cache & Cola

## Función
- Sesiones distribuidas.
- Rate limit por tenant.
- Colas de inferencia de IA asíncronas con **BullMQ** (análisis de pliegos pesados, generación documental).
- Caché de consultas SODA API (evitar golpear Datos Abiertos en cada request).

## Configuración (patrón Armonia, hardening)
- Imagen `redis:alpine`.
- `--maxmemory 256mb --maxmemory-policy allkeys-lru --appendonly yes`.
- Sin puertos expuestos al host; solo red interna `prometeo-internal-network`.
