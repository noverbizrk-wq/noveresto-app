// lib/currency.ts
//
// Formatage monétaire dynamique selon la devise du compte connecté.
// Garde la convention déjà en place dans tout le codebase (point comme
// séparateur décimal, code devise en suffixe — ex: "12.500 TND") plutôt
// que d'introduire un formatage locale complexe (virgule, symbole avant
// le montant...) qui casserait la cohérence visuelle du reste de l'app.
//
// Seul le nombre de décimales et le code affiché changent selon la devise
// du compte (TND a 3 décimales — les millimes — la plupart des autres
// devises courantes en ont 2, le XOF n'en a pas).

const DECIMALS: Record<string, number> = {
  TND: 3, EUR: 2, MAD: 2, DZD: 2, XOF: 0, AED: 2,
};

/**
 * Formate un montant selon la devise du compte. `currency` est optionnel
 * et retombe sur TND (marché domestique historique) si absent — ne
 * casse jamais un affichage existant même si `restaurant` n'est pas
 * encore chargé au moment du premier rendu.
 */
export function formatAmount(amount: number | string | null | undefined, currency: string = 'TND'): string {
  const n = Number(amount) || 0;
  const decimals = DECIMALS[currency] ?? 2;
  return `${n.toFixed(decimals)} ${currency}`;
}

/**
 * Variante sans le suffixe devise, pour les endroits où le code devise
 * est déjà affiché séparément (ex: en-tête de colonne de tableau).
 */
export function formatNumber(amount: number | string | null | undefined, currency: string = 'TND'): string {
  const n = Number(amount) || 0;
  const decimals = DECIMALS[currency] ?? 2;
  return n.toFixed(decimals);
}
