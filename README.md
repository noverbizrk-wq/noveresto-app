# NoveResto — Frontend (noveresto-app)

Dashboard Next.js du SaaS NoveResto. Pour la vue d'ensemble du système
complet (avec le backend), voir
**[docs/ARCHITECTURE.md](https://github.com/noverbizrk-wq/noveresto-saas/blob/main/docs/ARCHITECTURE.md)**
(dans le dépôt backend) — à lire en premier.

## Documentation

| Document | Contenu |
|---|---|
| [ARCHITECTURE.md ↗](https://github.com/noverbizrk-wq/noveresto-saas/blob/main/docs/ARCHITECTURE.md) | Vue d'ensemble système (dans noveresto-saas) — **à lire en premier** |
| [`docs/MODULES.md`](docs/MODULES.md) | Structure des routes, chaque module expliqué |
| [`docs/CONVENTIONS.md`](docs/CONVENTIONS.md) | Thème, mobile, permissions, formatage — les pièges déjà rencontrés |

## Stack

Next.js 16 (App Router) · React 19 · TypeScript · Leaflet/OpenStreetMap
(carte de prospection) · Recharts

## Démarrage local

```bash
git clone https://github.com/noverbizrk-wq/noveresto-app.git
cd noveresto-app
npm install
npm run dev
```

Par défaut, l'app tape sur `https://noveresto.app` (backend de
production — voir `lib/api.ts`). Pour pointer vers un backend local,
créer `.env.local` :

```
NEXT_PUBLIC_API_URL=http://localhost:3000
```

## Point d'architecture à connaître avant de toucher au routing

`basePath: '/app'` (`next.config.ts`) — **toute l'application vit sous
`/app/*`**, y compris les fichiers statiques du dossier `public/`. Une
page créée à `app/ma-page/page.tsx` est servie à `/app/ma-page`, pas
`/ma-page`. Le middleware (`middleware.ts`) ne protège que
`/dashboard/*` et `/login` — toute autre route est publique par défaut,
vérifier `middleware.ts` avant de supposer qu'une nouvelle page est
protégée.

## Comptes de démonstration

Voir le README de
[noveresto-saas](https://github.com/noverbizrk-wq/noveresto-saas#comptes-de-démonstration-base-de-production)
— même backend, mêmes comptes.

## Build et déploiement

```bash
npm run build   # vérifie TypeScript + génère le build de production
pm2 restart noveresto-next
```

Workflow de branche identique au backend — voir
[README de noveresto-saas §Déploiement](https://github.com/noverbizrk-wq/noveresto-saas#déploiement-production).

## Dépôt lié

Backend : [noveresto-saas](https://github.com/noverbizrk-wq/noveresto-saas)
