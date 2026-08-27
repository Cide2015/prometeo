---
type: Concept
title: Inteligencia Competitiva — Prometeo
description: Análisis histórico de adjudicaciones en SECOP II para patrones de puja, competidores recurrentes y márgenes de descuento.
timestamp: 2026-08-27T20:20:00-05:00
tags:
  - prometeo
  - competitiva
  - secop
  - analitica
---

# Inteligencia Competitiva de Licitaciones

## Objetivo
Determinar, a partir del dataset SECOP II Contratos (`jbjy-vk9h`):
- **Patrones de puja** por entidad compradora.
- **Competidores recurrentes** en los mismos códigos UNSPSC del tenant.
- **Precios de adjudicación históricos** y márgenes de descuento promedio por entidad.

## Uso estratégico
- Alimenta la estimación de costos y el P_win del motor Go/No-Go.
- Mejora la estrategia de precio en el Módulo 4 (Generador de Ofertas).

## Fuente
- Histórico de adjudicaciones SECOP II vía SODA API, filtrado por UNSPSC y entidad.
