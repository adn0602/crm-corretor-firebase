import React, { useState } from 'react';
import Login from './components/Login';
import { useAuth, useClients, useProperties } from './hooks/useFirebase';

function App() {
  const [user, setUser] = useState(null);
  const [currentPage, setCurrentPage] = useState('login');
  const { logout } = useAuth();
  const { addClient } = useClients();
  const { addProperty } = useProperties();

  const handleLogin = () => {
    setUser({ 
      email: 'corretor@exemplo.com', 
      name: 'Alexandre',
      uid: '123'
    });
    setCurrentPage('dashboard');
  };

  const handleLogout = () => {
    setUser(null);
    setCurrentPage('login');
  };

  // Formulário simples de cliente
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
        alert('Cliente cadastrado com sucesso!');
        setName('');
        setEmail('');
        setPhone('');
      } catch (error) {
        alert('Erro: ' + error.message);
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
            style={{ width: '100%', padding: '10px', margin: '5px 0' }}
            required
          />
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={{ width: '100%', padding: '10px', margin: '5px 0' }}
            required
          />
          <input
            type="text"
            placeholder="Telefone"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            style={{ width: '100%', padding: '10px', margin: '5px 0' }}
            required
          />
          <button 
            type="submit"
            style={{
              padding: '10px 20px',
              background: '#28a745',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer',
              marginTop: '10px'
            }}
          >
            Cadastrar Cliente
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
        <h1 style={{ margin: 0 }}>🏠 CRM Corretor</h1>
        <div>
          <span>Olá, {user.name}</span>
          <button 
            onClick={handleLogout}
            style={{ 
              marginLeft: '15px', 
              padding: '5px 10px',
              background: '#e74c3c',
              color: 'white',
              border: 'none',
              borderRadius: '3px',
              cursor: 'pointer'
            }}
          >
            Sair
          </button>
        </div>
      </header>

      {/* Navigation */}
      <nav style={{
        background: '#34495e',
        padding: '10px 20px'
      }}>
        <button 
          onClick={() => setCurrentPage('dashboard')}
          style={{ 
            marginRight: '10px', 
            padding: '8px 15px',
            background: currentPage === 'dashboard' ? '#2c3e50' : '#34495e',
            color: 'white',
            border: 'none',
            borderRadius: '3px',
            cursor: 'pointer'
          }}
        >
          📊 Dashboard
        </button>
        <button 
          onClick={() => setCurrentPage('clients')}
          style={{ 
            marginRight: '10px', 
            padding: '8px 15px',
            background: currentPage === 'clients' ? '#2c3e50' : '#34495e',
            color: 'white',
            border: 'none',
            borderRadius: '3px',
            cursor: 'pointer'
          }}
        >
          👥 Clientes
        </button>
        <button 
          onClick={() => setCurrentPage('properties')}
          style={{ 
            marginRight: '10px', 
            padding: '8px 15px',
            background: currentPage === 'properties' ? '#2c3e50' : '#34495e',
            color: 'white',
            border: 'none',
            borderRadius: '3px',
            cursor: 'pointer'
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
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
              gap: '20px', 
              marginTop: '20px' 
            }}>
              <div style={{ 
                background: '#e3f2fd', 
                padding: '20px', 
                borderRadius: '8px',
                textAlign: 'center'
              }}>
                <h3>👥 Total Clientes</h3>
                <p style={{ fontSize: '24px', fontWeight: 'bold', margin: '10px 0' }}>0</p>
                <small>Cadastrados</small>
              </div>
              <div style={{ 
                background: '#e8f5e8', 
                padding: '20px', 
                borderRadius: '8px',
                textAlign: 'center'
              }}>
                <h3>🏢 Imóveis Ativos</h3>
                <p style={{ fontSize: '24px', fontWeight: 'bold', margin: '10px 0' }}>0</p>
                <small>Disponíveis</small>
              </div>
              <div style={{ 
                background: '#fff3e0', 
                padding: '20px', 
                borderRadius: '8px',
                textAlign: 'center'
              }}>
                <h3>📅 Visitas Hoje</h3>
                <p style={{ fontSize: '24px', fontWeight: 'bold', margin: '10px 0' }}>0</p>
                <small>Agendadas</small>
              </div>
            </div>
          </div>
        )}

        {currentPage === 'clients' && <ClientForm />}
        
        {currentPage === 'properties' && (
          <div style={{ padding: '20px' }}>
            <h2>🏢 Gerenciar Imóveis</h2>
            <p>Funcionalidade em desenvolvimento...</p>
            <div style={{
              background: '#fff3cd',
              padding: '15px',
              borderRadius: '5px',
              border: '1px solid #ffeaa7',
              marginTop: '20px'
            }}>
              <strong>🚧 Em Breve:</strong>
              <ul>
                <li>Cadastro de imóveis com fotos</li>
                <li>Busca avançada</li>
                <li>Status de disponibilidade</li>
              </ul>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
