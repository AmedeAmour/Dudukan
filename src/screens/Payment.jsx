import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  ArrowLeft, Check, Crown, Smartphone, CreditCard,
  Lock, Sparkles, ShieldCheck, Zap, Layers, BarChart3, ChevronRight, Wallet
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const Payment = ({ onBack, onUnlock }) => {
  const { updateProfile } = useAuth();
  const [selectedMethod, setSelectedMethod] = useState(null); // 'orange', 'wave', 'mtn', 'moov', 'card'
  const [phoneNumber, setPhoneNumber] = useState('');
  const [countryCode, setCountryCode] = useState('+225'); // Default Côte d'Ivoire
  const [cardName, setCardName] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');
  const [paymentStep, setPaymentStep] = useState('selection'); // 'selection', 'processing', 'success'
  const [processingStatus, setProcessingStatus] = useState('');

  const premiumFeatures = [
    {
      icon: Crown,
      title: "Architecture Premium",
      desc: "Gestion de projets complexes avec étapes illimitées et jalons.",
      color: "var(--accent-orange)"
    },
    {
      icon: Zap,
      title: "Calculateur intelligent",
      desc: "Besoins prévisionnels réels calculés mensuellement pour chaque objectif.",
      color: "var(--accent-blue)"
    },
    {
      icon: BarChart3,
      title: "Score de Viabilité",
      desc: "Système prédictif évaluant la réussite de votre stratégie financière.",
      color: "var(--emerald)"
    },
    {
      icon: Layers,
      title: "Répartition intelligente",
      desc: "Distribution automatique de votre épargne selon la priorité des projets.",
      color: "var(--accent-pink)"
    },
    {
      icon: ShieldCheck,
      title: "Rapports Stratégiques PDF",
      desc: "Téléchargements de bilans de vie d'une qualité esthétique exceptionnelle.",
      color: "var(--navy)"
    }
  ];

  const paymentMethods = [
    { id: 'wave', name: 'Wave', color: '#1B9CFC', icon: Wallet },
    { id: 'orange', name: 'Orange Money', color: '#FF793F', icon: Smartphone },
    { id: 'mtn', name: 'MTN Mobile Money', color: '#FFC312', icon: Smartphone },
    { id: 'moov', name: 'Moov Money', color: '#0652DD', icon: Smartphone },
    { id: 'card', name: 'Carte Bancaire', color: 'var(--navy)', icon: CreditCard }
  ];

  const countries = [
    { code: '+225', name: 'Côte d\'Ivoire 🇨🇮' },
    { code: '+221', name: 'Sénégal 🇸🇳' },
    { code: '+223', name: 'Mali 🇲🇱' },
    { code: '+226', name: 'Burkina Faso 🇧🇫' },
    { code: '+229', name: 'Bénin 🇧🇯' },
    { code: '+228', name: 'Togo 🇹🇬' },
    { code: '+237', name: 'Cameroun 🇨🇲' }
  ];

  const handlePaymentSubmit = (e) => {
    e.preventDefault();
    if (!selectedMethod) return;

    setPaymentStep('processing');

    // Simulate mobile money payment flow steps
    const steps = [
      "Initialisation de la transaction sécurisée...",
      "Génération de la demande de prélèvement...",
      "Requête envoyée à votre opérateur mobile...",
      "En attente de votre confirmation (saisissez votre code secret sur votre téléphone)...",
      "Paiement reçu et approuvé par le système !"
    ];

    let currentStepIdx = 0;
    setProcessingStatus(steps[0]);

    const interval = setInterval(async () => {
      currentStepIdx++;
      if (currentStepIdx < steps.length) {
        setProcessingStatus(steps[currentStepIdx]);
      } else {
        clearInterval(interval);
        try {
          // Permanently update user metadata in Supabase to grant premium lifetime access
          const { error } = await updateProfile({ is_premium: true });
          if (error) throw error;

          setPaymentStep('success');
        } catch (err) {
          alert("Erreur lors de l'activation : " + err.message);
          setPaymentStep('selection');
        }
      }
    }, 2000);
  };

  const handleFinish = () => {
    if (onUnlock) onUnlock();
  };

  return (
    <div className="app-container" style={{ padding: '24px 20px 40px', backgroundColor: 'var(--bg-main)' }}>
      <AnimatePresence mode="wait">

        {/* Step 1: Feature Overview & Payment Selection */}
        {paymentStep === 'selection' && (
          <motion.div
            key="selection"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
          >
            {/* Header / Back button with outline icon and circular background */}
            <button
              onClick={onBack}
              style={{
                background: 'none',
                border: 'none',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                color: 'var(--navy)',
                marginBottom: '24px',
                cursor: 'pointer',
                fontWeight: '700',
                fontFamily: 'var(--font-headings)'
              }}
            >
              <div style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                backgroundColor: 'var(--white)',
                border: '1.5px solid rgba(0, 0, 0, 0.08)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--navy)',
                boxShadow: 'var(--shadow-soft)'
              }}>
                <ArrowLeft size={16} strokeWidth={2.5} />
              </div>
              Retour
            </button>

            {/* Main Title Hero with outline icon and circular background */}
            <div style={{ textAlign: 'center', marginBottom: '28px' }}>
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                backgroundColor: 'rgba(212, 175, 55, 0.1)',
                border: '1.5px solid rgba(212, 175, 55, 0.25)',
                color: '#D4AF37',
                marginBottom: '16px'
              }}>
                <Crown size={28} />
              </div>
              <h1 className="font-outfit" style={{ fontSize: '28px', fontWeight: '800', color: 'var(--navy)', marginBottom: '8px' }}>
                Accès Premium Dudukan
              </h1>
              <p style={{ color: 'var(--text-light)', fontSize: '15px', lineHeight: '1.4' }}>
                Libérez la puissance de vos finances de vie avec l'architecture Premium.
              </p>
            </div>

            {/* Premium Features List with outline icons and circular backgrounds */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '32px' }}>
              {premiumFeatures.map((feat, idx) => {
                const IconComponent = feat.icon;
                return (
                  <div key={idx} className="card" style={{ display: 'flex', gap: '16px', padding: '16px 20px', margin: 0, alignItems: 'center' }}>
                    <div style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '50%',
                      backgroundColor: `${feat.color}15`,
                      border: `1.5px solid ${feat.color}25`,
                      color: feat.color,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0
                    }}>
                      <IconComponent size={20} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <h4 className="font-outfit" style={{ fontSize: '15px', fontWeight: '700', color: 'var(--navy)', marginBottom: '2px' }}>
                        {feat.title}
                      </h4>
                      <p style={{ fontSize: '12px', color: 'var(--text-light)', lineHeight: '1.4' }}>
                        {feat.desc}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Single Lifetime Pricing Info */}
            <div className="card" style={{
              background: 'linear-gradient(135deg, #1A2B48 0%, #2D3E5E 100%)',
              color: 'white',
              padding: '24px',
              marginBottom: '32px',
              textAlign: 'center',
              border: 'none'
            }}>
              <span className="badge" style={{ backgroundColor: 'rgba(255, 255, 255, 0.15)', color: '#D4AF37', textTransform: 'uppercase', fontSize: '10px', fontWeight: 800, padding: '4px 12px', letterSpacing: '1px' }}>
                Offre unique & à vie
              </span>
              <h2 className="font-outfit" style={{ color: 'white', fontSize: '38px', fontWeight: '800', margin: '12px 0 2px' }}>
                9 900 XOF
              </h2>
              <p style={{ fontSize: '12px', opacity: 0.8, color: 'white', marginBottom: '0' }}>
                Pas d'abonnement récurrent. Payez une seule fois, profitez pour toujours.
              </p>
            </div>

            {/* Payment Method Selector with outline icons and circular backgrounds */}
            <h3 className="font-outfit" style={{ fontSize: '16px', fontWeight: '700', color: 'var(--navy)', marginBottom: '16px' }}>
              Choisissez votre moyen de paiement
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '24px' }}>
              {paymentMethods.map(method => {
                const isSelected = selectedMethod === method.id;
                return (
                  <button
                    key={method.id}
                    onClick={() => setSelectedMethod(method.id)}
                    style={{
                      width: '100%',
                      padding: '16px 20px',
                      borderRadius: 'var(--radius-md)',
                      backgroundColor: 'var(--white)',
                      border: isSelected ? `2.5px solid ${method.color}` : '1.5px solid rgba(0, 0, 0, 0.06)',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      cursor: 'pointer',
                      boxShadow: isSelected ? 'var(--shadow-medium)' : 'var(--shadow-soft)',
                      transition: 'all 0.2s'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                      <div style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '50%',
                        backgroundColor: `${method.color}15`,
                        border: `1.5px solid ${method.color}25`,
                        color: method.color,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        <method.icon size={20} />
                      </div>
                      <span className="font-outfit" style={{ fontWeight: '700', fontSize: '15px', color: 'var(--navy)' }}>
                        {method.name}
                      </span>
                    </div>
                    {isSelected ? (
                      <div style={{
                        width: '24px',
                        height: '24px',
                        borderRadius: '50%',
                        backgroundColor: method.color,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white'
                      }}>
                        <Check size={14} strokeWidth={3} />
                      </div>
                    ) : (
                      <ChevronRight size={18} color="var(--text-light)" />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Dynamic payment form */}
            <AnimatePresence>
              {selectedMethod && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  style={{ overflow: 'hidden' }}
                >
                  <form onSubmit={handlePaymentSubmit} className="card" style={{ padding: '24px', margin: '12px 0 32px' }}>
                    {selectedMethod !== 'card' ? (
                      <div>
                        <label className="label" style={{ fontWeight: 700, color: 'var(--navy)' }}>
                          Numéro de téléphone mobile
                        </label>
                        <div style={{ display: 'flex', gap: '10px' }}>
                          <select
                            value={countryCode}
                            onChange={(e) => setCountryCode(e.target.value)}
                            style={{
                              width: '130px',
                              padding: '14px 10px',
                              borderRadius: 'var(--radius-sm)',
                              border: '1.5px solid #E5E7EB',
                              fontFamily: 'Inter',
                              fontSize: '14px',
                              backgroundColor: 'white'
                            }}
                          >
                            {countries.map(c => <option key={c.code} value={c.code}>{c.code} {c.name.split(' ')[0]}</option>)}
                          </select>
                          <input
                            required
                            type="tel"
                            placeholder="Ex: 0707070707"
                            value={phoneNumber}
                            onChange={(e) => setPhoneNumber(e.target.value.replace(/\s/g, ''))}
                            style={{ flex: 1 }}
                          />
                        </div>
                        <p style={{ fontSize: '11px', color: 'var(--text-light)', marginTop: '8px', lineHeight: '1.4' }}>
                          Vous recevrez une demande d'autorisation de prélèvement sur ce numéro après avoir cliqué sur valider.
                        </p>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        <div>
                          <label className="label" style={{ fontWeight: 700, color: 'var(--navy)' }}>Nom sur la carte</label>
                          <input
                            required
                            type="text"
                            placeholder="Ex: Kouamé Koffi"
                            value={cardName}
                            onChange={(e) => setCardName(e.target.value)}
                          />
                        </div>
                        <div>
                          <label className="label" style={{ fontWeight: 700, color: 'var(--navy)' }}>Numéro de carte</label>
                          <input
                            required
                            type="text"
                            placeholder="xxxx xxxx xxxx xxxx"
                            value={cardNumber}
                            onChange={(e) => setCardNumber(e.target.value.replace(/[^\d]/g, '').substring(0, 16))}
                          />
                        </div>
                        <div style={{ display: 'flex', gap: '10px' }}>
                          <div style={{ flex: 1 }}>
                            <label className="label" style={{ fontWeight: 700, color: 'var(--navy)' }}>Expiration</label>
                            <input
                              required
                              type="text"
                              placeholder="MM/AA"
                              value={cardExpiry}
                              onChange={(e) => setCardExpiry(e.target.value.substring(0, 5))}
                            />
                          </div>
                          <div style={{ flex: 1 }}>
                            <label className="label" style={{ fontWeight: 700, color: 'var(--navy)' }}>CVV</label>
                            <input
                              required
                              type="password"
                              placeholder="123"
                              value={cardCvv}
                              onChange={(e) => setCardCvv(e.target.value.replace(/[^\d]/g, '').substring(0, 3))}
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Pay Button */}
                    <button
                      type="submit"
                      className="btn-primary"
                      style={{
                        marginTop: '24px',
                        backgroundColor: paymentMethods.find(m => m.id === selectedMethod)?.color || 'var(--navy)'
                      }}
                    >
                      <Lock size={18} /> Confirmer et Payer 9 900 XOF
                    </button>
                  </form>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Footer trust badges with outline icons and circular backgrounds */}
            <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', alignItems: 'center', opacity: 0.7, marginTop: '24px' }}>
              <span style={{ fontSize: '11px', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600, color: 'var(--text-light)' }}>
                <div style={{
                  width: '20px',
                  height: '20px',
                  borderRadius: '50%',
                  backgroundColor: 'rgba(31, 41, 55, 0.05)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--text-light)'
                }}>
                  <Lock size={10} />
                </div>
                Transaction Cryptée
              </span>
              <span style={{ fontSize: '11px', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600, color: 'var(--text-light)' }}>
                <div style={{
                  width: '20px',
                  height: '20px',
                  borderRadius: '50%',
                  backgroundColor: 'rgba(31, 41, 55, 0.05)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--text-light)'
                }}>
                  <ShieldCheck size={10} />
                </div>
                Protection Dudukan
              </span>
            </div>
          </motion.div>
        )}

        {/* Step 2: Interactive Payment Processing Simulator */}
        {paymentStep === 'processing' && (
          <motion.div
            key="processing"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.05 }}
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
            {/* Spinning ring loader with outline icon and circular background */}
            <div style={{ position: 'relative', width: '100px', height: '100px', marginBottom: '32px' }}>
              <div style={{
                boxSizing: 'border-box',
                position: 'absolute',
                width: '100px',
                height: '100px',
                border: '6px solid rgba(26, 43, 72, 0.1)',
                borderRadius: '50%'
              }}></div>
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
                style={{
                  boxSizing: 'border-box',
                  position: 'absolute',
                  width: '100px',
                  height: '100px',
                  border: '6px solid transparent',
                  borderTop: '6px solid var(--navy)',
                  borderRadius: '50%'
                }}
              ></motion.div>
              <div style={{
                position: 'absolute',
                inset: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--navy)'
              }}>
                <Smartphone size={36} />
              </div>
            </div>

            <h2 className="font-outfit" style={{ fontSize: '20px', fontWeight: '800', color: 'var(--navy)', marginBottom: '12px' }}>
              Paiement en cours
            </h2>

            <p style={{ color: 'var(--text-light)', fontSize: '14px', maxWidth: '300px', margin: '0 auto', lineHeight: '1.6' }}>
              {processingStatus}
            </p>

            <div style={{ marginTop: '40px', padding: '12px 20px', backgroundColor: 'rgba(26, 43, 72, 0.04)', borderRadius: 'var(--radius-sm)', display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--emerald)', display: 'inline-block' }}></span>
              <span style={{ fontSize: '11px', color: 'var(--text-light)', fontWeight: 600 }}>
                Sécurisé par Dudukan Pay
              </span>
            </div>
          </motion.div>
        )}

        {/* Step 3: Payment Success / Activations Animation */}
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
            {/* Animated Celebration Icon with outline icon and circular background */}
            <motion.div
              initial={{ scale: 0.5, rotate: -45 }}
              animate={{ scale: [0.5, 1.2, 1], rotate: 0 }}
              transition={{ duration: 0.6, ease: "easeOut" }}
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
              <Crown size={44} />
            </motion.div>

            <span className="badge" style={{ backgroundColor: 'var(--emerald-light)', color: 'var(--emerald)', textTransform: 'uppercase', fontSize: '10px', fontWeight: 800, padding: '4px 14px', letterSpacing: '0.5px' }}>
              Abonnement Activé à Vie
            </span>

             <h1 className="font-outfit" style={{ fontSize: '32px', fontWeight: '800', color: 'var(--navy)', marginTop: '16px', marginBottom: '12px' }}>
              Bienvenue sur Dudukan Premium !
            </h1>

            <p style={{ color: 'var(--text-light)', fontSize: '15px', maxWidth: '340px', margin: '0 auto 36px', lineHeight: '1.5' }}>
              Félicitations ! Vous disposez désormais de tous les outils stratégiques et prédictifs premium pour planifier vos projets de vie.
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
              Découvrir Dudukan Premium <Sparkles size={18} />
            </button>
          </motion.div>
        )}

      </AnimatePresence>
    </div>
  );
};

export default Payment;
