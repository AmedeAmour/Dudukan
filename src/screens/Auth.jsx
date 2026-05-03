import React, { useState } from 'react';
import { supabase } from '../supabaseClient';
import { Mail, Lock, User, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';

const Auth = () => {
  const [loading, setLoading] = useState(false);
  const [isLogin, setIsLogin] = useState(true);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);

  const handleAuth = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: name
            }
          }
        });
        if (error) throw error;
        // If email confirmation is required by Supabase, inform the user
        alert("Vérifiez vos emails pour confirmer votre compte !");
      }
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app-container" style={{ padding: '40px 24px', display: 'flex', flexDirection: 'column', justifyContent: 'center', minHeight: '100vh' }}>
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="fade-in"
      >
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <div style={{ 
            width: '80px', 
            height: '80px', 
            margin: '0 auto 24px',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center'
          }}>
            <img src="/logo.png" alt="Dudukan Logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
          </div>
          <h1 style={{ fontSize: '32px', marginBottom: '8px' }}>Dudukan</h1>
          <p style={{ color: 'var(--text-light)', fontSize: '16px' }}>
            {isLogin ? 'Connectez-vous à votre compte' : 'Créez votre compte'}
          </p>
        </div>

        {error && (
          <div className="card" style={{ background: 'var(--accent-pink-light)', color: 'var(--accent-pink)', border: 'none', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <AlertCircle size={20} />
            <p style={{ fontSize: '14px' }}>{error}</p>
          </div>
        )}

        <form onSubmit={handleAuth}>
          {!isLogin && (
            <div style={{ marginBottom: '20px' }}>
              <label className="label">Nom complet</label>
              <div style={{ position: 'relative' }}>
                <div style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-light)' }}>
                  <User size={20} />
                </div>
                <input 
                  type="text" 
                  placeholder="Tossou Sylvie" 
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  style={{ paddingLeft: '48px' }}
                  required={!isLogin}
                />
              </div>
            </div>
          )}

          <div style={{ marginBottom: '20px' }}>
            <label className="label">Adresse Email</label>
            <div style={{ position: 'relative' }}>
              <div style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-light)' }}>
                <Mail size={20} />
              </div>
              <input 
                type="email" 
                placeholder="votre@email.com" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={{ paddingLeft: '48px' }}
                required
              />
            </div>
          </div>

          <div style={{ marginBottom: '32px' }}>
            <label className="label">Mot de passe</label>
            <div style={{ position: 'relative' }}>
              <div style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-light)' }}>
                <Lock size={20} />
              </div>
              <input 
                type="password" 
                placeholder="••••••••" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{ paddingLeft: '48px' }}
                required
              />
            </div>
          </div>

          <button 
            className="btn-primary" 
            type="submit"
            disabled={loading}
            style={{ opacity: loading ? 0.7 : 1, marginBottom: '24px' }}
          >
            {loading ? 'Chargement...' : (isLogin ? 'Se connecter' : 'S\'inscrire')}
          </button>
        </form>

        <p style={{ textAlign: 'center', color: 'var(--text-light)', fontSize: '14px' }}>
          {isLogin ? "Vous n'avez pas de compte ?" : "Vous avez déjà un compte ?"}
          <button 
            onClick={() => setIsLogin(!isLogin)}
            style={{ background: 'none', border: 'none', color: 'var(--accent-blue)', fontWeight: '600', marginLeft: '6px', cursor: 'pointer' }}
          >
            {isLogin ? "S'inscrire" : "Se connecter"}
          </button>
        </p>
      </motion.div>
    </div>
  );
};

export default Auth;
