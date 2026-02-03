import React, { useState, useEffect } from 'react';
import { db, auth } from './firebase/config';
import { collection, addDoc, getDocs, query, where, updateDoc, doc, deleteDoc } from 'firebase/firestore';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import Login from './components/Login';

const TailwindStyle = () => (
  <style>{`
    @import url('https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css');
    .glass { background: rgba(255, 255, 255, 0.75); backdrop-filter: blur(15px); border: 1px solid rgba(255, 255, 255, 0.4); }
    .ai-gradient { background: linear-gradient(135deg, #0f172a 0%, #1e3a8a 100%); }
    .shadow-premium { box-shadow: 0 10px 30px -5px rgba(0, 0, 0, 0.1); }
    .scrollbar-hide::-webkit-scrollbar { display: none; }
  `}</style>
);

function App() {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('dashboard');
    const [showForm, setShowForm] = useState(false); // Controla a exibição do formulário
    
    const [clients, setClients] = useState([]);
    const [properties, setProperties] = useState([]);
    const [editingId, setEditingId] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('TODOS');

    // ESTADOS DE INPUT
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
        if (score >= 50) return { label: "QUENTE", color: "text-red-500", icon: "🔥" };
        if (score >= 20) return { label: "MORNO", color: "text-orange-400", icon: "⚡" };
        return { label: "FRIO", color: "text-blue-400", icon: "❄️" };
    };

    const sendMaterial = (client) => {
        const prop = properties.find(p => p.title === client.propertyInterest);
        const pdfLink = prop?.pdf || "Link em breve";
        const msg = `Olá ${client.fullName}! Aqui é o Alexandre. Segue o material do ${client.propertyInterest}: ${pdfLink}`;
        window.open(`https://wa.me/55${client.phones?.[0]?.replace(/\D/g,'')}?text=${encodeURIComponent(msg)}`, '_blank');
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
        setEditingId(null); setShowForm(false);
    };

    const addClient = async () => {
        await addDoc(collection(db, 'clients'), {
            fullName: name, email, phones: [phone], propertyInterest, birthDate, observations,
            status: "LEAD", assignedAgent: user.uid, createdAt: new Date()
        });
        resetForm(); loadData(user.uid);
    };

    const addProperty = async () => {
        await addDoc(collection(db, 'properties'), {
            title: name, price: propPrice, address: propAddress, description: observations,
            link: propLink, pdf: propPdf, image: propImg, userId: user.uid, createdAt: new Date()
        });
        resetForm(); loadData(user.uid);
    };

    const filteredClients = clients.filter(c => {
        const match = (c.fullName || "").toLowerCase().includes(searchTerm.toLowerCase()) || (c.propertyInterest || "").toLowerCase().includes(searchTerm.toLowerCase());
        return match && (statusFilter === 'TODOS' || c.status === statusFilter);
    });

    if (loading) return <div className="h-screen flex items-center justify-center font-black text-blue-900 bg-slate-50 animate-pulse uppercase">ALEXANDRE CRM...</div>;
    if (!user) return <Login onLogin={setUser} />;

    return (
        <div className="min-h-screen bg-slate-50 flex font-sans text-slate-900 overflow-x-hidden">
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
                        { id: 'clients', label: 'Clientes', icon: '👥' },
                        { id: 'properties', label: 'Imóveis', icon: '🏠' }
                    ].map(item => (
                        <button key={item.id} onClick={() => {setActiveTab(item.id); resetForm();}} className={`w-full flex items-center lg:gap-4 p-4 rounded-2xl font-bold text-sm transition-all ${activeTab === item.id ? 'bg-blue-900 text-white shadow-xl' : 'text-slate-400 hover:bg-slate-50'}`}>
                            <span className="text-lg">{item.icon}</span> <span className="hidden lg:block uppercase text-[10px] tracking-widest">{item.label}</span>
                        </button>
                    ))}
                </nav>
                <div className="p-4"><button onClick={() => signOut(auth)} className="w-full p-4 bg-red-50 text-red-600 rounded-2xl font-black text-[9px] uppercase">Sair</button></div>
            </aside>

            {/* MAIN CONTENT */}
            <main className="flex-1 overflow-y-auto">
                <header className="p-8 flex justify-between items-center bg-white/70 backdrop-blur-md sticky top-0 z-40 border-b border-slate-100">
                    <h2 className="text-2xl font-black uppercase italic tracking-tighter text-blue-900 uppercase">{activeTab}</h2>
                    <input type="text" placeholder="Buscar..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="p-3 bg-slate-100 rounded-2xl text-xs font-bold w-48 lg:w-80 outline-none focus:ring-2 ring-blue-500 transition-all shadow-inner" />
                </header>

                <div className="p-8">
                    {/* DASHBOARD */}
                    {activeTab === 'dashboard' && (
                        <div className="space-y-10">
                            <div className="ai-gradient rounded-[3rem] p-10 text-white shadow-2xl relative overflow-hidden">
                                <h3 className="text-3xl font-black italic mb-2 uppercase relative z-10 leading-none">Bem-vindo, Alexandre!</h3>
                                <p className="opacity-70 font-bold text-sm uppercase tracking-widest relative z-10">Monitorando {clients.filter(c => analyzeLead(c).label === "QUENTE").length} oportunidades de alto impacto.</p>
                                <div className="absolute right-0 top-0 text-[12rem] opacity-5 font-black italic select-none uppercase">CRM</div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                                <div className="glass p-8 rounded-[3rem] shadow-premium"><p className="text-slate-400 text-[10px] font-black uppercase mb-2">Leads Totais</p><p className="text-5xl font-black text-blue-900 leading-none">{clients.length}</p></div>
                                <div className="glass p-8 rounded-[3rem] shadow-premium"><p className="text-slate-400 text-[10px] font-black uppercase mb-2">Imóveis Ativos</p><p className="text-5xl font-black text-blue-600 leading-none">{properties.length}</p></div>
                                <div className="glass p-8 rounded-[3rem] shadow-premium"><p className="text-slate-400 text-[10px] font-black uppercase mb-2">Fechamentos</p><p className="text-5xl font-black text-green-600 leading-none">{clients.filter(c => c.status === 'FECHADO').length}</p></div>
                            </div>
                        </div>
                    )}

                    {/* CLIENTS SECTION */}
                    {activeTab === 'clients' && (
                        <div className="space-y-8">
                            <div className="flex flex-wrap justify-between items-center gap-4">
                                <div className="flex gap-2 bg-white p-1 rounded-full shadow-sm">
                                    {['TODOS', 'LEAD', 'AGENDADO', 'PROPOSTA', 'FECHADO'].map(f => (
                                        <button key={f} onClick={() => setStatusFilter(f)} className={`px-4 py-2 rounded-full text-[9px] font-black transition ${statusFilter === f ? 'bg-blue-900 text-white shadow-md' : 'text-slate-400'}`}>{f}</button>
                                    ))}
                                </div>
                                <button onClick={() => setShowForm(true)} className="bg-blue-900 text-white px-8 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl active:scale-95 transition">Adicionar Cliente +</button>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                                {filteredClients.map(c => {
                                    const ai = analyzeLead(c);
                                    return (
                                        <div key={c.id} className={`bg-white rounded-[2.5rem] shadow-premium p-8 border border-slate-50 relative group transition-all duration-500 hover:translate-y-[-5px] ${ai.label === 'QUENTE' ? 'border-red-100 bg-red-50/10' : ''}`}>
                                            <button onClick={() => {setEditingId(c.id); setName(c.fullName); setPhone(c.phones?.[0]); setPropertyInterest(c.propertyInterest); setBirthDate(c.birthDate); setObservations(c.observations); setShowForm(true);}} className="absolute top-6 left-6 p-2 text-slate-300 hover:text-blue-600 transition">✏️</button>
                                            <div className="flex justify-between items-start mb-6 pt-4">
                                                <h3 className="font-black text-blue-900 uppercase text-lg truncate ml-8 leading-none">{c.fullName}</h3>
                                                <span className={`text-[8px] font-black px-2 py-1 rounded-lg uppercase ${ai.color} bg-white shadow-sm`}>{ai.icon} {ai.label}</span>
                                            </div>
                                            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-3 mb-4 rounded-r-2xl text-[10px] font-black italic uppercase text-slate-700 leading-tight">🚩 Interesse: {c.propertyInterest}</div>
                                            <div className="grid grid-cols-2 gap-4 mb-4 text-[9px] font-bold">
                                                <div className="bg-slate-50 p-2 rounded-xl leading-tight"><p className="text-blue-800 text-[7px] uppercase mb-1">🎂 Nascimento</p>{c.birthDate ? new Date(c.birthDate).toLocaleDateString('pt-BR') : '-'}</div>
                                                <div className="bg-slate-50 p-2 rounded-xl leading-tight"><p className="text-green-700 text-[7px] uppercase mb-1">📞 WhatsApp</p>{c.phones?.[0]}</div>
                                            </div>
                                            <div className="mb-6 bg-slate-50/50 p-4 rounded-3xl border border-slate-100 h-28 overflow-y-auto text-xs italic font-medium text-slate-600 scrollbar-hide shadow-inner">
                                                {c.observations || 'Nenhum histórico.'}
                                            </div>
                                            <div className="flex flex-col gap-2">
                                                <button onClick={() => sendMaterial(c)} className="bg-blue-600 hover:bg-blue-700 text-white font-black py-4 rounded-2xl shadow-lg text-[10px] uppercase tracking-widest transition">Enviar Material (PDF)</button>
                                                <a href={`https://wa.me/55${c.phones?.[0]?.replace(/\D/g,'')}`} target="_blank" className="bg-green-500 hover:bg-green-600 text-white text-center font-black py-3.5 rounded-2xl shadow-lg text-[10px] uppercase tracking-widest transition">Zap Direto</a>
                                                <button onClick={() => deleteDoc(doc(db, 'clients', c.id)).then(() => loadData(user.uid))} className="w-full text-[9px] font-black text-slate-200 hover:text-red-500 uppercase tracking-widest text-center mt-2">Remover</button>
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        </div>
                    )}

                    {/* PROPERTIES SECTION */}
                    {activeTab === 'properties' && (
                        <div className="space-y-8">
                            <div className="flex justify-end"><button onClick={() => setShowForm(true)} className="bg-blue-900 text-white px-8 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl active:scale-95 transition">Novo Imóvel +</button></div>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
                                {properties.map(p => (
                                    <div key={p.id} className="bg-white rounded-[3rem] shadow-premium overflow-hidden border border-slate-100 flex flex-col hover:shadow-2xl transition-all duration-500 relative group">
                                        <button onClick={() => {setEditingId(p.id); setName(p.title); setPropPrice(p.price); setPropImg(p.image); setPropLink(p.link); setPropPdf(p.pdf); setPropAddress(p.address); setObservations(p.description); setShowForm(true);}} className="absolute top-4 left-4 z-10 p-2.5 bg-white/90 backdrop-blur rounded-full text-slate-400 hover:text-blue-600 shadow-lg opacity-0 group-hover:opacity-100 transition duration-300">✏️</button>
                                        <div className="h-64 relative overflow-hidden bg-slate-100">
                                            {p.image ? <img src={p.image.split(',')[0]} className="w-full h-full object-cover group-hover:scale-105 transition duration-700" alt="imóvel" /> : <div className="h-full flex items-center justify-center font-black text-slate-200 uppercase italic">Lopes</div>}
                                            <div className="absolute top-4 right-4 bg-green-500 text-white px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest">Disponível</div>
                                        </div>
                                        <div className="p-8 flex-1 flex flex-col">
                                            <h4 className="font-black text-xl uppercase text-blue-900 mb-1 italic leading-none">{p.title}</h4>
                                            <p className="text-blue-600 font-black text-2xl mb-4 italic tracking-tighter leading-none">{p.price}</p>
                                            <p className="text-[10px] font-bold text-slate-400 uppercase mb-8 leading-tight italic">📍 {p.address}</p>
                                            <div className="mt-auto grid grid-cols-2 gap-3">
                                                {p.link && <a href={p.link} target="_blank" className="bg-blue-900 text-white text-center py-4 rounded-2xl font-black text-[9px] uppercase tracking-widest shadow-lg hover:bg-black transition">Site</a>}
                                                {p.pdf && <a href={p.pdf} target="_blank" className="bg-red-600 text-white text-center py-4 rounded-2xl font-black text-[9px] uppercase tracking-widest shadow-lg hover:bg-red-700 transition">E-book (PDF)</a>}
                                            </div>
                                            <button onClick={() => deleteDoc(doc(db, 'properties', p.id)).then(() => loadData(user.uid))} className="w-full text-[9px] font-black text-slate-200 hover:text-red-500 uppercase tracking-widest text-center mt-6 transition">Remover</button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* FORMULÁRIO SOBREPOSTO (MODAL FIX) */}
                    {showForm && (
                        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fadeIn">
                            <div className="glass w-full max-w-2xl p-10 rounded-[3rem] shadow-2xl relative border-2 border-white/50">
                                <h2 className="text-2xl font-black mb-8 text-blue-900 uppercase italic tracking-tighter text-center">
                                    {activeTab === 'clients' ? (editingId ? 'Editar Cliente' : 'Novo Cadastro de Cliente') : (editingId ? 'Editar Imóvel' : 'Novo Cadastro de Imóvel')}
                                </h2>
                                <div className="space-y-4 max-h-[70vh] overflow-y-auto px-2 scrollbar-hide">
                                    <input type="text" placeholder="Nome Completo / Título" value={name} onChange={e => setName(e.target.value)} className="w-full p-4 bg-white rounded-2xl font-bold border-2 border-transparent focus:border-blue-900 outline-none shadow-sm" />
                                    {activeTab === 'clients' ? (
                                        <>
                                            <input type="text" placeholder="WhatsApp (DDD + Número)" value={phone} onChange={e => setPhone(e.target.value)} className="w-full p-4 bg-white rounded-2xl font-bold border shadow-sm" />
                                            <div className="flex flex-col gap-1 px-3"><label className="text-[10px] font-black uppercase text-slate-400">Data de Nascimento</label>
                                            <input type="date" value={birthDate} onChange={e => setBirthDate(e.target.value)} className="w-full p-4 bg-white rounded-2xl font-bold border uppercase text-xs shadow-sm" /></div>
                                            <select value={propertyInterest} onChange={e => setPropertyInterest(e.target.value)} className="w-full p-4 bg-yellow-50 rounded-2xl font-black border border-yellow-100 outline-none shadow-sm">
                                                <option value="">Selecione Imóvel de Interesse...</option>
                                                {properties.map(p => <option key={p.id} value={p.title}>{p.title}</option>)}
                                            </select>
                                            <textarea placeholder="Observações de atendimento..." value={observations} onChange={e => setObservations(e.target.value)} className="w-full p-4 bg-white rounded-2xl font-bold h-32 border shadow-sm text-sm" />
                                        </>
                                    ) : (
                                        <>
                                            <input type="text" placeholder="Valor" value={propPrice} onChange={e => setPropPrice(formatCurrency(e.target.value))} className="w-full p-4 bg-green-50 rounded-2xl font-black text-green-700 border shadow-sm" />
                                            <input type="text" placeholder="URL da Foto Principal" value={propImg} onChange={e => setPropImg(e.target.value)} className="w-full p-4 bg-white rounded-2xl font-bold italic border shadow-sm text-xs" />
                                            <input type="text" placeholder="Endereço / Local" value={propAddress} onChange={e => setPropAddress(e.target.value)} className="w-full p-4 bg-white rounded-2xl font-bold border shadow-sm" />
                                            <input type="text" placeholder="Link do Site" value={propLink} onChange={e => setPropLink(e.target.value)} className="w-full p-4 bg-blue-50 rounded-2xl font-bold border text-xs shadow-sm" />
                                            <input type="text" placeholder="Link do PDF" value={propPdf} onChange={e => setPropPdf(e.target.value)} className="w-full p-4 bg-red-50 rounded-2xl font-bold border text-xs shadow-sm" />
                                        </>
                                    )}
                                </div>
                                <div className="flex gap-4 pt-8">
                                    <button onClick={activeTab === 'clients' ? (editingId ? () => updateDoc(doc(db, 'clients', editingId), {fullName: name, phones: [phone], birthDate, propertyInterest, observations}).then(resetForm) : addClient) : (editingId ? () => updateDoc(doc(db, 'properties', editingId), {title: name, price: propPrice, image: propImg, link: propLink, pdf: propPdf, address: propAddress}).then(resetForm) : addProperty)} className="flex-1 bg-blue-900 text-white font-black py-5 rounded-[2.5rem] shadow-2xl uppercase tracking-widest transition hover:bg-black active:scale-95">Salvar</button>
                                    <button onClick={resetForm} className="flex-1 bg-slate-100 text-slate-400 font-black py-5 rounded-[2.5rem] uppercase tracking-widest hover:bg-slate-200 transition">Cancelar</button>
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
