import React from 'react';
import { db } from './firebase/config';
import { collection, addDoc } from 'firebase/firestore';

function App() {
  const testFirebase = async () => {
    try {
      // Testa a conexão com Firebase
      const docRef = await addDoc(collection(db, 'test'), {
        message: 'Teste de conexão Firebase',
        timestamp: new Date(),
        status: 'sucesso'
      });
      alert('🎉 FIREBASE CONECTADO COM SUCESSO! 🎉\nID do documento: ' + docRef.id);
    } catch (error) {
      alert('❌ ERRO NO FIREBASE:\n' + error.message);
    }
  };

  return (
    <div style={{ 
      padding: '50px', 
      textAlign: 'center',
      fontFamily: 'Arial, sans-serif'
    }}>
      <h1>🚀 CRM Corretor Firebase</h1>
      <p>Firebase + React + Vercel</p>
      
      <div style={{ 
        background: '#f0f8ff', 
        padding: '20px', 
        margin: '30px auto',
        maxWidth: '500px',
        borderRadius: '10px',
        border: '2px solid #007bff'
      }}>
        <h3>🧪 TESTE DE CONEXÃO</h3>
        <p>Clique no botão abaixo para testar se o Firebase está conectado:</p>
        
        <button 
          onClick={testFirebase}
          style={{
            padding: '15px 30px',
            fontSize: '18px',
            background: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            margin: '10px'
          }}
        >
          🧪 TESTAR FIREBASE
        </button>
      </div>

      <div style={{ 
        background: '#e8f5e8', 
        padding: '15px', 
        margin: '20px auto',
        maxWidth: '400px',
        borderRadius: '8px'
      }}>
        <h3>✅ Sistema Pronto</h3>
        <p>Firebase + React + Vercel</p>
      </div>
    </div>
  );
}

export default App;
