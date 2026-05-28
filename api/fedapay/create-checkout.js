import { createSupabaseAdmin, getUserFromRequest } from '../_utils/supabaseAdmin.js';
import { readJsonBody, sendJson } from '../_utils/http.js';

const PLAN = {
  code: 'lifetime_9900_xof',
  amount: 9900,
  currency: 'XOF',
};

const APP_CODE = 'dudukan';

const COUNTRY_ISO_BY_DIAL_CODE = {
  '+225': 'ci',
  '+229': 'bj',
  '+221': 'sn',
  '+223': 'ml',
  '+228': 'tg',
  '+226': 'bf',
  '+227': 'ne',
  '+237': 'cm',
  '+241': 'ga',
};

const PAYMENT_METHOD_LABELS = {
  wave: 'Wave',
  orange: 'Orange Money',
  mtn: 'MTN Mobile Money',
  moov: 'Moov Money',
  card: 'Carte bancaire',
};

const getFedaPayBaseUrl = () => {
  return getFedaPayEnvironment() === 'live' ? 'https://api.fedapay.com/v1' : 'https://sandbox-api.fedapay.com/v1';
};

const getFedaPayEnvironment = () => {
  return process.env.FEDAPAY_ENVIRONMENT === 'live' ? 'live' : 'sandbox';
};

const getFedaPaySecretKey = () => {
  const env = getFedaPayEnvironment();
  return env === 'live'
    ? process.env.FEDAPAY_LIVE_SECRET_KEY || process.env.FEDAPAY_SECRET_KEY
    : process.env.FEDAPAY_SANDBOX_SECRET_KEY || process.env.FEDAPAY_SECRET_KEY;
};

const splitName = (fullName = '') => {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  return {
    firstname: parts[0] || 'Client',
    lastname: parts.slice(1).join(' ') || 'Dudukan',
  };
};

const normalizePhoneNumber = (phoneNumber = '') => phoneNumber.replace(/[^\d+]/g, '').trim();

const buildCustomer = (user, body, firstname, lastname) => {
  const countryIso = COUNTRY_ISO_BY_DIAL_CODE[body?.countryCode];
  const phoneNumber = normalizePhoneNumber(body?.phoneNumber);
  const customer = {
    firstname,
    lastname,
    email: user.email,
  };

  if (phoneNumber && countryIso) {
    customer.phone_number = {
      number: phoneNumber,
      country: countryIso,
    };
  }

  return customer;
};

const fedapayRequest = async (path, options = {}) => {
  const apiKey = getFedaPaySecretKey();
  if (!apiKey) throw new Error(`Missing FedaPay ${getFedaPayEnvironment()} secret key.`);

  const response = await fetch(`${getFedaPayBaseUrl()}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      ...(options.headers || {}),
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

const extractToken = (payload) => {
  return payload?.url
    ? payload
    : payload?.token
      ? payload
      : payload?.data
        || payload?.['v1/token']
        || payload?.['v1_token']
        || null;
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

    const { body } = await readJsonBody(req);
    const origin = req.headers.origin || process.env.APP_URL || `https://${req.headers.host}`;
    const returnUrl = process.env.FEDAPAY_RETURN_URL || `${origin}/?payment=success`;
    const fullName = user.user_metadata?.full_name || user.email || '';
    const { firstname, lastname } = splitName(fullName);
    const selectedMethod = body?.selectedMethod || null;
    const merchantReference = `DUDUKAN-${Date.now()}-${user.id.slice(0, 8)}`;

    const { data: existingApproved, error: approvedError } = await supabase
      .from('premium_purchases')
      .select('id')
      .eq('user_id', user.id)
      .eq('status', 'approved')
      .eq('plan_code', PLAN.code)
      .maybeSingle();

    if (approvedError) throw approvedError;
    if (existingApproved) {
      return sendJson(res, 200, { alreadyPremium: true });
    }

    const transactionPayload = await fedapayRequest('/transactions', {
      method: 'POST',
      body: JSON.stringify({
        description: 'Dudukan Plus - acces a vie',
        amount: PLAN.amount,
        currency: { iso: PLAN.currency },
        callback_url: returnUrl,
        merchant_reference: merchantReference,
        custom_metadata: {
          app_code: APP_CODE,
          user_id: user.id,
          plan_code: PLAN.code,
          product_name: 'Dudukan Plus',
          return_url: returnUrl,
          payment_method_hint: selectedMethod,
          payment_method_label: PAYMENT_METHOD_LABELS[selectedMethod] || null,
        },
        customer: buildCustomer(user, body, firstname, lastname),
      }),
    });
    const transaction = extractTransaction(transactionPayload);

    if (!transaction?.id) {
      throw new Error('FedaPay transaction id missing.');
    }

    const fedapayId = String(transaction.id);
    const tokenPayload = await fedapayRequest(`/transactions/${fedapayId}/token`, {
      method: 'POST',
    });
    const token = extractToken(tokenPayload);

    if (!token?.url) {
      throw new Error('FedaPay checkout url missing.');
    }

    const { error: insertError } = await supabase.from('premium_purchases').upsert({
      user_id: user.id,
      provider: 'fedapay',
      provider_transaction_id: fedapayId,
      provider_reference: transaction.reference || null,
      amount: PLAN.amount,
      currency: PLAN.currency,
      status: transaction.status || 'pending',
      plan_code: PLAN.code,
      checkout_url: token.url,
      raw_event: {
        transaction: transactionPayload,
        token: tokenPayload,
        merchant_reference: merchantReference,
        selected_method: selectedMethod,
      },
      updated_at: new Date().toISOString(),
    }, {
      onConflict: 'provider_transaction_id',
    });

    if (insertError) throw insertError;

    return sendJson(res, 200, {
      checkoutUrl: token.url,
      transactionId: fedapayId,
      reference: transaction.reference || null,
    });
  } catch (error) {
    console.error('FedaPay checkout error:', error);
    const isFedapayConfigurationError = /Missing FedaPay .* secret key|Missing FEDAPAY_SECRET_KEY/.test(error.message || '');
    const isSupabaseConfigurationError = /Missing Supabase server environment variables/.test(error.message || '');
    const isFedapayAuthenticationError = /authentification|authentication|unauthorized|invalid api/i.test(error.message || '');
    const isConfigurationError = isFedapayConfigurationError || isSupabaseConfigurationError;

    return sendJson(res, isConfigurationError || isFedapayAuthenticationError ? 503 : 500, {
      error: isFedapayAuthenticationError
        ? "La cle FedaPay du serveur n'est pas acceptee. Verifiez la cle secrete et l'environnement FedaPay dans Vercel."
        : isConfigurationError
          ? "Le paiement est presque pret, mais la configuration serveur n'est pas encore complete."
          : "Impossible d'initialiser le paiement. Veuillez reessayer dans un instant.",
      code: isFedapayAuthenticationError
        ? 'FEDAPAY_AUTHENTICATION_ERROR'
        : isSupabaseConfigurationError
          ? 'MISSING_SUPABASE_SERVICE_ROLE_KEY'
          : isFedapayConfigurationError
            ? 'MISSING_FEDAPAY_SECRET_KEY'
            : 'CHECKOUT_ERROR',
    });
  }
}
