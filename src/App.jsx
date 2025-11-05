import React, { useState, useEffect } from 'react';
import { db, auth } from './firebase/config';
import { collection, addDoc, getDocs, query, where } from 'firebase/firestore';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import Login from './components/Login';

function App() {
    const [user, setUser] = useState(null);
    const [clients, setClients] = useState([]);
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');

    // Verificar se usuário já está logado
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            if (user) {
                setUser(user);
                loadClients(user.uid);
            } else {
                setUser(null);
                setClients([]);
            }
        });
        return () => unsubscribe();
    }, []);

    // Carregar clients APENAS do usuário logado
    const loadClients = async (userId) => {
        try {
            const q = query(
                collection(db, 'clients'), 
                where("assignedAgent", "==", userId)
            );
            const querySnapshot = await getDocs(q);
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

    // Adicionar client
    const addClient = async () => {
        if (!name.trim() || !email.trim() || !phone.trim()) {
            alert('❌ Preencha todos os campos obrigatórios!');
            return;
        }

        try {
            await addDoc(collection(db, 'clients'), {
                fullName: name,
                email: email,
                phones: [phone],
                status: "lead",
                assignedAgent: user.uid, // Agora usa o ID REAL do usuário
                createdAt: new Date(),
                lastContact: new Date()
            });
            
            alert("✅ Cliente adicionado com sucesso!");
            setName('');
            setEmail('');
            setPhone('');
            loadClients(user.uid);
        } catch (error) {
            console.error("Erro ao adicionar client:", error);
            alert("❌ Erro ao adicionar cliente: " + error.message);
        }
    };

    // Logout
    const handleLogout = async () => {
        try {
            await signOut(auth);
            alert('👋 Logout realizado!');
        } catch (error) {
            alert('❌ Erro ao fazer logout: ' + error.message);
        }
    };

    // Se não tem usuário logado, mostra tela de login
    if (!user) {
        return <Login onLogin={setUser} />;
    }

    // Se tem usuário logado, mostra o CRM
    return (
        <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
            {/* Cabeçalho com info do usuário */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h1 style={{ color: '#2c3e50', margin: 0 }}>🏠 CRM Corretor</h1>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span>Olá, <strong>{user.email}</strong></span>
                    <button 
                        onClick={handleLogout}
                        style={{ 
                            padding: '8px 15px', 
                            background: '#e74c3c', 
                            color: 'white', 
                            border: 'none', 
                            borderRadius: '4px', 
                            cursor: 'pointer' 
                        }}
                    >
                        🚪 Sair
                    </button>
                </div>
            </div>
            
            {/* Formulário para adicionar client */}
            <div style={{ marginBottom: '30px', padding: '15px', border: '1px solid #ddd', borderRadius: '8px' }}>
                <h2 style={{ borderBottom: '2px solid #3498db', paddingBottom: '10px', color: '#3498db' }}>➕ Adicionar Cliente</h2>
                <input 
                    type="text" 
                    placeholder="Nome completo"
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
                    placeholder="Telefone"
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
                onClick={() => loadClients(user.uid)}
                style={{ marginBottom: '20px', padding: '10px 15px', background: '#007bff', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
            >
                🔄 Carregar Meus Clientes
            </button>

            {/* Lista de clients */}
            <div>
                <h2 style={{ color: '#e67e22' }}>📋 Meus Clientes ({clients.length})</h2>
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
                        <p style={{ margin: 0 }}><strong>Nome:</strong> {client.fullName}</p>
                        <p style={{ margin: '5px 0' }}><strong>Email:</strong> {client.email}</p>
                        <p style={{ margin: '5px 0' }}><strong>Telefone:</strong> {client.phones && client.phones.length > 0 ? client.phones[0] : 'N/A'}</p>
                        <small style={{ display: 'block', marginTop: '10px', color: '#5e5e5e' }}>
                            Status: <strong>{client.status || 'lead'}</strong>
                        </small>
                    </div>
                ))}
            </div>
        </div>
    );
}

export default App;
