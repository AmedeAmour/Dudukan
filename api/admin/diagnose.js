import { createSupabaseAdmin } from '../_utils/supabaseAdmin.js';
import { requireAdmin, findUserByEmail } from '../_utils/adminAuth.js';
import { sendJson } from '../_utils/http.js';

const toNumber = (value) => {
  const parsed = Number(value || 0);
  return Number.isFinite(parsed) ? parsed : 0;
};

const summarizeFreeData = (row) => {
  const data = row?.data || {};
  const expenses = Array.isArray(data.expenses) ? data.expenses : [];
  const income = Array.isArray(data.extraIncome) ? data.extraIncome : [];
  const categories = Array.isArray(data.categories) ? data.categories : [];
  const savingsExpenses = expenses.filter((expense) => expense?.categoryId === 'savings');
  const oldSavingsExpenses = expenses.filter((expense) => expense?.categoryId === 'epargne');
  const withdrawals = income.filter((item) => String(item?.note || '').toLowerCase().includes('retrait'));
  const savingsDepositSum = savingsExpenses.reduce((sum, expense) => sum + toNumber(expense.amount), 0);
  const savingsWithdrawalSum = withdrawals.reduce((sum, item) => sum + toNumber(item.amount), 0);

  return {
    updatedAt: row?.updated_at || null,
    salary: toNumber(data.salary),
    savings: toNumber(data.savings),
    nextMonthSalary: toNumber(data.nextMonthSalary),
    periodStart: data.periodStart || null,
    lastActivity: data.lastActivity || null,
    expensesCount: expenses.length,
    incomeCount: income.length,
    categories,
    usedCategoryIds: [...new Set(expenses.map((expense) => expense?.categoryId).filter(Boolean))],
    savingsExpensesCount: savingsExpenses.length,
    oldEpargneExpensesCount: oldSavingsExpenses.length,
    savingsDepositSum,
    savingsWithdrawalSum,
    computedSavingsFromHistory: savingsDepositSum - savingsWithdrawalSum,
    recentSavingsExpenses: savingsExpenses.slice(-10),
    suspiciousSavingsExpenses: oldSavingsExpenses.slice(-20),
  };
};

const buildWarnings = ({ freeData, profile, projects, milestones, premiumTransactions, purchases }) => {
  const totalAllocated = projects.reduce((sum, project) => sum + toNumber(project.current_amount), 0);
  const totalTarget = projects.reduce((sum, project) => sum + toNumber(project.target_amount), 0);
  const milestoneTarget = milestones.reduce((sum, milestone) => sum + toNumber(milestone.target_amount), 0);
  const allocationTotal = premiumTransactions
    .filter((tx) => tx.transaction_type === 'allocation')
    .reduce((sum, tx) => sum + toNumber(tx.amount), 0);
  const orphanTransactions = premiumTransactions.filter((tx) => tx.project_id && !projects.some((project) => project.id === tx.project_id));
  const warnings = [];

  if (freeData?.oldEpargneExpensesCount > 0) {
    warnings.push(`Anciennes transactions epargne restantes: ${freeData.oldEpargneExpensesCount}.`);
  }
  if (profile && freeData && toNumber(profile.savings) !== toNumber(freeData.savings)) {
    warnings.push(`Epargne gratuite (${freeData.savings}) differente du profil Plus (${profile.savings}).`);
  }
  if (freeData && totalAllocated > toNumber(freeData.savings)) {
    warnings.push(`Allocations projets (${totalAllocated}) superieures a l'epargne (${freeData.savings}).`);
  }
  if (milestones.length > 0 && milestoneTarget !== totalTarget) {
    warnings.push(`Total des jalons (${milestoneTarget}) different du total des projets (${totalTarget}).`);
  }
  if (orphanTransactions.length > 0) {
    warnings.push(`Transactions premium liees a des projets absents: ${orphanTransactions.length}.`);
  }
  if (!purchases.some((purchase) => purchase.status === 'approved')) {
    warnings.push('Aucun achat Plus approuve trouve.');
  }
  if (allocationTotal > totalAllocated && totalAllocated > 0) {
    warnings.push(`Historique allocations (${allocationTotal}) superieur au montant projet actuel (${totalAllocated}).`);
  }

  return warnings;
};

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return sendJson(res, 405, { error: 'Methode non autorisee.' });
  }

  try {
    const supabase = createSupabaseAdmin();
    const { isAdmin } = await requireAdmin(req, res, supabase);
    if (!isAdmin) return;

    const email = req.query?.email || new URL(req.url, 'http://localhost').searchParams.get('email');
    const targetUser = await findUserByEmail(supabase, email);
    if (!targetUser) {
      return sendJson(res, 404, { error: 'Utilisateur introuvable.' });
    }

    const userId = targetUser.id;
    const [
      userDataResult,
      profilesResult,
      projectsResult,
      milestonesResult,
      transactionsResult,
      purchasesResult,
    ] = await Promise.all([
      supabase.from('user_data').select('*').eq('id', userId).maybeSingle(),
      supabase.from('profiles').select('*').eq('id', userId).maybeSingle(),
      supabase.from('projects').select('*, milestones(*)').eq('user_id', userId).order('created_at', { ascending: false }),
      supabase.from('milestones').select('*').eq('user_id', userId).order('created_at', { ascending: false }),
      supabase.from('premium_transactions').select('*').eq('user_id', userId).order('created_at', { ascending: false }),
      supabase.from('premium_purchases').select('*').eq('user_id', userId).order('created_at', { ascending: false }),
    ]);

    const errors = [
      userDataResult.error,
      profilesResult.error,
      projectsResult.error,
      milestonesResult.error,
      transactionsResult.error,
      purchasesResult.error,
    ].filter(Boolean);
    if (errors.length > 0) throw errors[0];

    const projects = projectsResult.data || [];
    const milestonesFromProjects = projects.flatMap((project) => project.milestones || []);
    const milestones = milestonesFromProjects.length > 0 ? milestonesFromProjects : (milestonesResult.data || []);
    const freeData = summarizeFreeData(userDataResult.data);
    const profile = profilesResult.data || null;
    const premiumTransactions = transactionsResult.data || [];
    const purchases = purchasesResult.data || [];
    const totalAllocated = projects.reduce((sum, project) => sum + toNumber(project.current_amount), 0);
    const totalTarget = projects.reduce((sum, project) => sum + toNumber(project.target_amount), 0);

    return sendJson(res, 200, {
      user: {
        id: targetUser.id,
        email: targetUser.email,
        createdAt: targetUser.created_at,
        lastSignInAt: targetUser.last_sign_in_at,
        userMetadata: targetUser.user_metadata,
        appMetadata: targetUser.app_metadata,
      },
      freeData,
      profile,
      premium: {
        projects,
        milestones,
        premiumTransactions,
        purchases,
        totalAllocated,
        totalTarget,
        unallocatedSavings: Math.max(0, toNumber(freeData.savings) - totalAllocated),
        approvedPurchaseCount: purchases.filter((purchase) => purchase.status === 'approved').length,
        adminGrantCount: purchases.filter((purchase) => purchase.provider === 'admin').length,
      },
      warnings: buildWarnings({ freeData, profile, projects, milestones, premiumTransactions, purchases }),
    });
  } catch (error) {
    return sendJson(res, 500, { error: error.message || 'Erreur diagnostic admin.' });
  }
}
