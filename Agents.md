# AGENTS.md

## Mission du dépôt

Ce dépôt héberge une application web de chat multi-agents inspirée de ChatGPT, construite avec `Next.js App Router`, `TypeScript`, `Prisma`, `PostgreSQL` et une intégration `Sim Studio` via un adaptateur backend.

L’objectif du code est de rester:

- modulaire
- testable
- strictement typé
- prêt pour faire évoluer le stockage fichier et l’intégration Sim sans casser le domaine

## Architecture à respecter

Le projet est organisé en trois couches:

1. `app/` et `features/`
   UI, navigation, composants React, hooks client et état UI.
2. `server/application`, `server/domain`
   logique métier, règles de domaine, orchestration des use cases.
3. `server/infrastructure`, `prisma/`
   Prisma, stockage disque, adaptateur Sim, parsing SSE, logs métier.

## Règles non négociables

- Pas de fichier de plus de `500` lignes.
- Cible recommandée: moins de `200` lignes par fichier.
- Pas de logique métier dans les route handlers.
- Pas d’accès Prisma depuis les composants React.
- Tous les inputs externes passent par `Zod`.
- Tout fichier sous `server/` doit importer `server-only`.
- Toute dépendance à Sim, au stockage et à la DB doit passer par un port/adaptateur ou un repository dédié.
- Pas de “dumping ground” du type `utils.ts`, `helpers.ts`, `common.ts`.
- Utiliser des noms métier explicites.

## Conventions de structure

### UI

- `features/chat/components`: shell, thread, composer, bulles de message
- `features/conversations/components`: sidebar, items, actions liste
- `components/ui`: primitives simples réutilisables

### Données partagées

- `features/*/types`: DTOs et contrats partagés entre client et serveur
- les types exportés ici ne doivent pas dépendre de Prisma

### Serveur

- `server/domain/*`: règles pures et logique métier locale
- `server/application/*`: use cases
- `server/infrastructure/repositories/*`: accès Prisma
- `server/infrastructure/sim/*`: client Sim
- `server/infrastructure/storage/*`: implémentations de stockage
- `server/infrastructure/streaming/*`: parsing/format streaming

## Flux chat à conserver

Quand un message est envoyé:

1. validation du payload
2. vérification conversation
3. stockage des fichiers
4. création message user
5. création message assistant vide
6. passage conversation en `streaming`
7. appel Sim en streaming
8. accumulation progressive de la réponse
9. finalisation assistant
10. mise à jour titre auto si nécessaire
11. log métier

## Contrat SSE

Le stream de `POST /api/conversations/:id/messages` doit rester compatible avec:

- `message.accepted`
- `assistant.started`
- `assistant.delta`
- `assistant.completed`
- `assistant.failed`
- `conversation.updated`
- `done`

Tout changement à ce contrat impose:

- mise à jour des types sous `features/chat/types`
- mise à jour du frontend consommateur
- mise à jour du `README.md`

## Persistance et suppression

- Les conversations sont supprimées logiquement via `deletedAt`.
- Les requêtes applicatives ne doivent jamais retourner une conversation supprimée.
- La mémoire Sim est découplée de l’historique produit.

## Intégration Sim Studio

- Ne jamais exposer `SIM_API_KEY` au frontend.
- L’adaptateur REST actuel est volontairement configurable via env.
- Si la forme exacte du payload Sim évolue, modifier `server/application/sim/sim-input-mapper.ts` ou `server/infrastructure/sim/sim-rest-workflow-client.ts`, sans propager de détails Sim dans l’UI.
- Toute modification du workflow Sim côté plateforme nécessite un redéploiement du workflow pour être prise en compte.

## Tests minimum attendus

Avant de conclure un changement:

- `pnpm lint`
- `pnpm typecheck`
- `pnpm test`
- `pnpm build`

Si une évolution touche Prisma:

- `pnpm prisma generate`
- documenter la migration ou le changement de schéma

## Documentation à maintenir

Mettre à jour `README.md` si un changement touche:

- variables d’environnement
- routes API
- schéma Prisma
- stratégie de streaming
- stockage des fichiers
- branchement Sim

## Style de code

- early returns
- fonctions courtes
- commentaires rares et utiles
- pas de duplication de logique de validation ou mapping
- privilégier des composants et services à responsabilité unique
