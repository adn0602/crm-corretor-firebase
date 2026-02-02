import React, { useState, useEffect } from 'react';
import { db, auth } from './firebase/config';
import { collection, addDoc, getDocs, query, where } from 'firebase/firestore';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import Login from './components/Login';

// ESTA LINHA ABAIXO VAI FORÇAR O ESTILO A FUNCIONAR NO VERCEL
const TailwindStyle = () => (
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" />
);

function App() {
    const [user, setUser] = useState(null);
    const [clients, setClients] = useState([]);
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [activeTab, setActiveTab] = useState('clients');
    const [loading, setLoading] = useState(true);

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
        }
    };

    const addClient = async () => {
        if (!name.trim() || !email.trim() || !phone.trim()) {
            alert('❌ Preencha todos os campos!');
            return;
        }
        try {
            await addDoc(collection(db, 'clients'), {
                fullName: name,
                email: email,
                phones: [phone],
                status: "lead",
                assignedAgent: user.uid,
                createdAt: new Date()
            });
            alert("✅ Cliente adicionado!");
            setName(''); setEmail(''); setPhone('');
            loadClients(user.uid);
            setActiveTab('clients');
        } catch (error) {
            alert("❌ Erro: " + error.message);
        }
    };

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            if (user) {
                setUser(user);
                loadClients(user.uid);
            } else {
                setUser(null);
            }
            setLoading(false);
        });
        return () => unsubscribe();
    }, []);

    if (loading) return <div className="flex justify-center items-center h-screen">Carregando...</div>;
    if (!user) return <Login onLogin={setUser} />;

    return (
        <div className="min-h-screen bg-gray-100 font-sans text-gray-900">
            <TailwindStyle />
            
            {/* Cabeçalho */}
            <header className="bg-blue-800 text-white shadow-lg p-4">
                <div className="max-w-6xl mx-auto flex justify-between items-center">
                    <h1 className="text-xl font-bold flex items-center">
                        <span className="mr-2">🏠</span> CRM LOPES PRIME
                    </h1>
                    <div className="flex items-center gap-4">
                        <span className="text-sm hidden md:block">{user.email}</span>
                        <button onClick={() => signOut(auth)} className="bg-red-500 hover:bg-red-600 px-3 py-1 rounded text-sm transition">Sair</button>
                    </div>
                </div>
            </header>

            {/* Menu */}
            <nav className="bg-white border-b flex justify-center gap-8 text-sm font-semibold">
                <button onClick={() => setActiveTab('clients')} className={`py-4 px-2 border-b-2 ${activeTab === 'clients' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500'}`}>
                    👥 MEUS CLIENTES
                </button>
                <button onClick={() => setActiveTab('add')} className={`py-4 px-2 border-b-2 ${activeTab === 'add' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500'}`}>
                    ➕ NOVO CLIENTE
                </button>
            </nav>

            <main className="max-w-6xl mx-auto p-4">
                {activeTab === 'clients' ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {clients.length === 0 ? (
                            <p className="col-span-full text-center py-10 text-gray-500">Nenhum cliente encontrado.</p>
                        ) : (
                            clients.map(client => (
                                <div key={client.id} className="bg-white p-5 rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition">
                                    <div className="flex justify-between items-start mb-3">
                                        <h3 className="font-bold text-lg text-blue-900 uppercase">{client.fullName}</h3>
                                        <span className="bg-green-100 text-green-800 text-xs font-bold px-2 py-1 rounded-full uppercase">{client.status}</span>
                                    </div>
                                    <p className="text-gray-600 text-sm mb-1">📧 {client.email}</p>
                                    <p className="text-gray-600 text-sm mb-3">📞 {client.phones?.[0] || 'Sem telefone'}</p>
                                    <div className="border-t pt-3 mt-3">
                                        <a href={`https://wa.me/55${client.phones?.[0]?.replace(/\D/g,'')}`} target="_blank" rel="noreferrer" className="block text-center bg-green-500 hover:bg-green-600 text-white font-bold py-2 rounded-lg text-sm transition">
                                            Falar no WhatsApp
                                        </a>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                ) : (
                    <div className="max-w-md mx-auto bg-white p-8 rounded-2xl shadow-lg border border-gray-100">
                        <h2 className="text-2xl font-bold mb-6 text-gray-800">Novo Cadastro</h2>
                        <div className="space-y-4">
                            <input type="text" placeholder="Nome do Cliente" value={name} onChange={e => setName(e.target.value)} className="w-full p-3 bg-gray-50 border border-gray-300 rounded-lg outline-none focus:border-blue-500" />
                            <input type="email" placeholder="E-mail" value={email} onChange={e => setEmail(e.target.value)} className="w-full p-3 bg-gray-50 border border-gray-300 rounded-lg outline-none focus:border-blue-500" />
                            <input type="text" placeholder="Telefone (com DDD)" value={phone} onChange={e => setPhone(e.target.value)} className="w-full p-3 bg-gray-50 border border-gray-300 rounded-lg outline-none focus:border-blue-500" />
                            <button onClick={addClient} className="w-full bg-blue-700 hover:bg-blue-800 text-white font-bold py-3 rounded-lg shadow-md transition">SALVAR CLIENTE</button>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}

export default App;
