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
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('clients');

    // ESTADOS PARA CADASTRO E EDIÇÃO
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [propertyInterest, setPropertyInterest] = useState('');
    const [birthDate, setBirthDate] = useState('');
    const [observations, setObservations] = useState('');
    
    // ESTADO PARA CONTROLE DE EDIÇÃO
    const [editingId, setEditingId] = useState(null);

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

    const addClient = async () => {
        if (!name.trim() || !phone.trim()) {
            alert('❌ Nome e Telefone são obrigatórios!');
            return;
        }
        try {
            await addDoc(collection(db, 'clients'), {
                fullName: name, email, phones: [phone], propertyInterest, birthDate, observations,
                status: "LEAD", assignedAgent: user.uid, createdAt: new Date()
            });
            alert("✅ Cliente cadastrado!");
            resetForm();
            loadClients(user.uid);
            setActiveTab('clients');
        } catch (error) {
            alert("❌ Erro: " + error.message);
        }
    };

    const startEdit = (client) => {
        setEditingId(client.id);
        setName(client.fullName);
        setEmail(client.email);
        setPhone(client.phones[0]);
        setPropertyInterest(client.propertyInterest);
        setBirthDate(client.birthDate);
        setObservations(client.observations);
    };

    const saveEdit = async (clientId) => {
        try {
            await updateDoc(doc(db, 'clients', clientId), {
                fullName: name, email, phones: [phone], propertyInterest, birthDate, observations
            });
            alert("✅ Alterações salvas!");
            setEditingId(null);
            resetForm();
            loadClients(user.uid);
        } catch (error) {
            alert("Erro ao salvar: " + error.message);
        }
    };

    const resetForm = () => {
        setName(''); setEmail(''); setPhone(''); setPropertyInterest(''); setBirthDate(''); setObservations('');
        setEditingId(null);
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

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (u) => {
            if (u) { setUser(u); loadClients(u.uid); }
            else { setUser(null); }
            setLoading(false);
        });
        return () => unsubscribe();
    }, []);

    const filteredClients = clients.filter(client => {
        const matchesSearch = (client.fullName || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
                            (client.propertyInterest || "").toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = statusFilter === 'TODOS' || client.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    if (loading) return <div className="flex justify-center items-center h-screen font-black text-blue-900 animate-pulse">CARREGANDO...</div>;
    if (!user) return <Login onLogin={setUser} />;

    return (
        <div className="min-h-screen bg-gray-50 pb-20 font-sans text-gray-900">
            <TailwindStyle />
            
            <header className="bg-blue-900 text-white p-6 shadow-2xl sticky top-0 z-30 flex justify-between items-center">
                <h1 className="text-xl font-black italic tracking-tighter">🏠 CRM LOPES PRIME</h1>
                <button onClick={() => signOut(auth)} className="bg-red-600 px-4 py-2 rounded-xl font-bold text-[10px]">SAIR</button>
            </header>

            <nav className="bg-white border-b sticky top-20 z-20 flex justify-center gap-2 p-2 shadow-sm">
                <button onClick={() => { setActiveTab('clients'); resetForm(); }} className={`py-3 px-6 rounded-xl font-black text-xs ${activeTab === 'clients' ? 'bg-blue-100 text-blue-700' : 'text-gray-400'}`}>
                    👥 CLIENTES ({clients.length})
                </button>
                <button onClick={() => { setActiveTab('add'); resetForm(); }} className={`py-3 px-6 rounded-xl font-black text-xs ${activeTab === 'add' ? 'bg-blue-100 text-blue-700' : 'text-gray-400'}`}>
                    ➕ NOVO CADASTRO
                </button>
            </nav>

            <main className="max-w-7xl mx-auto p-4 mt-4">
                {activeTab === 'clients' ? (
                    <>
                        <div className="max-w-4xl mx-auto mb-6 space-y-4">
                            <input type="text" placeholder="🔍 Pesquisar..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full p-4 bg-white border-2 border-gray-100 rounded-2xl outline-none focus:border-blue-500 font-bold shadow-md" />
                            <div className="flex flex-wrap justify-center gap-2">
                                {['TODOS', 'LEAD', 'AGENDADO', 'PROPOSTA', 'FECHADO'].map(f => (
                                    <button key={f} onClick={() => setStatusFilter(f)} className={`px-4 py-2 rounded-full text-[9px] font-black border-2 ${statusFilter === f ? 'bg-blue-900 text-white border-blue-900' : 'bg-white text-gray-400 border-gray-100'}`}>{f}</button>
                                ))}
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {filteredClients.map(client => (
                                <div key={client.id} className="bg-white rounded-3xl shadow-lg border-t-8 border-blue-900 p-6 relative flex flex-col hover:shadow-2xl transition-all">
                                    
                                    {/* ÍCONE DE EDITAR (LÁPIS) NO CANTO ESQUERDO */}
                                    {editingId !== client.id && (
                                        <button onClick={() => startEdit(client)} className="absolute top-3 left-3 text-gray-400 hover:text-blue-600 transition-colors p-2 bg-gray-50 rounded-full shadow-sm" title="Editar Informações">
                                            ✏️
                                        </button>
                                    )}

                                    {editingId === client.id ? (
                                        <div className="space-y-3">
                                            <p className="text-[10px] font-black text-blue-600 uppercase">Editando Cliente</p>
                                            <input type="text" value={name} onChange={e => setName(e.target.value)} className="w-full p-2 border-2 rounded-lg text-sm font-bold" placeholder="Nome" />
                                            <input type="text" value={phone} onChange={e => setPhone(e.target.value)} className="w-full p-2 border-2 rounded-lg text-sm font-bold" placeholder="WhatsApp" />
                                            <input type="text" value={propertyInterest} onChange={e => setPropertyInterest(e.target.value)} className="w-full p-2 border-2 rounded-lg text-sm font-bold bg-yellow-50" placeholder="Interesse" />
                                            <input type="date" value={birthDate} onChange={e => setBirthDate(e.target.value)} className="w-full p-2 border-2 rounded-lg text-sm font-bold" />
                                            <textarea value={observations} onChange={e => setObservations(e.target.value)} className="w-full p-2 border-2 rounded-lg text-xs h-20" placeholder="Observações" />
                                            <div className="flex gap-2">
                                                <button onClick={() => saveEdit(client.id)} className="flex-1 bg-green-500 text-white font-black py-2 rounded-xl text-xs uppercase">Salvar</button>
                                                <button onClick={() => setEditingId(null)} className="flex-1 bg-gray-200 text-gray-600 font-black py-2 rounded-xl text-xs uppercase">Cancelar</button>
                                            </div>
                                        </div>
                                    ) : (
                                        <>
                                            <div className="flex justify-between items-start mb-4 mt-2">
                                                <h3 className="font-black text-blue-900 text-lg uppercase truncate ml-6">{client.fullName}</h3>
                                                <span className={`text-[8px] font-black px-2 py-1 rounded shadow-sm ${client.status === 'FECHADO' ? 'bg-green-600 text-white' : 'bg-blue-600 text-white'}`}>{client.status || 'LEAD'}</span>
                                            </div>

                                            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-2 mb-4 rounded-r-lg">
                                                <p className="text-[9px] font-black text-yellow-700 uppercase leading-none mb-1">Interesse</p>
                                                <p className="text-sm font-black text-gray-800 uppercase italic">"{client.propertyInterest || 'Geral'}"</p>
                                            </div>

                                            <div className="grid grid-cols-2 gap-2 mb-4 text-[9px] font-bold">
                                                <div className="bg-gray-50 p-2 rounded-lg"><p className="text-blue-800 uppercase text-[7px]">🎂 Nasc.</p>{client.birthDate ? new Date(client.birthDate).toLocaleDateString('pt-BR') : '-'}</div>
                                                <div className="bg-gray-50 p-2 rounded-lg"><p className="text-green-700 uppercase text-[7px]">📞 Zap</p>{client.phones?.[0]}</div>
                                            </div>

                                            <div className="mb-4 bg-gray-50 p-3 rounded-xl border border-gray-100 h-20 overflow-y-auto text-xs italic font-medium text-gray-600">
                                                {client.observations || 'Sem anotações.'}
                                            </div>

                                            <select value={client.status || 'LEAD'} onChange={(e) => updateStatus(client.id, e.target.value)} className="w-full p-2 bg-blue-50 border border-blue-100 rounded-xl text-[10px] font-black text-blue-900 mb-6">
                                                <option value="LEAD">LEAD</option>
                                                <option value="AGENDADO">AGENDADO</option>
                                                <option value="PROPOSTA">PROPOSTA</option>
                                                <option value="FECHADO">FECHADO</option>
                                            </select>

                                            <div className="flex flex-col gap-2 mt-auto">
                                                <a href={`https://wa.me/55${client.phones?.[0]?.replace(/\D/g,'')}`} target="_blank" rel="noreferrer" className="bg-green-500 text-white font-black py-3 rounded-xl shadow-md text-[10px] uppercase text-center tracking-widest">WhatsApp</a>
                                                <button onClick={() => deleteClient(client.id, client.fullName)} className="text-[8px] font-black text-red-300 hover:text-red-600 uppercase">Excluir Cliente</button>
                                            </div>
                                        </>
                                    )}
                                </div>
                            ))}
                        </div>
                    </>
                ) : (
                    <div className="max-w-2xl mx-auto bg-white p-10 rounded-[40px] shadow-2xl border border-gray-100">
                        <h2 className="text-3xl font-black mb-6 text-gray-800 uppercase tracking-tighter italic text-center">Novo Cliente</h2>
                        <div className="space-y-4">
                            <input type="text" placeholder="Nome Completo" value={name} onChange={e => setName(e.target.value)} className="w-full p-4 bg-gray-50 border-2 border-gray-100 rounded-2xl font-bold" />
                            <input type="text" placeholder="WhatsApp (219XXXXXXXX)" value={phone} onChange={e => setPhone(e.target.value)} className="w-full p-4 bg-gray-50 border-2 border-gray-100 rounded-2xl font-bold" />
                            <input type="text" placeholder="Imóvel de Interesse" value={propertyInterest} onChange={e => setPropertyInterest(e.target.value)} className="w-full p-4 bg-yellow-50 border-2 border-yellow-100 rounded-2xl font-black" />
                            <input type="date" value={birthDate} onChange={e => setBirthDate(e.target.value)} className="w-full p-4 bg-gray-50 border-2 border-gray-100 rounded-2xl font-bold" />
                            <textarea placeholder="Observações" value={observations} onChange={e => setObservations(e.target.value)} className="w-full p-4 bg-gray-50 border-2 border-gray-100 rounded-2xl font-semibold h-24" />
                            <button onClick={addClient} className="w-full bg-blue-900 text-white font-black py-5 rounded-3xl shadow-2xl uppercase tracking-widest text-lg italic">Salvar no Banco</button>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}

export default App;
