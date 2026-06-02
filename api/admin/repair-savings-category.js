import { createSupabaseAdmin } from '../_utils/supabaseAdmin.js';
import { requireAdmin, findUserByEmail, writeAdminAudit } from '../_utils/adminAuth.js';
import { readJsonBody, sendJson } from '../_utils/http.js';

const normalizeFreeData = (data = {}) => ({
  ...data,
  categories: Array.isArray(data.categories)
    ? data.categories.map((category) => (
      category?.id === 'epargne'
        ? { ...category, id: 'savings', name: 'Épargne' }
        : category
    ))
    : data.categories,
  expenses: Array.isArray(data.expenses)
    ? data.expenses.map((expense) => (
      expense?.categoryId === 'epargne'
        ? { ...expense, categoryId: 'savings' }
        : expense
    ))
    : data.expenses,
});

const normalizeProfileCategories = (categories) => (
  Array.isArray(categories)
    ? categories.map((category) => (
      category?.id === 'epargne'
        ? { ...category, id: 'savings', name: 'Épargne' }
        : category
    ))
    : categories
);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return sendJson(res, 405, { error: 'Methode non autorisee.' });
  }

  try {
    const supabase = createSupabaseAdmin();
    const { user: adminUser, isAdmin } = await requireAdmin(req, res, supabase);
    if (!isAdmin) return;

    const { body } = await readJsonBody(req);
    const targetUser = await findUserByEmail(supabase, body.email);
    if (!targetUser) return sendJson(res, 404, { error: 'Utilisateur introuvable.' });

    const { data: userDataRow, error: userDataError } = await supabase
      .from('user_data')
      .select('*')
      .eq('id', targetUser.id)
      .maybeSingle();
    if (userDataError) throw userDataError;

    const { data: profileRow, error: profileError } = await supabase
      .from('profiles')
      .select('id, categories')
      .eq('id', targetUser.id)
      .maybeSingle();
    if (profileError) throw profileError;

    const beforeExpenses = Array.isArray(userDataRow?.data?.expenses)
      ? userDataRow.data.expenses.filter((expense) => expense?.categoryId === 'epargne').length
      : 0;
    const beforeCategories = Array.isArray(userDataRow?.data?.categories)
      ? userDataRow.data.categories.filter((category) => category?.id === 'epargne').length
      : 0;

    if (userDataRow) {
      const nextData = normalizeFreeData(userDataRow.data);
      const { error: updateUserDataError } = await supabase
        .from('user_data')
        .update({ data: nextData, updated_at: new Date().toISOString() })
        .eq('id', targetUser.id);
      if (updateUserDataError) throw updateUserDataError;
    }

    if (profileRow) {
      const { error: updateProfileError } = await supabase
        .from('profiles')
        .update({ categories: normalizeProfileCategories(profileRow.categories), updated_at: new Date().toISOString() })
        .eq('id', targetUser.id);
      if (updateProfileError) throw updateProfileError;
    }

    await writeAdminAudit(supabase, adminUser, 'repair_savings_category', targetUser.id, {
      email: targetUser.email,
      beforeExpenses,
      beforeCategories,
    });

    return sendJson(res, 200, {
      ok: true,
      userId: targetUser.id,
      fixedOldCategoryExpenses: beforeExpenses,
      fixedOldCategories: beforeCategories,
    });
  } catch (error) {
    return sendJson(res, 500, { error: error.message || 'Erreur reparation epargne.' });
  }
}
