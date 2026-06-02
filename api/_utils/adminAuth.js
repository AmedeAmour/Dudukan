import { sendJson } from './http.js';
import { getUserFromRequest } from './supabaseAdmin.js';

const DEFAULT_ADMIN_EMAILS = ['growpeak.agence@gmail.com'];

const getAdminEmails = () => {
  const configured = (process.env.ADMIN_EMAILS || '')
    .split(',')
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);

  return new Set([...DEFAULT_ADMIN_EMAILS, ...configured]);
};

export const requireAdmin = async (req, res, supabase) => {
  const { user, error } = await getUserFromRequest(req, supabase);
  if (error || !user) {
    sendJson(res, 401, { error: 'Session admin requise.' });
    return { user: null, isAdmin: false };
  }

  const email = (user.email || '').toLowerCase();
  const metadata = user.user_metadata || {};
  const appMetadata = user.app_metadata || {};
  const isAdmin =
    getAdminEmails().has(email)
    || metadata.is_admin === true
    || metadata.role === 'admin'
    || appMetadata.role === 'admin';

  if (!isAdmin) {
    sendJson(res, 403, { error: 'Acces admin refuse.' });
    return { user, isAdmin: false };
  }

  return { user, isAdmin: true };
};

export const findUserByEmail = async (supabase, email) => {
  const targetEmail = String(email || '').trim().toLowerCase();
  if (!targetEmail) return null;

  for (let page = 1; page <= 20; page += 1) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: 1000 });
    if (error) throw error;

    const found = (data?.users || []).find((user) => (user.email || '').toLowerCase() === targetEmail);
    if (found) return found;
    if (!data?.users || data.users.length < 1000) break;
  }

  return null;
};

export const writeAdminAudit = async (supabase, adminUser, action, targetUserId, details = {}) => {
  try {
    await supabase.from('admin_audit_logs').insert({
      admin_user_id: adminUser?.id || null,
      admin_email: adminUser?.email || null,
      target_user_id: targetUserId || null,
      action,
      details,
    });
  } catch (error) {
    // The admin area still works if the optional audit table has not been created yet.
  }
};
