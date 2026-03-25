# Sim Studio Chat

Application web de chatbot multi-agents inspirée de ChatGPT, construite avec `Next.js App Router`, `TypeScript`, `Prisma` et `PostgreSQL`, avec streaming temps réel et intégration `Sim Studio`.

## Fonctionnalités

- conversations persistées avec historique
- sidebar avec création, renommage et suppression logique
- messages utilisateur et assistant avec rendu markdown
- streaming temps réel via `SSE`
- upload de fichiers sur le message
- mémoire conversationnelle stable côté Sim via `simMemoryKey`
- thème clair/sombre
- architecture 3 couches propre et extensible

## Stack

- `Next.js 15`
- `React 19`
- `TypeScript`
- `Tailwind CSS v4`
- `TanStack Query`
- `Zustand`
- `Prisma`
- `PostgreSQL`
- `Vitest`
- `Playwright`

## Architecture

### 1. Frontend

- `app/`
- `features/chat/`
- `features/conversations/`
- `components/ui/`

Le frontend gère le shell produit, les composants conversationnels, l’état UI local et la consommation du flux SSE.

### 2. Application / BFF

- `app/api/`
- `server/application/`
- `server/domain/`

Les route handlers sont fins et délèguent la logique métier aux use cases.

### 3. Infrastructure / data

- `server/infrastructure/`
- `prisma/`

Cette couche contient Prisma, l’adaptateur Sim, le stockage local des fichiers, le parsing SSE amont et les repositories.

## Structure du projet

```text
app/
  (chat)/
  api/
components/
features/
lib/
server/
prisma/
tests/
docs/
README.md
Agents.md
docker-compose.yml
```

## Prérequis

- `Node.js >= 22`
- `pnpm >= 10`
- `Docker` et `Docker Compose`

## Installation locale

### 1. Installer les dépendances

```bash
pnpm install
```

### 2. Configurer les variables d’environnement

```bash
cp .env.example .env
```

Variables principales:

| Variable | Description |
| --- | --- |
| `DATABASE_URL` | URL PostgreSQL utilisée par Prisma |
| `APP_BASE_URL` | URL publique locale de l’application |
| `UPLOAD_DIR` | Dossier local de stockage des fichiers |
| `MAX_FILE_SIZE_MB` | Taille max par fichier |
| `MAX_ATTACHMENTS_PER_MESSAGE` | Nombre max de fichiers par message |
| `ALLOWED_UPLOAD_MIME_TYPES` | Liste des MIME autorisés, séparés par virgules |
| `SIM_API_KEY` | Clé API Sim Studio |
| `SIM_BASE_URL` | Base URL de Sim |
| `SIM_WORKFLOW_ID` | ID du workflow déployé |
| `SIM_PROMPT_INPUT_KEY` | Clé d’entrée Sim pour le texte, par défaut `input` |
| `SIM_QUERY_INPUT_KEY` | Clé du champ de requête du workflow, par défaut `query` |
| `SIM_MEMORY_INPUT_KEY` | Clé d’entrée Sim pour la mémoire |
| `SIM_FILES_INPUT_KEY` | Clé d’entrée Sim pour les fichiers |
| `SIM_SELECTED_OUTPUTS` | Sorties Sim streamées, séparées par virgules, recommandé: `resultat.content` |

### 3. Démarrer PostgreSQL

```bash
docker compose up -d
```

### 4. Générer Prisma

```bash
pnpm prisma generate
```

### 5. Créer la base et appliquer les migrations

Le schéma Prisma est fourni. Si tu veux créer la première migration localement:

```bash
pnpm prisma migrate dev --name init
```

### 6. Démarrer l’application

```bash
pnpm dev
```

L’application sera disponible sur `http://localhost:3000`.

## Déploiement production

Le dépôt inclut une stack dédiée pour un déploiement sur VPS avec:

- `docker-compose.prod.yml` pour `app + postgres + migrations`
- `Dockerfile` multi-stage pour l’application Next.js
- `.env.production.example` comme base de configuration
- `deploy/nginx/chatbot.romdev.cloud.conf` pour Nginx hors Docker

### 1. Préparer les variables

```bash
cp .env.production.example .env.production
```

Adapter au minimum:

- `POSTGRES_PASSWORD`
- `DATABASE_URL`
- `APP_BASE_URL`
- `SIM_API_KEY`

### 2. Construire et migrer

```bash
docker compose -f docker-compose.prod.yml --profile ops run --rm migrate
docker compose -f docker-compose.prod.yml up -d app postgres
```

### 3. Vérifier l’application

```bash
docker compose -f docker-compose.prod.yml ps
curl http://127.0.0.1:3000/api/health
```

### 4. Publier avec Nginx

Copier `deploy/nginx/chatbot.romdev.cloud.conf` dans `/etc/nginx/sites-available/`,
activer le site puis générer le certificat:

