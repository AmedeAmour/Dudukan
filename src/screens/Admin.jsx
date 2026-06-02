import { useEffect, useState } from 'react';
import {
  AlertCircle,
  CheckCircle,
  Database,
  KeyRound,
  RefreshCw,
  Save,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  UserCog,
  Wallet,
  Wrench
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { DEFAULT_PLUS_PLAN, normalizePlusPlan } from '../config/plusPlan';

const formatNumber = (value) => {
  const parsed = Number(value || 0);
  return new Intl.NumberFormat('fr-FR', {
    maximumFractionDigits: 0,
  }).format(Number.isFinite(parsed) ? parsed : 0);
};

const StatCard = ({ label, value, color = 'var(--navy)' }) => (
  <div className="card" style={{ margin: 0, padding: '14px', borderRadius: 'var(--radius-md)' }}>
    <span style={{ display: 'block', color: 'var(--text-light)', fontSize: '11px', fontWeight: 800, marginBottom: '5px' }}>
      {label}
    </span>
    <strong className="font-outfit" style={{ display: 'block', color, fontSize: '20px', lineHeight: 1.1 }}>
      {value}
    </strong>
  </div>
);

const SectionTitle = ({ icon: Icon, title, subtitle }) => (
  <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start', marginBottom: '14px' }}>
    <div style={{
      width: '38px',
      height: '38px',
      borderRadius: '50%',
      background: 'var(--accent-blue-light)',
      color: 'var(--accent-blue)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0
    }}>
      <Icon size={18} />
    </div>
    <div>
      <h2 className="font-outfit" style={{ fontSize: '18px', fontWeight: 900, color: 'var(--navy)', marginBottom: '2px' }}>
        {title}
      </h2>
      {subtitle && <p style={{ color: 'var(--text-light)', fontSize: '12px', lineHeight: 1.45 }}>{subtitle}</p>}
    </div>
  </div>
);

const Admin = () => {
  const { session, signOut } = useAuth();
  const [email, setEmail] = useState('growpeak.agence@gmail.com');
  const [diagnostic, setDiagnostic] = useState(null);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState('');
  const [settingsLoading, setSettingsLoading] = useState(false);
  const [settingsSaving, setSettingsSaving] = useState(false);
  const [plusPlan, setPlusPlan] = useState(DEFAULT_PLUS_PLAN);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const authHeaders = {
    Authorization: `Bearer ${session?.access_token}`,
    'Content-Type': 'application/json',
  };

  useEffect(() => {
    const loadSettings = async () => {
      setSettingsLoading(true);
      try {
        const response = await fetch('/api/admin/app-settings', {
          headers: { Authorization: `Bearer ${session?.access_token}` },
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data?.error || 'Parametres introuvables.');
        setPlusPlan(normalizePlusPlan(data.plusPlan || {}));
      } catch (err) {
        setError(err.message || 'Parametres introuvables.');
      } finally {
        setSettingsLoading(false);
      }
    };

    if (session?.access_token) loadSettings();
  }, [session]);

  const runDiagnostic = async (event) => {
    if (event) event.preventDefault();
    setLoading(true);
    setError('');
    setNotice('');
    try {
      const response = await fetch(`/api/admin/diagnose?email=${encodeURIComponent(email.trim())}`, {
        headers: { Authorization: `Bearer ${session?.access_token}` },
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data?.error || 'Diagnostic impossible.');
      setDiagnostic(data);
    } catch (err) {
      setDiagnostic(null);
      setError(err.message || 'Diagnostic impossible.');
    } finally {
      setLoading(false);
    }
  };

  const runAction = async (action, label, body = {}) => {
    const confirmed = window.confirm(`${label} pour ${email} ?`);
    if (!confirmed) return;

    setActionLoading(action);
    setError('');
    setNotice('');
    try {
      const response = await fetch(`/api/admin/${action}`, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({ email: email.trim(), ...body }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data?.error || 'Action impossible.');
      setNotice(label + ' effectue.');
      await runDiagnostic();
    } catch (err) {
      setError(err.message || 'Action impossible.');
    } finally {
      setActionLoading('');
    }
  };

  const updatePlusPlanField = (field, value) => {
    setPlusPlan((current) => ({
      ...current,
      [field]: field === 'amount' || field === 'originalAmount' ? Number(value) : value,
    }));
  };

  const saveSettings = async (event) => {
    event.preventDefault();
    setSettingsSaving(true);
    setError('');
    setNotice('');
    try {
      const response = await fetch('/api/admin/app-settings', {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({ plusPlan }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data?.error || 'Enregistrement impossible.');
      setPlusPlan(normalizePlusPlan(data.plusPlan || plusPlan));
      setNotice('Parametres Dudukan Plus enregistres.');
    } catch (err) {
      setError(err.message || 'Enregistrement impossible.');
    } finally {
      setSettingsSaving(false);
    }
  };

  const free = diagnostic?.freeData;
  const premium = diagnostic?.premium;
  const profile = diagnostic?.profile;
  const user = diagnostic?.user;

  return (
    <div className="app-container" style={{ padding: '22px 18px 44px', background: 'var(--bg-main)' }}>
      <header style={{ marginBottom: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', alignItems: 'center' }}>
          <div>
            <span className="badge badge-blue" style={{ fontWeight: 800 }}>ADMIN</span>
            <h1 className="font-outfit" style={{ fontSize: '28px', fontWeight: 900, marginTop: '10px' }}>
              Espace Admin
            </h1>
            <p style={{ color: 'var(--text-light)', fontSize: '13px', lineHeight: 1.5 }}>
              Diagnostic et corrections ciblées sans toucher aux comptes sains.
            </p>
          </div>
          <button
            type="button"
            onClick={signOut}
            style={{
              border: 'none',
              background: 'var(--white)',
              color: 'var(--text-light)',
              borderRadius: '50%',
              width: '42px',
              height: '42px',
              boxShadow: 'var(--shadow-soft)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer'
            }}
            title="Se déconnecter"
          >
            <KeyRound size={18} />
          </button>
        </div>
      </header>

      <section className="card" style={{ borderRadius: 'var(--radius-md)' }}>
        <SectionTitle icon={Search} title="Rechercher un compte" subtitle="Entrez un e-mail utilisateur pour ouvrir le diagnostic complet." />
        <form onSubmit={runDiagnostic}>
          <label className="label">E-mail du compte</label>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 52px', gap: '10px' }}>
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="client@email.com"
              required
            />
            <button
              type="submit"
              disabled={loading}
              style={{
                border: 'none',
                borderRadius: 'var(--radius-sm)',
                background: 'var(--navy)',
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: loading ? 'wait' : 'pointer'
              }}
              title="Lancer le diagnostic"
            >
              {loading ? <RefreshCw size={19} className="spin" /> : <Search size={19} />}
            </button>
          </div>
        </form>
      </section>

      {error && (
        <div className="card" style={{ borderRadius: 'var(--radius-md)', background: 'var(--accent-red-light)', color: 'var(--accent-red)' }}>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center', fontWeight: 800, fontSize: '13px' }}>
            <AlertCircle size={18} /> {error}
          </div>
        </div>
      )}

      {notice && (
        <div className="card" style={{ borderRadius: 'var(--radius-md)', background: 'var(--emerald-light)', color: 'var(--emerald)' }}>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center', fontWeight: 800, fontSize: '13px' }}>
            <CheckCircle size={18} /> {notice}
          </div>
        </div>
      )}

      <section className="card" style={{ borderRadius: 'var(--radius-md)' }}>
        <SectionTitle
          icon={SlidersHorizontal}
          title="Parametres de l'application"
          subtitle="Modifier l'offre Dudukan Plus sans toucher aux comptes utilisateurs."
        />
        <form onSubmit={saveSettings}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '12px' }}>
            <div>
              <label className="label">Prix a payer</label>
              <input
                type="number"
                min="1"
                value={plusPlan.amount}
                onChange={(event) => updatePlusPlanField('amount', event.target.value)}
              />
            </div>
            <div>
              <label className="label">Prix normal</label>
              <input
                type="number"
                min="1"
                value={plusPlan.originalAmount}
                onChange={(event) => updatePlusPlanField('originalAmount', event.target.value)}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '12px' }}>
            <div>
              <label className="label">Devise</label>
              <input
                value={plusPlan.currency}
                onChange={(event) => updatePlusPlanField('currency', event.target.value)}
              />
            </div>
            <div>
              <label className="label">Code de l'offre</label>
              <input
                value={plusPlan.code}
                onChange={(event) => updatePlusPlanField('code', event.target.value)}
              />
            </div>
          </div>

          <label className="label">Titre de la carte Plus</label>
          <input
            value={plusPlan.headline}
            onChange={(event) => updatePlusPlanField('headline', event.target.value)}
            style={{ marginBottom: '12px' }}
          />

          <label className="label">Texte sous le titre</label>
          <textarea
            value={plusPlan.subtitle}
            onChange={(event) => updatePlusPlanField('subtitle', event.target.value)}
            rows={3}
            style={{
              width: '100%',
              border: '1.5px solid rgba(26,43,72,0.12)',
              borderRadius: 'var(--radius-sm)',
              padding: '12px 14px',
              fontFamily: 'inherit',
              marginBottom: '12px',
              resize: 'vertical'
            }}
          />

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '14px' }}>
            <div>
              <label className="label">Libelle offre</label>
              <input
                value={plusPlan.offerLabel}
                onChange={(event) => updatePlusPlanField('offerLabel', event.target.value)}
              />
            </div>
            <div>
              <label className="label">Note paiement</label>
              <input
                value={plusPlan.paymentNote}
                onChange={(event) => updatePlusPlanField('paymentNote', event.target.value)}
              />
            </div>
          </div>

          <button type="submit" className="btn-primary" disabled={settingsLoading || settingsSaving}>
            {settingsSaving ? <RefreshCw size={18} className="spin" /> : <Save size={18} />}
            Enregistrer les parametres Plus
          </button>
        </form>
      </section>

      {diagnostic && (
        <>
          <section className="card" style={{ borderRadius: 'var(--radius-md)' }}>
            <SectionTitle icon={UserCog} title="Identité" subtitle={user?.email} />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '10px' }}>
              <StatCard label="User ID" value={user?.id || '-'} />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <StatCard label="Premium metadata" value={user?.userMetadata?.is_premium ? 'Oui' : 'Non'} color={user?.userMetadata?.is_premium ? 'var(--emerald)' : 'var(--text-light)'} />
                <StatCard label="Achats approuvés" value={premium?.approvedPurchaseCount || 0} color="var(--accent-blue)" />
              </div>
            </div>
          </section>

          {diagnostic.warnings?.length > 0 && (
            <section className="card" style={{ borderRadius: 'var(--radius-md)', border: '1px solid rgba(245,158,11,0.24)' }}>
              <SectionTitle icon={AlertCircle} title="Alertes" subtitle="Points à vérifier avant modification." />
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {diagnostic.warnings.map((warning) => (
                  <div key={warning} style={{ color: 'var(--accent-orange)', fontSize: '13px', fontWeight: 700, lineHeight: 1.45 }}>
                    {warning}
                  </div>
                ))}
              </div>
            </section>
          )}

          <section style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '16px' }}>
            <StatCard label="Salaire" value={`${formatNumber(free?.salary)} XOF`} />
            <StatCard label="Épargne gratuite" value={`${formatNumber(free?.savings)} XOF`} color="var(--emerald)" />
            <StatCard label="Épargne profil Plus" value={`${formatNumber(profile?.savings)} XOF`} color="var(--accent-blue)" />
            <StatCard label="Épargne libre" value={`${formatNumber(premium?.unallocatedSavings)} XOF`} color="var(--accent-orange)" />
          </section>

          <section className="card" style={{ borderRadius: 'var(--radius-md)' }}>
            <SectionTitle icon={Database} title="Données gratuites" subtitle="Catégories, revenus, dépenses et épargne." />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '14px' }}>
              <StatCard label="Dépenses" value={free?.expensesCount || 0} />
              <StatCard label="Revenus" value={free?.incomeCount || 0} />
              <StatCard label="Dépôts épargne" value={free?.savingsExpensesCount || 0} color="var(--emerald)" />
              <StatCard label="Ancien epargne" value={free?.oldEpargneExpensesCount || 0} color={free?.oldEpargneExpensesCount ? 'var(--accent-red)' : 'var(--emerald)'} />
            </div>
            <p style={{ color: 'var(--text-light)', fontSize: '12px', lineHeight: 1.5 }}>
              Catégories utilisées : {(free?.usedCategoryIds || []).join(', ') || '-'}
            </p>
          </section>

          <section className="card" style={{ borderRadius: 'var(--radius-md)' }}>
            <SectionTitle icon={Sparkles} title="Dudukan Plus" subtitle="Projets, allocations, paiements et accès." />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '14px' }}>
              <StatCard label="Projets" value={premium?.projects?.length || 0} />
              <StatCard label="Objectifs" value={`${formatNumber(premium?.totalTarget)} XOF`} />
              <StatCard label="Alloué" value={`${formatNumber(premium?.totalAllocated)} XOF`} color="var(--emerald)" />
              <StatCard label="Grant admin" value={premium?.adminGrantCount || 0} color="var(--accent-blue)" />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {(premium?.projects || []).map((project) => (
                <div key={project.id} style={{ padding: '12px', background: 'rgba(26,43,72,0.04)', borderRadius: 'var(--radius-sm)' }}>
                  <strong style={{ color: 'var(--navy)', fontSize: '13px' }}>{project.name}</strong>
                  <p style={{ color: 'var(--text-light)', fontSize: '12px', marginTop: '4px' }}>
                    {formatNumber(project.current_amount)} / {formatNumber(project.target_amount)} XOF
                  </p>
                </div>
              ))}
            </div>
          </section>

          <section className="card" style={{ borderRadius: 'var(--radius-md)' }}>
            <SectionTitle icon={Wrench} title="Actions ciblées" subtitle="Chaque action demande confirmation et ne touche que ce compte." />
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <button
                type="button"
                className="btn-secondary"
                disabled={!!actionLoading}
                onClick={() => runAction('repair-savings-category', 'Réparation catégorie Épargne')}
              >
                <Wrench size={18} /> Réparer catégorie Épargne
              </button>
              <button
                type="button"
                className="btn-secondary"
                disabled={!!actionLoading}
                onClick={() => runAction('sync-savings', 'Synchronisation épargne depuis gratuit', { source: 'free' })}
              >
                <Wallet size={18} /> Aligner Plus sur épargne gratuite
              </button>
              <button
                type="button"
                className="btn-secondary"
                disabled={!!actionLoading}
                onClick={() => runAction('grant-plus', 'Activation Dudukan Plus')}
              >
                <ShieldCheck size={18} /> Activer Dudukan Plus
              </button>
            </div>
            {actionLoading && (
              <p style={{ marginTop: '12px', color: 'var(--text-light)', fontSize: '12px', fontWeight: 700 }}>
                Action en cours...
              </p>
            )}
          </section>
        </>
      )}
    </div>
  );
};

export default Admin;
