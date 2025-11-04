import React from 'react';
import { db } from './firebase/config';
import { collection, addDoc } from 'firebase/firestore';

function App() {
  const testFirebase = async () => {
    try {
      // Testa a conexão com Firebase
      const docRef = await addDoc(collection(db, 'test'), {
        message: 'Teste de conexão Firebase',
        timestamp: new Date()
      });
      alert('✅ Firebase CONECTADO! ID: ' + docRef.id);
    } catch (error) {
      alert('❌ Erro Firebase: ' + error.message);
    }
  };

  return (
    <div style={{ padding: '50px', textAlign: 'center' }}>
      <h1>🚀 CRM Corretor Firebase</h1>
      <p>Firebase + React + Vercel</p>
      
      <button 
        onClick={testFirebase}
        style={{
          padding: '15px 30px',
          background: '#007bff',
          color: 'white',
          border: 'none',
          borderRadius: '8px',
          cursor: 'pointer',
          marginTop: '20px'
        }}
      >
        🧪 TESTAR FIREBASE
      </button>
    </div>
  );
}

export default App;
