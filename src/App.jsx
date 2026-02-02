import React, { useState, useEffect } from 'react';
import { db, auth } from './firebase/config';
import { collection, addDoc, getDocs, query, where, updateDoc, doc } from 'firebase/firestore';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import Login from './components/Login';

// FORÇAR ESTILO TAILWIND
const TailwindStyle = () => (
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" />
);

function App() {
    const [user, setUser] = useState(null);
    const [clients, setClients] = useState([]);
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

    // FUNÇÃO PARA MUDAR O STATUS NO FIREBASE
    const updateStatus = async (clientId, newStatus) => {
        try {
            const clientRef = doc(db, 'clients', clientId);
            await updateDoc(clientRef, { status: newStatus });
            loadClients(user.uid); // Recarrega a lista para mostrar a mudança
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

    const getStatusColor = (status) => {
        switch(status) {
            case 'AGENDADO': return 'bg-purple-600 text-white';
            case 'PROPOSTA': return 'bg-orange-500 text-white';
            case 'FECHADO': return 'bg-green-600 text-white';
            default: return 'bg-blue-600 text-white';
        }
    };

    if (loading) return <div className="flex justify-center items-center h-screen font-bold text-blue-900">Carregando Lopes Prime CRM...</div>;
    if (!user) return <Login onLogin={setUser} />;

    return (
        <div className="min-h-screen bg-gray-100 font-sans text-gray-900 pb-10">
            <TailwindStyle />
            
            <header className="bg-blue-900 text-white shadow-xl p-5">
                <div className="max-w-6xl mx-auto flex justify-between items-center">
                    <h1 className="text-2xl font-black tracking-tighter">🏠 CRM LOPES PRIME</h1>
                    <button onClick={() => signOut(auth)} className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded-lg text-xs font-bold transition-all shadow-md">SAIR</button>
                </div>
            </header>

            <nav className="bg-white border-b sticky top-0 z-10 flex justify-center gap-4 text-xs sm:text-sm font-bold shadow-sm">
                <button onClick={() => setActiveTab('clients')} className={`py-5 px-4 border-b-4 transition-all ${activeTab === 'clients' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-400'}`}>
                    👥 MEUS CLIENTES ({clients.length})
                </button>
                <button onClick={() => setActiveTab('add')} className={`py-5 px-4 border-b-4 transition-all ${activeTab === 'add' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-400'}`}>
                    ➕ NOVO CADASTRO
                </button>
            </nav>

            <main className="max-w-6xl mx-auto p-4 mt-6">
                {activeTab === 'clients' ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {clients.map(client => (
                            <div key={client.id} className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-xl transition-shadow">
                                <div className="p-5">
                                    <div className="flex justify-between items-start mb-3">
                                        <h3 className="font-black text-blue-900 text-lg leading-tight uppercase">{client.fullName}</h3>
                                        <span className={`text-[10px] font-black px-2 py-1 rounded-md uppercase ${getStatusColor(client.status)}`}>
                                            {client.status || 'LEAD'}
                                        </span>
                                    </div>
                                    
                                    <div className="bg-yellow-50 border-l-4 border-yellow-400 p-3 mb-4 rounded-r-lg">
                                        <p className="text-[10px] uppercase font-bold text-yellow-700 italic">"{client.propertyInterest}"</p>
                                    </div>

                                    {/* SELETOR DE STATUS */}
                                    <div className="mb-4">
                                        <label className="text-[10px] font-bold text-gray-400 uppercase block mb-1">Mudar Status:</label>
                                        <select 
                                            value={client.status} 
                                            onChange={(e) => updateStatus(client.id, e.target.value)}
                                            className="w-full p-2 bg-gray-50 border border-gray-200 rounded-lg text-xs font-bold outline-none focus:border-blue-500"
                                        >
                                            <option value="LEAD">LEAD (Novo)</option>
                                            <option value="AGENDADO">AGENDADO (Visita)</option>
                                            <option value="PROPOSTA">PROPOSTA (Negócio)</option>
                                            <option value="FECHADO">FECHADO (Venda)</option>
                                        </select>
                                    </div>

                                    <div className="space-y-1 mb-5 text-sm text-gray-600">
                                        <p>📧 {client.email || 'Sem e-mail'}</p>
                                        <p className="font-bold text-gray-800 font-lg">📞 {client.phones?.[0]}</p>
                                    </div>
                                    
                                    <a href={`https://wa.me/55${client.phones?.[0]?.replace(/\D/g,'')}`} target="_blank" rel="noreferrer" 
                                       className="flex items-center justify-center w-full bg-green-500 hover:bg-green-600 text-white font-black py-3 rounded-xl shadow-lg transition-transform active:scale-95 text-sm">
                                        WHATSAPP
                                    </a>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="max-w-xl mx-auto bg-white p-8 rounded-3xl shadow-2xl border border-gray-100">
                        <h2 className="text-3xl font-black mb-6 text-gray-800 uppercase tracking-tighter">Novo Cadastro</h2>
                        <div className="space-y-4">
                            <input type="text" placeholder="Nome Completo" value={name} onChange={e => setName(e.target.value)} className="w-full p-4 bg-gray-50 border-2 border-gray-100 rounded-xl outline-none focus:border-blue-500 font-bold" />
                            <input type="text" placeholder="WhatsApp (219XXXXXXXX)" value={phone} onChange={e => setPhone(e.target.value)} className="w-full p-4 bg-gray-50 border-2 border-gray-100 rounded-xl outline-none focus:border-blue-500 font-bold" />
                            <input type="email" placeholder="E-mail (opcional)" value={email} onChange={e => setEmail(e.target.value)} className="w-full p-4 bg-gray-50 border-2 border-gray-100 rounded-xl outline-none focus:border-blue-500 font-bold" />
                            <input type="text" placeholder="Imóvel / Perfil de interesse" value={propertyInterest} onChange={e => setPropertyInterest(e.target.value)} className="w-full p-4 bg-yellow-50 border-2 border-yellow-100 rounded-xl outline-none focus:border-yellow-400 font-bold" />
                            <button onClick={addClient} className="w-full bg-blue-800 hover:bg-blue-900 text-white font-black py-4 rounded-2xl shadow-xl transition-all transform hover:-translate-y-1 mt-4">SALVAR CLIENTE</button>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}

export default App;
