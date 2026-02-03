import React, { useState, useEffect } from 'react';
import { db, auth } from './firebase/config';
import { collection, addDoc, getDocs, query, where, updateDoc, doc, deleteDoc } from 'firebase/firestore';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import Login from './components/Login';

// ESTILOS FUTURISTAS E ANIMAÇÕES
const TailwindStyle = () => (
  <style>{`
    @import url('https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css');
    .glass { background: rgba(255, 255, 255, 0.7); backdrop-filter: blur(10px); border: 1px solid rgba(255, 255, 255, 0.3); }
    .neon-blue { box-shadow: 0 0 15px rgba(37, 99, 235, 0.3); }
    .neon-purple { box-shadow: 0 0 15px rgba(147, 51, 234, 0.3); }
    .neon-yellow { box-shadow: 0 0 15px rgba(234, 179, 8, 0.3); }
    @keyframes grow { from { width: 0; } to { width: 100%; } }
    .animate-grow { animation: grow 1.5s ease-out forwards; }
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

    const formatCurrency = (value) => {
        const clean = value.replace(/\D/g, "");
        return clean ? "R$ " + new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2 }).format(parseFloat(clean) / 100) : "";
    };

    if (loading) return <div className="h-screen flex items-center justify-center font-black text-blue-900 bg-gray-50 uppercase tracking-widest animate-pulse">Iniciando Sistemas...</div>;
    if (!user) return <Login onLogin={setUser} />;

    return (
        <div className="min-h-screen bg-slate-50 flex font-sans text-slate-900 overflow-hidden">
            <TailwindStyle />
            
            {/* MENU LATERAL FUTURISTA */}
            <aside className="w-20 lg:w-64 bg-white border-r border-slate-200 flex flex-col sticky top-0 h-screen transition-all duration-500 z-50">
                <div className="p-6 mb-4">
                    <h1 className="text-xl font-black text-blue-700 italic uppercase hidden lg:block tracking-tighter">Lopes <span className="text-yellow-400">Prime</span></h1>
                    <div className="lg:hidden w-10 h-10 bg-blue-600 rounded-xl mx-auto flex items-center justify-center text-white font-bold">LP</div>
                </div>
                <nav className="flex-1 px-4 space-y-4">
                    {[
                        { id: 'dashboard', label: 'Dashboard', icon: '📊' },
                        { id: 'clients', label: 'Meus Leads', icon: '👥' },
                        { id: 'properties', label: 'Produtos', icon: '🏠' }
                    ].map(item => (
                        <button key={item.id} onClick={() => setActiveTab(item.id)} className={`w-full flex items-center lg:gap-4 p-4 rounded-2xl font-bold text-sm transition-all duration-300 ${activeTab === item.id ? 'bg-blue-600 text-white shadow-lg neon-blue scale-105' : 'text-slate-400 hover:bg-slate-100 hover:text-slate-600'}`}>
                            <span className="text-lg">{item.icon}</span>
                            <span className="hidden lg:block">{item.label}</span>
                        </button>
                    ))}
                </nav>
                <div className="p-4 mt-auto">
                    <button onClick={() => signOut(auth)} className="w-full p-4 bg-slate-50 text-slate-400 rounded-2xl font-black text-[10px] uppercase hover:bg-red-50 hover:text-red-500 transition-all">Desconectar</button>
                </div>
            </aside>

            {/* PAINEL DE CONTEÚDO */}
            <main className="flex-1 overflow-y-auto bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-blue-50 via-slate-50 to-white">
                <header className="p-8 flex justify-between items-center bg-white/50 backdrop-blur-md sticky top-0 z-40 border-b border-slate-100">
                    <div>
                        <p className="text-[10px] font-black uppercase text-slate-400 tracking-[0.3em] mb-1">Visão Geral</p>
                        <h2 className="text-3xl font-black uppercase italic tracking-tighter">{activeTab}</h2>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="bg-white p-2 px-4 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-3">
                            <span className="w-2 h-2 bg-green-500 rounded-full animate-ping"></span>
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Sistemas Online</p>
                        </div>
                    </div>
                </header>

                <div className="p-8 space-y-10">
                    {activeTab === 'dashboard' && (
                        <>
                            {/* GRÁFICOS E MÉTRICAS FUTURISTAS */}
                            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                                <div className="glass p-6 rounded-[2.5rem] relative overflow-hidden group hover:scale-105 transition-transform duration-500">
                                    <div className="absolute top-0 right-0 p-4 opacity-10 text-6xl">📈</div>
                                    <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-2">Lead Intelligence</p>
                                    <p className="text-5xl font-black text-blue-700 tracking-tighter">{clients.length}</p>
                                    <p className="text-[10px] font-bold text-green-500 mt-2">↑ 12% vs mês anterior</p>
                                </div>
                                <div className="glass p-6 rounded-[2.5rem] relative overflow-hidden group hover:scale-105 transition-transform duration-500">
                                    <div className="absolute top-0 right-0 p-4 opacity-10 text-6xl">🏢</div>
                                    <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-2">Catálogo Ativo</p>
                                    <p className="text-5xl font-black text-purple-600 tracking-tighter">{properties.length}</p>
                                    <p className="text-[10px] font-bold text-purple-400 mt-2">Inventário em tempo real</p>
                                </div>
                                <div className="lg:col-span-2 glass p-8 rounded-[2.5rem] bg-gradient-to-br from-blue-600 to-indigo-800 text-white shadow-2xl neon-blue">
                                    <h3 className="text-xl font-black uppercase italic mb-4">Pipeline de Vendas</h3>
                                    <div className="space-y-4">
                                        {[
                                            { label: 'Prospecção', val: 75, color: 'bg-yellow-400' },
                                            { label: 'Visitas', val: 45, color: 'bg-purple-400' },
                                            { label: 'Fechamento', val: 20, color: 'bg-green-400' }
                                        ].map(bar => (
                                            <div key={bar.label}>
                                                <div className="flex justify-between text-[10px] font-black uppercase mb-1">
                                                    <span>{bar.label}</span>
                                                    <span>{bar.val}%</span>
                                                </div>
                                                <div className="w-full h-3 bg-white/10 rounded-full overflow-hidden">
                                                    <div className={`h-full ${bar.color} rounded-full animate-grow shadow-lg`} style={{ width: `${bar.val}%` }}></div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* QUADRO DE ATIVIDADES RECENTES ESTILO GLASS */}
                            <div className="glass p-10 rounded-[3rem]">
                                <h3 className="text-xl font-black uppercase italic mb-8 border-b border-slate-100 pb-4">Últimas Interações</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-sm">
                                    {clients.slice(0, 4).map(c => (
                                        <div key={c.id} className="flex items-center gap-4 p-4 hover:bg-white rounded-3xl transition duration-300 border border-transparent hover:border-slate-100 shadow-sm group">
                                            <div className="w-12 h-12 bg-blue-100 rounded-2xl flex items-center justify-center text-blue-600 font-black group-hover:bg-blue-600 group-hover:text-white transition-all">
                                                {c.fullName[0]}
                                            </div>
                                            <div>
                                                <p className="font-black text-slate-800 uppercase tracking-tight">{c.fullName}</p>
                                                <p className="text-[10px] text-slate-400 font-bold uppercase">Interessado em {c.propertyInterest}</p>
                                            </div>
                                            <div className="ml-auto text-[10px] font-black text-blue-500 uppercase tracking-widest">{c.status}</div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </>
                    )}

                    {activeTab === 'clients' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {clients.map(c => (
                                <div key={c.id} className="glass p-8 rounded-[3rem] hover:scale-[1.02] transition-all duration-500 group relative">
                                    <button onClick={() => {setEditingId(c.id); setName(c.fullName); setPhone(c.phones?.[0]); setPropertyInterest(c.propertyInterest); setActiveTab('add-client');}} className="absolute top-6 left-6 p-2 bg-slate-50 rounded-full text-slate-300 hover:text-blue-600 transition">✏️</button>
                                    <div className="text-center mb-6">
                                        <div className="w-20 h-20 bg-gradient-to-tr from-blue-600 to-indigo-400 rounded-3xl mx-auto flex items-center justify-center text-3xl text-white font-black shadow-xl mb-4 uppercase">{c.fullName[0]}</div>
                                        <h4 className="font-black text-xl uppercase tracking-tighter text-blue-900 leading-none">{c.fullName}</h4>
                                    </div>
                                    <div className="bg-yellow-100/50 p-3 rounded-2xl text-[10px] font-black uppercase text-center text-yellow-700 mb-6 italic">"{c.propertyInterest || 'Perfil Geral'}"</div>
                                    <div className="space-y-2 mb-8 border-y border-slate-50 py-4 text-xs font-bold text-slate-500">
                                        <p>📱 {c.phones?.[0]}</p>
                                        <p className="line-clamp-2 italic opacity-60">"{c.observations || 'Nenhuma nota...'}"</p>
                                    </div>
                                    <a href={`https://wa.me/55${c.phones?.[0]?.replace(/\D/g,'')}`} target="_blank" className="block w-full bg-green-500 hover:bg-green-600 text-white text-center py-4 rounded-3xl font-black text-[11px] uppercase tracking-[0.2em] shadow-lg neon-green transition active:scale-95">Abrir WhatsApp</a>
                                </div>
                            ))}
                        </div>
                    )}

                    {activeTab === 'properties' && (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            {properties.map(p => (
                                <div key={p.id} className="bg-white rounded-[3rem] overflow-hidden shadow-sm border border-slate-100 flex flex-col hover:shadow-2xl transition duration-500 group">
                                    <div className="h-64 relative overflow-hidden">
                                        {p.image ? <img src={p.image.split(',')[0]} className="w-full h-full object-cover group-hover:scale-110 transition duration-700" alt="imóvel" /> : <div className="w-full h-full bg-slate-100 flex items-center justify-center font-black text-slate-200">LP</div>}
                                        <div className="absolute bottom-0 left-0 p-6 bg-gradient-to-t from-black/60 to-transparent w-full">
                                            <p className="text-white font-black text-2xl tracking-tighter">{p.price}</p>
                                        </div>
                                    </div>
                                    <div className="p-8 flex-1 flex flex-col">
                                        <h4 className="font-black text-blue-900 uppercase text-lg mb-2 leading-none italic">{p.title}</h4>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase mb-6 leading-tight italic">📍 {p.address}</p>
                                        <div className="mt-auto space-y-3">
                                            {p.link && <a href={p.link} target="_blank" className="block bg-blue-600 text-white text-center py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg hover:bg-blue-700 transition">Material de Venda</a>}
                                            <button onClick={() => deleteDoc(doc(db, 'properties', p.id)).then(() => loadData(user.uid))} className="w-full text-[9px] font-black text-slate-200 hover:text-red-500 uppercase tracking-widest transition">Excluir</button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {(activeTab === 'add-client' || activeTab === 'add-property') && (
                        <div className="max-w-2xl mx-auto glass p-12 rounded-[4rem] shadow-2xl relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-10 opacity-5 text-9xl font-black italic uppercase pointer-events-none">New</div>
                            <h2 className="text-3xl font-black mb-10 text-blue-900 uppercase italic tracking-tighter text-center">Configuração de Dados</h2>
                            <div className="space-y-6">
                                <input type="text" placeholder="Identificação Principal" value={name} onChange={e => setName(e.target.value)} className="w-full p-5 bg-white/50 rounded-3xl font-bold border-2 border-transparent focus:border-blue-500 outline-none transition shadow-sm" />
                                {activeTab === 'add-client' ? (
                                    <>
                                        <input type="text" placeholder="WhatsApp Contato" value={phone} onChange={e => setPhone(e.target.value)} className="w-full p-5 bg-white/50 rounded-3xl font-bold border-none shadow-sm" />
                                        <select value={propertyInterest} onChange={e => setPropertyInterest(e.target.value)} className="w-full p-5 bg-yellow-50/50 rounded-3xl font-black border-none shadow-sm outline-none">
                                            <option value="">Produto de Interesse...</option>
                                            {properties.map(p => <option key={p.id} value={p.title}>{p.title}</option>)}
                                        </select>
                                        <textarea placeholder="Notas de atendimento..." value={observations} onChange={e => setObservations(e.target.value)} className="w-full p-5 bg-white/50 rounded-3xl font-bold h-40 border-none shadow-sm" />
                                    </>
                                ) : (
                                    <>
                                        <input type="text" placeholder="Preço de Mercado" value={propPrice} onChange={e => setPropPrice(e.target.value)} className="w-full p-5 bg-green-50/50 rounded-3xl font-black text-green-700 border-none shadow-sm" />
                                        <input type="text" placeholder="URL da Imagem de Capa" value={propImg} onChange={e => setPropImg(e.target.value)} className="w-full p-5 bg-white/50 rounded-3xl font-bold italic border-none shadow-sm" />
                                    </>
                                )}
                                <div className="flex gap-6 pt-6">
                                    <button onClick={activeTab === 'add-client' ? (editingId ? () => updateDoc(doc(db, 'clients', editingId), {fullName: name, phones: [phone], propertyInterest, observations}).then(() => {resetForm(); setActiveTab('clients'); loadData(user.uid);}) : addClient) : addProperty} className="flex-1 bg-blue-900 text-white font-black py-6 rounded-[2rem] shadow-2xl uppercase tracking-widest text-lg transition hover:bg-black hover:neon-blue active:scale-95">Sincronizar</button>
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
