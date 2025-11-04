import React, { useState, useEffect } from 'react';
import { useClients } from '../hooks/useFirebase';

function ClientList({ userId }) {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { getClients } = useClients();

  useEffect(() => {
    loadClients();
  }, [userId]);

  const loadClients = async () => {
    setLoading(true);
    setError('');
    try {
      console.log('🔄 Buscando clientes para userId:', userId);
      const clientesData = await getClients(userId);
      console.log('📋 Clientes encontrados:', clientesData);
      setClients(clientesData);
    } catch (error) {
      console.error('❌ Erro ao carregar clientes:', error);
      setError('Erro ao carregar clientes: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <div style={{
          display: 'inline-block',
          padding: '20px',
          background: '#f8f9fa',
          borderRadius: '10px'
        }}>
          <p style={{ margin: 0, fontSize: '16px', color: '#6c757d' }}>
            ⏳ Carregando clientes...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: '20px' }}>
        <div style={{
          background: '#f8d7da',
          color: '#721c24',
          padding: '15px',
          borderRadius: '8px',
          marginBottom: '20px'
        }}>
          <strong>❌ Erro:</strong> {error}
        </div>
        <button 
          onClick={loadClients}
          style={{
            padding: '10px 20px',
            background: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer'
          }}
        >
          🔄 Tentar Novamente
        </button>
      </div>
    );
  }

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '30px',
        flexWrap: 'wrap',
        gap: '15px'
      }}>
        <h2 style={{ 
          margin: 0, 
          color: '#2c3e50',
          fontSize: '28px'
        }}>
          👥 Meus Clientes
        </h2>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '15px'
        }}>
          <span style={{
            background: '#007bff',
            color: 'white',
            padding: '8px 16px',
            borderRadius: '20px',
            fontSize: '14px',
            fontWeight: '600'
          }}>
            Total: {clients.length}
          </span>
          <button 
            onClick={loadClients}
            style={{
              padding: '8px 16px',
              background: '#28a745',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            🔄 Atualizar
          </button>
        </div>
      </div>

      {clients.length === 0 ? (
        <div style={{
          background: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)',
          padding: '60px 40px',
          textAlign: 'center',
          borderRadius: '15px',
          border: '2px dashed #ced4da'
        }}>
          <div style={{
            fontSize: '48px',
            marginBottom: '20px'
          }}>
            📝
          </div>
          <h3 style={{ 
            color: '#6c757d', 
            marginBottom: '10px',
            fontSize: '24px'
          }}>
            Nenhum cliente cadastrado
          </h3>
          <p style={{ 
            color: '#868e96',
            fontSize: '16px',
            maxWidth: '400px',
            margin: '0 auto',
            lineHeight: '1.5'
          }}>
            Cadastre seu primeiro cliente usando o formulário de cadastro para começar!
          </p>
          <button 
            onClick={() => window.location.hash = '#clients'}
            style={{
              marginTop: '20px',
              padding: '10px 20px',
              background: '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer',
              fontSize: '16px'
            }}
          >
            ➕ Cadastrar Primeiro Cliente
          </button>
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
          gap: '20px'
        }}>
          {clients.map((client) => (
            <div key={client.id} style={{
              background: 'white',
              padding: '25px',
              borderRadius: '12px',
              border: '1px solid #e9ecef',
              boxShadow: '0 4px 6px rgba(0,0,0,0.05)',
              transition: 'transform 0.2s, box-shadow 0.2s',
              cursor: 'pointer'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 6px 12px rgba(0,0,0,0.1)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 4px 6px rgba(0,0,0,0.05)';
            }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                marginBottom: '15px'
              }}>
                <h4 style={{ 
                  margin: 0, 
                  color: '#2c3e50',
                  fontSize: '18px',
                  fontWeight: '600'
                }}>
                  {client.fullName}
                </h4>
                <span style={{
                  background: client.status === 'lead' ? '#fff3cd' : 
                             client.status === 'client' ? '#d4edda' : '#f8d7da',
                  color: client.status === 'lead' ? '#856404' : 
                        client.status === 'client' ? '#155724' : '#721c24',
                  padding: '4px 12px',
                  borderRadius: '15px',
                  fontSize: '12px',
                  fontWeight: '600',
                  textTransform: 'capitalize'
                }}>
                  {client.status || 'lead'}
                </span>
              </div>
              
              <div style={{ color: '#6c757d', fontSize: '14px' }}>
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  marginBottom: '8px' 
                }}>
                  <span style={{ marginRight: '8px' }}>📧</span>
                  <span>{client.email || 'Email não informado'}</span>
                </div>
                
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  marginBottom: '8px' 
                }}>
                  <span style={{ marginRight: '8px' }}>📞</span>
                  <span>{client.phones?.[0] || 'Telefone não informado'}</span>
                </div>
                
                <div style={{ 
                  marginTop: '15px', 
                  fontSize: '12px', 
                  color: '#adb5bd',
                  borderTop: '1px solid #e9ecef',
                  paddingTop: '10px'
                }}>
                  📅 Cadastrado em: {client.createdAt?.toDate?.()?.toLocaleDateString('pt-BR') || 'Data não disponível'}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default ClientList;
