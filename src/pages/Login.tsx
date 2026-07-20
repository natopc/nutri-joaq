import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChefHat, Mail, Lock, ArrowRight, AlertCircle } from 'lucide-react';
import { auth } from '../lib/firebase';
import { signInWithEmailAndPassword } from 'firebase/auth';
import './Login.css';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    try {
      await signInWithEmailAndPassword(auth, email, password);
      navigate('/dashboard');
    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/invalid-credential' || err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password') {
        setError('E-mail ou senha incorretos.');
      } else {
        setError('Ocorreu um erro ao fazer login. Tente novamente.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-image">
        <div className="login-overlay">
          <div className="overlay-content">
            <h1 className="overlay-title">Excelência em Nutrição.</h1>
            <p className="overlay-subtitle">
              Gestão inteligente e acompanhamento completo de suas Unidades de Alimentação e Nutrição.
            </p>
          </div>
        </div>
      </div>
      <div className="login-form-section">
        <div className="login-form-wrapper">
          <div className="login-logo">
            <div className="logo-icon">
              <ChefHat size={32} color="var(--color-primary)" />
            </div>
            <h2>Nutri<span className="logo-highlight">Joaq</span></h2>
            <p className="logo-tagline">Professional Kitchens</p>
          </div>

          <div className="login-header">
            <h3>Bem-vindo de volta</h3>
            <p>Faça login para acessar o painel de gestão.</p>
          </div>

          <form onSubmit={handleSubmit} className="login-form">
            {error && (
              <div style={{ backgroundColor: 'var(--color-error-bg)', color: 'var(--color-error)', padding: '12px', borderRadius: '8px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', fontWeight: '500' }}>
                <AlertCircle size={18} />
                {error}
              </div>
            )}

            <div className="form-group">
              <label className="input-label" htmlFor="email">E-mail Corporativo</label>
              <div className="input-wrapper">
                <Mail className="input-icon" size={20} />
                <input 
                  type="email" 
                  id="email" 
                  className="input-field with-icon" 
                  placeholder="seuemail@empresa.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label className="input-label" htmlFor="password">Senha</label>
              <div className="input-wrapper">
                <Lock className="input-icon" size={20} />
                <input 
                  type="password" 
                  id="password" 
                  className="input-field with-icon" 
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              <div className="forgot-password">
                <a href="#">Esqueceu a senha?</a>
              </div>
            </div>

            <button type="submit" className="btn-primary w-full mt-4 btn-login" disabled={loading}>
              {loading ? 'Entrando...' : (
                <>Acessar Painel <ArrowRight size={20} /></>
              )}
            </button>
            
            <div className="demo-credentials mt-6">
              <p className="text-sm text-muted">Não tem conta? Crie usuários pelo Painel do Firebase (Authentication).</p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
