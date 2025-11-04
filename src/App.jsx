import React, { useState } from 'react';
import { db } from './firebase/config';
import { collection, addDoc, getDocs } from 'firebase/firestore';

function App() {
  const [user, setUser] = useState({ name: 'Corretor Teste', uid: 'user123' });
  const [clients, setClients] = useState([]);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');

  // Carregar clientes
  const loadClients = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, 'clients'));
      const clientsList = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setClients(clientsList);
      alert(`📋 ${clientsList.length} clientes carregados!`);
    } catch (error) {
      alert('❌ Erro ao carregar: ' + error.message);
    }
  };

  // Salvar cliente
  const saveClient = async (e) => {
    e.preventDefault();
    
    if (!name || !email || !phone) {
      alert('❌ Preencha todos os campos!');
      return;
    }

    try {
      const docRef = await addDoc(collection(db, 'clients'), {
        fullName: name,
        email: email,
        phones: [phone],
        assignedAgent: user.uid,
        createdAt: new Date(),
        status: 'lead'
      });

      alert(`✅ CLIENTE SALVO COM SUCESSO! ID: ${docRef.id}`);
      
      // Limpar formulário
      setName('');
      setEmail('');
      setPhone('');
      
      // Recarregar lista
      loadClients();
      
    } catch (error) {
      alert('❌ ERRO AO SALVAR: ' + error.message);
      console.error('Erro detalhado:', error);
    }
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial', maxWidth: '1200px', margin: '0 auto' }}>
      <header style={{
        background: '#2c3e50',
        color: 'white',
        padding: '20px',
        borderRadius: '10px',
        marginBottom: '20px',
        textAlign: 'center'
      }}>
        <h1>🏠 CRM CORRETOR - FIREBASE</h1>
        <p>Sistema de Gestão para Corretores</p>
      </header>

      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '20px'
      }}>
        {/* Formulário */}
        <div style={{
          background: '#f8f9fa',
          padding: '20px',
          borderRadius: '10px',
          border: '2px solid #007bff'
        }}>
          <h2>👥 CADASTRAR CLIENTE</h2>
          <form onSubmit={saveClient}>
            <div style={{ marginBottom: '15px' }}>
              <input
                type="text"
                placeholder="Nome completo"
                value={name}
                onChange={(e) => setName(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '1px solid #ddd',
                  borderRadius: '5px',
                  fontSize: '16px'
                }}
              />
            </div>

            <div style={{ marginBottom: '15px' }}>
              <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '1px solid #ddd',
                  borderRadius: '5px',
                  fontSize: '16px'
                }}
              />
            </div>

            <div style={{ marginBottom: '20px' }}>
              <input
                type="text"
                placeholder="Telefone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '1px solid #ddd',
                  borderRadius: '5px',
                  fontSize: '16px'
                }}
              />
            </div>

            <button 
              type="submit"
              style={{
                width: '100%',
                padding: '15px',
                background: '#28a745',
                color: 'white',
                border: 'none',
                borderRadius: '5px',
                fontSize: '16px',
                fontWeight: 'bold',
                cursor: 'pointer'
              }}
            >
              💾 SALVAR CLIENTE
            </button>
          </form>
        </div>

        {/* Lista de Clientes */}
        <div style={{
          background: '#f8f9fa',
          padding: '20px',
          borderRadius: '10px',
          border: '2px solid #28a745'
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '20px'
          }}>
            <h2>📋 CLIENTES CADASTRADOS</h2>
            <button 
              onClick={loadClients}
              style={{
                padding: '10px 15px',
                background: '#007bff',
                color: 'white',
                border: 'none',
                borderRadius: '5px',
                cursor: 'pointer'
              }}
            >
              🔄 CARREGAR
            </button>
          </div>

          {clients.length === 0 ? (
            <div style={{
              textAlign: 'center',
              padding: '40px',
              color: '#6c757d'
            }}>
              <p>Nenhum cliente cadastrado ainda.</p>
              <p>Clique em "CARREGAR" para verificar.</p>
            </div>
          ) : (
            <div style={{
              maxHeight: '400px',
              overflowY: 'auto'
            }}>
              {clients.map(client => (
                <div key={client.id} style={{
                  background: 'white',
                  padding: '15px',
                  marginBottom: '10px',
                  borderRadius: '5px',
                  border: '1px solid #dee2e6'
                }}>
                  <strong>{client.fullName}</strong>
                  <br />
                  📧 {client.email}
                  <br />
                  📞 {client.phones?.[0]}
                  <br />
                  <small style={{ color: '#6c757d' }}>
                    ID: {client.id}
                  </small>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Status */}
      <div style={{
        background: '#e7f3ff',
        padding: '15px',
        borderRadius: '5px',
        marginTop: '20px',
        textAlign: 'center'
      }}>
        <h3>🔧 INSTRUÇÕES:</h3>
        <ol style={{ textAlign: 'left', display: 'inline-block' }}>
          <li>Preencha o formulário e clique em "SALVAR CLIENTE"</li>
          <li>Se aparecer alerta de sucesso, está funcionando!</li>
          <li>Clique em "CARREGAR" para ver os clientes salvos</li>
        </ol>
      </div>
    </div>
  );
}

export default App;
