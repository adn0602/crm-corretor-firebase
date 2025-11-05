import React, { useState } from 'react';
import { db } from './firebase/config';
import { collection, addDoc, getDocs } from 'firebase/firestore';

function App() {
    const [user, setUser] = useState({ name: 'Corretor Teste', uid: 'user123' });
    const [clients, setClients] = useState([]);
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');

    // Carregar clients - CORRIGIDO
    const loadClients = async () => {
        try {
            const querySnapshot = await getDocs(collection(db, 'clients'));
            const clientList = querySnapshot.docs.map(doc => ({ 
                id: doc.id, 
                ...doc.data() 
            }));
            setClients(clientList);
        } catch (error) {
            console.error("Erro ao carregar clients:", error);
        }
    };

    // Adicionar client - CORRIGIDO
    const addClient = async () => {
        // Validação básica
        if (!name.trim() || !email.trim() || !phone.trim()) {
            alert('Preencha todos os campos!');
            return;
        }
        
        try {
            await addDoc(collection(db, 'clients'), {
                fullName: name,          // ← AGORA COMBINA COM FIREBASE (MUDOU de 'name')
                email: email,
                phones: [phone],         // ← AGORA É ARRAY COMO NO FIREBASE (MUDOU de 'phone')
                status: "lead",          // ← ADICIONAMOS ESTE CAMPO
                assignedAgent: user.uid, // ← CORRIGIDO O NOME (MUDOU de 'corretorId')
                createdAt: new Date(),
                lastContact: new Date()  // ← ADICIONAMOS ESTE CAMPO
            });
            
            alert("Cliente adicionado com sucesso!");

            // Limpar campos
            setName('');
            setEmail('');
            setPhone('');
            // Recarregar lista
            loadClients();
        } catch (error) {
            console.error("Erro ao adicionar client:", error);
            alert("Erro ao adicionar cliente: " + error.message);
        }
    };

    return (
        <div style={{ padding: '20px' }}>
            <h1>CRM Corretor</h1>
            
            {/* Formulário para adicionar client */}
            <div style={{ marginBottom: '20px' }}>
                <h2>Adicionar Cliente</h2>
                <input 
                    type="text" 
                    placeholder="Nome"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    style={{ margin: '5px', padding: '8px' }}
                />
                <input 
                    type="email" 
                    placeholder="Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    style={{ margin: '5px', padding: '8px' }}
                />
                <input 
                    type="text" 
                    placeholder="Telefone (DDD + Número)"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    style={{ margin: '5px', padding: '8px' }}
                />
                <button 
                    onClick={addClient}
                    style={{ margin: '5px', padding: '8px', background: '#28a745', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                >
                    💾 Adicionar Cliente
                </button>
            </div>

            <hr style={{ margin: '20px 0' }} />

            {/* Botão para carregar clients */}
            <button 
                onClick={loadClients}
                style={{ marginBottom: '15px', padding: '10px 15px', background: '#007bff', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
            >
                🔄 Carregar Clientes
            </button>

            {/* Lista de clients */}
            <div>
                <h2>📋 Clientes Cadastrados ({clients.length})</h2>
                {clients.length === 0 ? (
                    <p>Nenhum cliente encontrado. Clique em "Carregar Clientes".</p>
                ) : (
                    <div style={{ display: 'grid', gap: '10px' }}>
                        {clients.map(client => (
                            <div key={client.id} style={{ 
                                border: '1px solid #ddd', 
                                padding: '15px', 
                                borderRadius: '8px',
                                background: '#f8f9fa'
                            }}>
                                <p style={{ margin: 0 }}><strong>Nome:</strong> {client.fullName}</p>
                                <p style={{ margin: '5px 0' }}><strong>Email:</strong> {client.email}</p>
                                <p style={{ margin: 0 }}><strong>Telefone:</strong> {client.phones ? client.phones.join(', ') : 'N/A'}</p>
                                <small style={{ display: 'block', marginTop: '5px', color: '#6c757d' }}>
                                    Status: **{client.status || 'N/A'}** | Corretor: {client.assignedAgent || 'N/A'}
                                </small>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

export default App;