```bash
sudo certbot --nginx -d chatbot.romdev.cloud
```

## Scripts utiles

```bash
pnpm dev
pnpm build
pnpm start
pnpm lint
pnpm typecheck
pnpm test
pnpm test:e2e
pnpm prisma generate
pnpm prisma migrate dev
pnpm prisma migrate deploy
```

## API exposée

### Conversations

- `POST /api/conversations`
- `GET /api/conversations`
- `GET /api/conversations/:id`
- `PATCH /api/conversations/:id`
- `DELETE /api/conversations/:id`

### Messages

- `POST /api/conversations/:id/messages`

Cette route attend du `multipart/form-data` avec:

- `content`
- `clientRequestId`
- `files[]`

### Healthcheck

- `GET /api/health`

## Contrat de streaming SSE

Le flux de chat émet:

- `message.accepted`
- `assistant.started`
- `assistant.delta`
- `assistant.completed`
- `assistant.failed`
- `conversation.updated`
- `done`

Le frontend consomme ce flux via `fetch` + lecture incrémentale de `Response.body`.

## Modèle de données

### Conversation

- `id`
- `title`
- `titleManuallyEdited`
- `simMemoryKey`
- `status`
- `metadata`
- `createdAt`
- `updatedAt`
- `deletedAt`

### Message

- `id`
- `conversationId`
- `role`
- `content`
- `status`
- `clientRequestId`
- `providerMessageId`
- `metadata`
- `error`
- `createdAt`
- `updatedAt`

### Attachment

- `id`
- `messageId`
- `originalName`
- `mimeType`
- `size`
- `status`
- `storageKey`
- `checksum`
- `createdAt`

### EventLog

- `id`
- `conversationId`
- `messageId`
- `level`
- `kind`
- `durationMs`
- `payload`
- `createdAt`

## Mémoire conversationnelle

L’application distingue clairement:

- l’historique produit, persisté dans PostgreSQL
- la mémoire agentique Sim, référencée par `simMemoryKey`

Chaque conversation locale possède une clé stable persistée. Cette clé est renvoyée à Sim à chaque message pour conserver le contexte côté workflow.

## Intégration Sim Studio

Le code n’expose jamais la clé Sim au frontend.

L’intégration actuelle repose sur:

- `server/application/sim/sim-workflow.port.ts`
- `server/application/sim/sim-input-mapper.ts`
- `server/infrastructure/sim/sim-rest-workflow-client.ts`

Le payload Sim est mappé par configuration via les variables d’environnement. Cela permet d’adapter la structure exacte du workflow sans propager la dépendance dans tout le code.

Le contrat actuellement branché correspond à une requête de la forme:

```json
{
  "input": "Bonjour",
  "conversationId": "conv_xxx",
  "query": "Bonjour",
  "files": [
    {
      "data": "data:application/pdf;base64,...",
      "type": "file",
      "name": "document.pdf",
      "mime": "application/pdf"
    }
  ],
  "stream": true,
  "selectedOutputs": ["resultat.content"]
}
```

avec le header `X-API-Key: $SIM_API_KEY`.

Quand `SIM_SELECTED_OUTPUTS` cible correctement le bloc Sim, l’application affiche les `chunk` en direct.
Si ce paramètre est vide ou mal configuré, le token streaming peut être absent, mais l’application récupère quand même le résultat final via `done.output.content`.

### Important

L’application consomme un workflow Sim déployé. Toute modification du workflow côté Sim nécessite un redéploiement pour être prise en compte par l’application.

## Upload de fichiers

Le stockage v1 est local:

- dossier racine configurable par `UPLOAD_DIR`
- sous-dossiers par `conversationId/messageId`
- checksum SHA-256
- fichiers validés par MIME et taille

Le stockage est abstrait derrière `AttachmentStoragePort` afin de pouvoir brancher S3 ou un stockage objet ultérieurement.

## Gestion d’erreurs

Cas traités:

- message vide
- conversation absente ou supprimée
- fichier trop lourd
- type de fichier interdit
- configuration Sim absente
- erreur upstream Sim
- interruption de stream

En cas d’échec du stream:

- le message assistant est marqué `failed`
- le contenu partiel est conservé
- la conversation passe en état `error`
- un log métier est créé

## Qualité et validation

Commandes exécutées sur cette version:

```bash
pnpm prisma generate
pnpm typecheck
pnpm lint
pnpm build
```

Tests unitaires présents:

- génération de titre de conversation
- mapping du payload Sim
- parsing SSE

## Limites actuelles

- pas d’authentification en v1
- stockage fichier local, pas objet
- adaptateur Sim volontairement flexible car les contrats précis peuvent varier selon le workflow
- pas encore de route de retry dédiée pour les messages échoués

## Extensions prévues

- ajout d’un `userId` sur les entités
- stockage S3/R2
- retry de message
- pagination d’historique
- observabilité plus poussée
- E2E Playwright contre une base de test
