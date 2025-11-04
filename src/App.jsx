import React, { useState } from 'react';
import Login from './components/Login';
import { useClients, useProperties } from './hooks/useFirebase';

function App() {
  const [user, setUser] = useState(null);
  const [currentPage, setCurrentPage] = useState('login');
  const { addClient } = useClients();
  const { addProperty } = useProperties();

  const handleLogin = (userData) => {
    setUser({ 
      email: userData.email || 'corretor@google.com', 
      name: userData.displayName || 'Usuário Google',
      uid: userData.uid || 'google-user-' + Date.now()
    });
    setCurrentPage('dashboard');
  };

  const handleLogout = () => {
    setUser(null);
    setCurrentPage('login');
  };

  // Formulário de cliente
  const ClientForm = () => {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');

    const handleSubmit = async (e) => {
      e.preventDefault();
      try {
        await addClient({
          fullName: name,
          email: email,
          phones: [phone],
          assignedAgent: user.uid
        });
        alert('✅ Cliente cadastrado com sucesso!');
        setName('');
        setEmail('');
        setPhone('');
      } catch (error) {
        alert('❌ Erro: ' + error.message);
      }
    };

    return (
      <div style={{ padding: '20px', maxWidth: '500px' }}>
        <h2>👥 Cadastrar Cliente</h2>
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            placeholder="Nome completo"
            value={name}
            onChange={(e) => setName(e.target.value)}
            style={{ 
              width: '100%', 
              padding: '12px', 
              margin: '8px 0', 
              border: '1px solid #ddd', 
              borderRadius: '5px',
              fontSize: '16px'
            }}
            required
          />
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={{ 
              width: '100%', 
              padding: '12px', 
              margin: '8px 0', 
              border: '1px solid #ddd', 
              borderRadius: '5px',
              fontSize: '16px'
            }}
            required
          />
          <input
            type="text"
            placeholder="Telefone"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            style={{ 
              width: '100%', 
              padding: '12px', 
              margin: '8px 0', 
              border: '1px solid #ddd', 
              borderRadius: '5px',
              fontSize: '16px'
            }}
            required
          />
          <button 
            type="submit"
            style={{
              width: '100%',
              padding: '12px',
              background: '#28a745',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer',
              marginTop: '10px',
              fontSize: '16px',
              fontWeight: '500'
            }}
          >
            💾 Salvar Cliente
          </button>
        </form>
      </div>
    );
  };

  if (!user) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <div style={{ fontFamily: 'Arial, sans-serif', minHeight: '100vh' }}>
      {/* Header */}
      <header style={{
        background: '#2c3e50',
        color: 'white',
        padding: '15px 20px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <h1 style={{ margin: 0, fontSize: '24px' }}>🏠 CRM Corretor</h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <span>Olá, {user.name}</span>
          <button 
            onClick={handleLogout}
            style={{ 
              padding: '8px 15px',
              background: '#e74c3c',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            Sair
          </button>
        </div>
      </header>

      {/* Navigation */}
      <nav style={{
        background: '#34495e',
        padding: '12px 20px',
        display: 'flex',
        gap: '10px',
        flexWrap: 'wrap'
      }}>
        <button 
          onClick={() => setCurrentPage('dashboard')}
          style={{ 
            padding: '10px 20px',
            background: currentPage === 'dashboard' ? '#2c3e50' : '#34495e',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer',
            fontSize: '14px'
          }}
        >
          📊 Dashboard
        </button>
        <button 
          onClick={() => setCurrentPage('clients')}
          style={{ 
            padding: '10px 20px',
            background: currentPage === 'clients' ? '#2c3e50' : '#34495e',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer',
            fontSize: '14px'
          }}
        >
          👥 Clientes
        </button>
        <button 
          onClick={() => setCurrentPage('properties')}
          style={{ 
            padding: '10px 20px',
            background: currentPage === 'properties' ? '#2c3e50' : '#34495e',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer',
            fontSize: '14px'
          }}
        >
          🏢 Imóveis
        </button>
      </nav>

      {/* Main Content */}
      <main style={{ padding: '20px' }}>
        {currentPage === 'dashboard' && (
          <div>
            <h2>📊 Dashboard</h2>
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
              gap: '20px', 
              marginTop: '20px' 
            }}>
              <div style={{ 
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', 
                padding: '25px', 
                borderRadius: '10px',
                textAlign: 'center',
                color: 'white'
              }}>
                <h3>👥 Total Clientes</h3>
                <p style={{ fontSize: '32px', fontWeight: 'bold', margin: '15px 0' }}>0</p>
                <small>Cadastrados no sistema</small>
              </div>
              <div style={{ 
                background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)', 
                padding: '25px', 
                borderRadius: '10px',
                textAlign: 'center',
                color: 'white'
              }}>
                <h3>🏢 Imóveis Ativos</h3>
                <p style={{ fontSize: '32px', fontWeight: 'bold', margin: '15px 0' }}>0</p>
                <small>Disponíveis para venda</small>
              </div>
              <div style={{ 
                background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)', 
                padding: '25px', 
                borderRadius: '10px',
                textAlign: 'center',
                color: 'white'
              }}>
                <h3>📅 Visitas Hoje</h3>
                <p style={{ fontSize: '32px', fontWeight: 'bold', margin: '15px 0' }}>0</p>
                <small>Agendadas para hoje</small>
              </div>
            </div>
          </div>
        )}

        {currentPage === 'clients' && <ClientForm />}
        
        {currentPage === 'properties' && (
          <div style={{ padding: '20px' }}>
            <h2>🏢 Gerenciar Imóveis</h2>
            <div style={{
              background: '#e3f2fd',
              padding: '25px',
              borderRadius: '10px',
              border: '2px dashed #2196f3',
              textAlign: 'center',
              marginTop: '20px'
            }}>
              <h3 style={{ color: '#1976d2' }}>🚀 Em Desenvolvimento</h3>
              <p>Esta funcionalidade estará disponível em breve!</p>
              <div style={{ marginTop: '20px' }}>
                <strong>📋 Próximas Funcionalidades:</strong>
                <ul style={{ textAlign: 'left', marginTop: '10px' }}>
                  <li>📸 Cadastro de imóveis com múltiplas fotos</li>
                  <li>🔍 Busca avançada com filtros</li>
                  <li>📊 Status de disponibilidade</li>
                  <li>📍 Integração com Google Maps</li>
                </ul>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
