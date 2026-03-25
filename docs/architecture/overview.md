# Vue d’ensemble d’architecture

## But

Fournir une interface de chat moderne branchée sur un workflow `Sim Studio`, avec persistance produit indépendante, streaming temps réel et architecture maintenable.

## Découpage

### UI

- rendu serveur initial via `app/`
- consommation client via `React Query`
- état UX local via `Zustand`

### Application

- use cases par intention métier
- validation `Zod`
- contrats SSE typés

### Infrastructure

- Prisma pour la persistance
- stockage disque local pour les attachments
- adaptateur REST Sim pour le workflow
- parser SSE amont pour convertir la réponse provider en événements UI

## Règles d’évolution

- changer un provider ou un stockage ne doit pas casser le domaine
- les DTOs exposés au frontend ne doivent pas dépendre de Prisma
- les route handlers ne doivent jamais contenir la logique métier
