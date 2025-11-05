import React, { useState } from 'react';
import { db } from './firebase/config';
import { collection, addDoc, getDocs } from 'firebase/firestore';

function App() {
    // Definimos um usuário padrão para simular o login
    const [user, setUser] = useState({ name: 'Corretor Teste', uid: 'user123' });
    const [clients, setClients] = useState([]);
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');

    // Carregar clients - CORRIGIDO
    // Esta função está correta, busca todos os clientes e atualiza o estado
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
            alert("Erro ao carregar clientes: " + error.message);
        }
    };

    // Adicionar client - CORRIGIDO (Versão Aprimorada)
    const addClient = async () => {
        // Validação básica
        if (!name.trim() || !email.trim() || !phone.trim()) {
            alert('❌ Preencha todos os campos obrigatórios!');
            return;
        }

        try {
            await addDoc(collection(db, 'clients'), {
                fullName: name,          // ← AGORA SALVA COMO 'fullName'
                email: email,
                phones: [phone],         // ← AGORA SALVA COMO 'phones' (array)
                status: "lead",          // ← ADICIONAMOS O CAMPO 'status'
                assignedAgent: user.uid, // ← USANDO 'assignedAgent'
                createdAt: new Date(),
                lastContact: new Date()  // ← ADICIONAMOS O CAMPO 'lastContact'
            });
            
            alert("✅ Cliente adicionado com sucesso!");

            // Limpar campos
            setName('');
            setEmail('');
            setPhone('');
            // Recarregar lista para mostrar o novo cliente
            loadClients(); 
        } catch (error) {
            console.error("Erro ao adicionar client:", error);
            alert("❌ Erro ao adicionar cliente: " + error.message);
        }
    };

    return (
        <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
            <h1 style={{ color: '#2c3e50' }}>🏠 CRM Corretor</h1>
            
            {/* Formulário para adicionar client */}
            <div style={{ marginBottom: '30px', padding: '15px', border: '1px solid #ddd', borderRadius: '8px' }}>
                <h2 style={{ borderBottom: '2px solid #3498db', paddingBottom: '10px', color: '#3498db' }}>➕ Adicionar Cliente</h2>
                <input 
                    type="text" 
                    placeholder="Nome completo (fullName)"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    style={{ margin: '5px', padding: '10px', width: '200px', border: '1px solid #ccc', borderRadius: '4px' }}
                />
                <input 
                    type="email" 
                    placeholder="Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    style={{ margin: '5px', padding: '10px', width: '200px', border: '1px solid #ccc', borderRadius: '4px' }}
                />
                <input 
                    type="text" 
                    placeholder="Telefone (phones[0])"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    style={{ margin: '5px', padding: '10px', width: '200px', border: '1px solid #ccc', borderRadius: '4px' }}
                />
                <button 
                    onClick={addClient}
                    style={{ margin: '5px', padding: '10px 15px', background: '#28a745', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
                >
                    💾 Adicionar Cliente
                </button>
            </div>

            {/* Botão para carregar clients */}
            <button 
                onClick={loadClients}
                style={{ marginBottom: '20px', padding: '10px 15px', background: '#007bff', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
            >
                🔄 Carregar Clientes do Firebase
            </button>

            {/* Lista de clients - CORRIGIDO para ler os novos campos */}
            <div>
                <h2 style={{ color: '#e67e22' }}>📋 Clientes Cadastrados ({clients.length})</h2>
                {clients.map(client => (
                    <div 
                        key={client.id} 
                        style={{ 
                            border: '1px solid #ccc', 
                            padding: '15px', 
                            margin: '10px 0', 
                            borderRadius: '8px', 
                            background: '#f8f9fa' 
                        }}
                    >
                        {/* ATENÇÃO: Mudança para client.fullName e client.phones[0] */}
                        <p style={{ margin: 0 }}><strong>Nome:</strong> {client.fullName}</p>
                        <p style={{ margin: '5px 0' }}><strong>Email:</strong> {client.email}</p>
                        <p style={{ margin: '5px 0' }}><strong>Telefone:</strong> {client.phones && client.phones.length > 0 ? client.phones[0] : 'N/A'}</p>
                        <small style={{ display: 'block', marginTop: '10px', color: '#5e5e5e' }}>
                             Status: **{client.status || 'Não definido'}** | Corretor ID: {client.assignedAgent || 'N/A'}
                        </small>
                    </div>
                ))}
            </div>
        </div>
    );
}

export default App;
