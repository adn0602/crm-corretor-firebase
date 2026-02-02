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
    const [statusFilter, setStatusFilter] = useState('TODOS');
    
    // CAMPOS DO FORMULÁRIO
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [propertyInterest, setPropertyInterest] = useState('');
    const [birthDate, setBirthDate] = useState('');
    const [observations, setObservations] = useState('');

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

    const deleteClient = async (clientId, clientName) => {
        if (window.confirm(`⚠️ EXCLUIR DEFINITIVAMENTE o cliente ${clientName}?`)) {
            try {
                await deleteDoc(doc(db, 'clients', clientId));
                loadClients(user.uid);
            } catch (error) {
                alert("Erro ao excluir: " + error.message);
            }
        }
    };

    const updateStatus = async (clientId, newStatus) => {
        try {
            await updateDoc(doc(db, 'clients', clientId), { status: newStatus });
            loadClients(user.uid);
        } catch (error) {
            alert("Erro ao atualizar status: " + error.message);
        }
    };

    const addClient = async () => {
        if (!name.trim() || !phone.trim()) {
            alert('❌ Nome e Telefone são obrigatórios!');
            return;
        }
        try {
            await addDoc(collection(db, 'clients'), {
                fullName: name,
                email: email,
                phones: [phone],
                propertyInterest: propertyInterest,
                birthDate: birthDate,
                observations: observations,
                status: "LEAD",
                assignedAgent: user.uid,
                createdAt: new Date()
            });
            alert("✅ Cliente cadastrado!");
            setName(''); setEmail(''); setPhone(''); setPropertyInterest(''); setBirthDate(''); setObservations('');
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

    // LÓGICA DE FILTRO (BUSCA + STATUS)
    const filteredClients = clients.filter(client => {
        const matchesSearch = (client.fullName || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
                            (client.propertyInterest || "").toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = statusFilter === 'TODOS' || client.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    const getStatusStyle = (status) => {
        switch(status) {
            case 'AGENDADO': return 'bg-purple-600 text-white';
            case 'PROPOSTA': return 'bg-orange-500 text-white';
            case 'FECHADO': return 'bg-green-600 text-white';
            default: return 'bg-blue-600 text-white';
        }
    };

    if (loading) return <div className="flex justify-center items-center h-screen font-black text-blue-900 animate-bounce text-2xl tracking-tighter">CRM LOPES PRIME...</div>;
    if (!user) return <Login onLogin={setUser} />;

    return (
        <div className="min-h-screen bg-gray-50 pb-20 font-sans text-gray-900">
            <TailwindStyle />
            
            <header className="bg-blue-900 text-white p-6 shadow-2xl sticky top-0 z-30 flex justify-between items-center">
                <h1 className="text-2xl font-black italic tracking-tighter">🏠 CRM LOPES PRIME</h1>
                <button onClick={() => signOut(auth)} className="bg-red-600 hover:bg-red-700 px-5 py-2 rounded-xl font-bold text-xs shadow-lg transition-transform active:scale-95">SAIR</button>
            </header>

            <nav className="bg-white border-b sticky top-20 z-20 flex justify-center gap-2 p-2 shadow-sm">
                <button onClick={() => setActiveTab('clients')} className={`py-3 px-6 rounded-xl font-black text-xs transition-all ${activeTab === 'clients' ? 'bg-blue-100 text-blue-700 shadow-inner' : 'text-gray-400 hover:bg-gray-50'}`}>
                    👥 MEUS CLIENTES ({clients.length})
                </button>
                <button onClick={() => setActiveTab('add')} className={`py-3 px-6 rounded-xl font-black text-xs transition-all ${activeTab === 'add' ? 'bg-blue-100 text-blue-700 shadow-inner' : 'text-gray-400 hover:bg-gray-50'}`}>
                    ➕ NOVO CADASTRO
                </button>
            </nav>

            <main className="max-w-7xl mx-auto p-4 mt-4">
                {activeTab === 'clients' ? (
                    <>
                        {/* BUSCA E FILTROS */}
                        <div className="max-w-4xl mx-auto mb-8 space-y-4">
                            <input 
                                type="text" 
                                placeholder="🔍 Pesquisar por nome ou imóvel..." 
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full p-5 bg-white border-2 border-gray-100 rounded-2xl outline-none focus:border-blue-500 font-bold shadow-md"
                            />
                            
                            <div className="flex flex-wrap justify-center gap-2">
                                {['TODOS', 'LEAD', 'AGENDADO', 'PROPOSTA', 'FECHADO'].map(f => (
                                    <button 
                                        key={f} 
                                        onClick={() => setStatusFilter(f)}
                                        className={`px-4 py-2 rounded-full text-[10px] font-black transition-all border-2 ${statusFilter === f ? 'bg-blue-900 text-white border-blue-900 shadow-lg' : 'bg-white text-gray-400 border-gray-100 hover:border-blue-200'}`}
                                    >
                                        {f}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {filteredClients.map(client => (
                                <div key={client.id} className="bg-white rounded-3xl shadow-lg border border-gray-100 overflow-hidden relative flex flex-col hover:shadow-2xl transition-all border-t-8 border-blue-900">
                                    <div className="p-6 flex-grow">
                                        <div className="flex justify-between items-start mb-4">
                                            <h3 className="font-black text-blue-900 text-xl uppercase leading-none truncate mr-2">{client.fullName}</h3>
                                            <span className={`text-[9px] font-black px-3 py-1.5 rounded-lg uppercase whitespace-nowrap shadow-sm ${getStatusStyle(client.status)}`}>
                                                {client.status || 'LEAD'}
                                            </span>
                                        </div>

                                        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-3 mb-4 rounded-r-xl">
                                            <p className="text-[9px] font-black text-yellow-700 uppercase leading-none mb-1">Interesse</p>
                                            <p className="text-sm font-black text-gray-800 uppercase italic leading-tight">"{client.propertyInterest || 'Geral'}"</p>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4 mb-4 text-[10px] font-bold text-gray-500 uppercase">
                                            <div>
                                                <p className="mb-1 text-blue-800">🎂 Nascimento</p>
                                                <p className="text-gray-800 bg-gray-50 p-2 rounded-lg">{client.birthDate ? new Date(client.birthDate).toLocaleDateString('pt-BR') : 'Não inf.'}</p>
                                            </div>
                                            <div>
                                                <p className="mb-1 text-green-700">📞 WhatsApp</p>
                                                <p className="text-gray-800 bg-gray-50 p-2 rounded-lg">{client.phones?.[0]}</p>
                                            </div>
                                        </div>

                                        <div className="mb-4">
                                            <p className="text-[9px] font-black text-gray-400 uppercase mb-1 ml-1">Anotações / Próximos Passos</p>
                                            <div className="bg-gray-50 p-3 rounded-xl text-xs font-semibold text-gray-700 border border-gray-100 h-20 overflow-y-auto italic">
                                                {client.observations || 'Nenhuma observação cadastrada.'}
                                            </div>
                                        </div>

                                        <div className="mb-6">
                                            <label className="text-[9px] font-black text-gray-400 uppercase block mb-1 ml-1 text-center">Atualizar Situação do Lead</label>
                                            <select 
                                                value={client.status || 'LEAD'} 
                                                onChange={(e) => updateStatus(client.id, e.target.value)}
                                                className="w-full p-3 bg-blue-50 border-2 border-blue-100 rounded-xl text-xs font-black text-blue-900 outline-none focus:border-blue-500"
                                            >
                                                <option value="LEAD">LEAD (Novo Contato)</option>
                                                <option value="AGENDADO">AGENDADO (Visita)</option>
                                                <option value="PROPOSTA">PROPOSTA (Negociação)</option>
                                                <option value="FECHADO">FECHADO (Venda/Sucesso)</option>
                                            </select>
                                        </div>
                                    </div>

                                    {/* BOTÕES DE AÇÃO NO RODAPÉ DO CARD */}
                                    <div className="px-6 pb-6 flex flex-col gap-2">
                                        <a href={`https://wa.me/55${client.phones?.[0]?.replace(/\D/g,'')}`} target="_blank" rel="noreferrer" 
                                           className="flex items-center justify-center w-full bg-green-500 hover:bg-green-600 text-white font-black py-4 rounded-2xl shadow-lg transition-all active:scale-95 text-xs uppercase tracking-widest">
                                            ABRIR WHATSAPP
                                        </a>
                                        <button 
                                            onClick={() => deleteClient(client.id, client.fullName)}
                                            className="w-full bg-red-100 hover:bg-red-600 text-red-600 hover:text-white font-black py-2 rounded-xl text-[9px] transition-all uppercase tracking-tighter shadow-sm border border-red-200"
                                        >
                                            EXCLUIR ESTE CLIENTE
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </>
                ) : (
                    <div className="max-w-2xl mx-auto bg-white p-10 rounded-[40px] shadow-2xl border border-gray-100">
                        <h2 className="text-3xl font-black mb-2 text-gray-800 uppercase tracking-tighter italic text-center">Novo Cliente</h2>
                        <p className="text-center text-gray-400 text-sm font-bold mb-8 uppercase tracking-widest">Cadastrar no Banco Lopes Prime</p>
                        
                        <div className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="text-[10px] font-black uppercase text-gray-400 ml-2">Nome Completo *</label>
                                    <input type="text" placeholder="Ex: João da Silva" value={name} onChange={e => setName(e.target.value)} className="w-full p-4 bg-gray-50 border-2 border-gray-100 rounded-2xl font-bold outline-none focus:border-blue-500" />
                                </div>
                                <div>
                                    <label className="text-[10px] font-black uppercase text-gray-400 ml-2">WhatsApp (219XXXXXXXX) *</label>
                                    <input type="text" placeholder="Somente números" value={phone} onChange={e => setPhone(e.target.value)} className="w-full p-4 bg-gray-50 border-2 border-gray-100 rounded-2xl font-bold outline-none focus:border-blue-500" />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="text-[10px] font-black uppercase text-gray-400 ml-2">E-mail</label>
                                    <input type="email" placeholder="cliente@email.com" value={email} onChange={e => setEmail(e.target.value)} className="w-full p-4 bg-gray-50 border-2 border-gray-100 rounded-2xl font-bold outline-none focus:border-blue-500" />
                                </div>
                                <div>
                                    <label className="text-[10px] font-black uppercase text-gray-400 ml-2">Data de Nascimento</label>
                                    <input type="date" value={birthDate} onChange={e => setBirthDate(e.target.value)} className="w-full p-4 bg-gray-50 border-2 border-gray-100 rounded-2xl font-bold outline-none focus:border-blue-500 uppercase text-xs" />
                                </div>
                            </div>

                            <div>
                                <label className="text-[10px] font-black uppercase text-gray-400 ml-2">Empreendimento de Interesse</label>
                                <input type="text" placeholder="Ex: Ilha Pura, Arte Wood, 3 qts Barra..." value={propertyInterest} onChange={e => setPropertyInterest(e.target.value)} className="w-full p-4 bg-yellow-50 border-2 border-yellow-100 rounded-2xl font-black text-gray-800 outline-none focus:border-yellow-400" />
                            </div>

                            <div>
                                <label className="text-[10px] font-black uppercase text-gray-400 ml-2">Observações Iniciais</label>
                                <textarea rows="3" placeholder="O que o cliente busca? Qual a urgência? Já visitou outros?" value={observations} onChange={e => setObservations(e.target.value)} className="w-full p-4 bg-gray-50 border-2 border-gray-100 rounded-2xl font-semibold outline-none focus:border-blue-500 text-sm" />
                            </div>

                            <button onClick={addClient} className="w-full bg-blue-900 hover:bg-black text-white font-black py-5 rounded-3xl shadow-2xl transition-all transform hover:-translate-y-1 mt-4 tracking-widest uppercase text-lg italic">
                                SALVAR NO BANCO DE DADOS
                            </button>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}

export default App;
