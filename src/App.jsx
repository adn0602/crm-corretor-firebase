import React, { useState, useEffect } from 'react';
import { db, auth } from './firebase/config';
import { collection, addDoc, getDocs, query, where, updateDoc, doc, deleteDoc } from 'firebase/firestore';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import Login from './components/Login';

const TailwindStyle = () => (
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" />
);

function App() {
    const [user, setUser] = useState(null);
    const [clients, setClients] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [propertyInterest, setPropertyInterest] = useState('');
    const [activeTab, setActiveTab] = useState('clients');
    const [loading, setLoading] = useState(true);

    const loadClients = async (userId) => {
        try {
            const q = query(collection(db, 'clients'), where("assignedAgent", "==", userId));
            const querySnapshot = await getDocs(q);
            const clientList = querySnapshot.docs.map(d => ({ id: d.id, ...d.data() }));
            clientList.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
            setClients(clientList);
        } catch (error) {
            console.error("Erro ao carregar:", error);
        }
    };

    // FUNÇÃO PARA EXCLUIR CLIENTE
    const deleteClient = async (clientId, clientName) => {
        const confirmacao = window.confirm(`⚠️ Atenção: Tem certeza que deseja excluir o cliente ${clientName}? Esta ação não pode ser desfeita.`);
        if (confirmacao) {
            try {
                await deleteDoc(doc(db, 'clients', clientId));
                alert("🗑️ Cliente excluído com sucesso.");
                loadClients(user.uid);
            } catch (error) {
                alert("Erro ao excluir: " + error.message);
            }
        }
    };

    const updateStatus = async (clientId, newStatus) => {
        try {
            const clientRef = doc(db, 'clients', clientId);
            await updateDoc(clientRef, { status: newStatus });
            loadClients(user.uid);
        } catch (error) {
            alert("Erro ao atualizar status: " + error.message);
        }
    };

    const addClient = async () => {
        if (!name.trim() || !phone.trim() || !propertyInterest.trim()) {
            alert('❌ Nome, Telefone e Imóvel são obrigatórios!');
            return;
        }
        try {
            await addDoc(collection(db, 'clients'), {
                fullName: name,
                email: email,
                phones: [phone],
                propertyInterest: propertyInterest,
                status: "LEAD",
                assignedAgent: user.uid,
                createdAt: new Date()
            });
            alert("✅ Cliente cadastrado!");
            setName(''); setEmail(''); setPhone(''); setPropertyInterest('');
            loadClients(user.uid);
            setActiveTab('clients');
        } catch (error) {
            alert("❌ Erro: " + error.message);
        }
    };

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (u) => {
            if (u) { setUser(u); loadClients(u.uid); }
            else { setUser(null); }
            setLoading(false);
        });
        return () => unsubscribe();
    }, []);

    const filteredClients = clients.filter(client => 
        (client.fullName || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (client.propertyInterest || "").toLowerCase().includes(searchTerm.toLowerCase())
    );

    const getStatusColor = (status) => {
        switch(status) {
            case 'AGENDADO': return 'bg-purple-600 text-white';
            case 'PROPOSTA': return 'bg-orange-500 text-white';
            case 'FECHADO': return 'bg-green-600 text-white';
            default: return 'bg-blue-600 text-white';
        }
    };

    if (loading) return <div className="flex justify-center items-center h-screen font-bold text-blue-900">CARREGANDO...</div>;
    if (!user) return <Login onLogin={setUser} />;

    return (
        <div className="min-h-screen bg-gray-100 pb-10">
            <TailwindStyle />
            <header className="bg-blue-900 text-white p-5 shadow-lg">
                <div className="max-w-6xl mx-auto flex justify-between items-center">
                    <h1 className="text-xl font-bold uppercase tracking-tighter italic">🏠 CRM Lopes Prime</h1>
                    <button onClick={() => signOut(auth)} className="bg-red-600 px-4 py-2 rounded font-bold text-[10px] tracking-widest">SAIR</button>
                </div>
            </header>

            <nav className="bg-white border-b flex justify-center shadow-sm">
                <button onClick={() => setActiveTab('clients')} className={`py-4 px-6 border-b-4 font-bold text-xs ${activeTab === 'clients' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-400'}`}>
                    👥 MEUS CLIENTES ({clients.length})
                </button>
                <button onClick={() => setActiveTab('add')} className={`py-4 px-6 border-b-4 font-bold text-xs ${activeTab === 'add' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-400'}`}>
                    ➕ NOVO CADASTRO
                </button>
            </nav>

            <main className="max-w-6xl mx-auto p-4 mt-6">
                {activeTab === 'clients' ? (
                    <>
                        <div className="mb-6 max-w-md mx-auto">
                            <input 
                                type="text" 
                                placeholder="🔍 Pesquisar por nome ou imóvel..." 
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full p-4 bg-white border-2 border-gray-100 rounded-2xl outline-none focus:border-blue-500 font-bold shadow-sm"
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {filteredClients.map(client => (
                                <div key={client.id} className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden relative group">
                                    {/* BOTÃO EXCLUIR NO CANTO */}
                                    <button 
                                        onClick={() => deleteClient(client.id, client.fullName)}
                                        className="absolute top-2 right-2 text-gray-300 hover:text-red-500 transition-colors p-1"
                                        title="Excluir Cliente"
                                    >
                                        <span className="text-lg">🗑️</span>
                                    </button>

                                    <div className="p-5">
                                        <div className="flex justify-between items-start mb-3 mt-2">
                                            <h3 className="font-black text-blue-900 uppercase truncate pr-6">{client.fullName}</h3>
                                            <span className={`text-[9px] font-black px-2 py-1 rounded uppercase shrink-0 ${getStatusColor(client.status)}`}>
                                                {client.status || 'LEAD'}
                                            </span>
                                        </div>
                                        
                                        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-2 mb-4 rounded-r shadow-inner">
                                            <p className="text-[10px] font-bold text-gray-800 uppercase italic">"{client.propertyInterest}"</p>
                                        </div>

                                        <div className="mb-4">
                                            <label className="text-[10px] font-bold text-gray-400 uppercase block mb-1">Mudar Status:</label>
                                            <select 
                                                value={client.status || 'LEAD'} 
                                                onChange={(e) => updateStatus(client.id, e.target.value)}
                                                className="w-full p-2 bg-gray-50 border rounded-lg text-xs font-bold"
                                            >
                                                <option value="LEAD">LEAD (Novo)</option>
                                                <option value="AGENDADO">AGENDADO (Visita)</option>
                                                <option value="PROPOSTA">PROPOSTA (Negócio)</option>
                                                <option value="FECHADO">FECHADO (Venda)</option>
                                            </select>
                                        </div>

                                        <div className="text-xs text-gray-600 mb-4 border-t pt-3">
                                            <p className="truncate">📧 {client.email || 'Sem e-mail'}</p>
                                            <p className="font-black text-gray-800 text-sm mt-1">📞 {client.phones?.[0]}</p>
                                        </div>
                                        
                                        <a href={`https://wa.me/55${client.phones?.[0]?.replace(/\D/g,'')}`} target="_blank" rel="noreferrer" 
                                           className="flex items-center justify-center w-full bg-green-500 hover:bg-green-600 text-white font-black py-3 rounded-xl shadow-md transition-all active:scale-95 text-xs tracking-widest uppercase">
                                            Abrir WhatsApp
                                        </a>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </>
                ) : (
                    <div className="max-w-lg mx-auto bg-white p-8 rounded-3xl shadow-2xl border border-gray-100">
                        <h2 className="text-2xl font-black mb-6 text-gray-800 uppercase italic tracking-tighter">Novo Cadastro</h2>
                        <div className="space-y-4">
                            <input type="text" placeholder="Nome Completo" value={name} onChange={e => setName(e.target.value)} className="w-full p-4 bg-gray-50 border rounded-xl font-bold outline-none focus:border-blue-500" />
                            <input type="text" placeholder="WhatsApp (219XXXXXXXX)" value={phone} onChange={e => setPhone(e.target.value)} className="w-full p-4 bg-gray-50 border rounded-xl font-bold outline-none focus:border-blue-500" />
                            <input type="email" placeholder="E-mail (opcional)" value={email} onChange={e => setEmail(e.target.value)} className="w-full p-4 bg-gray-50 border rounded-xl font-bold outline-none focus:border-blue-500" />
                            <input type="text" placeholder="Empreendimento / Perfil de interesse" value={propertyInterest} onChange={e => setPropertyInterest(e.target.value)} className="w-full p-4 bg-yellow-50 border rounded-xl font-bold outline-none focus:border-yellow-400" />
                            <button onClick={addClient} className="w-full bg-blue-800 text-white font-black py-4 rounded-2xl shadow-xl hover:bg-blue-900 transition-all uppercase tracking-widest">Salvar Cliente</button>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}

export default App;
