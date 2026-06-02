import crypto from 'node:crypto';
import { createSupabaseAdmin } from '../_utils/supabaseAdmin.js';
import { requireAdmin, findUserByEmail, writeAdminAudit } from '../_utils/adminAuth.js';
import { readJsonBody, sendJson } from '../_utils/http.js';
import { getPlusPlan } from '../_utils/plusPlan.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return sendJson(res, 405, { error: 'Methode non autorisee.' });
  }

  try {
    const supabase = createSupabaseAdmin();
    const plan = await getPlusPlan(supabase);
    const { user: adminUser, isAdmin } = await requireAdmin(req, res, supabase);
    if (!isAdmin) return;

    const { body } = await readJsonBody(req);
    const targetUser = await findUserByEmail(supabase, body.email);
    if (!targetUser) return sendJson(res, 404, { error: 'Utilisateur introuvable.' });

    const transactionId = `admin-${targetUser.id}-${plan.code}`;
    const now = new Date().toISOString();
    const payload = {
      user_id: targetUser.id,
      provider: 'admin',
      provider_transaction_id: transactionId,
      provider_reference: `manual:${targetUser.email}`,
      amount: plan.amount,
      currency: plan.currency,
      status: 'approved',
      plan_code: plan.code,
      approved_at: now,
      updated_at: now,
      raw_event: {
        action: 'grant',
        source: 'admin',
        admin_email: adminUser.email,
        target_email: targetUser.email,
        audit_id: crypto.randomUUID(),
      },
    };

    const { error: purchaseError } = await supabase
      .from('premium_purchases')
      .upsert(payload, { onConflict: 'provider_transaction_id' });
    if (purchaseError) throw purchaseError;

    const nextMetadata = {
      ...(targetUser.user_metadata || {}),
      is_premium: true,
    };
    const { error: metadataError } = await supabase.auth.admin.updateUserById(targetUser.id, {
      user_metadata: nextMetadata,
    });
    if (metadataError) throw metadataError;

    await writeAdminAudit(supabase, adminUser, 'grant_plus', targetUser.id, {
      email: targetUser.email,
      providerTransactionId: transactionId,
    });

    return sendJson(res, 200, {
      ok: true,
      userId: targetUser.id,
      providerTransactionId: transactionId,
    });
  } catch (error) {
    return sendJson(res, 500, { error: error.message || 'Erreur activation Plus.' });
  }
}
