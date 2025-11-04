import React from 'react';
import { useAuth } from '../hooks/useFirebase';

function Login({ onLogin }) {
  const { loginWithGoogle } = useAuth();

  const handleGoogleLogin = async () => {
    try {
      const user = await loginWithGoogle();
      onLogin(user);
    } catch (error) {
      alert('Erro no login com Google: ' + error.message);
    }
  };

  const handleQuickLogin = () => {
    // Login rápido para teste
    onLogin({
      displayName: 'Alexandre Corretor',
      email: 'corretor@teste.com',
      uid: 'quick-user-123'
    });
  };

  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      height: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      padding: '20px'
    }}>
      <div style={{
        background: 'white',
        padding: '40px',
        borderRadius: '15px',
        boxShadow: '0 10px 30px rgba(0,0,0,0.2)',
        width: '100%',
        maxWidth: '400px',
        textAlign: 'center'
      }}>
        <div style={{
          background: '#f8f9fa',
          padding: '20px',
          borderRadius: '10px',
          marginBottom: '30px'
        }}>
          <h1 style={{ margin: '0 0 10px 0', color: '#2c3e50' }}>🏠 CRM Corretor</h1>
          <p style={{ color: '#7f8c8d', margin: 0 }}>Sistema Profissional</p>
        </div>

        <button 
          onClick={handleGoogleLogin}
          style={{
            width: '100%',
            padding: '15px',
            background: '#4285f4',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            fontSize: '16px',
            cursor: 'pointer',
            marginBottom: '15px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '10px',
            fontWeight: '500'
          }}
        >
          <span style={{ 
            background: 'white', 
            padding: '5px', 
            borderRadius: '3px',
            color: '#4285f4',
            fontWeight: 'bold',
            width: '20px',
            height: '20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            G
          </span>
          Entrar com Google
        </button>

        <div style={{ 
          margin: '20px 0', 
          display: 'flex', 
          alignItems: 'center',
          color: '#bdc3c7'
        }}>
          <div style={{ flex: 1, height: '1px', background: '#bdc3c7' }}></div>
          <span style={{ padding: '0 15px', fontSize: '14px' }}>ou</span>
          <div style={{ flex: 1, height: '1px', background: '#bdc3c7' }}></div>
        </div>

        <button 
          onClick={handleQuickLogin}
          style={{
            width: '100%',
            padding: '15px',
            background: '#27ae60',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            fontSize: '16px',
            cursor: 'pointer',
            fontWeight: '500'
          }}
        >
          🚀 Entrar Rapidamente
        </button>

        <p style={{ 
          marginTop: '25px', 
          fontSize: '12px', 
          color: '#95a5a6',
          lineHeight: '1.4'
        }}>
          <strong>Firebase + React + Vercel</strong><br/>
          Sistema seguro com autenticação Google
        </p>
      </div>
    </div>
  );
}

export default Login;
