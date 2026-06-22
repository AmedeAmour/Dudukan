import crypto from 'node:crypto';
import { createSupabaseAdmin } from '../_utils/supabaseAdmin.js';
import { readJsonBody, sendJson } from '../_utils/http.js';
import { DEFAULT_PLUS_PLAN, getPlusPlan } from '../_utils/plusPlan.js';

const APP_CODE = 'dudukan';
const MERCHANT_REFERENCE_PREFIX = 'DUDUKAN-';
const PAYMENT_PAGE_REFERENCE = 'dudukan-plus';

const timingSafeEqual = (a, b) => {
  const left = Buffer.from(a || '');
  const right = Buffer.from(b || '');
  return left.length === right.length && crypto.timingSafeEqual(left, right);
};

const cleanEnvValue = (value) => {
  return typeof value === 'string' ? value.replace(/^\uFEFF/, '').trim() : value;
};

const getFedaPayEnvironment = () => {
  return cleanEnvValue(process.env.FEDAPAY_ENVIRONMENT) === 'live' ? 'live' : 'sandbox';
};

const getFedaPayWebhookSecret = () => {
  const env = getFedaPayEnvironment();
  const secret = env === 'live'
    ? process.env.FEDAPAY_LIVE_WEBHOOK_SECRET || process.env.FEDAPAY_WEBHOOK_SECRET
    : process.env.FEDAPAY_SANDBOX_WEBHOOK_SECRET || process.env.FEDAPAY_WEBHOOK_SECRET;
  return cleanEnvValue(secret);
};

const isWebhookSignatureRequired = () => {
  return getFedaPayEnvironment() === 'live'
    || process.env.VERCEL_ENV === 'production'
    || process.env.NODE_ENV === 'production';
};

const verifySignature = (rawBody, signature) => {
  const secret = getFedaPayWebhookSecret();
  if (!secret) {
    return {
      ok: !isWebhookSignatureRequired(),
      error: 'missing_webhook_secret',
    };
  }
  if (!signature) {
    return {
      ok: false,
      error: 'missing_webhook_signature',
    };
  }

  const digest = crypto.createHmac('sha256', secret).update(rawBody).digest('hex');
  return {
    ok: timingSafeEqual(signature, digest) || timingSafeEqual(signature, `sha256=${digest}`),
    error: 'invalid_webhook_signature',
  };
};

const extractTransaction = (event) => {
  return event?.entity || event?.data?.entity || event?.data?.transaction || event?.transaction || event?.data || {};
};

const normalizeText = (value = '') => String(value)
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .toLowerCase();

const collectStrings = (value, strings = [], seen = new Set()) => {
  if (value == null) return strings;
  if (typeof value === 'string' || typeof value === 'number') {
    strings.push(String(value));
    return strings;
  }
  if (typeof value !== 'object' || seen.has(value)) return strings;
  seen.add(value);
  if (Array.isArray(value)) {
    value.forEach((item) => collectStrings(item, strings, seen));
    return strings;
  }
  Object.entries(value).forEach(([key, item]) => {
    strings.push(String(key));
    collectStrings(item, strings, seen);
  });
  return strings;
};

const isDudukanPaymentPageTransaction = (transaction, event) => {
  const haystack = normalizeText(collectStrings({ transaction, event }).join(' '));
  return haystack.includes(PAYMENT_PAGE_REFERENCE)
    || haystack.includes('dudukan plus');
};

const isDudukanTransaction = (transaction, metadata) => {
  const merchantReference = transaction?.merchant_reference || transaction?.reference || '';
  return (
    metadata?.app_code === APP_CODE
    || metadata?.product_name === 'Dudukan Plus'
    || merchantReference.startsWith(MERCHANT_REFERENCE_PREFIX)
  );
};

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/i;

const extractEmail = (value, seen = new Set()) => {
  if (value == null) return null;
  if (typeof value === 'string') {
    const trimmed = value.trim();
    return EMAIL_PATTERN.test(trimmed) ? trimmed.toLowerCase() : null;
  }
  if (typeof value !== 'object' || seen.has(value)) return null;
  seen.add(value);

  if (!Array.isArray(value)) {
    const prioritized = Object.entries(value).filter(([key]) => /email|mail|courriel/i.test(key));
    for (const [, item] of prioritized) {
      const email = extractEmail(item, seen);
      if (email) return email;
    }
  }

  const entries = Array.isArray(value) ? value : Object.values(value);
  for (const item of entries) {
    const email = extractEmail(item, seen);
    if (email) return email;
  }
  return null;
};

