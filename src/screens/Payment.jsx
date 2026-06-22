import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../supabaseClient';
import { DEFAULT_PLUS_PLAN, normalizePlusPlan } from '../config/plusPlan';
import {
  ArrowLeft,
  BarChart3,
  Layers,
  Lock,
  PiggyBank,
  ShieldCheck,
  Sparkles,
  Zap
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const FEDAPAY_METHODS = [
  { id: 'wave', label: 'Wave' },
  { id: 'orange', label: 'Orange Money' },
  { id: 'mtn', label: 'MTN' },
  { id: 'moov', label: 'Moov Money' },
  { id: 'card', label: 'Carte bancaire' },
];

const PAYMENT_ACCESS_POLL_INTERVAL_MS = 2000;
const PAYMENT_ACCESS_POLL_ATTEMPTS = 15;

const Payment = ({
  onBack,
  onUnlock,
  onRefreshAccess,
  canPreviewPlus = false,
  onPreviewPlus,
  paymentReturnInfo = null
}) => {
  const { session } = useAuth();
  const [paymentStep, setPaymentStep] = useState('selection');
  const [processingStatus, setProcessingStatus] = useState('');
  const [paymentError, setPaymentError] = useState('');
  const [plusPlan, setPlusPlan] = useState(DEFAULT_PLUS_PLAN);
  const [selectedMethod, setSelectedMethod] = useState('wave');
  const [confirmationCheckActive, setConfirmationCheckActive] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const loadPlusPlan = async () => {
      const { data, error } = await supabase
        .from('app_settings')
        .select('value')
        .eq('key', 'plus_plan')
        .maybeSingle();

      if (!cancelled && !error) {
        setPlusPlan(normalizePlusPlan(data?.value || {}));
      }
    };

    loadPlusPlan();
    return () => {
      cancelled = true;
    };
  }, []);

  const formatPlanAmount = (value) => `${new Intl.NumberFormat('fr-FR', {
    maximumFractionDigits: 0,
  }).format(Number(value || 0))} ${plusPlan.currency}`;

  const savingsAmount = useMemo(() => {
    return Math.max(0, Number(plusPlan.originalAmount || 0) - Number(plusPlan.amount || 0));
  }, [plusPlan]);

  const premiumFeatures = [
    {
      icon: ShieldCheck,
      title: 'Coach clair',
      desc: 'Un tableau de bord simple pour suivre maison, terrain, mariage, enfants, business ou dettes.',
      color: 'var(--accent-blue)'
    },
    {
      icon: Zap,
      title: 'Effort du mois',
      desc: 'Dudukan estime combien mettre de côté selon vos objectifs, vos délais et votre rythme.',
      color: 'var(--emerald)'
    },
    {
      icon: Layers,
      title: 'Répartition guidée',
      desc: 'Votre épargne va vers les projets les plus urgents ou les plus importants.',
      color: 'var(--accent-pink)'
    },
    {
      icon: BarChart3,
      title: 'Score du plan',
      desc: "Un repère facile à lire pour savoir si ça avance bien ou s'il faut ajuster doucement.",
      color: 'var(--accent-orange)'
    }
  ];

  const returnStatus = paymentReturnInfo?.status;
  const returnNotice = returnStatus
    ? returnStatus === 'approved'
      ? 'Paiement reçu. Activation de Dudukan Plus en cours, ça peut prendre quelques secondes.'
      : returnStatus === 'canceled' || returnStatus === 'declined'
        ? "Le paiement n'a pas été terminé. Vous pouvez réessayer tranquillement."
        : 'Paiement lancé. Nous attendons la confirmation sécurisée.'
    : '';

  useEffect(() => {
    if (!returnStatus || !onRefreshAccess) return undefined;
    if (returnStatus === 'canceled' || returnStatus === 'declined') return undefined;

    let cancelled = false;
    let attempts = 0;
    let timeoutId;

    const confirmPaymentReturn = async () => {
      if (!session?.access_token) return false;

      const params = new URLSearchParams();
      if (paymentReturnInfo?.transactionId) {
        params.set('transaction_id', paymentReturnInfo.transactionId);
      }

      const response = await fetch(`/api/fedapay/confirm-return?${params.toString()}`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data?.error || 'Confirmation du paiement indisponible.');
      }

      return data?.premiumActivated === true || data?.confirmed === true;
    };

    const pollPremiumAccess = async () => {
      if (cancelled) return;
      attempts += 1;
      setConfirmationCheckActive(true);

      if (attempts === 1) {
        try {
          const confirmed = await confirmPaymentReturn();
          if (cancelled) return;
          if (confirmed) {
            setPaymentError('');
            setConfirmationCheckActive(false);
            setPaymentStep('success');
            return;
          }
        } catch (error) {
          if (cancelled) return;
          setPaymentError(error.message || 'Confirmation du paiement indisponible.');
        }
      }

      const hasAccess = await onRefreshAccess();
      if (cancelled) return;

      if (hasAccess) {
        setPaymentError('');
        setConfirmationCheckActive(false);
        setPaymentStep('success');
        return;
      }

      if (attempts >= PAYMENT_ACCESS_POLL_ATTEMPTS) {
        setConfirmationCheckActive(false);
        return;
      }

      timeoutId = window.setTimeout(pollPremiumAccess, PAYMENT_ACCESS_POLL_INTERVAL_MS);
    };

    pollPremiumAccess();

    return () => {
      cancelled = true;
      window.clearTimeout(timeoutId);
    };
  }, [onRefreshAccess, returnStatus, paymentReturnInfo?.transactionId, session?.access_token]);

  const getFreshAccessToken = async () => {
    const { data: sessionResult } = await supabase.auth.getSession();
    let accessToken = sessionResult?.session?.access_token || session?.access_token;

    if (!accessToken) {
      const { data: refreshResult } = await supabase.auth.refreshSession();
      accessToken = refreshResult?.session?.access_token || null;
    }

    return accessToken;
  };

  const requestCheckout = async (accessToken) => {
    const response = await fetch('/api/fedapay/create-checkout', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ selectedMethod }),
    });
    const data = await response.json();
    return { response, data };
  };

  const handlePaymentSubmit = async (e) => {
    e.preventDefault();
    const accessToken = await getFreshAccessToken();
    if (!accessToken) {
      setPaymentError('Votre session a expiré. Reconnectez-vous puis réessayez.');
      return;
    }

    setPaymentStep('processing');
    setPaymentError('');
    setProcessingStatus('Création de votre paiement sécurisé...');

    try {
      let { response, data } = await requestCheckout(accessToken);

      if (response.status === 401) {
        const { data: refreshResult } = await supabase.auth.refreshSession();
        const refreshedToken = refreshResult?.session?.access_token;
        if (refreshedToken) {
          ({ response, data } = await requestCheckout(refreshedToken));
        }
      }

      if (!response.ok) {
        throw new Error(data?.error || "Impossible d'initialiser le paiement.");
      }

      if (data.alreadyPremium) {
        setPaymentStep('success');
        return;
      }

      if (!data.checkoutUrl) {
        throw new Error('Lien de paiement introuvable.');
      }

      setProcessingStatus('Redirection vers la page de paiement sécurisée...');
      window.location.href = data.checkoutUrl;
    } catch (err) {
      setPaymentError(err.message || "Erreur lors de l'initialisation du paiement.");
      setPaymentStep('selection');
    }
  };

  const handleFinish = async () => {
    const hasAccess = onRefreshAccess ? await onRefreshAccess() : true;
    if (hasAccess && onUnlock) onUnlock();
    if (!hasAccess) {
      setPaymentError("Le paiement n'est pas encore confirmé. Réessayez dans quelques secondes.");
      setPaymentStep('selection');
    }
  };

  return (
    <div className="app-container payment-screen" style={{
      padding: '18px 18px 40px',
      background:
        'linear-gradient(180deg, rgba(59,130,246,0.08) 0%, rgba(248,249,250,0) 240px), var(--bg-main)'
    }}>
      <AnimatePresence mode="wait">
        {paymentStep === 'selection' && (
          <motion.div
            key="selection"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
          >
            <button
              onClick={onBack}
              className="payment-back-button"
              style={{
                background: 'none',
                border: 'none',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '10px',
                color: 'var(--navy)',
                marginBottom: '18px',
                cursor: 'pointer',
                fontWeight: '800',
                fontFamily: 'Outfit, sans-serif'
              }}
            >
              <span style={{
                width: '34px',
                height: '34px',
                borderRadius: '50%',
                backgroundColor: 'var(--white)',
                border: '1px solid rgba(26,43,72,0.08)',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: 'var(--shadow-soft)'
              }}>
                <ArrowLeft size={17} strokeWidth={2.5} />
              </span>
              Retour
            </button>

            <section className="card payment-hero-card" style={{
              padding: '24px',
              marginBottom: '18px',
              border: 'none',
              background: 'linear-gradient(135deg, #0B4DBA 0%, #1677E8 58%, #4DA3FF 100%)',
              boxShadow: '0 18px 34px rgba(22, 119, 232, 0.28)',
              overflow: 'hidden',
              position: 'relative',
              color: 'white'
            }}>
              <div className="payment-hero-orb" style={{
                position: 'absolute',
                top: '-28px',
                right: '-18px',
                width: '112px',
                height: '112px',
                borderRadius: '50%',
                background: 'rgba(255,255,255,0.18)'
              }} />

              <div className="payment-hero-content" style={{ position: 'relative', zIndex: 1 }}>
                <div className="payment-hero-badge" style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '7px',
                  color: '#DBEAFE',
                  fontSize: '12px',
                  fontWeight: 900,
                  marginBottom: '12px'
                }}>
                  <ShieldCheck size={15} />
                  {plusPlan.badge}
                </div>

                <h1 className="font-outfit payment-hero-title" style={{
                  color: 'white',
                  fontSize: '28px',
                  lineHeight: 1.05,
                  fontWeight: 900,
                  marginBottom: '10px'
                }}>
                  {plusPlan.headline}
                </h1>

                <p className="payment-hero-subtitle" style={{
                  color: 'rgba(255,255,255,0.86)',
                  fontSize: '14px',
                  lineHeight: 1.55,
                  margin: 0,
                  maxWidth: '360px',
                  fontWeight: 600
                }}>
                  {plusPlan.subtitle}
                </p>
              </div>
            </section>

            <section className="card payment-pricing-card" style={{
              padding: '18px',
              marginBottom: '18px',
              border: '1px solid rgba(255, 255, 255, 0.22)',
              background: 'linear-gradient(145deg, #10233F 0%, #173B66 55%, #0F2748 100%)',
              boxShadow: '0 20px 42px rgba(15, 35, 68, 0.18)',
              borderRadius: 'var(--radius-md)',
              position: 'relative',
              overflow: 'hidden'
            }}>
              <div className="payment-price-regular" style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '12px',
                marginBottom: '12px',
                padding: '11px 12px',
                borderRadius: '14px',
                background: 'rgba(255, 255, 255, 0.08)',
                border: '1px solid rgba(255, 255, 255, 0.12)'
              }}>
                <span style={{
                  color: 'rgba(232, 240, 255, 0.78)',
                  fontSize: '12px',
                  fontWeight: 900,
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em'
                }}>
                  {plusPlan.normalPriceLabel}
                </span>
                <span className="font-outfit payment-old-price" style={{
                  color: '#FFFFFF',
                  fontSize: '18px',
                  fontWeight: 900,
                  textDecoration: 'line-through',
                  textDecorationThickness: '2px',
                  textDecorationColor: 'rgba(252, 211, 77, 0.82)'
                }}>
                  {formatPlanAmount(plusPlan.originalAmount)}
                </span>
              </div>

              <div className="payment-price-panel" style={{
                background: 'linear-gradient(180deg, #FFFFFF 0%, #F7FBFF 100%)',
                border: '1px solid rgba(255, 255, 255, 0.72)',
                borderRadius: 'var(--radius-md)',
                padding: '16px',
                color: 'var(--navy)',
                boxShadow: '0 16px 28px rgba(4, 16, 35, 0.16)'
              }}>
                  <PiggyBank className="payment-offer-watermark" size={116} strokeWidth={1.8} aria-hidden="true" />
                  <div className="payment-offer-row" style={{
                    display: 'flex',
                    alignItems: 'flex-end',
                    justifyContent: 'space-between',
                    gap: '14px',
                    flexWrap: 'wrap'
                  }}>
                    <div className="payment-offer-main">
                      <span style={{
                        display: 'block',
                        color: 'var(--accent-blue)',
                        fontSize: '12px',
                        fontWeight: 900,
                        marginBottom: '4px'
                      }}>
                        {plusPlan.offerLabel}
                      </span>
                      <strong className="font-outfit payment-main-price" style={{
                        display: 'block',
                        color: 'var(--navy)',
                        fontSize: '36px',
                        lineHeight: 1,
                        letterSpacing: '0',
                        fontWeight: 900,
                        textShadow: 'none'
                      }}>
                        {formatPlanAmount(plusPlan.amount)}
                      </strong>
                    </div>

                    <div className="payment-savings-badge" style={{
                      background: 'linear-gradient(180deg, #ECFDF5 0%, #DFF8EC 100%)',
                      color: '#047857',
                      border: '1px solid rgba(16, 185, 129, 0.18)',
                      borderRadius: 'var(--radius-sm)',
                      padding: '9px 10px',
                      textAlign: 'right',
                      boxShadow: '0 8px 18px rgba(16, 185, 129, 0.12)'
                    }}>
                      <span style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: '#059669' }}>
                        {plusPlan.savingsLabel}
                      </span>
                      <strong className="font-outfit payment-savings-amount" style={{ display: 'block', fontSize: '18px', lineHeight: 1.1, color: '#064E3B' }}>
                        {formatPlanAmount(savingsAmount)}
                      </strong>
                    </div>
                  </div>

                  <p className="payment-note" style={{
                    color: 'var(--text-light)',
                    fontSize: '12px',
                    lineHeight: 1.45,
                    margin: '12px 0 0',
                    fontWeight: 700
                  }}>
                    {plusPlan.paymentNote}
                  </p>
                </div>
            </section>

            <section className="payment-feature-grid" style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '10px',
              marginBottom: '18px'
            }}>
              {premiumFeatures.map((feat) => {
                const IconComponent = feat.icon;
                return (
                  <div key={feat.title} className="card payment-feature-card" style={{
                    margin: 0,
                    padding: '14px',
                    borderRadius: 'var(--radius-md)',
                    minHeight: '138px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '10px'
                  }}>
                    <div style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '50%',
                      backgroundColor: `${feat.color}15`,
                      color: feat.color,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0
                    }}>
                      <IconComponent size={18} />
                    </div>
                    <div className="payment-feature-content">
                      <h3 className="font-outfit" style={{
                        fontSize: '14px',
                        lineHeight: 1.15,
                        fontWeight: 800,
                        color: 'var(--navy)',
                        marginBottom: '5px'
                      }}>
                        {feat.title}
                      </h3>
                      <p style={{
                        fontSize: '11px',
                        lineHeight: 1.45,
                        color: 'var(--text-light)'
                      }}>
                        {feat.desc}
                      </p>
                    </div>
                  </div>
                );
              })}
            </section>

            {canPreviewPlus && (
              <section className="card" style={{
                padding: '15px',
                marginBottom: '18px',
                border: '1.5px dashed rgba(59, 130, 246, 0.35)',
                background: 'rgba(59, 130, 246, 0.06)',
                borderRadius: 'var(--radius-md)'
              }}>
                <p style={{
                  margin: '0 0 12px',
                  color: 'var(--navy)',
                  fontSize: '13px',
                  lineHeight: 1.5,
                  fontWeight: 700
                }}>
                  Aperçu local : regardez Dudukan Plus sans paiement pendant la préparation du paiement.
                </p>
                <button
                  type="button"
                  onClick={onPreviewPlus}
                  className="btn-secondary"
                  style={{
                    width: '100%',
                    border: 'none',
                    background: 'var(--accent-blue)',
                    color: 'white',
                    justifyContent: 'center',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}
                >
                  <Sparkles size={18} /> Voir Dudukan Plus maintenant
                </button>
              </section>
            )}

            <section className="card payment-checkout-card" style={{ padding: '18px', borderRadius: 'var(--radius-md)' }}>
              <div style={{ marginBottom: '14px' }}>
                <h2 className="font-outfit" style={{
                  fontSize: '18px',
                  fontWeight: 900,
                  color: 'var(--navy)',
                  marginBottom: '4px'
                }}>
                  Paiement Dudukan Plus
                </h2>
                <p style={{ color: 'var(--text-light)', fontSize: '13px', lineHeight: 1.5 }}>
                  Choisissez votre moyen préféré. Le paiement se termine sur une page sécurisée.
                </p>
              </div>

              {paymentError && (
                <div className="payment-security-note" style={{
                  padding: '12px 14px',
                  background: 'var(--accent-red-light)',
                  color: 'var(--accent-red)',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '13px',
                  fontWeight: 700,
                  marginBottom: '14px'
                }}>
                  {paymentError}
                </div>
              )}

              {returnNotice && !paymentError && (
                <div className="payment-summary-box" style={{
                  padding: '12px 14px',
                  background: 'rgba(59, 130, 246, 0.08)',
                  color: 'var(--navy)',
                  border: '1px solid rgba(59, 130, 246, 0.16)',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '13px',
                  fontWeight: 700,
                  lineHeight: 1.45,
                  marginBottom: '14px'
                }}>
                  {confirmationCheckActive ? 'Nous verifions automatiquement la confirmation du paiement...' : returnNotice}
                </div>
              )}

              <motion.form
                onSubmit={handlePaymentSubmit}
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
              >
                <div style={{
                  border: '1.5px solid rgba(26,43,72,0.08)',
                  borderRadius: 'var(--radius-md)',
                  padding: '14px',
                  background: 'var(--white)',
                  marginBottom: '14px'
                }}>
                  <div className="payment-summary-header" style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    gap: '14px',
                    alignItems: 'center',
                    marginBottom: '12px'
                  }}>
                    <div className="payment-summary-amount">
                      <span style={{
                        display: 'block',
                        color: 'var(--text-light)',
                        fontSize: '11px',
                        fontWeight: 800,
                        marginBottom: '3px'
                      }}>
                        Montant a payer
                      </span>
                      <strong className="font-outfit" style={{
                        color: 'var(--navy)',
                        fontSize: '24px',
                        lineHeight: 1,
                        fontWeight: 900
                      }}>
                        {formatPlanAmount(plusPlan.amount)}
                      </strong>
                    </div>
                    <span className="payment-secure-pill" style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '8px 10px',
                      borderRadius: '999px',
                      background: 'rgba(16, 185, 129, 0.1)',
                      color: 'var(--emerald)',
                      fontSize: '11px',
                      fontWeight: 900,
                      whiteSpace: 'nowrap'
                    }}>
                      <Lock size={13} /> Sécurisé
                    </span>
                  </div>

                  <div className="payment-method-list" style={{ display: 'flex', flexWrap: 'wrap', gap: '7px' }}>
                    {FEDAPAY_METHODS.map((method) => {
                      const isSelected = selectedMethod === method.id;
                      return (
                      <button key={method.id} type="button" aria-pressed={isSelected} onClick={() => setSelectedMethod(method.id)} style={{
                        padding: '7px 9px',
                        borderRadius: '999px',
                        background: isSelected ? 'rgba(59, 130, 246, 0.12)' : 'rgba(26,43,72,0.04)',
                        color: isSelected ? 'var(--accent-blue)' : 'var(--text-light)',
                        fontSize: '11px',
                        fontWeight: 800,
                        border: isSelected ? '1px solid rgba(59, 130, 246, 0.25)' : '1px solid transparent',
                        cursor: 'pointer',
                        fontFamily: 'Inter, sans-serif'
                      }}>
                        {method.label}
                      </button>
                    );
                    })}
                  </div>
                </div>

                <div className="payment-privacy-note" style={{
                  padding: '13px 14px',
                  borderRadius: 'var(--radius-md)',
                  background: 'rgba(16, 185, 129, 0.08)',
                  color: 'var(--navy)',
                  fontSize: '12px',
                  lineHeight: 1.5,
                  marginBottom: '16px',
                  fontWeight: 700,
                  display: 'flex',
                  gap: '10px',
                  alignItems: 'flex-start'
                }}>
                  <Lock size={16} color="var(--emerald)" style={{ flexShrink: 0, marginTop: 1 }} />
                  <span>Dudukan ne garde jamais vos informations sensibles. Le choix du moyen de paiement et la confirmation se font sur une page de paiement sécurisée.</span>
                </div>

                <button
                  type="submit"
                  className="btn-primary"
                  style={{
                    marginTop: '2px',
                    backgroundColor: 'var(--accent-blue)'
                  }}
                >
                  <Lock size={18} />
                  <span className="payment-submit-full">Continuer le paiement - {formatPlanAmount(plusPlan.amount)}</span>
                  <span className="payment-submit-short">Continuer - {formatPlanAmount(plusPlan.amount)}</span>
                </button>
              </motion.form>
            </section>

            <div className="payment-trust-grid" style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '10px',
              marginTop: '14px'
            }}>
              {[
                { icon: Lock, label: 'Paiement chiffré' },
                { icon: ShieldCheck, label: 'Accès après confirmation' }
              ].map((item) => {
                const IconComponent = item.icon;
                return (
                  <div key={item.label} style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '7px',
                    padding: '10px',
                    borderRadius: 'var(--radius-sm)',
                    background: 'rgba(26,43,72,0.04)',
                    color: 'var(--text-light)',
                    fontSize: '11px',
                    fontWeight: 800
                  }}>
                    <IconComponent size={13} />
                    {item.label}
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}

        {paymentStep === 'processing' && (
          <motion.div
            key="processing"
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.04 }}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '60px 20px',
              textAlign: 'center',
              minHeight: '80vh'
            }}
          >
            <div style={{ position: 'relative', width: '104px', height: '104px', marginBottom: '32px' }}>
              <div style={{
                position: 'absolute',
                inset: 0,
                border: '7px solid rgba(26, 43, 72, 0.08)',
                borderRadius: '50%'
              }} />
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 1.4, ease: 'linear' }}
                style={{
                  position: 'absolute',
                  inset: 0,
                  border: '7px solid transparent',
                  borderTop: '7px solid var(--accent-blue)',
                  borderRadius: '50%'
                }}
              />
              <div style={{
                position: 'absolute',
                inset: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--navy)'
              }}>
                <ShieldCheck size={36} />
              </div>
            </div>

            <h2 className="font-outfit" style={{ fontSize: '22px', fontWeight: 900, color: 'var(--navy)', marginBottom: '12px' }}>
              Préparation du paiement
            </h2>
            <p style={{ color: 'var(--text-light)', fontSize: '14px', maxWidth: '310px', margin: '0 auto', lineHeight: 1.6 }}>
              {processingStatus}
            </p>
            <div style={{
              marginTop: '34px',
              padding: '12px 16px',
              backgroundColor: 'rgba(16, 185, 129, 0.08)',
              borderRadius: 'var(--radius-sm)',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              color: 'var(--text-light)',
              fontSize: '12px',
              fontWeight: 800
            }}>
              <Lock size={14} color="var(--emerald)" />
              Paiement sécurisé
            </div>
          </motion.div>
        )}

        {paymentStep === 'success' && (
          <motion.div
            key="success"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '60px 20px',
              textAlign: 'center',
              minHeight: '85vh'
            }}
          >
            <motion.div
              initial={{ scale: 0.5, rotate: -30 }}
              animate={{ scale: [0.5, 1.15, 1], rotate: 0 }}
              transition={{ duration: 0.6, ease: 'easeOut' }}
              style={{
                width: '96px',
                height: '96px',
                borderRadius: '50%',
                backgroundColor: 'rgba(16, 185, 129, 0.1)',
                border: '1.5px solid rgba(16, 185, 129, 0.25)',
                color: 'var(--emerald)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '28px'
              }}
            >
              <ShieldCheck size={44} />
            </motion.div>

            <span className="badge" style={{
              backgroundColor: 'var(--emerald-light)',
              color: 'var(--emerald)',
              textTransform: 'uppercase',
              fontSize: '10px',
              fontWeight: 800,
              padding: '4px 14px',
              letterSpacing: '0'
            }}>
              Accès activé à vie
            </span>

            <h1 className="font-outfit" style={{ fontSize: '32px', fontWeight: 900, color: 'var(--navy)', marginTop: '16px', marginBottom: '12px' }}>
              Bienvenue sur Dudukan Plus !
            </h1>

            <p style={{ color: 'var(--text-light)', fontSize: '15px', maxWidth: '340px', margin: '0 auto 36px', lineHeight: 1.55 }}>
              C'est bon. Vous pouvez maintenant planifier vos projets avec un coach plus clair, plus complet et plus rassurant.
            </p>

            <button
              onClick={handleFinish}
              className="btn-primary"
              style={{
                backgroundColor: 'var(--emerald)',
                boxShadow: '0 8px 24px rgba(16, 185, 129, 0.25)',
                width: '100%',
                maxWidth: '300px'
              }}
            >
              Découvrir Dudukan Plus <Sparkles size={18} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Payment;
