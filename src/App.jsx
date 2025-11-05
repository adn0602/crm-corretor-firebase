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
    const [activeTab, setActiveTab] = useState('clients');
    const [loading, setLoading] = useState(true); // ← ADICIONADO: Estado de Loading

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
            setLoading(false); // ← ADICIONADO: Desativa o loading após a verificação
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
                assignedAgent: user.uid,
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
        } catch (error) {
            alert('❌ Erro ao fazer logout: ' + error.message);
        }
    };

    // ADICIONADO: Exibição da tela de loading
    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    {/* Estilo simples de loading com Tailwind */}
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-imobiliaria-primary mx-auto"></div>
                    <p className="mt-4 text-gray-600">Carregando...</p>
                </div>
            </div>
        );
    }

    // Se não tem usuário logado, mostra tela de login
    if (!user) {
        return <Login onLogin={setUser} />;
    }

    // Se tem usuário logado, mostra o CRM
    return (
        <div className="min-h-screen bg-gray-50">
            {/* ... restante do JSX ... */}
            {/* Header */}
            <header className="bg-white shadow-sm border-b">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        <div className="flex items-center">
                            <div className="bg-imobiliaria-primary rounded-lg p-2 mr-3">
                                <span className="text-white text-xl">🏠</span>
                            </div>
                            <h1 className="text-2xl font-bold text-gray-900">CRM Imobiliário</h1>
                        </div>
                        
                        <div className="flex items-center space-x-4">
                            <div className="text-right">
                                <p className="text-sm font-medium text-gray-900">{user.email}</p>
                                <p className="text-xs text-gray-500">Corretor</p>
                            </div>
                            <button 
                                onClick={handleLogout}
                                className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition duration-200"
                            >
                                Sair
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            {/* Navigation Tabs */}
            <div className="bg-white border-b">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <nav className="flex space-x-8">
                        <button
                            onClick={() => setActiveTab('clients')}
                            className={`py-4 px-1 border-b-2 font-medium text-sm ${
                                activeTab === 'clients'
                                ? 'border-imobiliaria-primary text-imobiliaria-primary'
                                : 'border-transparent text-gray-500 hover:text-gray-700'
                            }`}
                        >
                            👥 Meus Clientes
                        </button>
                        <button
                            onClick={() => setActiveTab('add')}
                            className={`py-4 px-1 border-b-2 font-medium text-sm ${
                                activeTab === 'add'
                                ? 'border-imobiliaria-primary text-imobiliaria-primary'
                                : 'border-transparent text-gray-500 hover:text-gray-700'
                            }`}
                        >
                            ➕ Novo Cliente
                        </button>
                    </nav>
                </div>
            </div>

            {/* Main Content */}
            <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <div className="card">
                        <div className="flex items-center">
                            <div className="bg-blue-100 rounded-lg p-3 mr-4">
                                <span className="text-blue-600 text-xl">👥</span>
                            </div>
                            <div>
                                <p className="text-sm font-medium text-gray-600">Total de Clientes</p>
                                <p className="text-2xl font-bold text-gray-900">{clients.length}</p>
                            </div>
                        </div>
                    </div>
                    
                    <div className="card">
                        <div className="flex items-center">
                            <div className="bg-green-100 rounded-lg p-3 mr-4">
                                <span className="text-green-600 text-xl">🔥</span>
                            </div>
                            <div>
                                <p className="text-sm font-medium text-gray-600">Leads Ativos</p>
                                <p className="text-2xl font-bold text-gray-900">
                                    {clients.filter(c => c.status === 'lead').length}
                                </p>
                            </div>
                        </div>
                    </div>
                    
                    <div className="card">
                        <div className="flex items-center">
                            <div className="bg-purple-100 rounded-lg p-3 mr-4">
                                <span className="text-purple-600 text-xl">📅</span>
                            </div>
                            <div>
                                <p className="text-sm font-medium text-gray-600">Contato Hoje</p>
                                <p className="text-2xl font-bold text-gray-900">0</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Conteúdo das Abas */}
                {activeTab === 'clients' && (
                    <div className="card">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-semibold text-gray-900">Meus Clientes</h2>
                            <button 
                                onClick={() => loadClients(user.uid)}
                                className="btn-secondary"
                            >
                                🔄 Atualizar Lista
                            </button>
                        </div>

                        {clients.length === 0 ? (
                            <div className="text-center py-12">
                                <div className="text-6xl mb-4">🏠</div>
                                <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum cliente cadastrado</h3>
                                <p className="text-gray-500 mb-4">Comece adicionando seu primeiro cliente!</p>
                                <button 
                                    onClick={() => setActiveTab('add')}
                                    className="btn-primary"
                                >
                                    ➕ Adicionar Primeiro Cliente
                                </button>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {clients.map(client => (
                                    <div key={client.id} className="card hover:shadow-xl transition duration-300">
                                        <div className="flex justify-between items-start mb-4">
                                            <h3 className="font-semibold text-lg text-gray-900 truncate">
                                                {client.fullName}
                                            </h3>
                                            <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                                                {client.status || 'lead'}
                                            </span>
                                        </div>
                                        
                                        <div className="space-y-2">
                                            <div className="flex items-center text-gray-600">
                                                <span className="mr-2">📧</span>
                                                <span className="truncate">{client.email}</span>
                                            </div>
                                            <div className="flex items-center text-gray-600">
                                                <span className="mr-2">📱</span>
                                                <span>{client.phones && client.phones.length > 0 ? client.phones[0] : 'N/A'}</span>
                                            </div>
                                        </div>
                                        
                                        <div className="mt-4 pt-4 border-t border-gray-200">
                                            <div className="flex justify-between text-sm text-gray-500">
                                                <span>Cadastro:</span>
                                                <span>{client.createdAt?.toDate?.().toLocaleDateString('pt-BR') || 'N/A'}</span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'add' && (
                    <div className="card">
                        <h2 className="text-xl font-semibold text-gray-900 mb-6">Adicionar Novo Cliente</h2>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Nome Completo *
                                </label>
                                <input 
                                    type="text" 
                                    placeholder="Ex: João Silva"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    className="input-field"
                                />
                            </div>
                            
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Email *
                                </label>
                                <input 
                                    type="email" 
                                    placeholder="Ex: joao@email.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="input-field"
                                />
                            </div>
                            
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Telefone *
                                </label>
                                <input 
                                    type="text" 
                                    placeholder="Ex: (11) 99999-9999"
                                    value={phone}
                                    onChange={(e) => setPhone(e.target.value)}
                                    className="input-field"
                                />
                            </div>
                        </div>

                        <div className="mt-8 flex space-x-4">
                            <button 
                                onClick={addClient}
                                className="btn-primary"
                            >
                                💾 Salvar Cliente
                            </button>
                            <button 
                                onClick={() => setActiveTab('clients')}
                                className="bg-gray-500 hover:bg-gray-600 text-white font-medium py-2 px-4 rounded-lg transition duration-200"
                            >
                                ← Voltar para Lista
                            </button>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}

export default App;
