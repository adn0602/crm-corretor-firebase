import React, { useState, useEffect } from 'react';
import { db, auth } from './firebase/config';
import { collection, addDoc, getDocs, query, where, updateDoc, doc, deleteDoc } from 'firebase/firestore';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import Login from './components/Login';

const TailwindStyle = () => (
  <style>{`
    @import url('https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css');
    .glass { background: rgba(255, 255, 255, 0.7); backdrop-filter: blur(12px); border: 1px solid rgba(255, 255, 255, 0.4); }
    .neon-hot { border: 2px solid rgba(239, 68, 68, 0.5); box-shadow: 0 0 15px rgba(239, 68, 68, 0.2); }
    .ai-gradient { background: linear-gradient(135deg, #0f172a 0%, #1e3a8a 100%); }
  `}</style>
);

function App() {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('dashboard');
    const [clients, setClients] = useState([]);
    const [properties, setProperties] = useState([]);
    const [editingId, setEditingId] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('TODOS');

    // CAMPOS FORMULÁRIO
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
            const listC = snapC.docs.map(d => ({ id: d.id, ...d.data() }));
            listC.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
            setClients(listC);

            const qP = query(collection(db, 'properties'), where("userId", "==", userId));
            const snapP = await getDocs(qP);
            setProperties(snapP.docs.map(d => ({ id: d.id, ...d.data() })));
        } catch (error) { console.error(error); }
    };

    const analyzeLead = (client) => {
        const text = (client.observations || "").toLowerCase();
        const status = client.status || "LEAD";
        let score = 0;
        if (status === "PROPOSTA") score += 50;
        if (status === "AGENDADO") score += 30;
        if (text.includes("urgente") || text.includes("comprar")) score += 20;
        if (score >= 50) return { label: "QUENTE", color: "text-red-500", icon: "🔥", glow: "neon-hot" };
        if (score >= 20) return { label: "MORNO", color: "text-orange-400", icon: "⚡", glow: "" };
        return { label: "FRIO", color: "text-blue-400", icon: "❄️", glow: "" };
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
        setName(''); setEmail(''); setPhone(''); setPropertyInterest(''); setBirthDate(''); 
        setObservations(''); setPropPrice(''); setPropAddress(''); setPropLink(''); setPropPdf(''); setPropImg('');
        setEditingId(null);
    };

    const formatCurrency = (value) => {
        const clean = value.replace(/\D/g, "");
        return clean ? "R$ " + new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2 }).format(parseFloat(clean) / 100) : "";
    };

    const filteredClients = clients.filter(c => {
        const match = (c.fullName || "").toLowerCase().includes(searchTerm.toLowerCase()) || (c.propertyInterest || "").toLowerCase().includes(searchTerm.toLowerCase());
        return match && (statusFilter === 'TODOS' || c.status === statusFilter);
    });

    if (loading) return <div className="h-screen flex items-center justify-center font-black text-blue-900 bg-slate-50 animate-pulse">ALEXANDRE CRM...</div>;
    if (!user) return <Login onLogin={setUser} />;

    return (
        <div className="min-h-screen bg-slate-50 flex font-sans text-slate-900">
            <TailwindStyle />
            
            {/* SIDEBAR */}
            <aside className="w-20 lg:w-64 bg-white border-r border-slate-200 flex flex-col sticky top-0 h-screen z-50">
                <div className="p-6 mb-8 text-center lg:text-left">
                    <h1 className="text-xl font-black text-blue-900 italic hidden lg:block uppercase tracking-tighter">Alexandre <span className="text-blue-500">CRM</span></h1>
                    <div className="lg:hidden w-10 h-10 bg-blue-900 rounded-xl mx-auto flex items-center justify-center text-white font-bold">A</div>
                </div>
                <nav className="flex-1 px-4 space-y-4">
                    {[
                        { id: 'dashboard', label: 'Dashboard', icon: '📊' },
                        { id: 'clients', label: 'Leads', icon: '👥' },
                        { id: 'properties', label: 'Imóveis', icon: '🏠' }
                    ].map(item => (
                        <button key={item.id} onClick={() => {setActiveTab(item.id); resetForm();}} className={`w-full flex items-center lg:gap-4 p-4 rounded-2xl font-bold text-sm transition-all ${activeTab === item.id ? 'bg-blue-900 text-white shadow-xl' : 'text-slate-400 hover:bg-slate-100'}`}>
                            <span>{item.icon}</span> <span className="hidden lg:block uppercase text-[10px] tracking-widest">{item.label}</span>
                        </button>
                    ))}
                </nav>
                <div className="p-4"><button onClick={() => signOut(auth)} className="w-full p-4 bg-red-50 text-red-600 rounded-2xl font-black text-[9px] uppercase hover:bg-red-100">Sair</button></div>
            </aside>

            {/* CONTEÚDO */}
            <main className="flex-1 overflow-y-auto">
                <header className="p-8 flex justify-between items-center bg-white/60 backdrop-blur-md sticky top-0 z-40 border-b border-slate-100">
                    <h2 className="text-2xl font-black uppercase italic tracking-tighter text-blue-900">{activeTab}</h2>
                    <div className="flex gap-4">
                        <input type="text" placeholder="Buscar..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="p-3 bg-slate-100 rounded-xl text-xs font-bold w-48 lg:w-64 outline-none focus:ring-2 ring-blue-500 transition-all" />
                    </div>
                </header>

                <div className="p-8">
                    {activeTab === 'dashboard' && (
                        <div className="space-y-10">
                            <div className="ai-gradient rounded-[3rem] p-10 text-white shadow-2xl">
                                <h3 className="text-3xl font-black italic mb-2 uppercase">Bem-vindo, Alexandre!</h3>
                                <p className="opacity-70 font-bold text-sm uppercase tracking-widest">IA Lopes Prime detectou {clients.filter(c => analyzeLead(c).label === "QUENTE").length} oportunidades urgentes hoje.</p>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                                <div className="glass p-8 rounded-[2.5rem]"><p className="text-slate-400 text-[10px] font-black uppercase mb-4">Meus Leads</p><p className="text-5xl font-black text-blue-900">{clients.length}</p></div>
                                <div className="glass p-8 rounded-[2.5rem]"><p className="text-slate-400 text-[10px] font-black uppercase mb-4">Meus Imóveis</p><p className="text-5xl font-black text-purple-600">{properties.length}</p></div>
                                <div className="glass p-8 rounded-[2.5rem]"><p className="text-slate-400 text-[10px] font-black uppercase mb-4">Vendas</p><p className="text-5xl font-black text-green-600">{clients.filter(c => c.status === 'FECHADO').length}</p></div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'clients' && (
                        <div className="space-y-8">
                            <div className="flex justify-between items-center">
                                <div className="flex gap-2">
                                    {['TODOS', 'LEAD', 'AGENDADO', 'PROPOSTA', 'FECHADO'].map(f => (
                                        <button key={f} onClick={() => setStatusFilter(f)} className={`px-3 py-1.5 rounded-full text-[9px] font-black border transition ${statusFilter === f ? 'bg-blue-900 text-white' : 'bg-white text-gray-400'}`}>{f}</button>
                                    ))}
                                </div>
                                <button onClick={() => setActiveTab('add-client')} className="bg-blue-900 text-white px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest">Novo Cliente +</button>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                                {filteredClients.map(c => {
                                    const ai = analyzeLead(c);
                                    return (
                                        <div key={c.id} className={`bg-white rounded-[2.5rem] shadow-sm p-8 border border-slate-100 relative group transition-all duration-500 hover:shadow-2xl ${ai.glow}`}>
                                            <button onClick={() => {setEditingId(c.id); setName(c.fullName); setPhone(c.phones?.[0]); setPropertyInterest(c.propertyInterest); setBirthDate(c.birthDate); setObservations(c.observations); setActiveTab('add-client');}} className="absolute top-4 left-4 p-2 text-slate-300 hover:text-blue-600 transition">✏️</button>
                                            <div className="flex justify-between items-start mb-6 pt-2">
                                                <h3 className="font-black text-blue-900 uppercase text-lg truncate ml-6">{c.fullName}</h3>
                                                <span className={`text-[8px] font-black px-2 py-1 rounded uppercase ${ai.color}`}>{ai.icon} {ai.label}</span>
                                            </div>
                                            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-3 mb-4 rounded-r-lg text-[10px] font-black italic uppercase text-gray-800 leading-tight">Interesse: {c.propertyInterest}</div>
                                            <div className="grid grid-cols-2 gap-2 mb-4 text-[9px] font-bold">
                                                <div className="bg-slate-50 p-2 rounded-lg leading-tight"><p className="text-blue-800 text-[7px] uppercase">🎂 Nasc.</p>{c.birthDate ? new Date(c.birthDate).toLocaleDateString('pt-BR') : '-'}</div>
                                                <div className="bg-slate-50 p-2 rounded-lg leading-tight"><p className="text-green-700 text-[7px] uppercase">📞 Zap</p>{c.phones?.[0]}</div>
                                            </div>
                                            <div className="mb-6 bg-slate-50 p-4 rounded-2xl border border-slate-100 h-28 overflow-y-auto text-xs italic font-medium text-slate-600 scrollbar-hide">
                                                {c.observations || 'Nenhuma observação cadastrada.'}
                                            </div>
                                            <div className="flex flex-col gap-2">
                                                <a href={`https://wa.me/55${c.phones?.[0]?.replace(/\D/g,'')}`} target="_blank" className="bg-green-500 text-white text-center font-black py-4 rounded-2xl shadow-lg text-[10px] uppercase tracking-widest transition active:scale-95">WhatsApp</a>
                                                <button onClick={() => deleteDoc(doc(db, 'clients', c.id)).then(() => loadData(user.uid))} className="w-full text-[8px] font-black text-slate-200 hover:text-red-500 uppercase tracking-widest text-center mt-2">Excluir</button>
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        </div>
                    )}

                    {activeTab === 'properties' && (
                        <div className="space-y-8">
                            <div className="flex justify-end"><button onClick={() => setActiveTab('add-property')} className="bg-purple-900 text-white px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest">Novo Imóvel +</button></div>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                                {properties.map(p => (
                                    <div key={p.id} className="bg-white rounded-[3rem] shadow-xl overflow-hidden border border-slate-100 flex flex-col hover:shadow-2xl transition duration-500 relative group">
                                        <button onClick={() => {setEditingId(p.id); setName(p.title); setPropPrice(p.price); setPropImg(p.image); setPropLink(p.link); setPropPdf(p.pdf); setPropAddress(p.address); setObservations(p.description); setActiveTab('add-property');}} className="absolute top-4 left-4 z-10 p-2 bg-white/80 backdrop-blur rounded-full text-slate-400 hover:text-blue-600 shadow-sm opacity-0 group-hover:opacity-100 transition">✏️</button>
                                        <div className="h-64 relative overflow-hidden bg-slate-100">
                                            {p.image ? <img src={p.image.split(',')[0]} className="w-full h-full object-cover transition-transform group-hover:scale-105" alt="imóvel" /> : <div className="h-full flex items-center justify-center font-black text-slate-300">LP</div>}
                                            <div className="absolute bottom-4 left-6 bg-blue-900/80 backdrop-blur px-4 py-2 rounded-2xl"><p className="text-white font-black text-xl italic">{p.price}</p></div>
                                        </div>
                                        <div className="p-8 flex-1 flex flex-col">
                                            <h4 className="font-black text-xl uppercase text-blue-900 mb-2 italic leading-none">{p.title}</h4>
                                            <p className="text-[10px] font-bold text-slate-400 uppercase mb-6 leading-tight italic">📍 {p.address}</p>
                                            <div className="mt-auto space-y-3">
                                                {p.link && <a href={p.link} target="_blank" className="block bg-blue-600 text-white text-center py-3.5 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg">Abrir Site</a>}
                                                {p.pdf && <a href={p.pdf} target="_blank" className="block bg-red-600 text-white text-center py-3.5 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg">E-book / PDF</a>}
                                                <button onClick={() => deleteDoc(doc(db, 'properties', p.id)).then(() => loadData(user.uid))} className="w-full text-[9px] font-black text-slate-200 hover:text-red-500 uppercase tracking-widest text-center mt-2">Remover</button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {(activeTab === 'add-client' || activeTab === 'add-property') && (
                        <div className="max-w-2xl mx-auto glass p-12 rounded-[4rem] shadow-2xl relative border-2 border-white/50">
                            <h2 className="text-3xl font-black mb-10 text-blue-900 uppercase italic tracking-tighter text-center">{activeTab === 'add-client' ? (editingId ? 'Editar Cliente' : 'Novo Cliente') : (editingId ? 'Editar Imóvel' : 'Novo Imóvel')}</h2>
                            <div className="space-y-4">
                                <input type="text" placeholder="Nome Completo / Empreendimento" value={name} onChange={e => setName(e.target.value)} className="w-full p-4 bg-white rounded-2xl font-bold border outline-none focus:border-blue-900" />
                                {activeTab === 'add-client' ? (
                                    <>
                                        <input type="text" placeholder="WhatsApp" value={phone} onChange={e => setPhone(e.target.value)} className="w-full p-4 bg-white rounded-2xl font-bold border" />
                                        <input type="date" value={birthDate} onChange={e => setBirthDate(e.target.value)} className="w-full p-4 bg-white rounded-2xl font-bold border uppercase text-xs" />
                                        <select value={propertyInterest} onChange={e => setPropertyInterest(e.target.value)} className="w-full p-4 bg-yellow-50 rounded-2xl font-black border border-yellow-100 outline-none">
                                            <option value="">Selecionar Imóvel de Interesse...</option>
                                            {properties.map(p => <option key={p.id} value={p.title}>{p.title}</option>)}
                                        </select>
                                        <textarea placeholder="Observações..." value={observations} onChange={e => setObservations(e.target.value)} className="w-full p-4 bg-white rounded-2xl font-bold h-32 border" />
                                    </>
                                ) : (
                                    <>
                                        <input type="text" placeholder="Valor" value={propPrice} onChange={e => setPropPrice(formatCurrency(e.target.value))} className="w-full p-4 bg-green-50 rounded-2xl font-black text-green-700 border" />
                                        <input type="text" placeholder="Endereço" value={propAddress} onChange={e => setPropAddress(e.target.value)} className="w-full p-4 bg-white rounded-2xl font-bold border" />
                                        <input type="text" placeholder="URL da Imagem" value={propImg} onChange={e => setPropImg(e.target.value)} className="w-full p-4 bg-white rounded-2xl font-bold border text-xs italic" />
                                        <input type="text" placeholder="Link do Site" value={propLink} onChange={e => setPropLink(e.target.value)} className="w-full p-4 bg-blue-50 rounded-2xl font-bold border text-xs" />
                                        <input type="text" placeholder="Link do PDF" value={propPdf} onChange={e => setPropPdf(e.target.value)} className="w-full p-4 bg-red-50 rounded-2xl font-bold border text-xs" />
                                        <textarea placeholder="Descrição rápida..." value={observations} onChange={e => setObservations(e.target.value)} className="w-full p-4 bg-white rounded-2xl font-bold h-24 border" />
                                    </>
                                )}
                                <div className="flex gap-4 pt-4">
                                    <button onClick={activeTab === 'add-client' ? (editingId ? () => saveEditClient(editingId) : addClient) : (editingId ? () => saveEditProperty(editingId) : addProperty)} className="flex-1 bg-blue-900 text-white font-black py-5 rounded-3xl shadow-xl uppercase tracking-widest transition hover:bg-black active:scale-95">Salvar</button>
                                    <button onClick={() => {setActiveTab(activeTab === 'add-client' ? 'clients' : 'properties'); resetForm();}} className="flex-1 bg-slate-100 text-slate-400 font-black py-5 rounded-3xl uppercase tracking-widest hover:bg-slate-200 transition">Cancelar</button>
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
