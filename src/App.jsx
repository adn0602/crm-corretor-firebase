import React, { useState, useEffect } from 'react';
import { 
  Home, BarChart2, Search, Users, UserCheck, Target, FileText, Calendar, Phone, MapPin, 
  FolderKanban, File, ChevronLeft, ChevronRight, Bell, Settings, Zap, TrendingUp, 
  Clock, CheckCircle, Megaphone, Eye, Edit, Trash2, Plus, Share2
} from 'lucide-react';
import { db, auth } from './firebase/config';
import { collection, addDoc, getDocs, query, where, updateDoc, doc, deleteDoc } from 'firebase/firestore';
import { onAuthStateChanged, signOut, updatePassword } from 'firebase/auth';
import Login from './pages/Login';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, PieChart, Pie, Legend } from 'recharts';

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
    
    .glass-panel { background: white; border: 1px solid #e2e8f0; border-radius: 1rem; transition: 0.3s; }
    .btn-primary { background: var(--primary); color: white; font-weight: 700; border-radius: 0.75rem; transition: 0.2s; }
    .settings-input { width: 100%; padding: 0.75rem 1rem; background-color: #f8fafc; border-radius: 0.75rem; border: 1px solid #cbd5e1; outline: none; }
    .sidebar-active { background-color: #eff6ff; color: #2563eb; border-left: 4px solid #2563eb; }
    
    .fluxo-input { width: 100%; background: #f8fafc; border: 1px solid #cbd5e1; padding: 8px; border-radius: 6px; text-align: right; font-weight: 600; }
    .prop-image img { width: 100%; height: 100%; object-fit: cover; border-radius: 1rem; }
  `}</style>
);

// --- UTILITÁRIOS ---
const formatDate = (val) => {
    if(!val) return '-';
    if(val?.seconds) return new Date(val.seconds * 1000).toLocaleDateString('pt-BR');
    return String(val).includes('T') ? new Date(val).toLocaleDateString('pt-BR') : val;
};
const maskPhone = (v) => {
    let r = String(v || '').replace(/\D/g, "");
    if (r.length > 10) return r.replace(/^(\d\d)(\d{5})(\d{4}).*/, "($1) $2-$3");
    return r.replace(/^(\d\d)(\d{4})(\d{0,4}).*/, "($1) $2-$3");
};
const maskCurrency = (v) => (Number(String(v || '').replace(/\D/g, "")) / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
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
    const [editingId, setEditingId] = useState(null);
    const [saving, setSaving] = useState(false);
    
    const [formData, setFormData] = useState({ name: '', phone: '', email: '', birthDate: '', address: '', interest: '', price: '', type: 'client', obs: '', image: '', date: '', time: '', bedrooms: '', garage: '', area: '', propertyStatus: 'PRONTO', developer: '', imagesStr: '', videoUrl: '', pdfUrl: '' });
    const [fluxo, setFluxo] = useState({ ato: 0, mensaisQtd: 36, mensaisVal: 0, interQtd: 5, interVal: 0, chaves: 0 });
    const [currentImgIndex, setCurrentImgIndex] = useState(0);
    const [wpMessages, setWpMessages] = useState({});
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

    const handleSave = async () => {
        setSaving(true);
        try {
            const now = new Date().toISOString();
            if(formData.type === 'client') {
                await addDoc(collection(db, 'clients'), { fullName: formData.name, phones: [formData.phone], status: 'LEAD', assignedAgent: user.uid, createdAt: now });
            } else if(formData.type === 'property') {
                const imgs = formData.imagesStr.split('\n').filter(i => i.trim() !== '');
                await addDoc(collection(db, 'properties'), { title: formData.name, price: formData.price, userId: user.uid, images: imgs, bedrooms: formData.bedrooms, garage: formData.garage, area: formData.area });
            } else if(formData.type === 'agenda') {
                await addDoc(collection(db, 'agenda'), { title: formData.name, date: formData.date, time: formData.time, userId: user.uid });
            }
            setShowForm(false); loadData(user.uid);
        } catch (e) { alert(e.message); } finally { setSaving(false); }
    };

    const openPropertyDetails = (p) => {
        setViewingProperty(p);
        const price = parseCurrency(p.price);
        setFluxo({ ato: price * 0.1, mensaisQtd: 36, mensaisVal: (price * 0.4)/36, interQtd: 3, interVal: (price * 0.2)/3, chaves: price * 0.3 });
    };

    // --- CÁLCULOS ---
    const totalVGV = properties.reduce((acc, c) => acc + parseCurrency(c.price), 0);
    const funnelData = [
        { name: 'Lead', value: clients.filter(c => (c.status || 'LEAD') === 'LEAD').length, color: '#94a3b8' },
        { name: 'Visita', value: clients.filter(c => c.status === 'AGENDADO').length, color: '#f59e0b' },
        { name: 'Proposta', value: clients.filter(c => c.status === 'PROPOSTA').length, color: '#8b5cf6' },
        { name: 'Fechado', value: clients.filter(c => c.status === 'FECHADO').length, color: '#10b981' },
    ];

    if (loading) return <div className="h-screen flex items-center justify-center">CARREGANDO...</div>;
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
                <nav className="flex-1 p-4 space-y-2">
                    {[{id:'Página Inicial', icon:Home}, {id:'Relatórios', icon:BarChart2}, {id:'Clientes Potenciais', icon:UserCheck}, {id:'Imóveis', icon:Target}, {id:'Reuniões', icon:Calendar}].map(m => (
                        <button key={m.id} onClick={() => setActiveModule(m.id)} className={`w-full flex items-center gap-3 p-3 rounded-xl transition ${activeModule === m.id ? 'sidebar-active' : 'text-gray-600 hover:bg-gray-50'}`}>
                            <m.icon size={18} /> {!isSidebarCollapsed && <span className="text-sm font-semibold">{m.id}</span>}
                        </button>
                    ))}
                </nav>
            </aside>

            {/* Content */}
            <main className="flex-1 overflow-y-auto p-8">
                <header className="flex justify-between items-center mb-8">
                    <h1 className="text-3xl font-bold text-gray-900">{activeModule}</h1>
                    <div className="flex items-center gap-2 text-right">
                        <div><p className="text-xs font-bold uppercase">{userProfile.name}</p><p className="text-[10px] text-blue-600 font-bold">CRECI {userProfile.creci}</p></div>
                        {userProfile.photo && <img src={userProfile.photo} className="w-10 h-10 rounded-full border" />}
                    </div>
                </header>

                {/* --- PÁGINA INICIAL (MELHORADA) --- */}
                {activeModule === 'Página Inicial' && (
                    <div className="space-y-6 animate-fadeIn">
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                            <div className="glass-panel p-6 border-l-4 border-blue-500"><p className="text-xs font-bold text-gray-400 uppercase">Clientes</p><p className="text-3xl font-black">{clients.length}</p></div>
                            <div className="glass-panel p-6 border-l-4 border-green-500"><p className="text-xs font-bold text-gray-400 uppercase">VGV Carteira</p><p className="text-2xl font-black">{formatCurrency(totalVGV)}</p></div>
                            <div className="glass-panel p-6 border-l-4 border-purple-500"><p className="text-xs font-bold text-gray-400 uppercase">Vendas</p><p className="text-3xl font-black">{clients.filter(c => c.status === 'FECHADO').length}</p></div>
                            <div className="glass-panel p-6 border-l-4 border-orange-500"><p className="text-xs font-bold text-gray-400 uppercase">Imóveis</p><p className="text-3xl font-black">{properties.length}</p></div>
                        </div>
                        <div className="glass-panel p-8 h-96">
                            <h3 className="font-bold mb-6 opacity-50 uppercase text-xs">Funil de Vendas Real</h3>
                            <ResponsiveContainer width="100%" height="90%">
                                <BarChart data={funnelData} layout="vertical">
                                    <XAxis type="number" hide />
                                    <YAxis dataKey="name" type="category" width={80} tick={{fontSize:12, fontWeight:800}} axisLine={false} />
                                    <Tooltip />
                                    <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={35}>
                                        {funnelData.map((e, i) => <Cell key={i} fill={e.color} />)}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                )}

                {/* --- RELATÓRIOS --- */}
                {activeModule === 'Relatórios' && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-fadeIn">
                        <div className="glass-panel p-8"><h3 className="font-bold mb-6 uppercase text-xs opacity-50">Distribuição de Status</h3><div className="h-64"><ResponsiveContainer><PieChart><Pie data={funnelData} dataKey="value" innerRadius={60} outerRadius={80} paddingAngle={5}><Cell fill="#2563eb"/><Cell fill="#f59e0b"/><Cell fill="#8b5cf6"/><Cell fill="#10b981"/></Pie><Tooltip/><Legend/></PieChart></ResponsiveContainer></div></div>
                        <div className="glass-panel p-8"><h3 className="font-bold mb-6 uppercase text-xs opacity-50">Resumo de Performance</h3><div className="space-y-4"><div className="flex justify-between border-b pb-2"><span className="text-sm">Conversão</span><span className="font-bold">{(clients.filter(c => c.status === 'FECHADO').length / (clients.length || 1) * 100).toFixed(1)}%</span></div><div className="flex justify-between border-b pb-2"><span className="text-sm">Ticket Médio</span><span className="font-bold">{formatCurrency(totalVGV / (properties.length || 1))}</span></div></div></div>
                    </div>
                )}

                {/* --- CLIENTES POTENCIAIS (RESTAURADO) --- */}
                {activeModule === 'Clientes Potenciais' && (
                    <div className="space-y-6 animate-fadeIn">
                        <div className="flex justify-between items-center gap-4">
                            <div className="relative flex-1"><Search className="absolute left-3 top-3.5 text-gray-400" size={18}/><input placeholder="Buscar por nome ou telefone..." value={clientSearch} onChange={e => setClientSearch(e.target.value)} className="settings-input pl-10" /></div>
                            <button onClick={() => { setEditingId(null); setFormData({name:'', phone:'', type:'client'}); setShowForm(true); }} className="btn-primary px-6 py-3 shadow-lg">+ Novo Cliente</button>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {clients.filter(c => c.fullName.toLowerCase().includes(clientSearch.toLowerCase())).map(client => (
                                <div key={client.id} className="glass-panel p-6 relative group hover:border-blue-400 flex flex-col">
                                    <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition"><button onClick={() => deleteItem('clients', client.id)} className="p-2 bg-red-50 text-red-500 rounded-lg">✕</button></div>
                                    <div className="flex items-start gap-4 mb-4">
                                        <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-lg font-black text-slate-400">{client.fullName.charAt(0)}</div>
                                        <div className="overflow-hidden"><h4 className="font-black text-base uppercase leading-tight truncate">{client.fullName}</h4><span className="inline-block mt-2 text-[9px] font-bold uppercase px-2 py-0.5 rounded-md bg-slate-100 text-slate-500">{client.status || 'LEAD'}</span></div>
                                    </div>
                                    <div className="bg-slate-50 rounded-xl p-3 space-y-2 mb-4 text-[10px] font-bold">
                                        <p>📞 {maskPhone(client.phones?.[0])}</p><p>📧 {client.email || '-'}</p>
                                    </div>
                                    <textarea placeholder="Escreva a mensagem aqui..." className="w-full text-xs p-2 bg-white border rounded-lg mb-2 h-16 outline-none" value={wpMessages[client.id] || ''} onChange={(e) => setWpMessages({...wpMessages, [client.id]: e.target.value})} />
                                    <button onClick={() => sendWp(client.phones?.[0], wpMessages[client.id] || '')} className="w-full py-3 bg-green-500 text-white rounded-xl font-black uppercase text-xs shadow-lg">Enviar WhatsApp ➜</button>
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
                            <button onClick={() => { setEditingId(null); setFormData({name:'', price:'', type:'property'}); setShowForm(true); }} className="btn-primary px-6 py-3 shadow-lg">+ Novo Imóvel</button>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            {properties.filter(p => p.title.toLowerCase().includes(propertySearch.toLowerCase())).map(p => (
                                <div key={p.id} className="glass-panel overflow-hidden cursor-pointer" onClick={() => openPropertyDetails(p)}>
                                    <div className="h-48 bg-slate-200">{p.images?.[0] ? <img src={p.images[0]} className="w-full h-full object-cover" /> : <div className="h-full flex items-center justify-center font-black opacity-20 text-4xl">🏠</div>}</div>
                                    <div className="p-5"><h4 className="font-black uppercase text-sm truncate">{p.title}</h4><p className="text-xl font-black text-blue-600 mt-1">{p.price}</p></div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* --- REUNIÕES (FIXED) --- */}
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
                            <h3 className="font-black uppercase text-sm mb-6">Agenda de {formatDate(selectedDate)}</h3>
                            <div className="space-y-4">
                                {agenda.filter(a => a.date === selectedDate).map(a => (
                                    <div key={a.id} className="p-4 border-l-4 border-blue-500 bg-blue-50 rounded-r-xl relative">
                                        <p className="text-xs font-bold text-blue-600">{a.time}</p><p className="font-black uppercase text-sm">{a.title}</p>
                                    </div>
                                ))}
                                {agenda.filter(a => a.date === selectedDate).length === 0 && <p className="text-gray-400 text-xs italic">Nenhum evento agendado.</p>}
                            </div>
                            <button onClick={() => { setEditingId(null); setFormData({...formData, type:'agenda', date:selectedDate}); setShowForm(true); }} className="w-full mt-6 py-4 bg-gray-100 rounded-xl font-bold text-xs uppercase hover:bg-gray-200">Agendar Novo</button>
                        </div>
                    </div>
                )}
            </main>

            {/* MODAL GLOBAL */}
            {showForm && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="glass-panel bg-white w-full max-w-lg p-8 max-h-[90vh] overflow-y-auto">
                        <h3 className="text-xl font-black uppercase mb-6">{editingId ? 'Editar' : 'Novo'} {formData.type}</h3>
                        <div className="space-y-4">
                            <input className="settings-input" placeholder="Nome / Título" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                            {formData.type === 'client' && <input className="settings-input" placeholder="Telefone" value={formData.phone} onChange={e => setFormData({...formData, phone: maskPhone(e.target.value)})} />}
                            {formData.type === 'property' && (
                                <>
                                    <input className="settings-input" placeholder="Preço" value={formData.price} onChange={e => setFormData({...formData, price: maskCurrency(e.target.value)})} />
                                    <textarea className="settings-input h-20" placeholder="Links fotos (por linha)" value={formData.imagesStr} onChange={e => setFormData({...formData, imagesStr: e.target.value})} />
                                </>
                            )}
                            {formData.type === 'agenda' && <div className="grid grid-cols-2 gap-2"><input type="date" className="settings-input" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} /><input type="time" className="settings-input" value={formData.time} onChange={e => setFormData({...formData, time: e.target.value})} /></div>}
                        </div>
                        <div className="flex gap-4 mt-8"><button onClick={handleSave} className="btn-primary flex-1 py-4 uppercase">Salvar</button><button onClick={() => setShowForm(false)} className="flex-1 bg-gray-100 py-4 rounded-xl font-bold">Cancelar</button></div>
                    </div>
                </div>
            )}

            {/* MODAL DETALHES IMÓVEL (CALCULADORA RESTAURADA) */}
            {viewingProperty && (
                <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fadeIn">
                    <div className="bg-white w-full max-w-5xl h-[90vh] rounded-2xl overflow-hidden flex flex-col relative">
                        <button onClick={() => setViewingProperty(null)} className="absolute top-4 right-4 z-20 w-10 h-10 bg-white rounded-full shadow-lg font-bold">✕</button>
                        <div className="flex-1 overflow-y-auto p-10">
                            <div className="h-80 bg-slate-900 rounded-2xl overflow-hidden mb-8">
                                {viewingProperty.images?.length > 0 && <img src={viewingProperty.images[currentImgIndex]} className="w-full h-full object-contain" />}
                            </div>
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                                <div className="lg:col-span-2 space-y-6">
                                    <h2 className="text-4xl font-black uppercase italic leading-none">{viewingProperty.title}</h2>
                                    <p className="text-3xl font-black text-blue-600">{viewingProperty.price}</p>
                                </div>
                                <div className="bg-slate-50 p-6 rounded-2xl border">
                                    <h3 className="font-black text-lg uppercase mb-4 text-slate-700">Fluxo de Pagamento</h3>
                                    <div className="space-y-4">
                                        <div><span className="text-[10px] font-bold uppercase opacity-50">Sinal / Ato</span><input type="number" className="fluxo-input" value={fluxo.ato} onChange={e => setFluxo({...fluxo, ato: Number(e.target.value)})} /></div>
                                        <div><span className="text-[10px] font-bold uppercase opacity-50">Financ.</span><input type="number" className="fluxo-input" value={fluxo.chaves} onChange={e => setFluxo({...fluxo, chaves: Number(e.target.value)})} /></div>
                                        <div className="p-4 bg-blue-600 rounded-xl text-white mt-6"><p className="text-[10px] font-bold uppercase opacity-70">Total:</p><p className="text-xl font-black">{formatCurrency(fluxo.ato + fluxo.chaves)}</p></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default App;