const findUserIdByEmail = async (supabase, email) => {
  if (!email) return null;
  const expected = email.toLowerCase();

  for (let page = 1; page <= 20; page += 1) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: 1000 });
    if (error) throw error;
    const users = data?.users || [];
    const match = users.find((user) => user.email?.toLowerCase() === expected);
    if (match) return match.id;
    if (users.length < 1000) break;
  }

  return null;
};

const normalizeCurrency = (currency) => {
  const value = typeof currency === 'string' ? currency : currency?.iso;
  const normalized = String(value || DEFAULT_PLUS_PLAN.currency).toUpperCase();
  return normalized === 'CFA' || normalized === 'FCFA' ? DEFAULT_PLUS_PLAN.currency : normalized;
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return sendJson(res, 405, { error: 'Method not allowed.' });
  }

  try {
    const { rawBody, body } = await readJsonBody(req);
    const signature = req.headers['x-fedapay-signature'];
    const signatureCheck = verifySignature(rawBody, signature);

    if (!signatureCheck.ok) {
      const statusCode = signatureCheck.error === 'missing_webhook_secret' ? 503 : 401;
      return sendJson(res, statusCode, {
        error: signatureCheck.error === 'missing_webhook_secret'
          ? 'FedaPay webhook secret is not configured.'
          : 'Invalid webhook signature.',
        code: signatureCheck.error,
      });
    }

    const eventName = body?.name || body?.event || body?.type;
    const transaction = extractTransaction(body);
    const metadata = transaction?.custom_metadata || transaction?.metadata || {};
    const transactionId = transaction?.id ? String(transaction.id) : null;
    const status = transaction?.status || (eventName === 'transaction.approved' ? 'approved' : 'pending');
    const isPaymentPageTransaction = isDudukanPaymentPageTransaction(transaction, body);
    let userId = metadata.user_id;

    if (!transactionId) {
      return sendJson(res, 200, { received: true, ignored: 'missing_transaction_id' });
    }

    if (!isDudukanTransaction(transaction, metadata) && !isPaymentPageTransaction) {
      return sendJson(res, 200, { received: true, ignored: 'not_dudukan_transaction' });
    }

    const supabase = createSupabaseAdmin();
    const plan = await getPlusPlan(supabase);
    const amount = Number(transaction?.amount || plan.amount);
    const currency = normalizeCurrency(transaction?.currency);
    const isApproved = eventName === 'transaction.approved' || status === 'approved';
    const isExpectedPlan = amount === plan.amount
      && currency === plan.currency
      && (metadata.plan_code === plan.code || isPaymentPageTransaction);

    if (!userId && isPaymentPageTransaction) {
      const email = extractEmail({ transaction, body });
      userId = await findUserIdByEmail(supabase, email);
    }

    if (!userId) {
      return sendJson(res, 200, { received: true, ignored: 'missing_dudukan_user_id' });
    }

    if (!isApproved || !isExpectedPlan) {
      await supabase.from('premium_purchases').upsert({
        user_id: userId,
        provider: 'fedapay',
        provider_transaction_id: transactionId,
        provider_reference: transaction?.reference || null,
        amount,
        currency,
        status,
        plan_code: metadata.plan_code || plan.code,
        raw_event: body,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'provider_transaction_id',
      });

      return sendJson(res, 200, { received: true, ignored: 'not_an_approved_lifetime_payment' });
    }

    const now = new Date().toISOString();
    const { error } = await supabase.from('premium_purchases').upsert({
      user_id: userId,
      provider: 'fedapay',
      provider_transaction_id: transactionId,
      provider_reference: transaction?.reference || null,
      amount: plan.amount,
      currency: plan.currency,
      status: 'approved',
      plan_code: plan.code,
      raw_event: body,
      approved_at: now,
      updated_at: now,
    }, {
      onConflict: 'provider_transaction_id',
    });

    if (error) throw error;

    await supabase.auth.admin.updateUserById(userId, {
      user_metadata: { is_premium: true },
    });

    return sendJson(res, 200, { received: true, premiumActivated: true });
  } catch (error) {
    console.error('FedaPay webhook error:', error);
    return sendJson(res, 500, { error: 'Webhook processing failed.' });
  }
}
