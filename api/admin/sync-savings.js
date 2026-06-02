import { createSupabaseAdmin } from '../_utils/supabaseAdmin.js';
import { requireAdmin, findUserByEmail, writeAdminAudit } from '../_utils/adminAuth.js';
import { readJsonBody, sendJson } from '../_utils/http.js';

const toNumber = (value) => {
  const parsed = Number(value || 0);
  return Number.isFinite(parsed) ? parsed : 0;
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return sendJson(res, 405, { error: 'Methode non autorisee.' });
  }

  try {
    const supabase = createSupabaseAdmin();
    const { user: adminUser, isAdmin } = await requireAdmin(req, res, supabase);
    if (!isAdmin) return;

    const { body } = await readJsonBody(req);
    const source = body.source === 'profile' ? 'profile' : 'free';
    const targetUser = await findUserByEmail(supabase, body.email);
    if (!targetUser) return sendJson(res, 404, { error: 'Utilisateur introuvable.' });

    const [{ data: userDataRow, error: userDataError }, { data: profileRow, error: profileError }] = await Promise.all([
      supabase.from('user_data').select('*').eq('id', targetUser.id).maybeSingle(),
      supabase.from('profiles').select('*').eq('id', targetUser.id).maybeSingle(),
    ]);
    if (userDataError) throw userDataError;
    if (profileError) throw profileError;

    const freeSavings = toNumber(userDataRow?.data?.savings);
    const profileSavings = toNumber(profileRow?.savings);
    const nextSavings = source === 'profile' ? profileSavings : freeSavings;

    if (userDataRow) {
      const nextData = { ...(userDataRow.data || {}), savings: nextSavings };
      const { error } = await supabase
        .from('user_data')
        .update({ data: nextData, updated_at: new Date().toISOString() })
        .eq('id', targetUser.id);
      if (error) throw error;
    }

    if (profileRow) {
      const { error } = await supabase
        .from('profiles')
        .update({ savings: nextSavings, updated_at: new Date().toISOString() })
        .eq('id', targetUser.id);
      if (error) throw error;
    }

    await writeAdminAudit(supabase, adminUser, 'sync_savings', targetUser.id, {
      email: targetUser.email,
      source,
      before: { freeSavings, profileSavings },
      after: nextSavings,
    });

    return sendJson(res, 200, {
      ok: true,
      userId: targetUser.id,
      source,
      savings: nextSavings,
    });
  } catch (error) {
    return sendJson(res, 500, { error: error.message || 'Erreur synchronisation epargne.' });
  }
}
