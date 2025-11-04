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

    // Adicionar client - VAMOS CRIAR
    const addClient = async () => {
        try {
            await addDoc(collection(db, 'clients'), {
                name: name,
                email: email,
                phone: phone,
                corretorId: user.uid,
                createdAt: new Date()
            });
            // Limpar campos
            setName('');
            setEmail('');
            setPhone('');
            // Recarregar lista
            loadClients();
        } catch (error) {
            console.error("Erro ao adicionar client:", error);
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
                    placeholder="Telefone"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    style={{ margin: '5px', padding: '8px' }}
                />
                <button 
                    onClick={addClient}
                    style={{ margin: '5px', padding: '8px' }}
                >
                    Adicionar Cliente
                </button>
            </div>

            {/* Botão para carregar clients */}
            <button onClick={loadClients}>Carregar Clientes</button>

            {/* Lista de clients */}
            <div>
                <h2>Clientes Cadastrados</h2>
                {clients.map(client => (
                    <div key={client.id} style={{ border: '1px solid #ccc', padding: '10px', margin: '5px' }}>
                        <p><strong>Nome:</strong> {client.name}</p>
                        <p><strong>Email:</strong> {client.email}</p>
                        <p><strong>Telefone:</strong> {client.phone}</p>
                    </div>
                ))}
            </div>
        </div>
    );
}

export default App;
