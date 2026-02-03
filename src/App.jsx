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
    const [activeTab, setActiveTab] = useState('dashboard');
    const [clients, setClients] = useState([]);
    const [properties, setProperties] = useState([]);
    const [editingId, setEditingId] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');

    // ESTADOS PARA FORMULÁRIOS
    const [name, setName] = useState('');
    const [phone, setPhone] = useState('');
    const [propertyInterest, setPropertyInterest] = useState('');
    const [birthDate, setBirthDate] = useState('');
    const [observations, setObservations] = useState('');
    const [propPrice, setPropPrice] = useState('');
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

    useEffect(() => {
        const unsub = onAuthStateChanged(auth, (u) => {
            if (u) { setUser(u); loadData(u.uid); }
            else setUser(null);
            setLoading(false);
        });
        return () => unsub();
    }, []);

    const resetForm = () => {
        setName(''); setPhone(''); setPropertyInterest(''); setBirthDate(''); 
        setObservations(''); setPropPrice(''); setPropImg(''); setEditingId(null);
    };

    if (loading) return <div className="h-screen flex items-center justify-center font-black text-blue-900 animate-pulse">CARREGANDO DASHBOARD...</div>;
    if (!user) return <Login onLogin={setUser} />;

    return (
        <div className="min-h-screen bg-gray-50 flex font-sans text-gray-800">
            <TailwindStyle />
            
            {/* SIDEBAR LATERAL (MENU FIXO) */}
            <aside className="w-64 bg-white border-r border-gray-200 hidden md:flex flex-col sticky top-0 h-screen">
                <div className="p-6">
                    <h1 className="text-xl font-black text-blue-900 italic uppercase">CRM LOPES</h1>
                </div>
                <nav className="flex-1 px-4 space-y-2">
                    <button onClick={() => setActiveTab('dashboard')} className={`w-full flex items-center gap-3 p-3 rounded-xl font-bold text-sm ${activeTab === 'dashboard' ? 'bg-blue-600 text-white' : 'hover:bg-gray-100 text-gray-500'}`}>📊 Dashboard</button>
                    <button onClick={() => setActiveTab('clients')} className={`w-full flex items-center gap-3 p-3 rounded-xl font-bold text-sm ${activeTab === 'clients' ? 'bg-blue-600 text-white' : 'hover:bg-gray-100 text-gray-500'}`}>👥 Clientes</button>
                    <button onClick={() => setActiveTab('properties')} className={`w-full flex items-center gap-3 p-3 rounded-xl font-bold text-sm ${activeTab === 'properties' ? 'bg-blue-600 text-white' : 'hover:bg-gray-100 text-gray-500'}`}>🏠 Imóveis</button>
                </nav>
                <div className="p-4 border-t">
                    <button onClick={() => signOut(auth)} className="w-full p-3 bg-red-50 text-red-600 rounded-xl font-bold text-xs hover:bg-red-100 transition">Sair do CRM</button>
                </div>
            </aside>

            {/* CONTEÚDO PRINCIPAL */}
            <main className="flex-1 overflow-y-auto">
                <header className="bg-white p-6 border-b flex justify-between items-center sticky top-0 z-40">
                    <h2 className="text-xl font-black uppercase tracking-tight">{activeTab === 'dashboard' ? 'Bem-vindo ao seu CRM!' : activeTab}</h2>
                    <input 
                        type="text" 
                        placeholder="Pesquisar..." 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="p-2 bg-gray-100 rounded-lg text-sm border-none outline-none w-64 focus:ring-2 ring-blue-500 transition"
                    />
                </header>

                <div className="p-8">
                    {activeTab === 'dashboard' && (
                        <div className="space-y-8">
                            {/* BANNER DE BOAS-VINDAS */}
                            <div className="bg-blue-600 rounded-3xl p-8 text-white shadow-xl relative overflow-hidden">
                                <div className="relative z-10">
                                    <h3 className="text-3xl font-black mb-2 italic">Fala, Alexandre!</h3>
                                    <p className="opacity-90 font-medium">Sua meta para hoje é converter mais leads da Lopes Prime.</p>
                                </div>
                                <div className="absolute right-0 top-0 text-white opacity-10 text-[10rem] font-black pointer-events-none uppercase italic">CRM</div>
                            </div>

                            {/* CARDS DE MÉTRICAS */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
                                    <p className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-1">Total de Clientes</p>
                                    <p className="text-4xl font-black text-blue-900 leading-none">{clients.length}</p>
                                </div>
                                <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
                                    <p className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-1">Imóveis Ativos</p>
                                    <p className="text-4xl font-black text-purple-600 leading-none">{properties.length}</p>
                                </div>
                                <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
                                    <p className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-1">Vendas Concluídas</p>
                                    <p className="text-4xl font-black text-green-600 leading-none">{clients.filter(c => c.status === 'FECHADO').length}</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'clients' && (
                        <div className="space-y-6">
                            <div className="flex justify-between items-center">
                                <h3 className="text-lg font-black uppercase italic">Sua Carteira de Leads</h3>
                                <button onClick={() => setActiveTab('add-client')} className="bg-blue-600 text-white px-4 py-2 rounded-xl font-bold text-xs shadow-lg hover:bg-blue-700 transition">Novo Cliente +</button>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {clients.map(c => (
                                    <div key={c.id} className="bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100 hover:shadow-xl transition relative group">
                                        <button onClick={() => {setEditingId(c.id); setName(c.fullName); setPhone(c.phones?.[0]); setPropertyInterest(c.propertyInterest); setBirthDate(c.birthDate); setObservations(c.observations); setActiveTab('add-client');}} className="absolute top-4 left-4 opacity-0 group-hover:opacity-100 transition text-gray-300 hover:text-blue-600">✏️</button>
                                        <h4 className="font-black text-blue-900 text-lg uppercase truncate mb-1 ml-4">{c.fullName}</h4>
                                        <div className="bg-yellow-50 p-2 rounded-lg text-[10px] font-black uppercase text-yellow-700 mb-4">{c.propertyInterest || 'Geral'}</div>
                                        <div className="space-y-2 mb-4">
                                            <p className="text-xs font-bold text-gray-500">📞 {c.phones?.[0]}</p>
                                            <p className="text-xs italic text-gray-400 line-clamp-2">{c.observations}</p>
                                        </div>
                                        <a href={`https://wa.me/55${c.phones?.[0]?.replace(/\D/g,'')}`} target="_blank" className="block w-full bg-green-500 text-white text-center py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-md">WhatsApp</a>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {activeTab === 'properties' && (
                        <div className="space-y-6">
                            <div className="flex justify-between items-center">
                                <h3 className="text-lg font-black uppercase italic">Seu Catálogo de Imóveis</h3>
                                <button onClick={() => setActiveTab('add-property')} className="bg-purple-600 text-white px-4 py-2 rounded-xl font-bold text-xs shadow-lg hover:bg-purple-700 transition">Novo Imóvel +</button>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                                {properties.map(p => (
                                    <div key={p.id} className="bg-white rounded-[2rem] overflow-hidden shadow-sm border border-gray-100 hover:shadow-xl transition flex flex-col">
                                        {p.image ? <img src={p.image.split(',')[0]} className="h-48 w-full object-cover" alt="imóvel" /> : <div className="h-48 bg-gray-100 flex items-center justify-center font-black text-gray-200">SEM FOTO</div>}
                                        <div className="p-6 flex-1 flex flex-col">
                                            <h4 className="font-black text-blue-900 uppercase text-lg mb-1 leading-tight">{p.title}</h4>
                                            <p className="text-green-600 font-black text-2xl mb-4 italic tracking-tighter leading-none">{p.price}</p>
                                            <div className="mt-auto space-y-2">
                                                {p.link && <a href={p.link} target="_blank" className="block bg-blue-100 text-blue-700 text-center py-2 rounded-xl font-black text-[9px] uppercase tracking-widest">Ver Site</a>}
                                                <button onClick={() => deleteDoc(doc(db, 'properties', p.id)).then(() => loadData(user.uid))} className="w-full text-[9px] font-bold text-gray-300 hover:text-red-500 uppercase tracking-widest">Remover</button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {(activeTab === 'add-client' || activeTab === 'add-property') && (
                        <div className="max-w-2xl mx-auto bg-white p-10 rounded-[3rem] shadow-2xl border border-gray-50">
                            <h2 className="text-2xl font-black mb-8 text-blue-900 uppercase italic text-center tracking-tighter">
                                {activeTab === 'add-client' ? (editingId ? 'Editar Cliente' : 'Novo Cliente') : 'Cadastrar Imóvel'}
                            </h2>
                            <div className="space-y-4">
                                <input type="text" placeholder="Nome Completo / Título" value={name} onChange={e => setName(e.target.value)} className="w-full p-4 bg-gray-50 rounded-2xl font-bold border-2 border-transparent focus:border-blue-500 outline-none" />
                                {activeTab === 'add-client' ? (
                                    <>
                                        <input type="text" placeholder="WhatsApp" value={phone} onChange={e => setPhone(e.target.value)} className="w-full p-4 bg-gray-50 rounded-2xl font-bold border-none" />
                                        <select value={propertyInterest} onChange={e => setPropertyInterest(e.target.value)} className="w-full p-4 bg-yellow-50 rounded-2xl font-black border-none">
                                            <option value="">Imóvel de Interesse...</option>
                                            {properties.map(p => <option key={p.id} value={p.title}>{p.title}</option>)}
                                        </select>
                                        <textarea placeholder="Observações..." value={observations} onChange={e => setObservations(e.target.value)} className="w-full p-4 bg-gray-50 rounded-2xl font-bold h-32 border-none" />
                                    </>
                                ) : (
                                    <>
                                        <input type="text" placeholder="Preço" value={propPrice} onChange={e => setPropPrice(e.target.value)} className="w-full p-4 bg-green-50 rounded-2xl font-black text-green-700" />
                                        <input type="text" placeholder="Link da Foto" value={propImg} onChange={e => setPropImg(e.target.value)} className="w-full p-4 bg-gray-50 rounded-2xl font-bold italic" />
                                    </>
                                )}
                                <div className="flex gap-4 pt-4">
                                    <button onClick={activeTab === 'add-client' ? (editingId ? () => updateDoc(doc(db, 'clients', editingId), {fullName: name, phones: [phone], propertyInterest, observations}).then(() => {resetForm(); setActiveTab('clients'); loadData(user.uid);}) : addClient) : addProperty} className="flex-1 bg-blue-900 text-white font-black py-5 rounded-3xl shadow-xl uppercase tracking-widest text-lg transition hover:bg-black active:scale-95">Salvar</button>
                                    <button onClick={() => {setActiveTab(activeTab === 'add-client' ? 'clients' : 'properties'); resetForm();}} className="flex-1 bg-gray-100 text-gray-400 font-black py-5 rounded-3xl uppercase tracking-widest text-lg hover:bg-gray-200 transition">Cancelar</button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}

export default App;
