import React, { useState, useEffect } from 'react';
import { 
  Home, BarChart2, Search, Users, UserCheck, Target, FileText, Calendar, Phone, MapPin, 
  FolderKanban, File, ChevronLeft, ChevronRight, Bell, Settings, Zap, TrendingUp, 
  Clock, CheckCircle, Megaphone, Eye, Edit, Trash2, Plus, MessageSquare, Send
} from 'lucide-react';
import { db, auth } from './firebase/config';
import { collection, addDoc, getDocs, query, where, updateDoc, doc, deleteDoc } from 'firebase/firestore';
import { onAuthStateChanged, signOut, updatePassword } from 'firebase/auth';
import Login from './pages/Login';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, PieChart, Pie, Legend, CartesianGrid } from 'recharts';

// --- MOTOR DE TEMAS ---
const THEMES = {
    'blue': { name: 'Tech Blue', primary: '#2563eb', secondary: '#1e40af', bg: '#f8fafc', sidebar: '#ffffff', text: '#1e293b', accent: '#3b82f6' },
    'dark': { name: 'Midnight Luxury', primary: '#d4af37', secondary: '#b4941f', bg: '#0f172a', sidebar: '#1e293b', text: '#f8fafc', accent: '#fbbf24' },
};

const TailwindStyle = ({ theme }) => (
  <style>{`
    @import url('https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css');
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
    
    :root { --primary: ${theme.primary}; --secondary: ${theme.secondary}; --bg-main: ${theme.bg}; --sidebar-bg: ${theme.sidebar}; --text-main: ${theme.text}; --accent: ${theme.accent}; }
    body { font-family: 'Inter', sans-serif; background-color: var(--bg-main); color: var(--text-main); transition: background-color 0.5s ease; margin: 0; }
    
    .glass-panel { background: white; border: 1px solid #e2e8f0; border-radius: 1rem; }
    .btn-primary { background: var(--primary); color: white; font-weight: 700; border-radius: 0.75rem; transition: 0.2s; }
    .settings-input { width: 100%; padding: 0.75rem 1rem; background-color: #f8fafc; border-radius: 0.75rem; border: 1px solid #cbd5e1; outline: none; }
    .sidebar-active { background-color: #eff6ff; color: #2563eb; border-left: 4px solid #2563eb; }
    
    .custom-checkbox { width: 1.2rem; height: 1.2rem; border-radius: 0.4rem; border: 2px solid #cbd5e1; appearance: none; cursor: pointer; }
    .custom-checkbox:checked { background-color: var(--primary); border-color: var(--primary); background-image: url("data:image/svg+xml,%3csvg viewBox='0 0 16 16' fill='white' xmlns='http://www.w3.org/2000/svg'%3e%3cpath d='M12.207 4.793a1 1 0 010 1.414l-5 5a1 1 0 01-1.414 0l-2.5-2.5a1 1 0 011.414-1.414L6.5 9.086l4.293-4.293a1 1 0 011.414 0z'/%3e%3c/svg%3e"); }
  `}</style>
);

// --- UTILITÁRIOS ---
const formatDate = (val) => {
    if(!val) return '-';
    if(val?.seconds) return new Date(val.seconds * 1000).toLocaleDateString('pt-BR');
    const d = String(val);
    if(d.includes('T')) return new Date(d).toLocaleDateString('pt-BR');
    const parts = d.split('-');
    return parts.length === 3 ? `${parts[2]}/${parts[1]}/${parts[0]}` : d;
};

const maskPhone = (v) => {
    let r = String(v || '').replace(/\D/g, "");
    if (r.length > 10) return r.replace(/^(\d\d)(\d{5})(\d{4}).*/, "($1) $2-$3");
    return r.replace(/^(\d\d)(\d{4})(\d{0,4}).*/, "($1) $2-$3");
};

const parseCurrency = (v) => typeof v === 'number' ? v : (parseFloat(String(v).replace('R$', '').replace(/\./g, '').replace(',', '.').trim()) || 0);
const formatCurrency = (val) => val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

