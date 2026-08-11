# Modules — Frontend (noveresto-app)

> Voir `docs/ARCHITECTURE.md` (dans noveresto-saas) pour la vue
> d'ensemble système. Ce document couvre la structure et les
> conventions propres au frontend.

## Structure des routes

Next.js App Router. `basePath: '/app'` (configuré dans
`next.config.ts`) — **toute l'application est servie sous `/app/*`**,
y compris les fichiers statiques (`/public/manifest.json` devient
`/app/manifest.json`, etc.). Le site vitrine public (marketing,
`noveresto.app` sans préfixe) est un fichier HTML statique **séparé**,
hors de ce dépôt (`/var/www/html/index.html` sur le serveur — voir
`docs/DECISIONS.md` dans noveresto-saas).

```
app/
├── login/, onboarding/          Pages publiques d'authentification
├── diagnostic/                   Diagnostic de visibilité PUBLIC (aimant à prospects)
├── pricing/                      Page de tarifs PUBLIQUE (multi-région)
├── offline/                      Page affichée hors connexion (fallback service worker)
├── dashboard/
│   ├── layout.tsx                 Sidebar + navigation, catégories pliables
│   ├── admin/                     Panneau admin
│   ├── forecasts/, reputation/,   Modules "d'origine" (avant le module
│   │   social/, social-media/,     "Gestion du restaurant" — voir note
│   │   fidelisation/, import/      ci-dessous)
│   └── restaurant/                 Module "Gestion du restaurant" (voir plus bas)
├── components/                    Composants partagés (ex: NetworkStatusBanner)
public/
├── manifest.json, sw.js, icons/  PWA — voir section dédiée plus bas
```

## Deux générations de pages coexistent — ne pas confondre

Le dashboard contient des pages **d'origine** (`app/dashboard/*`,
antérieures à ce projet) et des pages du module **"Gestion du
restaurant"** (`app/dashboard/restaurant/*`, construites lot par lot).
Deux d'entre elles se recoupaient exactement avec les pages d'origine —
**supprimées** après vérification (elles affichaient des données
factices codées en dur) :

| Supprimé | Gardait quoi |
|---|---|
| `app/dashboard/orders/` | `app/dashboard/restaurant/purchases/` (même concept réel : bons de commande fournisseurs) |
| `app/dashboard/stocks/` | `app/dashboard/restaurant/stocks/` |

`app/dashboard/restaurant/orders/` (commandes **clients** + écran
cuisine) n'est **pas** un doublon malgré le nom proche — aucun
équivalent d'origine, fonctionnalité propre au module Gestion du
restaurant.

## Module "Gestion du restaurant" (`app/dashboard/restaurant/`)

Toutes ces pages partagent deux éléments communs :
- **`useCurrentRestaurant()`** (`useCurrentRestaurant.ts`) — hook qui
  expose le restaurant actif (`id`, `name`, `country`, `currency`,
  `timezone`), la liste des restaurants (vue admin), et le token.
- **`formatAmount(valeur, restaurant?.currency)`** (`lib/currency.ts`)
  — tout affichage monétaire doit passer par cette fonction, jamais un
  montant brut avec un suffixe codé en dur (`TND` en dur a été
  entièrement retiré, 29 occurrences, voir `docs/DECISIONS.md` côté
  backend).

| Page | Contenu |
|---|---|
| `overview/` | Pilotage restaurant, KPIs |
| `orders/` | Commandes clients + écran cuisine + génération de facture TEIF par commande + connexion Deliveroo |
| `kds/` | Écran cuisine (Kitchen Display System) |
| `menus/` | Menus et produits + mapping articles Deliveroo |
| `recipes/` | Recettes et coûts matière |
| `stocks/` | Inventaire |
| `purchases/` | Achats et fournisseurs |
| `staff/` | Personnel et planning |
| `disputes/` | Litiges et remboursements |
| `finance/` | Finance/TVA + profil fiscal (matricule, requis pour TEIF) |
| `copilot/` | Copilote IA conversationnel |
| `prospection/` | Prospection commerciale — le module le plus riche, voir ci-dessous |

### Prospection — particularités notables

- **Deux modes de recherche** : par nom de zone (texte) ou sur une
  carte interactive (Leaflet/OpenStreetMap, aucune dépendance API
  externe pour l'affichage de la carte elle-même)
- **Lignes dépliables** : vue compacte par défaut, dépliage révèle un
  pipeline visuel (stepper Nouveau→Contacté→Qualifié, avec "Rejeté"
  visuellement distinct plutôt qu'une simple variante de couleur)
- **Bouton WhatsApp** conditionnel (masqué si le prospect n'a pas de
  numéro), lien `wa.me` avec message pré-rempli — soit un template fixe
  par palier, soit un message généré par IA (bouton "✨ Générer un
  message personnalisé")

## Pages publiques (hors authentification)

Le middleware (`middleware.ts`) ne protège que `/dashboard/*` et
`/login` (`matcher` explicite) — toute nouvelle route créée ailleurs est
publique par défaut. Actuellement :

- **`/diagnostic`** — diagnostic de visibilité gratuit, réutilise le
  moteur de scoring du module Prospection côté backend
  (`/api/v1/public/diagnostic`)
- **`/pricing`** — tarifs multi-région (Tunisie/France/Maroc/Algérie/
  Sénégal/UAE), région devinée par fuseau horaire navigateur

⚠️ Existe aussi un site vitrine **séparé et distinct** (voir plus haut)
avec sa propre section tarifs — les deux ne sont pas synchronisés
automatiquement, un changement de prix doit être répercuté aux deux
endroits manuellement si nécessaire.

## PWA — fondations, pas un mode hors-ligne complet

`public/manifest.json` + `public/sw.js`, enregistré dans `app/layout.tsx`.

**Ce qui fonctionne** : installation sur écran d'accueil, coquille
applicative + pages déjà visitées consultables hors connexion (cache
navigateur), bandeau d'avertissement visible
(`app/components/NetworkStatusBanner.tsx`).

**Ce qui NE fonctionne PAS** : créer/modifier une commande sans
connexion puis synchroniser au retour — non implémenté, chantier
architectural bien plus large si un jour nécessaire. Les appels
`/api/*` sont explicitement exclus du cache (`public/sw.js`) — les
données affichées hors ligne sont donc les dernières connues, jamais
modifiables sans connexion.

## Variables d'environnement

```
NEXT_PUBLIC_API_URL=https://noveresto.app   # optionnel, fallback déjà en dur dans lib/api.ts
```

Attention en cas d'ajout de nouvel appel réseau : **toujours** utiliser
`apiCall()` (`lib/api.ts`), jamais un `fetch()` relatif brut — un
`fetch('/api/...')` sans passer par `apiCall` tape sur le frontend
Next.js lui-même plutôt que sur le vrai backend Express (bug rencontré
et corrigé une fois pendant le développement, avant mise en production).
