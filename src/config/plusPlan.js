export const DEFAULT_PLUS_PLAN = {
  code: 'lifetime_9900_xof',
  amount: 9900,
  currency: 'XOF',
  originalAmount: 59900,
  productName: 'Dudukan Plus',
  badge: 'Dudukan Plus a vie',
  headline: 'Passez au niveau superieur',
  subtitle: 'Planification intelligente, projets complexes et suivi guide pour garder le cap.',
  offerLabel: 'Offre de lancement',
  normalPriceLabel: 'Prix normal',
  savingsLabel: 'Vous economisez',
  paymentNote: 'Paiement unique a vie. Aucun abonnement mensuel.',
};

export const normalizePlusPlan = (value = {}) => {
  const amount = Number(value.amount ?? DEFAULT_PLUS_PLAN.amount);
  const originalAmount = Number(value.originalAmount ?? DEFAULT_PLUS_PLAN.originalAmount);
  const currency = String(value.currency || DEFAULT_PLUS_PLAN.currency).trim().toUpperCase();
  const code = String(value.code || `lifetime_${amount}_${currency}`.toLowerCase()).trim();

  return {
    ...DEFAULT_PLUS_PLAN,
    ...value,
    code,
    amount: Number.isFinite(amount) && amount > 0 ? Math.round(amount) : DEFAULT_PLUS_PLAN.amount,
    originalAmount: Number.isFinite(originalAmount) && originalAmount > 0 ? Math.round(originalAmount) : DEFAULT_PLUS_PLAN.originalAmount,
    currency: currency || DEFAULT_PLUS_PLAN.currency,
  };
};