function App() {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
    const [activeModule, setActiveModule] = useState('Página Inicial');
    
    const [clients, setClients] = useState([]);
    const [properties, setProperties] = useState([]);
    const [agenda, setAgenda] = useState([]);
    const [currentTheme, setCurrentTheme] = useState('blue');
    const [clientSearch, setClientSearch] = useState('');
    const [propertySearch, setPropertySearch] = useState('');
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    
    const [showForm, setShowForm] = useState(false);
    const [viewingProperty, setViewingProperty] = useState(null);
    const [saving, setSaving] = useState(false);
    
    const [formData, setFormData] = useState({ name: '', phone: '', email: '', type: 'client', date: '', time: '' });
    const [wpMessages, setWpMessages] = useState({});
    const [bulkMessage, setBulkMessage] = useState('');
    const [selectedClients, setSelectedClients] = useState([]);
    const [userProfile, setUserProfile] = useState({ name: 'Alexandre', creci: '', photo: '' });

    const theme = THEMES[currentTheme] || THEMES['blue'];

    const loadData = async (userId) => {
        try {
            const snapC = await getDocs(query(collection(db, 'clients'), where("assignedAgent", "==", userId)));
            setClients(snapC.docs.map(d => ({ id: d.id, ...d.data() })));
            const snapP = await getDocs(query(collection(db, 'properties'), where("userId", "==", userId)));
            setProperties(snapP.docs.map(d => ({ id: d.id, ...d.data() })));
            const snapA = await getDocs(query(collection(db, 'agenda'), where("userId", "==", userId)));
            setAgenda(snapA.docs.map(d => ({ id: d.id, ...d.data() })));
            const savedProfile = localStorage.getItem('crm_profile');
            if(savedProfile) setUserProfile(JSON.parse(savedProfile));
        } catch (e) { console.error(e); }
    };

    useEffect(() => {
        const unsub = onAuthStateChanged(auth, (u) => {
            if (u) { setUser(u); loadData(u.uid); }
            else setUser(null); setLoading(false);
        });
        return () => unsub();
    }, []);

    const sendWp = (phone, msg) => {
        const num = String(phone || '').replace(/\D/g, '');
        if (num) window.open(`https://wa.me/55${num}?text=${encodeURIComponent(msg)}`, '_blank');
    };

    const toggleSelectClient = (id) => {
        setSelectedClients(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
    };

    // --- CÁLCULOS ---
    const totalVGV = properties.reduce((acc, c) => acc + parseCurrency(c.price), 0);
    const funnelData = [
        { name: 'Lead', value: clients.filter(c => (c.status || 'LEAD') === 'LEAD').length, color: '#94a3b8' },
        { name: 'Visita', value: clients.filter(c => c.status === 'AGENDADO').length, color: '#f59e0b' },
        { name: 'Proposta', value: clients.filter(c => c.status === 'PROPOSTA').length, color: '#8b5cf6' },
        { name: 'Fechado', value: clients.filter(c => c.status === 'FECHADO').length, color: '#10b981' },
    ];

    if (loading) return <div className="h-screen flex items-center justify-center font-bold text-gray-400">CARREGANDO...</div>;
    if (!user) return <Login onLogin={setUser} />;

    return (
        <div className="flex h-screen bg-gray-50 overflow-hidden">
            <TailwindStyle theme={theme} />
            
            {/* Sidebar */}
            <aside className={`bg-white border-r flex flex-col transition-all duration-300 ${isSidebarCollapsed ? 'w-20' : 'w-64'}`}>
                <div className="p-4 border-b flex items-center justify-between">
                    {!isSidebarCollapsed && <span className="font-bold text-xl tracking-tighter">ALEXANDRE<span className="text-blue-600">CRM</span></span>}
                    <button onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)} className="p-2 hover:bg-gray-100 rounded-lg">
                        {isSidebarCollapsed ? <ChevronRight size={20}/> : <ChevronLeft size={20}/>}
                    </button>
                </div>
                <nav className="flex-1 p-4 space-y-1">
                    {[
                        {id:'Página Inicial', icon:Home}, 
                        {id:'Relatórios', icon:BarChart2}, 
                        {id:'Clientes Potenciais', icon:UserCheck}, 
                        {id:'Imóveis', icon:Target}, 
                        {id:'WhatsApp', icon:MessageSquare},
                        {id:'Reuniões', icon:Calendar}
                    ].map(m => (
                        <button key={m.id} onClick={() => setActiveModule(m.id)} className={`w-full flex items-center gap-3 p-3 rounded-xl transition ${activeModule === m.id ? 'sidebar-active' : 'text-gray-600 hover:bg-gray-50'}`}>
                            <m.icon size={18} /> {!isSidebarCollapsed && <span className="text-sm font-semibold">{m.id}</span>}
                        </button>
                    ))}
                </nav>
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-y-auto p-8">
                <header className="flex justify-between items-center mb-8">
                    <h1 className="text-3xl font-bold text-gray-900">{activeModule}</h1>
                    <div className="flex items-center gap-3">
                        <div className="text-right"><p className="text-xs font-bold uppercase">{userProfile.name}</p><p className="text-[10px] text-blue-600 font-bold">CRECI {userProfile.creci}</p></div>
                        {userProfile.photo && <img src={userProfile.photo} className="w-10 h-10 rounded-full border" />}
                    </div>
                </header>

                {/* --- PÁGINA INICIAL --- */}
                {activeModule === 'Página Inicial' && (
                    <div className="space-y-6 animate-fadeIn">
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                            <div className="glass-panel p-6 border-l-4 border-blue-500"><p className="text-xs font-bold text-gray-400 uppercase">Leads Ativos</p><p className="text-3xl font-black">{clients.length}</p></div>
                            <div className="glass-panel p-6 border-l-4 border-green-500"><p className="text-xs font-bold text-gray-400 uppercase">VGV Carteira</p><p className="text-2xl font-black">{formatCurrency(totalVGV)}</p></div>
                        </div>
                        <div className="glass-panel p-8">
                            <h3 className="font-bold mb-6 opacity-50 uppercase text-xs">Desempenho do Funil</h3>
                            <div className="h-80">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={funnelData}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize:12, fontWeight:700}} />
                                        <YAxis axisLine={false} tickLine={false} />
                                        <Tooltip cursor={{fill: '#f8fafc'}} />
                                        <Bar dataKey="value" radius={[4, 4, 0, 0]} barSize={50}>
                                            {funnelData.map((e, i) => <Cell key={i} fill={e.color} />)}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </div>
                )}

                {/* --- RELATÓRIOS --- */}
                {activeModule === 'Relatórios' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-fadeIn">
                        <div className="glass-panel p-8">
                            <h3 className="font-bold text-xs uppercase opacity-50 mb-6">Composição de Carteira</h3>
                            <div className="h-64">
                                <ResponsiveContainer>
                                    <PieChart>
                                        <Pie data={funnelData} dataKey="value" nameKey="name" innerRadius={60} outerRadius={80} paddingAngle={5}>
                                            {funnelData.map((e, i) => <Cell key={i} fill={e.color} />)}
                                        </Pie>
                                        <Tooltip />
                                        <Legend />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                        <div className="glass-panel p-8">
                            <h3 className="font-bold text-xs uppercase opacity-50 mb-6">Métricas de Venda</h3>
                            <div className="space-y-6">
                                <div className="flex justify-between items-end border-b pb-4"><div><p className="text-xs font-bold text-gray-400 uppercase">Ticket Médio</p><p className="text-2xl font-black">{formatCurrency(totalVGV / (properties.length || 1))}</p></div><TrendingUp className="text-green-500" /></div>
                                <div className="flex justify-between items-end border-b pb-4"><div><p className="text-xs font-bold text-gray-400 uppercase">Conversão</p><p className="text-2xl font-black">{(clients.filter(c => c.status === 'FECHADO').length / (clients.length || 1) * 100).toFixed(1)}%</p></div><Target className="text-blue-500" /></div>
                            </div>
                        </div>
                    </div>
                )}

                {/* --- CLIENTES POTENCIAIS (RESTAURADO) --- */}
                {activeModule === 'Clientes Potenciais' && (
                    <div className="space-y-6 animate-fadeIn">
                        <div className="flex justify-between items-center gap-4">
                            <div className="relative flex-1"><Search className="absolute left-3 top-3.5 text-gray-400" size={18}/><input placeholder="Buscar por nome ou telefone..." value={clientSearch} onChange={e => setClientSearch(e.target.value)} className="settings-input pl-10" /></div>
                            <button onClick={() => setShowForm(true)} className="btn-primary px-6 py-3 shadow-lg">+ Novo Cliente</button>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {clients.filter(c => c.fullName.toLowerCase().includes(clientSearch.toLowerCase())).map(client => (
                                <div key={client.id} className="glass-panel p-6 group relative">
                                    <div className="flex items-start gap-4 mb-4">
                                        <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-lg font-black text-slate-400">{client.fullName.charAt(0)}</div>
                                        <div className="overflow-hidden"><h4 className="font-black text-base uppercase leading-tight truncate">{client.fullName}</h4><span className="inline-block mt-2 text-[9px] font-bold uppercase px-2 py-0.5 rounded-md bg-blue-50 text-blue-600">{client.status || 'LEAD'}</span></div>
                                    </div>
                                    <div className="bg-slate-50 rounded-xl p-3 space-y-2 mb-4 text-[10px] font-bold text-gray-600">
                                        <p>📞 {maskPhone(client.phones?.[0])}</p><p>📧 {client.email || '-'}</p>
                                    </div>
                                    <textarea placeholder="Mensagem rápida..." className="w-full text-xs p-2 border rounded-lg mb-2 h-16 outline-none focus:border-green-400" value={wpMessages[client.id] || ''} onChange={(e) => setWpMessages({...wpMessages, [client.id]: e.target.value})} />
                                    <button onClick={() => sendWp(client.phones?.[0], wpMessages[client.id] || 'Olá!')} className="w-full py-3 bg-green-500 text-white rounded-xl font-black uppercase text-xs shadow-lg">WhatsApp ➜</button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* --- IMÓVEIS (RESTAURADO) --- */}
                {activeModule === 'Imóveis' && (
                    <div className="space-y-6 animate-fadeIn">
                        <div className="flex justify-between items-center">
                            <input placeholder="Buscar imóveis..." value={propertySearch} onChange={e => setPropertySearch(e.target.value)} className="settings-input w-72" />
                            <button onClick={() => setShowForm(true)} className="btn-primary px-6 py-3 shadow-lg">+ Novo Imóvel</button>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            {properties.filter(p => p.title.toLowerCase().includes(propertySearch.toLowerCase())).map(p => (
                                <div key={p.id} className="glass-panel overflow-hidden cursor-pointer hover:shadow-xl transition" onClick={() => openPropertyDetails(p)}>
                                    <div className="h-48 bg-gray-200">{p.images?.[0] ? <img src={p.images[0]} className="w-full h-full object-cover" /> : <div className="h-full flex items-center justify-center opacity-20 text-4xl">🏠</div>}</div>
                                    <div className="p-5"><h4 className="font-black uppercase text-sm truncate">{p.title}</h4><p className="text-xl font-black text-blue-600 mt-1">{p.price}</p></div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* --- WHATSAPP (SEÇÃO SOLICITADA) --- */}
                {activeModule === 'WhatsApp' && (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-fadeIn h-[calc(100vh-200px)]">
                        <div className="glass-panel p-6 flex flex-col">
                            <h3 className="font-bold text-sm uppercase mb-4">Selecionar Clientes</h3>
                            <div className="flex-1 overflow-y-auto space-y-2 pr-2">
                                {clients.map(c => (
                                    <div key={c.id} onClick={() => toggleSelectClient(c.id)} className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition ${selectedClients.includes(c.id) ? 'bg-blue-50 border-blue-400' : 'bg-white hover:bg-gray-50'}`}>
                                        <div className="flex items-center gap-3"><div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-[10px] font-bold uppercase">{c.fullName.charAt(0)}</div><p className="text-xs font-bold uppercase">{c.fullName}</p></div>
                                        <input type="checkbox" checked={selectedClients.includes(c.id)} readOnly className="custom-checkbox" />
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div className="lg:col-span-2 flex flex-col gap-6">
                            <div className="glass-panel p-6">
                                <h3 className="font-bold text-sm uppercase mb-4">Mensagem e Templates</h3>
                                <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
                                    {[{l:'Apresentação', t:'Olá! Sou o Alexandre, corretor de imóveis. Gostaria de te mostrar algumas oportunidades.'}, {l:'Lembrete Visita', t:'Olá! Passando para confirmar nossa visita agendada.'}].map((t,i) => (
                                        <button key={i} onClick={() => setBulkMessage(t.t)} className="px-3 py-1 bg-gray-100 text-[10px] font-bold uppercase rounded-full border hover:bg-gray-200">{t.l}</button>
                                    ))}
                                </div>
                                <textarea value={bulkMessage} onChange={e => setBulkMessage(e.target.value)} className="w-full h-32 p-4 bg-gray-50 rounded-xl border-none outline-none focus:ring-2 focus:ring-blue-500 font-medium text-sm" placeholder="Escreva sua mensagem aqui..." />
                            </div>
                            <div className="glass-panel p-8 bg-slate-900 text-white flex flex-col items-center justify-center relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-green-500 rounded-full blur-3xl opacity-20"></div>
                                <h3 className="text-xl font-black uppercase mb-2 relative z-10">Central de Disparo</h3>
                                <p className="text-xs font-bold opacity-50 uppercase mb-8 relative z-10">{selectedClients.length} contatos na fila</p>
                                <button 
                                    onClick={() => selectedClients.forEach(id => sendWp(clients.find(c => c.id === id).phones?.[0], bulkMessage))} 
                                    className="px-12 py-4 bg-green-500 hover:bg-green-600 text-white rounded-xl font-black uppercase text-xs shadow-2xl transition-all flex items-center gap-2 relative z-10"
                                >
                                    <Send size={16} /> Disparar no WhatsApp
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* --- REUNIÕES --- */}
                {activeModule === 'Reuniões' && (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 animate-fadeIn">
                        <div className="lg:col-span-2 glass-panel p-8">
                            <h3 className="text-xl font-black uppercase italic mb-8">Calendário</h3>
                            <div className="grid grid-cols-7 gap-2">
                                {Array.from({length: 31}, (_, i) => i + 1).map(d => (
                                    <div key={d} onClick={() => setSelectedDate(`2026-02-${String(d).padStart(2,'0')}`)} className={`aspect-square flex items-center justify-center rounded-xl font-bold cursor-pointer transition ${selectedDate.endsWith(String(d).padStart(2,'0')) ? 'bg-blue-600 text-white shadow-lg' : 'hover:bg-slate-100'}`}>{d}</div>
                                ))}
                            </div>
                        </div>
                        <div className="glass-panel p-8 bg-white h-fit">
                            <h3 className="font-black uppercase text-xs opacity-50 mb-6">Agenda: {formatDate(selectedDate)}</h3>
                            <div className="space-y-4">
                                {agenda.filter(a => a.date === selectedDate).length > 0 ? (
                                    agenda.filter(a => a.date === selectedDate).map(a => (
                                        <div key={a.id} className="p-4 border-l-4 border-blue-500 bg-blue-50 rounded-r-xl">
                                            <p className="text-xs font-bold text-blue-600">{a.time}</p><p className="font-black uppercase text-sm">{a.title}</p>
                                        </div>
                                    ))
                                ) : (
                                    <p className="text-gray-400 text-xs italic">Nenhum evento para este dia.</p>
                                )}
                            </div>
                            <button onClick={() => setShowForm(true)} className="w-full mt-6 py-4 bg-gray-100 rounded-xl font-bold text-xs uppercase hover:bg-gray-200">Novo Agendamento</button>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}

export default App;
