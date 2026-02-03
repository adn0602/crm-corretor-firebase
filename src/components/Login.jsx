import React, { useState } from 'react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../firebase/config';

const LoginStyle = () => (
  <style>{`
    @import url('https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css');
    @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,900;1,900&display=swap');
    
    .bg-mansion {
      background-image: url('https://images.unsplash.com/photo-1600596542815-2a429b08e0b9?q=80&w=2075&auto=format&fit=crop');
      background-size: cover;
      background-position: center;
    }
    .glass-panel {
      background: rgba(15, 23, 42, 0.65);
      backdrop-filter: blur(20px);
      -webkit-backdrop-filter: blur(20px);
      border: 1px solid rgba(255, 255, 255, 0.1);
    }
    .input-field {
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid rgba(255, 255, 255, 0.1);
      color: white;
      transition: all 0.3s ease;
    }
    .input-field:focus {
      background: rgba(255, 255, 255, 0.15);
      border-color: #3b82f6;
      outline: none;
    }
    .premium-font { font-family: 'Playfair Display', serif; }
  `}</style>
);

function Login({ onLogin }) {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            onLogin(userCredential.user);
        } catch (error) {
            setError('Acesso negado. Verifique suas credenciais.');
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-mansion flex items-center justify-center p-6 relative">
            <LoginStyle />
            {/* Overlay Escuro para leitura */}
            <div className="absolute inset-0 bg-slate-900/40"></div>

            <div className="glass-panel w-full max-w-md p-10 rounded-[3rem] shadow-2xl relative z-10 animate-fadeIn">
                <div className="text-center mb-10">
                    <p className="text-blue-400 text-xs font-black uppercase tracking-[0.3em] mb-2">Sistema Exclusivo</p>
                    <h1 className="text-5xl text-white premium-font italic mb-1">Alexandre</h1>
                    <h2 className="text-2xl text-slate-300 font-light uppercase tracking-widest">Real Estate CRM</h2>
                </div>

                <form onSubmit={handleLogin} className="space-y-6">
                    <div>
                        <input 
                            type="email" 
                            placeholder="E-mail Corporativo" 
                            value={email} 
                            onChange={(e) => setEmail(e.target.value)} 
                            className="input-field w-full p-5 rounded-2xl font-bold text-sm placeholder-slate-400"
                        />
                    </div>
                    <div>
                        <input 
                            type="password" 
                            placeholder="Senha de Acesso" 
                            value={password} 
                            onChange={(e) => setPassword(e.target.value)} 
                            className="input-field w-full p-5 rounded-2xl font-bold text-sm placeholder-slate-400"
                        />
                    </div>

                    {error && (
                        <div className="bg-red-500/20 border border-red-500/50 text-red-200 text-xs font-bold p-4 rounded-xl text-center uppercase tracking-wide">
                            ⚠️ {error}
                        </div>
                    )}

                    <button 
                        type="submit" 
                        disabled={loading}
                        className="w-full bg-gradient-to-r from-blue-600 to-blue-800 hover:from-blue-500 hover:to-blue-700 text-white p-5 rounded-2xl font-black uppercase tracking-widest text-sm shadow-lg shadow-blue-900/50 transition transform hover:scale-[1.02] active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? 'Autenticando...' : 'Acessar Painel'}
                    </button>
                </form>

                <div className="mt-10 text-center">
                    <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">
                        Tecnologia Lopes Prime © 2026
                    </p>
                </div>
            </div>
        </div>
    );
}

export default Login;
