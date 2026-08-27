---
type: Entity
title: Arquitectura de Red y Zero Trust — Prometeo
description: Topología de red del VPS, Cloudflare Tunnel, NGINX gateway, aislamiento de redes Docker y headers de seguridad obligatorios.
timestamp: 2026-08-27T20:10:00-05:00
tags:
  - prometeo
  - red
  - zerotrust
  - cloudflare
  - nginx
---

# Arquitectura de Red y Zero Trust

## Principio
**Cero puertos expuestos (Zero Open Inbound Ports):** UFW/iptables bloquea entradas en 80, 443 y puertos administrativos. El acceso público llega únicamente por el túnel saliente de Cloudflare.

## Flujo de tráfico
1. Usuario → `https://prometeo.cidesolutions.com` → Edge Cloudflare (SSL/TLS, HSTS, anti-DDoS, WAF).
2. Cloudflare Tunnel (`cloudflared`, conexión saliente gRPC/HTTP2) → red `red_publica`.
3. NPM (Nginx Proxy Manager) enruta por host a `prometeo-nginx:80`.
4. NGINX interno → app Next.js (`3000`) / backend NestJS (`3001`) / n8n (`5678`).

## Redes Docker (segmentación)
| Red | Conecta |
|---|---|
| `red_publica` (external, = red del NPM) | nginx ↔ NPM/Cloudflare |
| `prometeo-internal-network` | nginx ↔ app ↔ backend ↔ db ↔ redis ↔ n8n |

## Headers de seguridad (obligatorios, patrón `security-headers.conf`)
- `Strict-Transport-Security: max-age=31536000; includeSubDomains`
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: SAMEORIGIN` (SRS dice DENY; ecosistema usa SAMEORIGIN — mantener consistencia con Fenix/Admin)
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy: geolocation=(), microphone=(), camera=()`
- `Content-Security-Policy` (incluir `fonts.gstatic.com` en font-src y `fonts.googleapis.com` en style-src — lección Admin 2026-08-26)
- `server_tokens off`

## Lecciones aplicadas (del skill cide-seguridad)
- DOCKER-USER: SIEMPRE `ESTABLISHED,RELATED ACCEPT` primero o el túnel Cloudflare cae (502/timeout).
- UFW solo controla tráfico al host; los puertos publicados por Docker se saltan UFW → usar DOCKER-USER.
- Acceso administrativo (NPM 81, SSH) solo por Tailscale + loopback.
