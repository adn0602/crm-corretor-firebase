import React, { useState, useEffect } from 'react';
import { db, auth } from './firebase/config';
import { collection, addDoc, getDocs, query, where, updateDoc, doc, deleteDoc } from 'firebase/firestore';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import Login from './components/Login';

// ESTILOS FUTURISTAS COM GLOW INTELIGENTE
const TailwindStyle = () => (
  <style>{`
    @import url('https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css');
    .glass { background: rgba(255, 255, 255, 0.7); backdrop-filter: blur(12px); border: 1px solid rgba(255, 255, 255, 0.4); }
    .neon-hot { box-shadow: 0 0 20px rgba(239, 68, 68, 0.4); border: 1px solid rgba(239, 68, 68, 0.5); }
    .neon-cold { box-shadow: 0 0 20px rgba(59, 130, 246, 0.2); }
    .ai-gradient { background: linear-gradient(135deg, #1e3a8a 0%, #4338ca 100%); }
    @keyframes pulse-ai { 0% { opacity: 0.6; } 50% { opacity: 1; } 100% { opacity: 0.6; } }
    .animate-ai { animation: pulse-ai 2s infinite; }
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

    // CAMPOS DE FORMULÁRIO
    const [name, setName] = useState('');
    const [phone, setPhone] = useState('');
    const [propertyInterest, setPropertyInterest] = useState('');
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

    // LÓGICA DE INTELIGÊNCIA ARTIFICIAL (ANÁLISE DE TEMPERATURA)
    const analyzeLead = (client) => {
        const text = (client.observations || "").toLowerCase();
        const status = client.status || "LEAD";
        let score = 0;

        if (status === "PROPOSTA") score += 50;
        if (status === "AGENDADO") score += 30;
        if (text.includes("urgente") || text.includes("agora") || text.includes("comprar")) score += 20;
        if (text.includes("visitou") || text.includes("gostou")) score += 15;
        if (text.includes("parado") || text.includes("depois")) score -= 20;

        if (score >= 50) return { label: "QUENTE", color: "text-red-500", icon: "🔥", glow: "neon-hot" };
        if (score >= 20) return { label: "MORNO", color: "text-orange-400", icon: "⚡", glow: "" };
        return { label: "FRIO", color: "text-blue-400", icon: "❄️", glow: "neon-cold" };
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
        setName(''); setPhone(''); setPropertyInterest(''); setObservations(''); setPropPrice(''); setPropImg(''); setEditingId(null);
    };

    if (loading) return <div className="h-screen flex items-center justify-center font-black text-blue-900 bg-slate-900 uppercase tracking-widest animate-ai">Iniciando IA Lopes...</div>;
    if (!user) return <Login onLogin={setUser} />;

    return (
        <div className="min-h-screen bg-slate-50 flex font-sans text-slate-900">
            <TailwindStyle />
            
            {/* SIDEBAR FUTURISTA */}
            <aside className="w-20 lg:w-64 bg-white border-r border-slate-200 flex flex-col sticky top-0 h-screen z-50">
                <div className="p-6 mb-8">
                    <h1 className="text-xl font-black text-blue-900 italic hidden lg:block uppercase tracking-tighter">AI <span className="text-blue-500 underline">CRM</span></h1>
                </div>
                <nav className="flex-1 px-4 space-y-4 text-center lg:text-left">
                    <button onClick={() => setActiveTab('dashboard')} className={`w-full flex items-center lg:gap-4 p-4 rounded-2xl font-bold text-sm transition-all ${activeTab === 'dashboard' ? 'bg-blue-900 text-white shadow-xl' : 'text-slate-400 hover:bg-slate-100'}`}>
                        <span>📊</span> <span className="hidden lg:block uppercase tracking-widest text-[10px]">Dashboard</span>
                    </button>
                    <button onClick={() => setActiveTab('clients')} className={`w-full flex items-center lg:gap-4 p-4 rounded-2xl font-bold text-sm transition-all ${activeTab === 'clients' ? 'bg-blue-900 text-white shadow-xl' : 'text-slate-400 hover:bg-slate-100'}`}>
                        <span>👥</span> <span className="hidden lg:block uppercase tracking-widest text-[10px]">Leads</span>
                    </button>
                    <button onClick={() => setActiveTab('properties')} className={`w-full flex items-center lg:gap-4 p-4 rounded-2xl font-bold text-sm transition-all ${activeTab === 'properties' ? 'bg-blue-900 text-white shadow-xl' : 'text-slate-400 hover:bg-slate-100'}`}>
                        <span>🏠</span> <span className="hidden lg:block uppercase tracking-widest text-[10px]">Produtos</span>
                    </button>
                </nav>
                <div className="p-4"><button onClick={() => signOut(auth)} className="w-full p-4 bg-red-50 text-red-600 rounded-2xl font-black text-[9px] uppercase hover:bg-red-100 transition-all">Logout</button></div>
            </aside>

            {/* CONTEÚDO */}
            <main className="flex-1 overflow-y-auto">
                <header className="p-8 flex justify-between items-center bg-white/60 backdrop-blur-md sticky top-0 z-40 border-b border-slate-100">
                    <div>
                        <h2 className="text-3xl font-black uppercase italic tracking-tighter text-blue-900">{activeTab}</h2>
                    </div>
                    <div className="flex gap-4">
                        <div className="glass px-4 py-2 rounded-2xl flex items-center gap-2">
                            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                            <span className="text-[10px] font-black uppercase text-slate-500">IA Ativa</span>
                        </div>
                    </div>
                </header>

                <div className="p-8">
                    {activeTab === 'dashboard' && (
                        <div className="space-y-10">
                            {/* INSIGHTS DA IA */}
                            <div className="ai-gradient rounded-[3rem] p-10 text-white shadow-2xl relative overflow-hidden">
                                <div className="relative z-10 flex flex-col lg:flex-row justify-between items-center gap-8">
                                    <div className="max-w-md">
                                        <p className="text-blue-200 text-[10px] font-black uppercase tracking-[0.3em] mb-4">Análise do Dia</p>
                                        <h3 className="text-4xl font-black italic mb-4 leading-none uppercase">Alexandre, você tem {clients.filter(c => analyzeLead(c).label === "QUENTE").length} Leads Quentes!</h3>
                                        <p className="opacity-80 font-medium text-sm leading-relaxed">A inteligência detectou alta probabilidade de fechamento no empreendimento {properties[0]?.title || 'cadastrado'}. Foque neles agora.</p>
                                    </div>
                                    <div className="flex gap-4">
                                        <div className="bg-white/10 p-6 rounded-3xl backdrop-blur-md text-center border border-white/20">
                                            <p className="text-5xl mb-2">🔥</p>
                                            <p className="text-2xl font-black">{clients.filter(c => analyzeLead(c).label === "QUENTE").length}</p>
                                            <p className="text-[9px] font-bold uppercase opacity-60">Prioridade</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* MÉTRICAS */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                                <div className="glass p-8 rounded-[2.5rem] hover:scale-105 transition-all duration-500">
                                    <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-4">Volume Total</p>
                                    <p className="text-6xl font-black text-blue-900">{clients.length}</p>
                                    <div className="mt-4 w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                        <div className="bg-blue-600 h-full w-full opacity-30"></div>
                                    </div>
                                </div>
                                <div className="glass p-8 rounded-[2.5rem] hover:scale-105 transition-all duration-500">
                                    <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-4">Taxa de Conversão</p>
                                    <p className="text-6xl font-black text-green-600">
                                        {clients.length > 0 ? ((clients.filter(c => c.status === 'FECHADO').length / clients.length) * 100).toFixed(0) : 0}%
                                    </p>
                                    <p className="text-[10px] font-black text-slate-300 mt-2 uppercase tracking-widest italic">Performance Real</p>
                                </div>
                                <div className="glass p-8 rounded-[2.5rem] bg-slate-900 text-white">
                                    <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-4 italic">Lead Temperature</p>
                                    <div className="flex justify-between items-end h-20 gap-2">
                                        <div className="bg-blue-500 w-full rounded-t-lg" style={{ height: '30%' }}></div>
                                        <div className="bg-orange-400 w-full rounded-t-lg" style={{ height: '60%' }}></div>
                                        <div className="bg-red-500 w-full rounded-t-lg shadow-lg shadow-red-500/50" style={{ height: '90%' }}></div>
                                    </div>
                                    <p className="text-center text-[8px] font-black uppercase mt-4 text-slate-400">Escala de Calor Preditiva</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'clients' && (
                        <div className="space-y-8">
                            <div className="flex justify-between items-center">
                                <h3 className="text-xl font-black italic uppercase tracking-tighter">Gerenciamento de Ativos</h3>
                                <button onClick={() => setActiveTab('add-client')} className="bg-blue-900 text-white px-8 py-3 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl hover:bg-black transition-all active:scale-95">Novo Cadastro +</button>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                                {clients.map(c => {
                                    const ai = analyzeLead(c);
                                    return (
                                        <div key={c.id} className={`glass p-8 rounded-[3rem] group relative transition-all duration-500 hover:shadow-2xl ${ai.glow}`}>
                                            <div className="flex justify-between items-start mb-6">
                                                <div className="w-16 h-16 bg-blue-900 text-white rounded-3xl flex items-center justify-center text-2xl font-black italic shadow-lg">
                                                    {c.fullName[0]}
                                                </div>
                                                <div className="text-right">
                                                    <p className={`text-[10px] font-black tracking-widest uppercase ${ai.color}`}>{ai.icon} {ai.label}</p>
                                                    <span className="text-[8px] font-bold text-slate-300 uppercase italic">Análise de IA</span>
                                                </div>
                                            </div>
                                            <h4 className="font-black text-2xl uppercase tracking-tighter text-blue-900 truncate mb-1 leading-none">{c.fullName}</h4>
                                            <p className="text-[10px] font-black uppercase text-slate-400 mb-6 italic tracking-widest">Interesse: {c.propertyInterest}</p>
                                            
                                            <div className="mb-8 p-4 bg-slate-50/50 rounded-2xl border border-slate-100 min-h-[80px] text-xs font-semibold text-slate-500 italic leading-relaxed">
                                                {c.observations || 'Nenhuma nota de inteligência...'}
                                            </div>

                                            <div className="flex gap-3">
                                                <a href={`https://wa.me/55${c.phones?.[0]?.replace(/\D/g,'')}`} target="_blank" className="flex-1 bg-green-500 hover:bg-green-600 text-white text-center py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg transition active:scale-95">Zap</a>
                                                <button onClick={() => {setEditingId(c.id); setName(c.fullName); setPhone(c.phones?.[0]); setPropertyInterest(c.propertyInterest); setObservations(c.observations); setActiveTab('add-client');}} className="p-4 glass rounded-2xl text-blue-600 hover:bg-blue-600 hover:text-white transition-all duration-300">✏️</button>
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        </div>
                    )}

                    {activeTab === 'properties' && (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            {properties.map(p => (
                                <div key={p.id} className="bg-white rounded-[3rem] overflow-hidden shadow-xl border border-slate-100 flex flex-col hover:shadow-2xl transition duration-500 group">
                                    <div className="h-64 relative overflow-hidden bg-slate-100 flex items-center justify-center">
                                        {p.image ? <img src={p.image.split(',')[0]} className="w-full h-full object-cover group-hover:scale-110 transition duration-1000" alt="imóvel" /> : <p className="text-slate-300 font-black text-3xl italic">Lopes</p>}
                                        <div className="absolute top-4 right-4 bg-white/80 backdrop-blur px-4 py-1.5 rounded-full shadow-lg">
                                            <p className="text-[10px] font-black text-green-600 uppercase italic">{p.price}</p>
                                        </div>
                                    </div>
                                    <div className="p-8 flex-1 flex flex-col">
                                        <h4 className="font-black text-xl uppercase text-blue-900 mb-6 italic leading-none">{p.title}</h4>
                                        <div className="mt-auto space-y-3">
                                            {p.link && <a href={p.link} target="_blank" className="block bg-blue-900 text-white text-center py-3.5 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl hover:bg-black transition">Visualizar Material</a>}
                                            <button onClick={() => deleteDoc(doc(db, 'properties', p.id)).then(() => loadData(user.uid))} className="w-full text-[9px] font-black text-slate-300 hover:text-red-500 uppercase tracking-widest transition">Desativar Item</button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {(activeTab === 'add-client' || activeTab === 'add-property') && (
                        <div className="max-w-2xl mx-auto glass p-12 rounded-[4rem] shadow-2xl relative border-2 border-white/50">
                            <h2 className="text-3xl font-black mb-10 text-blue-900 uppercase italic tracking-tighter text-center leading-none">Configuração de Dados</h2>
                            <div className="space-y-6">
                                <input type="text" placeholder="Nome do Cliente / Imóvel" value={name} onChange={e => setName(e.target.value)} className="w-full p-5 bg-white rounded-3xl font-bold border-2 border-transparent focus:border-blue-900 outline-none transition shadow-sm" />
                                {activeTab === 'add-client' ? (
                                    <>
                                        <input type="text" placeholder="WhatsApp (DDD + Número)" value={phone} onChange={e => setPhone(e.target.value)} className="w-full p-5 bg-white rounded-3xl font-bold border-none shadow-sm" />
                                        <select value={propertyInterest} onChange={e => setPropertyInterest(e.target.value)} className="w-full p-5 bg-yellow-50 rounded-3xl font-black border-none shadow-sm outline-none">
                                            <option value="">Imóvel de Interesse...</option>
                                            {properties.map(p => <option key={p.id} value={p.title}>{p.title}</option>)}
                                        </select>
                                        <textarea placeholder="Observações (A IA lerá isso para medir a temperatura)..." value={observations} onChange={e => setObservations(e.target.value)} className="w-full p-5 bg-white rounded-3xl font-bold h-40 border-none shadow-sm text-sm" />
                                    </>
                                ) : (
                                    <>
                                        <input type="text" placeholder="Valor do Imóvel" value={propPrice} onChange={e => setPropPrice(e.target.value)} className="w-full p-5 bg-green-50 rounded-3xl font-black text-green-700 border-none shadow-sm" />
                                        <input type="text" placeholder="Link da Imagem Principal" value={propImg} onChange={e => setPropImg(e.target.value)} className="w-full p-5 bg-white rounded-3xl font-bold italic border-none shadow-sm text-xs" />
                                    </>
                                )}
                                <div className="flex gap-6 pt-6">
                                    <button onClick={activeTab === 'add-client' ? (editingId ? () => updateDoc(doc(db, 'clients', editingId), {fullName: name, phones: [phone], propertyInterest, observations}).then(() => {resetForm(); setActiveTab('clients'); loadData(user.uid);}) : addClient) : addProperty} className="flex-1 bg-blue-900 text-white font-black py-6 rounded-[2rem] shadow-2xl uppercase tracking-widest text-lg transition hover:bg-black active:scale-95">Sincronizar</button>
                                    <button onClick={() => {setActiveTab(activeTab === 'add-client' ? 'clients' : 'properties'); resetForm();}} className="flex-1 bg-slate-100 text-slate-400 font-black py-6 rounded-[2rem] uppercase tracking-widest text-lg hover:bg-slate-200 transition">Cancelar</button>
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
