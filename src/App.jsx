import React, { useState } from 'react';
import Login from './components/Login';
import ClientList from './components/ClientList';
import { useClients, useProperties } from './hooks/useFirebase';

function App() {
  const [user, setUser] = useState(null);
  const [currentPage, setCurrentPage] = useState('login');
  const { addClient } = useClients();
  const { addProperty } = useProperties();

  const handleLogin = (userData) => {
    setUser({ 
      email: userData.email || 'corretor@google.com', 
      name: userData.displayName || 'Alexandre Corretor',
      uid: userData.uid || 'quick-user-' + Date.now()
    });
    setCurrentPage('dashboard');
  };

  const handleLogout = () => {
    setUser(null);
    setCurrentPage('login');
  };

  // Formulário de cliente - CORRIGIDO
  const ClientForm = () => {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
      e.preventDefault();
      
      // Validação básica
      if (!name.trim() || !email.trim() || !phone.trim()) {
        alert('❌ Preencha todos os campos obrigatórios!');
        return;
      }

      setLoading(true);
      try {
        console.log('🔄 Tentando salvar cliente...', { name, email, phone, uid: user.uid });
        
        await addClient({
          fullName: name.trim(),
          email: email.trim(),
          phones: [phone.trim()],
          assignedAgent: user.uid
        });
        
        alert('✅ Cliente cadastrado com sucesso!');
        setName('');
        setEmail('');
        setPhone('');
        
        // Se estiver na lista de clientes, recarrega
        if (currentPage === 'clientList') {
          // Nota: Em uma aplicação real, seria melhor atualizar o estado da lista
          // em vez de recarregar a página, mas para um protótipo, isso funciona.
          window.location.reload(); 
        }
        
      } catch (error) {
        console.error('❌ Erro detalhado:', error);
        alert('❌ Erro ao cadastrar cliente: ' + error.message);
      } finally {
        setLoading(false);
      }
    };

    return (
      <div style={{ padding: '20px', maxWidth: '500px' }}>
        <h2>👥 Cadastrar Cliente</h2>
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>
              Nome completo *
            </label>
            <input
              type="text"
              placeholder="Digite o nome completo"
              value={name}
              onChange={(e) => setName(e.target.value)}
              style={{ 
                width: '100%', 
                padding: '12px', 
                border: '1px solid #ddd', 
                borderRadius: '5px',
                fontSize: '16px'
              }}
              required
            />
          </div>

          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>
              Email *
            </label>
            <input
              type="email"
              placeholder="Digite o email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={{ 
                width: '100%', 
                padding: '12px', 
                border: '1px solid #ddd', 
                borderRadius: '5px',
                fontSize: '16px'
              }}
              required
            />
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '5px', fontWeight: '500' }}>
              Telefone *
            </label>
            <input
              type="text"
              placeholder="Digite o telefone com DDD"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              style={{ 
                width: '100%', 
                padding: '12px', 
                border: '1px solid #ddd', 
                borderRadius: '5px',
                fontSize: '16px'
              }}
              required
            />
          </div>

          <button 
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '12px',
              background: loading ? '#6c757d' : '#28a745',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: loading ? 'not-allowed' : 'pointer',
              fontSize: '16px',
              fontWeight: '500'
            }}
          >
            {loading ? '⏳ Salvando...' : '💾 Salvar Cliente'}
          </button>
        </form>

        <div style={{
          background: '#e7f3ff',
          padding: '15px',
          borderRadius: '8px',
          marginTop: '20px',
          border: '1px solid #b3d9ff'
        }}>
          <h4 style={{ margin: '0 0 10px 0', color: '#0066cc' }}>💡 Dica</h4>
          <p style={{ margin: 0, fontSize: '14px', color: '#0066cc' }}>
            Após cadastrar, vá em <strong>"Lista de Clientes"</strong> para visualizar todos os clientes cadastrados.
          </p>
        </div>
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
          <span>Olá, **{user.name}**</span>
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
          ➕ Cadastrar Cliente
        </button>
        <button 
          onClick={() => setCurrentPage('clientList')}
          style={{ 
            padding: '10px 20px',
            background: currentPage === 'clientList' ? '#2c3e50' : '#34495e',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer',
            fontSize: '14px'
          }}
        >
          📋 Lista de Clientes
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
        
        {currentPage === 'clientList' && <ClientList userId={user.uid} />}
        
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
