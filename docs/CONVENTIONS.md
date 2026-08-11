# Conventions — Frontend

## Thème clair/sombre

Variables CSS sémantiques dans `app/globals.css`, jamais de couleur
codée en dur dans un composant :

```
--bg-page, --bg-card, --bg-card-alt, --bg-sidebar
--text-primary, --text-secondary, --text-muted
--accent, --danger, --warning, --success, --info
--border-color
```

Basculement via `lib/use-theme.tsx` (hook `useTheme()` +
`ThemeToggleButton`), persisté en `localStorage` (`nr_theme`).

⚠️ Piège CSS déjà rencontré : `${couleur}20` (notation hexadécimale pour
transparence) ne fonctionne pas avec une variable CSS. Utiliser
`color-mix(in srgb, var(--accent) 12%, transparent)` à la place.

**Couverture actuelle** : les pages du module "Gestion du restaurant"
(`app/dashboard/restaurant/*`) suivent cette convention. Les pages
d'origine restantes ne sont pas toutes retapées — vérifier au cas par
cas avant de supposer qu'une couleur est déjà une variable.

## Adaptation mobile

Classes utilitaires dans `app/globals.css` :
`.nr-sidebar`, `.nr-sidebar-open`, `.nr-overlay`, `.nr-hamburger`,
`.nr-main`, `.nr-grid-responsive`, `.nr-table-wrap`, `.nr-page-padding`.

Sidebar en tiroir sous 768px (`translateX(-100%)` fermé), grilles qui
passent de 4 → 2 → 1 colonnes selon la largeur. Comme pour le thème,
seules les pages du module "Gestion du restaurant" sont systématiquement
couvertes.

## Filtrage par permissions (`myModules`)

`app/dashboard/layout.tsx` charge `GET /api/v1/restaurant/my-modules` au
montage, stocke le résultat dans `myModules` (état local, pas de
contexte React global). Chaque lien de navigation avec une clé `key`
n'est affiché que si cette clé est présente dans `myModules` (ou si le
compte est admin, qui voit tout). Une catégorie entière disparaît de la
sidebar si aucun de ses liens n'est autorisé.

**Important** : ce filtrage est côté affichage uniquement — la vraie
protection est côté backend (`moduleAccessMiddleware`). Ne jamais
considérer le masquage d'un lien comme une mesure de sécurité en soi.

## Devise et formatage monétaire

`lib/currency.ts` — `formatAmount(montant, devise)`. Nombre de
décimales dépend de la devise (3 pour TND, 2 pour la plupart des autres,
0 pour XOF), séparateur décimal toujours un point (convention conservée
du système d'origine, pas de virgule même en contexte français) —
volontaire pour la cohérence visuelle, pas un oubli.

## Appels API — toujours via `apiCall()`

`lib/api.ts` centralise tous les appels réseau vers le backend. La
fonction `apiCall()` préfixe automatiquement `NEXT_PUBLIC_API_URL` (ou
son fallback `https://noveresto.app`). Ne jamais utiliser `fetch()`
directement avec un chemin relatif dans une page — ça cible le serveur
Next.js lui-même, pas le backend Express (erreur silencieuse en
apparence, 404 en réalité — piège déjà rencontré, corrigé avant mise en
production).
