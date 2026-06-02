import { createSupabaseAdmin } from '../_utils/supabaseAdmin.js';
import { requireAdmin, writeAdminAudit } from '../_utils/adminAuth.js';
import { readJsonBody, sendJson } from '../_utils/http.js';
import { normalizePlusPlan } from '../_utils/plusPlan.js';

export default async function handler(req, res) {
  try {
    const supabase = createSupabaseAdmin();
    const { user: adminUser, isAdmin } = await requireAdmin(req, res, supabase);
    if (!isAdmin) return;

    if (req.method === 'GET') {
      const { data, error } = await supabase
        .from('app_settings')
        .select('key,value,updated_at')
        .eq('key', 'plus_plan')
        .maybeSingle();

      if (error) throw error;
      return sendJson(res, 200, {
        plusPlan: normalizePlusPlan(data?.value || {}),
        updatedAt: data?.updated_at || null,
      });
    }

    if (req.method === 'POST') {
      const { body } = await readJsonBody(req);
      const plusPlan = normalizePlusPlan(body.plusPlan || body);

      const { error } = await supabase
        .from('app_settings')
        .upsert({
          key: 'plus_plan',
          value: plusPlan,
          description: 'Configuration publique de l’offre Dudukan Plus.',
          updated_by: adminUser.id,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'key',
        });

      if (error) throw error;

      await writeAdminAudit(supabase, adminUser, 'update_app_settings', null, {
        key: 'plus_plan',
        plusPlan,
      });

      return sendJson(res, 200, { ok: true, plusPlan });
    }

    return sendJson(res, 405, { error: 'Methode non autorisee.' });
  } catch (error) {
    return sendJson(res, 500, { error: error.message || 'Erreur parametres admin.' });
  }
}
