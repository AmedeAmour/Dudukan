import { createSupabaseAdmin, getUserFromRequest } from '../_utils/supabaseAdmin.js';
import { sendJson } from '../_utils/http.js';
import { DEFAULT_PLUS_PLAN, getPlusPlan } from '../_utils/plusPlan.js';

const APP_CODE = 'dudukan';
const MERCHANT_REFERENCE_PREFIX = 'DUDUKAN-';

const getFedaPayEnvironment = () => {
  return process.env.FEDAPAY_ENVIRONMENT === 'live' ? 'live' : 'sandbox';
};

const getFedaPayBaseUrl = () => {
  return getFedaPayEnvironment() === 'live' ? 'https://api.fedapay.com/v1' : 'https://sandbox-api.fedapay.com/v1';
};

const getFedaPaySecretKey = () => {
  const env = getFedaPayEnvironment();
  return env === 'live'
    ? process.env.FEDAPAY_LIVE_SECRET_KEY || process.env.FEDAPAY_SECRET_KEY
    : process.env.FEDAPAY_SANDBOX_SECRET_KEY || process.env.FEDAPAY_SECRET_KEY;
};

const fedapayRequest = async (path) => {
  const apiKey = getFedaPaySecretKey();
  if (!apiKey) throw new Error(`Missing FedaPay ${getFedaPayEnvironment()} secret key.`);

  const response = await fetch(`${getFedaPayBaseUrl()}${path}`, {
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload?.message || payload?.error || 'FedaPay request failed.');
  }

  return payload;
};

const extractTransaction = (payload) => {
  return payload?.id
    ? payload
    : payload?.transaction
      || payload?.data?.transaction
      || payload?.data
      || payload?.entity
      || payload?.['v1/transaction']
      || payload?.['v1_transaction']
      || null;
};

const normalizeCurrency = (currency) => {
  const value = typeof currency === 'string' ? currency : currency?.iso;
  const normalized = String(value || DEFAULT_PLUS_PLAN.currency).toUpperCase();
  return normalized === 'CFA' || normalized === 'FCFA' ? DEFAULT_PLUS_PLAN.currency : normalized;
};

const isDudukanTransaction = (transaction, metadata) => {
  const merchantReference = transaction?.merchant_reference || transaction?.reference || '';
  return (
    metadata?.app_code === APP_CODE
    || metadata?.product_name === 'Dudukan Plus'
    || merchantReference.startsWith(MERCHANT_REFERENCE_PREFIX)
  );
};

const findCandidatePurchase = async (supabase, userId, requestedTransactionId) => {
  if (requestedTransactionId) {
    const { data, error } = await supabase
      .from('premium_purchases')
      .select('*')
      .eq('user_id', userId)
      .eq('provider_transaction_id', requestedTransactionId)
      .maybeSingle();

    if (error) throw error;
    if (data) return data;
  }

  const { data, error } = await supabase
    .from('premium_purchases')
    .select('*')
    .eq('user_id', userId)
    .eq('provider', 'fedapay')
    .eq('status', 'pending')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  return data || null;
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return sendJson(res, 405, { error: 'Method not allowed.' });
  }

  try {
    const supabase = createSupabaseAdmin();
    const { user, error: userError } = await getUserFromRequest(req, supabase);
    if (userError || !user) {
      return sendJson(res, 401, { error: 'Session invalide. Reconnectez-vous puis réessayez.' });
    }

    const requestedTransactionId = String(req.query?.transaction_id || req.query?.id || '').trim();
    const candidate = await findCandidatePurchase(supabase, user.id, requestedTransactionId);
    if (!candidate?.provider_transaction_id) {
      return sendJson(res, 404, { confirmed: false, error: 'Achat en attente introuvable.' });
    }

    const payload = await fedapayRequest(`/transactions/${candidate.provider_transaction_id}`);
    const transaction = extractTransaction(payload);
    const metadata = transaction?.custom_metadata || transaction?.metadata || {};
    const transactionId = transaction?.id ? String(transaction.id) : candidate.provider_transaction_id;

    if (!transaction?.id || transactionId !== String(candidate.provider_transaction_id)) {
      return sendJson(res, 409, { confirmed: false, error: 'Transaction FedaPay non reconnue.' });
    }

    if (!isDudukanTransaction(transaction, metadata)) {
      return sendJson(res, 409, { confirmed: false, error: 'Transaction non liée à Dudukan.' });
    }

    const plan = await getPlusPlan(supabase);
    const amount = Number(transaction?.amount || candidate.amount);
    const currency = normalizeCurrency(transaction?.currency || candidate.currency);
    const status = transaction?.status || 'pending';
    const isApproved = status === 'approved' || status === 'transferred';
    const isExpectedPlan = amount === Number(plan.amount)
      && currency === plan.currency
      && (metadata.plan_code === plan.code || candidate.plan_code === plan.code);

    if (!isApproved || !isExpectedPlan) {
      await supabase.from('premium_purchases').update({
        status,
        amount,
        currency,
        raw_event: payload,
        updated_at: new Date().toISOString(),
      }).eq('id', candidate.id);

      return sendJson(res, 200, {
        confirmed: false,
        status,
        reason: isApproved ? 'unexpected_plan' : 'not_approved',
      });
    }

    const now = new Date().toISOString();
    const { error: updateError } = await supabase.from('premium_purchases').update({
      status: 'approved',
      amount: plan.amount,
      currency: plan.currency,
      plan_code: plan.code,
      provider_reference: transaction?.reference || candidate.provider_reference || null,
      raw_event: payload,
      approved_at: now,
      updated_at: now,
    }).eq('id', candidate.id);

    if (updateError) throw updateError;

    await supabase.auth.admin.updateUserById(user.id, {
      user_metadata: { is_premium: true },
    });

    return sendJson(res, 200, {
      confirmed: true,
      premiumActivated: true,
      transactionId,
    });
  } catch (error) {
    console.error('FedaPay return confirmation error:', error);
    const isConfigurationError = /Missing FedaPay .* secret key|Missing Supabase server environment variables/.test(error.message || '');
    return sendJson(res, isConfigurationError ? 503 : 500, {
      confirmed: false,
      error: isConfigurationError
        ? "La confirmation du paiement n'est pas encore configurée côté serveur."
        : 'Impossible de confirmer le paiement pour le moment.',
    });
  }
}
