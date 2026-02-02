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
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('clients');
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('TODOS');
    
    const [clients, setClients] = useState([]);
    const [properties, setProperties] = useState([]);

    // CAMPOS GERAIS
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [propertyInterest, setPropertyInterest] = useState('');
    const [birthDate, setBirthDate] = useState('');
    const [observations, setObservations] = useState('');
    const [propPrice, setPropPrice] = useState('');
    const [propAddress, setPropAddress] = useState('');
    const [propLink, setPropLink] = useState('');
    const [propPdf, setPropPdf] = useState('');
    const [propImg, setPropImg] = useState('');

    const loadData = async (userId) => {
        try {
            const qC = query(collection(db, 'clients'), where("assignedAgent", "==", userId));
            const snapC = await getDocs(qC);
            setClients(snapC.docs.map(d => ({ id: d.id, ...d.data() })));

            const qP = query(collection(db, 'properties'), where("userId", "==", userId));
            const snapP = await getDocs(qP);
            setProperties(snapP.docs.map(d => ({ id: d.id, ...d.data() })));
        } catch (error) { console.error(error); }
    };

    const formatCurrency = (value) => {
        const clean = value.replace(/\D/g, "");
        return clean ? "R$ " + new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2 }).format(parseFloat(clean) / 100) : "";
    };

    const addClient = async () => {
        await addDoc(collection(db, 'clients'), {
            fullName: name, email, phones: [phone], propertyInterest, birthDate, observations,
            status: "LEAD", assignedAgent: user.uid, createdAt: new Date()
        });
        resetForm(); setActiveTab('clients'); loadData(user.uid);
    };

    const addProperty = async () => {
        await addDoc(collection(db, 'properties'), {
            title: name, price: propPrice, address: propAddress, description: observations,
            link: propLink, pdf: propPdf, image: propImg, userId: user.uid, createdAt: new Date()
        });
        resetForm(); setActiveTab('properties'); loadData(user.uid);
    };

    const updateStatus = async (id, status) => {
        await updateDoc(doc(db, 'clients', id), { status });
        loadData(user.uid);
    };

    const resetForm = () => {
        setName(''); setEmail(''); setPhone(''); setPropertyInterest(''); setBirthDate(''); 
        setObservations(''); setPropPrice(''); setPropAddress(''); setPropLink(''); setPropPdf(''); setPropImg('');
    };

    useEffect(() => {
        const unsub = onAuthStateChanged(auth, (u) => {
            if (u) { setUser(u); loadData(u.uid); }
            else setUser(null);
            setLoading(false);
        });
        return () => unsub();
    }, []);

    const filteredClients = clients.filter(c => {
        const match = (c.fullName || "").toLowerCase().includes(searchTerm.toLowerCase()) || (c.propertyInterest || "").toLowerCase().includes(searchTerm.toLowerCase());
        return match && (statusFilter === 'TODOS' || c.status === statusFilter);
    });

    if (loading) return <div className="h-screen flex items-center justify-center font-black text-blue-900 animate-pulse uppercase tracking-widest">Carregando Lopes Prime...</div>;
    if (!user) return <Login onLogin={setUser} />;

    return (
        <div className="min-h-screen bg-gray-50 pb-20 font-sans text-gray-900">
            <TailwindStyle />
            <header className="bg-blue-900 text-white p-5 shadow-xl flex justify-between items-center sticky top-0 z-50">
                <h1 className="text-xl font-black italic tracking-tighter uppercase">🏠 CRM LOPES PRIME</h1>
                <button onClick={() => signOut(auth)} className="bg-red-600 px-3 py-1 rounded-lg text-[10px] font-bold shadow-md active:scale-95 transition">SAIR</button>
            </header>

            <nav className="bg-white border-b sticky top-16 z-40 flex flex-wrap justify-center gap-2 p-3 shadow-md">
                <button onClick={() => setActiveTab('clients')} className={`py-2 px-4 rounded-xl font-black text-[10px] uppercase ${activeTab === 'clients' ? 'bg-blue-900 text-white' : 'bg-gray-100 text-gray-400'}`}>👥 Clientes</button>
                <button onClick={() => setActiveTab('properties')} className={`py-2 px-4 rounded-xl font-black text-[10px] uppercase ${activeTab === 'properties' ? 'bg-blue-900 text-white' : 'bg-gray-100 text-gray-400'}`}>🏠 Imóveis</button>
                <button onClick={() => setActiveTab('add-client')} className="py-2 px-4 rounded-xl font-black text-[10px] uppercase bg-green-100 text-green-700">➕ Novo Cliente</button>
                <button onClick={() => setActiveTab('add-property')} className="py-2 px-4 rounded-xl font-black text-[10px] uppercase bg-purple-100 text-purple-700">➕ Novo Imóvel</button>
            </nav>

            <main className="max-w-7xl mx-auto p-4 mt-4">
                {activeTab === 'clients' && (
                    <>
                        <div className="max-w-2xl mx-auto mb-8 space-y-4">
                            <input type="text" placeholder="🔍 Buscar por nome ou imóvel..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full p-4 bg-white border-2 rounded-2xl font-bold shadow-md outline-none focus:border-blue-500" />
                            <div className="flex flex-wrap justify-center gap-2">
                                {['TODOS', 'LEAD', 'AGENDADO', 'PROPOSTA', 'FECHADO'].map(f => (
                                    <button key={f} onClick={() => setStatusFilter(f)} className={`px-4 py-2 rounded-full text-[9px] font-black border-2 transition ${statusFilter === f ? 'bg-blue-900 text-white border-blue-900' : 'bg-white text-gray-400 border-gray-100'}`}>{f}</button>
                                ))}
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {filteredClients.map(c => (
                                <div key={c.id} className="bg-white rounded-[2rem] shadow-lg p-6 border-t-8 border-blue-900 relative hover:shadow-2xl transition duration-300">
                                    <div className="flex justify-between items-start mb-4">
                                        <h3 className="font-black text-blue-900 uppercase text-lg truncate mr-2">{c.fullName}</h3>
                                        <span className={`text-[9px] font-black px-2 py-1 rounded uppercase ${c.status === 'FECHADO' ? 'bg-green-600' : 'bg-blue-600'} text-white shadow-sm`}>{c.status || 'LEAD'}</span>
                                    </div>
                                    <div className="bg-yellow-50 border-l-4 border-yellow-400 p-3 mb-4 rounded-r-lg text-[10px] font-black italic uppercase text-gray-800 leading-tight">
                                        Interesse: {c.propertyInterest || 'Geral'}
                                    </div>
                                    <div className="space-y-3 mb-6">
                                        <p className="text-xs font-bold text-gray-600">📞 {c.phones?.[0]}</p>
                                        <select value={c.status || 'LEAD'} onChange={(e) => updateStatus(c.id, e.target.value)} className="w-full p-2.5 bg-gray-50 border-2 border-gray-100 rounded-xl text-[10px] font-black outline-none focus:border-blue-500">
                                            <option value="LEAD">LEAD (Novo)</option>
                                            <option value="AGENDADO">AGENDADO (Visita)</option>
                                            <option value="PROPOSTA">PROPOSTA (Negócio)</option>
                                            <option value="FECHADO">FECHADO (Venda)</option>
                                        </select>
                                    </div>
                                    <a href={`https://wa.me/55${c.phones?.[0]?.replace(/\D/g,'')}`} target="_blank" className="flex items-center justify-center w-full bg-green-500 hover:bg-green-600 text-white font-black py-4 rounded-2xl shadow-lg text-[11px] uppercase tracking-widest transition active:scale-95 mb-3">WhatsApp</a>
                                    <button onClick={() => deleteDoc(doc(db, 'clients', c.id)).then(() => loadData(user.uid))} className="w-full text-[9px] font-black text-red-100 hover:text-red-600 uppercase transition tracking-tighter">Remover do CRM</button>
                                </div>
                            ))}
                        </div>
                    </>
                )}

                {activeTab === 'properties' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {properties.map(p => (
                            <div key={p.id} className="bg-white rounded-[2rem] shadow-xl overflow-hidden border border-gray-100 flex flex-col hover:shadow-2xl transition duration-300">
                                {p.image ? (
                                    <img src={p.image} className="h-56 w-full object-cover" alt="imóvel" />
                                ) : (
                                    <div className="h-56 w-full bg-gray-100 flex items-center justify-center text-gray-300 text-4xl">🏠</div>
                                )}
                                <div className="p-6 flex flex-col flex-grow">
                                    <h3 className="font-black text-xl uppercase text-blue-900 mb-1">{p.title}</h3>
                                    <p className="text-green-600 font-black text-2xl mb-4 tracking-tighter italic">{p.price}</p>
                                    <p className="text-[10px] font-bold text-gray-400 uppercase mb-5 leading-tight italic">📍 {p.address}</p>
                                    
                                    <div className="flex flex-col gap-3 mt-auto">
                                        {p.link && <a href={p.link} target="_blank" className="bg-blue-600 hover:bg-blue-700 text-white text-center py-3 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-md transition">Abrir Site/Linktree</a>}
                                        {p.pdf && <a href={p.pdf} target="_blank" className="bg-red-600 hover:bg-red-700 text-white text-center py-3 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-md transition">E-book/Tabela PDF</a>}
                                        <button onClick={() => deleteDoc(doc(db, 'properties', p.id)).then(() => loadData(user.uid))} className="mt-4 text-[9px] font-black text-gray-300 hover:text-red-500 uppercase transition tracking-widest text-center">Excluir Imóvel</button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {activeTab === 'add-client' && (
                    <div className="max-w-xl mx-auto bg-white p-10 rounded-[3rem] shadow-2xl border border-gray-100">
                        <h2 className="text-3xl font-black mb-8 text-blue-900 text-center uppercase tracking-tighter">Novo Cliente</h2>
                        <div className="space-y-5">
                            <input type="text" placeholder="Nome Completo" value={name} onChange={e => setName(e.target.value)} className="w-full p-4 bg-gray-50 rounded-2xl font-bold border-2 border-transparent focus:border-blue-500 outline-none transition" />
                            <input type="text" placeholder="WhatsApp (DDD + Número)" value={phone} onChange={e => setPhone(e.target.value)} className="w-full p-4 bg-gray-50 rounded-2xl font-bold border-2 border-transparent focus:border-blue-500 outline-none transition" />
                            <select value={propertyInterest} onChange={e => setPropertyInterest(e.target.value)} className="w-full p-4 bg-yellow-50 rounded-2xl font-black border-2 border-yellow-100 outline-none focus:border-yellow-400 transition">
                                <option value="">Vincular Imóvel da Lista...</option>
                                {properties.map(p => <option key={p.id} value={p.title}>{p.title}</option>)}
                            </select>
                            <textarea placeholder="Observações do atendimento..." value={observations} onChange={e => setObservations(e.target.value)} className="w-full p-4 bg-gray-50 rounded-2xl font-bold border-2 border-transparent focus:border-blue-500 outline-none h-32 transition" />
                            <button onClick={addClient} className="w-full bg-blue-900 text-white font-black py-5 rounded-3xl shadow-2xl uppercase tracking-widest text-lg transition hover:bg-black active:scale-95">Salvar no CRM</button>
                        </div>
                    </div>
                )}

                {activeTab === 'add-property' && (
                    <div className="max-w-xl mx-auto bg-white p-10 rounded-[3rem] shadow-2xl border-t-8 border-purple-700">
                        <h2 className="text-3xl font-black mb-8 text-purple-900 text-center uppercase italic tracking-tighter">Cadastrar Produto</h2>
                        <div className="space-y-4">
                            <input type="text" placeholder="Nome do Empreendimento" value={name} onChange={e => setName(e.target.value)} className="w-full p-4 bg-gray-50 rounded-2xl font-bold border shadow-inner" />
                            <input type="text" placeholder="Preço Sugerido" value={propPrice} onChange={e => setPropPrice(formatCurrency(e.target.value))} className="w-full p-4 bg-green-50 rounded-2xl font-black border border-green-200 text-green-700 text-xl" />
                            <input type="text" placeholder="Link da Imagem Principal (URL)" value={propImg} onChange={e => setPropImg(e.target.value)} className="w-full p-4 bg-gray-50 rounded-2xl font-bold border italic" />
                            <input type="text" placeholder="Endereço Completo" value={propAddress} onChange={e => setPropAddress(e.target.value)} className="w-full p-4 bg-gray-50 rounded-2xl font-bold border" />
                            <input type="text" placeholder="Link do Site Oficial" value={propLink} onChange={e => setPropLink(e.target.value)} className="w-full p-4 bg-blue-50 rounded-2xl font-bold border" />
                            <input type="text" placeholder="Link do E-book ou Tabela (PDF)" value={propPdf} onChange={e => setPropPdf(e.target.value)} className="w-full p-4 bg-red-50 rounded-2xl font-bold border" />
                            <button onClick={addProperty} className="w-full bg-purple-700 text-white font-black py-5 rounded-3xl shadow-2xl uppercase tracking-widest font-italic transition hover:bg-purple-900 active:scale-95">Cadastrar Imóvel</button>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}

export default App;
