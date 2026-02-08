import React, { useState, useEffect } from 'react';
import { db, auth } from './firebase/config';
import { collection, addDoc, getDocs, query, where, updateDoc, doc, deleteDoc } from 'firebase/firestore';
import { onAuthStateChanged, signOut, updatePassword } from 'firebase/auth';
import Login from './pages/Login';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, PieChart, Pie, Legend } from 'recharts';

// --- MOTOR DE TEMAS ---
const THEMES = {
    'blue': { name: 'Tech Blue', primary: '#2563eb', secondary: '#1e40af', bg: '#f8fafc', sidebar: '#ffffff', text: '#1e293b', accent: '#3b82f6' },
    'dark': { name: 'Midnight Luxury', primary: '#d4af37', secondary: '#b4941f', bg: '#0f172a', sidebar: '#1e293b', text: '#f8fafc', accent: '#fbbf24' },
    'green': { name: 'Forest Success', primary: '#16a34a', secondary: '#15803d', bg: '#f0fdf4', sidebar: '#ffffff', text: '#14532d', accent: '#22c55e' },
    'purple': { name: 'Royal Estate', primary: '#7e22ce', secondary: '#6b21a8', bg: '#faf5ff', sidebar: '#ffffff', text: '#581c87', accent: '#9333ea' },
};

// --- ESTILOS GLOBAIS ---
const TailwindStyle = ({ theme }) => (
  <style>{`
    @import url('https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css');
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
    
    :root { --primary: ${theme.primary}; --secondary: ${theme.secondary}; --bg-main: ${theme.bg}; --sidebar-bg: ${theme.sidebar}; --text-main: ${theme.text}; --accent: ${theme.accent}; }
    body { font-family: 'Inter', sans-serif; background-color: var(--bg-main); color: var(--text-main); transition: background-color 0.5s ease; }
    
    .glass-panel { background: ${theme.name.includes('Dark') ? 'rgba(30, 41, 59, 0.7)' : 'rgba(255, 255, 255, 1)'}; border: 1px solid ${theme.name.includes('Dark') ? 'rgba(255,255,255,0.1)' : '#e2e8f0'}; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05); border-radius: 1rem; transition: all 0.3s ease; }
    .glass-panel:hover { transform: translateY(-2px); box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1); border-color: var(--primary); }
    
    .glass-column { background: ${theme.name.includes('Dark') ? 'rgba(15, 23, 42, 0.5)' : '#f8fafc'}; border: 1px solid ${theme.name.includes('Dark') ? 'rgba(255,255,255,0.05)' : '#e2e8f0'}; border-radius: 1rem; display: flex; flex-direction: column; }

    .sidebar-container { background-color: var(--sidebar-bg); border-right: 1px solid rgba(0,0,0,0.05); transition: background-color 0.5s ease; }
    .sidebar-link { transition: all 0.2s; border-radius: 0.75rem; font-weight: 600; font-size: 0.9rem; display: flex; align-items: center; gap: 0.75rem; padding: 0.85rem 1rem; color: #64748b; }
    .sidebar-link.active { background-color: var(--primary); color: white; box-shadow: 0 4px 12px -2px rgba(0, 0, 0, 0.2); }
    .sidebar-link:hover:not(.active) { background-color: rgba(0,0,0,0.03); color: var(--text-main); }

    .btn-primary { background: var(--primary); color: white; border: none; font-weight: 700; transition: 0.2s; }
    .btn-primary:hover { background: var(--secondary); transform: scale(1.02); }
    .btn-primary:disabled { opacity: 0.5; cursor: not-allowed; transform: none; }
    
    .settings-input { width: 100%; padding: 0.75rem 1rem; background-color: rgba(0,0,0,0.03); border-radius: 0.75rem; border: 1px solid #cbd5e1; font-weight: 500; outline: none; transition: 0.2s; color: var(--text-main); }
    .settings-input:focus { background-color: ${theme.name.includes('Dark') ? '#334155' : '#ffffff'}; border-color: var(--primary); box-shadow: 0 0 0 3px rgba(0,0,0,0.1); }
    
    .kanban-card { background: ${theme.name.includes('Dark') ? '#1e293b' : 'white'}; border: 1px solid rgba(0,0,0,0.1); border-radius: 0.75rem; padding: 1rem; cursor: pointer; position: relative; margin-bottom: 0.75rem; color: var(--text-main); transition: 0.2s; }
    .kanban-card:hover { border-color: var(--primary); transform: translateY(-2px); box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); }

    .text-primary { color: var(--primary); }
    .bg-primary-light { background-color: var(--bg-main); }
    
    @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
    .animate-fadeIn { animation: fadeIn 0.4s ease-out forwards; }
    .scrollbar-hide::-webkit-scrollbar { display: none; }
    
    .prop-image img { width: 100%; height: 100%; object-fit: cover; border-radius: 1rem; }
    .custom-checkbox { width: 1.2rem; height: 1.2rem; border-radius: 0.4rem; border: 2px solid #cbd5e1; appearance: none; cursor: pointer; transition: 0.2s; }
    .custom-checkbox:checked { background-color: var(--primary); border-color: var(--primary); background-image: url("data:image/svg+xml,%3csvg viewBox='0 0 16 16' fill='white' xmlns='http://www.w3.org/2000/svg'%3e%3cpath d='M12.207 4.793a1 1 0 010 1.414l-5 5a1 1 0 01-1.414 0l-2.5-2.5a1 1 0 011.414-1.414L6.5 9.086l4.293-4.293a1 1 0 011.414 0z'/%3e%3c/svg%3e"); }
    
    @media print {
        .sidebar-container, .no-print { display: none !important; }
        main { margin-left: 0 !important; padding: 0 !important; }
        .glass-panel { box-shadow: none; border: 1px solid #ccc; break-inside: avoid; }
        body { background: white; color: black; }
    }
  `}</style>
);

// --- UTILITÁRIOS ---
const formatDate = (val) => {
    try {
        if(!val) return '-';
        if(val && typeof val === 'object' && val.seconds) return new Date(val.seconds * 1000).toLocaleDateString('pt-BR');
        const d = String(val);
        if(d.includes('T')) return new Date(d).toLocaleDateString('pt-BR');
        const parts = d.split('-');
        if(parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
        return d;
    } catch (e) { return '-'; }
};

const maskPhone = (v) => {
    let r = String(v || '').replace(/\D/g, "");
    if (r.length > 11) r = r.substring(0, 11);
    if (r.length > 10) return r.replace(/^(\d\d)(\d{5})(\d{4}).*/, "($1) $2-$3");
    if (r.length > 5) return r.replace(/^(\d\d)(\d{4})(\d{0,4}).*/, "($1) $2-$3");
    if (r.length > 2) return r.replace(/^(\d\d)(\d{0,5}).*/, "($1) $2");
    return r;
};

const maskCurrency = (v) => {
    let r = String(v || '').replace(/\D/g, "");
    r = (Number(r) / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    return r;
};

const maskNumber = (v) => String(v || '').replace(/\D/g, "");

function App() {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('dashboard');
    const [settingsTab, setSettingsTab] = useState('perfil');
    
    // DADOS
    const [currentTheme, setCurrentTheme] = useState('blue');
    const [clients, setClients] = useState([]);
    const [properties, setProperties] = useState([]);
    const [agenda, setAgenda] = useState([]);
    
    // UI - FILTROS
    const [timeFilter, setTimeFilter] = useState('TODOS'); // HOJE, MES, ANO, TODOS
    const [clientSearch, setClientSearch] = useState('');
    const [clientFilter, setClientFilter] = useState('TODOS');
    const [propertySearch, setPropertySearch] = useState('');
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [saving, setSaving] = useState(false);
    
    // FORM DATA
    const [formData, setFormData] = useState({ 
        name: '', phone: '', email: '', birthDate: '', address: '', interest: '', 
        price: '', type: 'client', obs: '', image: '', date: '', time: '',
        bedrooms: '', garage: '', area: '' 
    });
    
    const [wpMessages, setWpMessages] = useState({});
    const [bulkMessage, setBulkMessage] = useState('');
    const [selectedClients, setSelectedClients] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [userProfile, setUserProfile] = useState({ name: 'Alexandre', creci: '', phone: '', address: '', bio: '', photo: '' });
    const [passwords, setPasswords] = useState({ current: '', new: '', confirm: '' });

    const theme = THEMES[currentTheme] || THEMES['blue'];

    // LOAD
    const loadData = async (userId) => {
        try {
            const qC = query(collection(db, 'clients'), where("assignedAgent", "==", userId));
            const snapC = await getDocs(qC);
            setClients(snapC.docs.map(d => ({ id: d.id, ...d.data() })));
            
            const qP = query(collection(db, 'properties'), where("userId", "==", userId));
            const snapP = await getDocs(qP);
            setProperties(snapP.docs.map(d => ({ id: d.id, ...d.data() })));
            
            const qA = query(collection(db, 'agenda'), where("userId", "==", userId));
            const snapA = await getDocs(qA);
            setAgenda(snapA.docs.map(d => ({ id: d.id, ...d.data() })));
            
            const savedTheme = localStorage.getItem('crm_theme');
            if(savedTheme && THEMES[savedTheme]) setCurrentTheme(savedTheme);
            
            const savedProfile = localStorage.getItem('crm_profile');
            if(savedProfile) setUserProfile(JSON.parse(savedProfile));
            
        } catch (error) { console.error("Erro:", error); }
    };

    useEffect(() => {
        const unsub = onAuthStateChanged(auth, (u) => {
            if (u) { setUser(u); loadData(u.uid); }
            else setUser(null); setLoading(false);
        });
        return () => unsub();
    }, []);

    // ACTIONS
    const handleThemeChange = (t) => { setCurrentTheme(t); localStorage.setItem('crm_theme', t); };
    
    const saveProfile = () => {
        localStorage.setItem('crm_profile', JSON.stringify(userProfile));
        alert("Perfil salvo neste dispositivo!");
    };

    const handlePasswordChange = async () => {
        if(passwords.new !== passwords.confirm) return alert("As senhas não coincidem.");
        if(passwords.new.length < 6) return alert("Senha muito curta.");
        try { await updatePassword(user, passwords.new); alert("Senha atualizada!"); setPasswords({ current: '', new: '', confirm: '' }); } 
        catch (e) { alert("Erro ao atualizar. Faça logout e login."); }
    };

    const updateStatus = async (clientId, currentStatus, direction) => {
        const flow = ['LEAD', 'AGENDADO', 'PROPOSTA', 'FECHADO'];
        const currentIndex = flow.indexOf(currentStatus || 'LEAD');
        let nextIndex = direction === 'next' ? currentIndex + 1 : currentIndex - 1;
        if (nextIndex >= 0 && nextIndex < flow.length) {
            await updateDoc(doc(db, 'clients', clientId), { status: flow[nextIndex] });
            loadData(user.uid);
        }
    };

    const deleteItem = async (collectionName, id, e) => {
        if(e) e.stopPropagation();
        if(window.confirm("Confirmar exclusão?")) {
            try { await deleteDoc(doc(db, collectionName, id)); loadData(user.uid); }
            catch (e) { alert("Erro ao excluir."); }
        }
    };

    const openEdit = (item, type) => {
        setEditingId(item.id);
        if (type === 'client') {
            setFormData({ 
                name: item.fullName, phone: maskPhone(item.phones?.[0] || ''), email: item.email || '', 
                birthDate: item.birthDate || '', address: item.address || '', interest: item.interest || '', 
                type: 'client', obs: item.observations || '' 
            });
        }
        if (type === 'property') {
            setFormData({ 
                name: item.title, price: item.price, type: 'property', image: item.image || '',
                bedrooms: item.bedrooms || '', garage: item.garage || '', area: item.area || ''
            });
        }
        if (type === 'agenda') setFormData({ name: item.title, date: item.date, time: item.time, type: 'agenda', obs: item.type || 'Visita' });
        setShowForm(true);
    };

    const handleSave = async () => {
        if(!formData.name) return alert("Nome é obrigatório.");
        setSaving(true);
        try {
            const now = new Date().toISOString();
            if(editingId) {
                if(formData.type === 'client') await updateDoc(doc(db, 'clients', editingId), { 
                    fullName: formData.name, phones: [formData.phone], email: formData.email, 
                    birthDate: formData.birthDate, address: formData.address, interest: formData.interest, 
                    observations: formData.obs, updatedAt: now 
                });
                else if(formData.type === 'property') await updateDoc(doc(db, 'properties', editingId), { 
                    title: formData.name, price: formData.price, image: formData.image,
                    bedrooms: formData.bedrooms, garage: formData.garage, area: formData.area
                });
                else if(formData.type === 'agenda') await updateDoc(doc(db, 'agenda', editingId), { title: formData.name, date: formData.date, time: formData.time, type: formData.obs });
            } else {
                if(formData.type === 'property') await addDoc(collection(db, 'properties'), { 
                    title: formData.name, price: formData.price, image: formData.image, userId: user.uid,
                    bedrooms: formData.bedrooms, garage: formData.garage, area: formData.area
                });
                else if(formData.type === 'agenda') await addDoc(collection(db, 'agenda'), { title: formData.name, date: formData.date, time: formData.time, type: formData.obs, userId: user.uid });
                else await addDoc(collection(db, 'clients'), { 
                    fullName: formData.name, phones: [formData.phone], email: formData.email,
                    birthDate: formData.birthDate, address: formData.address, interest: formData.interest,
                    observations: formData.obs, status: 'LEAD', assignedAgent: user.uid,
                    createdAt: now, updatedAt: now
                });
            }
            alert("Salvo com sucesso!"); setShowForm(false); setEditingId(null); 
            setFormData({ name: '', phone: '', email: '', birthDate: '', address: '', interest: '', price: '', type: 'client', obs: '', image: '', date: '', time: '', bedrooms: '', garage: '', area: '' }); 
            loadData(user.uid);
        } catch (error) { alert("Erro: " + error.message); } 
        finally { setSaving(false); }
    };

    const toggleSelectClient = (id) => {
        if (selectedClients.includes(id)) setSelectedClients(selectedClients.filter(c => c !== id));
        else setSelectedClients([...selectedClients, id]);
    };

    const sendWp = (phone, msg) => {
        const num = String(phone || '').replace(/\D/g, '');
        if (num) window.open(`https://wa.me/55${num}?text=${encodeURIComponent(msg)}`, '_blank');
        else alert("Sem telefone.");
    };

    const shareProperty = (p) => {
        const text = `*${p.title}*\n\n💰 ${p.price}\n🛏 ${p.bedrooms || 0} Quartos | 🚗 ${p.garage || 0} Vagas | 📐 ${p.area || 0}m²\n\nInteressado? Me chame aqui!`;
        const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
        window.open(url, '_blank');
    };

    const exportCSV = () => {
        if(clients.length === 0) return alert("Sem clientes para exportar.");
        const headers = "Nome,Telefone,Email,Status,Interesse\n";
        const rows = clients.map(c => `${c.fullName},${c.phones?.[0] || ''},${c.email || ''},${c.status || 'LEAD'},${c.interest || ''}`).join("\n");
        const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = `backup_clientes_${new Date().toLocaleDateString().replace(/\//g,'-')}.csv`;
        link.click();
    };

    // --- CÁLCULOS E INTELIGÊNCIA ---
    const hour = new Date().getHours();
    const greeting = hour < 12 ? 'Bom dia' : hour < 18 ? 'Boa tarde' : 'Boa noite';
    
    // FILTROS DASHBOARD (Data)
    const filterByDate = (items) => {
        if (timeFilter === 'TODOS') return items;
        const now = new Date();
        return items.filter(item => {
            const itemDate = item.createdAt ? new Date(item.createdAt) : new Date();
            if (timeFilter === 'HOJE') return itemDate.toDateString() === now.toDateString();
            if (timeFilter === 'MES') return itemDate.getMonth() === now.getMonth() && itemDate.getFullYear() === now.getFullYear();
            if (timeFilter === 'ANO') return itemDate.getFullYear() === now.getFullYear();
            return true;
        });
    };

    const dashboardClients = filterByDate(clients);
    const totalVGV = properties.reduce((acc, c) => acc + (parseFloat(String(c.price || '0').replace(/\D/g, ''))/100), 0);
    
    const funnelData = [
        { name: 'Lead', value: dashboardClients.filter(c => !c.status || c.status === 'LEAD').length, color: '#94a3b8' },
        { name: 'Visita', value: dashboardClients.filter(c => c.status === 'AGENDADO').length, color: '#f59e0b' },
        { name: 'Proposta', value: dashboardClients.filter(c => c.status === 'PROPOSTA').length, color: '#8b5cf6' },
        { name: 'Fechado', value: dashboardClients.filter(c => c.status === 'FECHADO').length, color: '#10b981' },
    ];
    
    const salesCount = clients.filter(c => c.status === 'FECHADO').length;
    const leadsCount = clients.length || 1; 
    const conversionRate = ((salesCount / leadsCount) * 100).toFixed(1);
    const avgTicket = totalVGV / (properties.length || 1);
    const potentialCommission = totalVGV * 0.05; 

    // Filtros de Busca (Listas)
    const filteredClients = clients.filter(c => {
        const matchesSearch = c.fullName.toLowerCase().includes(clientSearch.toLowerCase()) || String(c.phones?.[0]).includes(clientSearch);
        const matchesFilter = clientFilter === 'TODOS' ? true : (c.status || 'LEAD') === clientFilter;
        return matchesSearch && matchesFilter;
    });

    const filteredProperties = properties.filter(p => p.title.toLowerCase().includes(propertySearch.toLowerCase()));

    const dailyEvents = agenda
        .filter(a => a.date === selectedDate)
        .sort((a, b) => (a.time || '').localeCompare(b.time || ''));

    if (loading) return <div className="h-screen flex items-center justify-center font-bold text-slate-400">CARREGANDO SISTEMA...</div>;
    if (!user) return <Login onLogin={setUser} />;

    return (
        <div className="min-h-screen flex">
            <TailwindStyle theme={theme} />
            
            <aside className="w-20 lg:w-64 sidebar-container flex flex-col fixed h-full z-50">
                <div className="p-8"><h1 className="font-black text-xl tracking-tighter italic" style={{color: theme.text}}>ALEXANDRE<span style={{color: theme.primary}}>CRM</span></h1></div>
                <nav className="flex-1 px-4 space-y-2 overflow-y-auto">
                    {[{ id: 'dashboard', icon: '📊', label: 'Dashboard' }, { id: 'pipeline', icon: '🌪️', label: 'Funil Vendas' }, { id: 'clients', icon: '👥', label: 'Clientes' }, { id: 'properties', icon: '🏠', label: 'Imóveis' }, { id: 'agenda', icon: '📅', label: 'Agenda' }, { id: 'whatsapp', icon: '💬', label: 'WhatsApp' }, { id: 'relatorios', icon: '📄', label: 'Relatórios' }, { id: 'settings', icon: '⚙️', label: 'Configuração' }].map(item => (
                        <button key={item.id} onClick={() => setActiveTab(item.id)} className={`sidebar-link w-full ${activeTab === item.id ? 'active' : ''}`}><span className="text-xl">{item.icon}</span> <span className="hidden lg:block">{item.label}</span></button>
                    ))}
                </nav>
                <div className="p-4 border-t"><button onClick={() => signOut(auth)} className="w-full py-3 text-xs font-bold text-red-500 hover:bg-red-50 rounded-xl">SAIR</button></div>
            </aside>

            <main className="flex-1 ml-20 lg:ml-64 p-6 lg:p-10 overflow-y-auto transition-colors duration-500">
                <header className="flex justify-between items-center mb-8 animate-fadeIn no-print">
                    <div className="flex items-center gap-4">
                        {userProfile.photo && <img src={userProfile.photo} className="w-10 h-10 rounded-full object-cover border-2 border-slate-100" />}
                        <div>
                            <h2 className="text-xs font-black opacity-50 uppercase tracking-widest mb-1">{greeting}, {userProfile.name}</h2>
                            <h1 className="text-3xl font-black tracking-tight uppercase">{activeTab === 'settings' ? 'Configurações' : activeTab}</h1>
                        </div>
                    </div>
                    {/* FILTRO DE DATA APENAS NO DASHBOARD */}
                    {activeTab === 'dashboard' ? (
                         <div className="hidden sm:flex bg-slate-100 p-1 rounded-xl">
                            {['HOJE', 'MES', 'ANO', 'TODOS'].map(f => (
                                <button key={f} onClick={() => setTimeFilter(f)} className={`px-4 py-2 text-xs font-black rounded-lg transition uppercase ${timeFilter === f ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>{f}</button>
                            ))}
                        </div>
                    ) : (
                         <div className="hidden sm:block text-right"><div className="flex items-center gap-2 justify-end"><div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div><span className="font-bold text-xs text-green-600">SISTEMA ONLINE</span></div></div>
                    )}
                </header>

                {activeTab === 'dashboard' && (
                    <div className="space-y-8 animate-fadeIn">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            <div className="glass-panel p-6 border-l-4 border-primary"><p className="opacity-50 text-xs font-bold uppercase mb-2">Clientes</p><p className="text-3xl font-black">{dashboardClients.length}</p></div>
                            <div className="glass-panel p-6 border-l-4 border-primary"><p className="opacity-50 text-xs font-bold uppercase mb-2">VGV Total (Carteira)</p><p className="text-2xl font-black">{totalVGV.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })}</p></div>
                            <div className="glass-panel p-6 border-l-4 border-primary"><p className="opacity-50 text-xs font-bold uppercase mb-2">Em Negociação</p><p className="text-3xl font-black">{dashboardClients.filter(c => c.status === 'PROPOSTA' || c.status === 'AGENDADO').length}</p></div>
                            <div className="glass-panel p-6 border-l-4 border-primary"><p className="opacity-50 text-xs font-bold uppercase mb-2">Vendas Fechadas</p><p className="text-3xl font-black text-green-600">{dashboardClients.filter(c => c.status === 'FECHADO').length}</p></div>
                        </div>
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                            {/* GRÁFICO FUNIL (FONTE AUMENTADA) */}
                            <div className="glass-panel p-6 lg:col-span-2 shadow-sm h-96">
                                <h3 className="text-sm font-black uppercase opacity-50 mb-4">Funil de Vendas</h3>
                                <ResponsiveContainer width="100%" height="90%">
                                    <BarChart data={funnelData} layout="vertical" margin={{top:5, right:30, left:40, bottom:5}}>
                                        <XAxis type="number" hide />
                                        <YAxis dataKey="name" type="category" width={100} tick={{fontSize:14, fontWeight:800, fill:'#334155'}} axisLine={false} tickLine={false} />
                                        <Tooltip cursor={{fill: 'rgba(0,0,0,0.05)'}} />
                                        <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={40}>
                                            {funnelData.map((e, i) => <Cell key={i} fill={e.color} />)}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                            {/* LISTA DE CLIENTES (FONTE AUMENTADA E PADRONIZADA) */}
                            <div className="glass-panel p-6 h-96 overflow-y-auto">
                                <h3 className="text-sm font-black uppercase opacity-50 mb-4">Últimos Leads</h3>
                                <div className="space-y-3">
                                    {dashboardClients.slice(0, 5).map(c => (
                                        <div key={c.id} className="flex justify-between items-center p-3 bg-primary-light rounded-xl border border-dashed border-slate-200 cursor-pointer hover:bg-white hover:shadow-md transition" onClick={() => { setEditingId(c.id); setFormData({...c, type:'client'}); setShowForm(true); }}>
                                            <div>
                                                <p className="font-black text-base text-slate-800 uppercase">{c.fullName}</p>
                                                <span className={`inline-block mt-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase ${c.status === 'FECHADO' ? 'bg-green-100 text-green-700' : c.status === 'PROPOSTA' ? 'bg-purple-100 text-purple-700' : 'bg-slate-200 text-slate-500'}`}>
                                                    {c.status || 'LEAD'}
                                                </span>
                                            </div>
                                            <div className="text-[10px] font-bold text-blue-500 uppercase">EDITAR</div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                )}
                
                {/* --- PIPELINE (KANBAN RESTAURADO) --- */}
                {activeTab === 'pipeline' && (
                    <div className="flex gap-6 overflow-x-auto pb-6 scrollbar-hide h-[calc(100vh-180px)] animate-fadeIn">
                        {[{ id: 'LEAD', label: 'Novos Leads' }, { id: 'AGENDADO', label: 'Visitas' }, { id: 'PROPOSTA', label: 'Propostas' }, { id: 'FECHADO', label: 'Fechados' }].map(col => (
                            <div key={col.id} className="glass-column min-w-[320px] shadow-sm">
                                <div className="p-5 border-b border-dashed border-slate-200 flex justify-between items-center sticky top-0 z-10"><h3 className="font-black uppercase text-sm opacity-60">{col.label}</h3><span className="bg-primary-light px-2 py-1 rounded-lg text-xs font-bold opacity-60 shadow-inner">{clients.filter(c => (c.status || 'LEAD') === col.id).length}</span></div>
                                <div className="p-4 flex-1 overflow-y-auto space-y-3">
                                    {clients.filter(c => (c.status || 'LEAD') === col.id).map(client => (
                                        <div key={client.id} onClick={() => openEdit(client, 'client')} className="kanban-card group">
                                            <div className="flex justify-between items-start mb-3"><div className="flex items-center gap-2"><div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-black border border-slate-200 text-slate-500">{client.fullName.charAt(0)}</div><div><h4 className="font-black text-xs uppercase leading-tight truncate w-32">{client.fullName}</h4><p className="text-[9px] opacity-50 font-bold">{maskPhone(client.phones?.[0])}</p></div></div><button onClick={(e) => deleteItem('clients', client.id, e)} className="text-slate-300 hover:text-red-500 px-1">✕</button></div>
                                            <div className="flex gap-2 mt-3">{col.id !== 'LEAD' && col.id !== 'FECHADO' && <button onClick={(e) => { e.stopPropagation(); updateStatus(client.id, col.id, 'prev'); }} className="btn-back px-3 py-2 rounded-lg text-xs transition">◀</button>}{col.id !== 'FECHADO' && <button onClick={(e) => { e.stopPropagation(); updateStatus(client.id, col.id, 'next'); }} className="btn-advance flex-1 py-2 rounded-lg text-[10px] uppercase shadow-md transition">Avançar ➜</button>}{col.id === 'FECHADO' && <button onClick={(e) => { e.stopPropagation(); updateStatus(client.id, col.id, 'prev'); }} className="btn-reopen w-full py-2 rounded-lg text-[10px] uppercase shadow-md transition">↺ Reabrir</button>}</div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
                
                {/* --- CLIENTES (LISTA RESTAURADA) --- */}
                {activeTab === 'clients' && (
                    <div className="space-y-6 animate-fadeIn">
                       <div className="flex flex-col lg:flex-row justify-between items-end lg:items-center gap-4">
                           <div className="flex-1 w-full lg:w-auto flex flex-col gap-4">
                               <div className="relative">
                                   <input placeholder="Buscar por nome ou telefone..." value={clientSearch} onChange={e => setClientSearch(e.target.value)} className="settings-input pl-10" />
                                   <span className="absolute left-3 top-3.5 text-slate-400">🔍</span>
                               </div>
                               <div className="flex gap-2 overflow-x-auto pb-1">
                                    {['TODOS', 'LEAD', 'AGENDADO', 'PROPOSTA', 'FECHADO'].map(status => (
                                        <button key={status} onClick={() => setClientFilter(status)} className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase transition whitespace-nowrap ${clientFilter === status ? 'bg-primary text-white shadow-md' : 'bg-white text-slate-500 border border-slate-200'}`}>{status}</button>
                                    ))}
                               </div>
                           </div>
                           <button onClick={() => { setEditingId(null); setFormData({ name: '', phone: '', email: '', birthDate: '', address: '', interest: '', obs: '', type: 'client' }); setShowForm(true); }} className="btn-primary px-6 py-3 rounded-xl text-xs uppercase shadow-lg whitespace-nowrap">+ Novo Cliente</button>
                       </div>
                       <p className="text-xs font-bold opacity-50 uppercase">Mostrando {filteredClients.length} de {clients.length} clientes</p>
                       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                           {filteredClients.map(client => (
                               <div key={client.id} className="glass-panel p-6 relative group hover:border-blue-400 flex flex-col">
                                   <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition z-10"><button onClick={() => openEdit(client, 'client')} className="p-2 bg-slate-100 rounded-lg text-slate-500 hover:text-blue-600 shadow-sm transition">✎</button><button onClick={(e) => deleteItem('clients', client.id, e)} className="p-2 bg-slate-100 rounded-lg text-slate-500 hover:text-red-500 shadow-sm transition">✕</button></div>
                                   <div className="flex items-start gap-4 mb-4"><div className="w-12 h-12 rounded-full bg-slate-100 border border-white shadow-inner flex items-center justify-center text-lg font-black text-slate-400 flex-shrink-0">{client.fullName.charAt(0)}</div><div className="overflow-hidden"><h4 className="font-black text-base uppercase leading-tight truncate">{client.fullName}</h4><p className="text-[10px] font-bold text-blue-500 uppercase mt-1">{client.interest || 'Interesse não informado'}</p><span className={`inline-block mt-2 text-[9px] font-bold uppercase px-2 py-0.5 rounded-md ${client.status === 'FECHADO' ? 'bg-green-100 text-green-700' : client.status === 'PROPOSTA' ? 'bg-purple-100 text-purple-700' : 'bg-slate-100 text-slate-500'}`}>{client.status || 'LEAD'}</span></div></div>
                                   <div className="bg-slate-50/50 rounded-xl p-3 space-y-2 mb-4 border border-slate-100">
                                       <div className="grid grid-cols-2 gap-2"><div><p className="text-[9px] font-bold uppercase opacity-50">Telefone</p><p className="text-[10px] font-bold truncate">{maskPhone(client.phones?.[0])}</p></div><div><p className="text-[9px] font-bold uppercase opacity-50">Nascimento</p><p className="text-[10px] font-bold truncate">{formatDate(client.birthDate)}</p></div></div>
                                       <div><p className="text-[9px] font-bold uppercase opacity-50">Email</p><p className="text-[10px] font-bold truncate">{client.email || '-'}</p></div>
                                       <div><p className="text-[9px] font-bold uppercase opacity-50">Endereço</p><p className="text-[10px] font-bold truncate">{client.address || '-'}</p></div>
                                   </div>
                                   {client.observations && <div className="mb-4 text-[10px] italic opacity-60 bg-yellow-50 p-2 rounded-lg border border-yellow-100 line-clamp-3">"{client.observations}"</div>}
                                   <div className="mt-auto pt-2"><textarea placeholder="Escreva a mensagem aqui..." className="w-full text-xs p-2 bg-white border border-slate-200 rounded-lg mb-2 h-16 outline-none focus:border-green-400 transition resize-none" value={wpMessages[client.id] || ''} onChange={(e) => setWpMessages({...wpMessages, [client.id]: e.target.value})} onClick={(e) => e.stopPropagation()} /><button onClick={() => sendWp(client.phones?.[0], wpMessages[client.id] || '')} className="flex items-center justify-center gap-2 w-full py-3 bg-green-500 text-white rounded-xl font-black uppercase text-xs tracking-wider shadow-lg hover:bg-green-600 transition">Enviar WhatsApp ➜</button></div>
                               </div>
                           ))}
                       </div>
                   </div>
                )}
                
                {/* --- IMÓVEIS (GRID RESTAURADO) --- */}
                {activeTab === 'properties' && (
                   <div className="space-y-6 animate-fadeIn">
                       <div className="flex flex-col lg:flex-row justify-between items-end lg:items-center gap-4">
                           <div className="flex-1 w-full lg:w-auto relative">
                               <input placeholder="Buscar imóveis..." value={propertySearch} onChange={e => setPropertySearch(e.target.value)} className="settings-input pl-10" />
                               <span className="absolute left-3 top-3.5 text-slate-400">🔍</span>
                           </div>
                           <button onClick={() => { setEditingId(null); setFormData({ name: '', phone: '', price: '', type: 'property', obs: '', image: '', date: '', time: '', bedrooms: '', garage: '', area: '' }); setShowForm(true); }} className="btn-primary px-6 py-3 rounded-xl text-xs uppercase shadow-lg whitespace-nowrap">+ Novo Imóvel</button>
                       </div>
                       <p className="text-xs font-bold opacity-50 uppercase">Mostrando {filteredProperties.length} de {properties.length} imóveis</p>
                       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                           {filteredProperties.map(p => (
                               <div key={p.id} className="glass-panel overflow-hidden group flex flex-col">
                                   <div className="prop-image h-48 relative">{p.image ? <img src={p.image} alt={p.title} /> : <div className="w-full h-full flex items-center justify-center bg-slate-100 text-slate-300 font-black text-4xl">🏠</div>}<div className="absolute top-4 right-4 flex gap-2"><button onClick={() => openEdit(p, 'property')} className="w-8 h-8 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center text-slate-600 hover:text-blue-600 shadow-sm transition">✎</button><button onClick={(e) => deleteItem('properties', p.id, e)} className="w-8 h-8 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center text-slate-600 hover:text-red-500 shadow-sm transition">✕</button></div></div>
                                   <div className="p-6 flex-1 flex flex-col">
                                       <h3 className="font-black text-xl uppercase leading-tight mb-2 truncate">{p.title}</h3>
                                       <p className="text-2xl font-black text-primary mb-4 tracking-tighter" style={{color: theme.primary}}>{p.price}</p>
                                       <div className="flex justify-between items-center bg-slate-50 p-3 rounded-xl border border-dashed border-slate-200 mb-6"><div className="text-center"><p className="text-[10px] font-bold uppercase opacity-40">Quartos</p><p className="font-black text-sm">{p.bedrooms || '-'}</p></div><div className="w-px h-6 bg-slate-200"></div><div className="text-center"><p className="text-[10px] font-bold uppercase opacity-40">Vagas</p><p className="font-black text-sm">{p.garage || '-'}</p></div><div className="w-px h-6 bg-slate-200"></div><div className="text-center"><p className="text-[10px] font-bold uppercase opacity-40">Área</p><p className="font-black text-sm">{p.area ? `${p.area}m²` : '-'}</p></div></div>
                                       <div className="mt-auto grid grid-cols-2 gap-3">
                                            <button className="py-3 bg-slate-100 text-slate-600 rounded-xl font-black uppercase text-xs hover:bg-slate-200 transition shadow-sm">Copiar Link</button>
                                            <button onClick={() => shareProperty(p)} className="py-3 bg-green-500 text-white rounded-xl font-black uppercase text-xs hover:bg-green-600 transition shadow-sm flex items-center justify-center gap-2">Compartilhar ➜</button>
                                       </div>
                                   </div>
                               </div>
                           ))}
                       </div>
                   </div>
                )}

                {/* --- AGENDA (CALENDÁRIO RESTAURADO) --- */}
                {activeTab === 'agenda' && (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 animate-fadeIn">
                        <div className="lg:col-span-2 glass-panel p-8">
                            <h3 className="text-xl font-black uppercase italic mb-8">Calendário</h3>
                            <div className="grid grid-cols-7 gap-2 text-center text-xs font-bold opacity-50 mb-2"><div>D</div><div>S</div><div>T</div><div>Q</div><div>Q</div><div>S</div><div>S</div></div>
                            <div className="grid grid-cols-7 gap-2">
                                {Array.from({length: 31}, (_, i) => i + 1).map(d => (
                                    <div key={d} onClick={() => setSelectedDate(`2024-02-${String(d).padStart(2,'0')}`)} className={`aspect-square flex flex-col items-center justify-center rounded-xl font-bold text-sm cursor-pointer transition ${selectedDate.endsWith(String(d).padStart(2,'0')) ? 'bg-primary text-white shadow-lg' : 'hover:bg-slate-100'}`} style={selectedDate.endsWith(String(d).padStart(2,'0')) ? {backgroundColor: theme.primary} : {}}>{d}{agenda.some(a => a.date?.endsWith(String(d).padStart(2,'0'))) && <div className="w-1 h-1 rounded-full bg-red-500 mt-1"></div>}</div>
                                ))}
                            </div>
                        </div>
                        <div className="glass-panel p-8 flex flex-col h-[600px]">
                            <div className="flex justify-between items-center mb-6">
                                <div><h3 className="text-xl font-black uppercase italic">Agenda</h3><p className="text-xs font-bold opacity-50 uppercase">{formatDate(selectedDate)}</p></div>
                                <button onClick={() => { setEditingId(null); setFormData({ name: '', phone: '', price: '', type: 'agenda', obs: 'Visita', image: '', date: selectedDate, time: '09:00' }); setShowForm(true); }} className="btn-primary w-10 h-10 rounded-full flex items-center justify-center shadow-lg">+</button>
                            </div>
                            <div className="flex-1 overflow-y-auto space-y-4">
                                {dailyEvents.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center h-full opacity-40"><p className="text-3xl mb-2">📅</p><p className="text-xs font-bold uppercase">Nada agendado</p></div>
                                ) : (
                                    dailyEvents.map(a => (
                                        <div key={a.id} className="p-4 border-l-4 border-primary bg-slate-50 rounded-r-xl relative group">
                                            <p className="text-xs font-bold text-primary">{a.time}</p>
                                            <p className="font-black uppercase text-sm">{a.title}</p>
                                            <p className="text-[10px] font-bold opacity-50 uppercase mt-1">{a.type}</p>
                                            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition">
                                                <button onClick={() => deleteItem('agenda', a.id)} className="text-red-400 hover:text-red-600 px-2 font-bold">✕</button>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* --- WHATSAPP (RESTAURADO) --- */}
                {activeTab === 'whatsapp' && (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-fadeIn h-[calc(100vh-140px)]">
                       <div className="glass-panel p-6 flex flex-col">
                           <div className="mb-6"><h3 className="text-lg font-black uppercase mb-2">Destinatários</h3><input placeholder="Buscar cliente..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="settings-input" /></div>
                           <div className="flex-1 overflow-y-auto space-y-2 pr-2">{clients.filter(c => c.fullName.toLowerCase().includes(searchTerm.toLowerCase())).map(c => (<div key={c.id} onClick={() => toggleSelectClient(c.id)} className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition ${selectedClients.includes(c.id) ? 'bg-primary-light border-primary' : 'bg-white border-slate-100 hover:border-blue-300'}`}><div className="flex items-center gap-3"><div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${selectedClients.includes(c.id) ? 'bg-primary text-white' : 'bg-slate-100 text-slate-400'}`} style={selectedClients.includes(c.id) ? {backgroundColor: theme.primary} : {}}>{c.fullName.charAt(0)}</div><p className="text-xs font-bold uppercase">{c.fullName}</p></div><input type="checkbox" checked={selectedClients.includes(c.id)} readOnly className="custom-checkbox" /></div>))}</div>
                       </div>
                       <div className="lg:col-span-2 flex flex-col gap-6">
                           <div className="glass-panel p-6"><h3 className="text-lg font-black uppercase mb-4">Mensagem</h3><div className="flex gap-2 mb-4 overflow-x-auto pb-2">{[{l:'Olá Inicial', t:'Olá! Tudo bem? Sou Alexandre e gostaria de apresentar oportunidades de imóveis.'}, {l:'Cobrar Visita', t:'Olá! Lembrete da nossa visita agendada para amanhã.'}].map((t,i) => (<button key={i} onClick={() => setBulkMessage(t.t)} className="px-3 py-1 bg-slate-100 text-slate-600 rounded-full text-[10px] font-black uppercase whitespace-nowrap hover:bg-slate-200 border border-slate-200">{t.l}</button>))}</div><textarea value={bulkMessage} onChange={e => setBulkMessage(e.target.value)} className="w-full h-32 p-4 bg-slate-50 rounded-xl border border-slate-200 outline-none focus:border-blue-400 font-medium text-sm" placeholder="Digite sua mensagem aqui..." /></div>
                           <div className="glass-panel p-6 flex-1 bg-slate-900 text-white flex flex-col relative overflow-hidden"><div className="absolute top-0 right-0 w-64 h-64 bg-green-500 rounded-full blur-[100px] opacity-20"></div><h3 className="text-lg font-black uppercase mb-4 relative z-10">Central de Disparo</h3>{selectedClients.length === 0 ? (<div className="flex-1 flex flex-col items-center justify-center opacity-30"><span className="text-4xl mb-2">🚀</span><p className="text-xs font-bold uppercase">Selecione clientes</p></div>) : (<div className="flex-1 overflow-y-auto space-y-3 relative z-10 pr-2">{selectedClients.map(id => {const client = clients.find(c => c.id === id); return (<div key={id} className="flex items-center justify-between p-3 bg-white/10 rounded-xl border border-white/10"><span className="font-bold text-xs uppercase">{client?.fullName}</span><button onClick={() => sendWp(client?.phones?.[0], bulkMessage)} className="px-4 py-2 bg-green-500 hover:bg-green-400 text-white rounded-lg text-[10px] font-black uppercase transition shadow-lg">Enviar ➜</button></div>);})}</div>)}</div>
                       </div>
                    </div>
                )}
                
                {/* --- RELATÓRIOS (RESTAURADO) --- */}
                {activeTab === 'relatorios' && (
                    <div className="space-y-8 animate-fadeIn">
                        <div className="flex justify-between items-center mb-4 no-print">
                            <h3 className="text-xl font-black uppercase italic">Desempenho Geral</h3>
                            <button onClick={() => window.print()} className="btn-primary px-6 py-2 rounded-xl text-xs uppercase shadow-lg">Imprimir Relatório</button>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="glass-panel p-8 border-t-4 border-primary">
                                <p className="opacity-50 text-xs font-bold uppercase mb-2">Conversão</p>
                                <p className="text-4xl font-black">{conversionRate}%</p>
                                <p className="text-[10px] opacity-50 mt-2">{salesCount} vendas de {clients.length} leads</p>
                            </div>
                            <div className="glass-panel p-8 border-t-4 border-primary">
                                <p className="opacity-50 text-xs font-bold uppercase mb-2">Ticket Médio (Imóveis)</p>
                                <p className="text-3xl font-black">{avgTicket.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })}</p>
                                <p className="text-[10px] opacity-50 mt-2">Baseado em {properties.length} imóveis</p>
                            </div>
                            <div className="glass-panel p-8 border-t-4 border-primary bg-green-50 border-green-500">
                                <p className="opacity-50 text-xs font-bold uppercase mb-2 text-green-800">Comissão Potencial (5%)</p>
                                <p className="text-3xl font-black text-green-600">{potentialCommission.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })}</p>
                                <p className="text-[10px] opacity-50 mt-2 text-green-700">Se vender toda a carteira</p>
                            </div>
                        </div>
                        
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                            <div className="glass-panel p-8 flex flex-col h-96">
                                <h4 className="text-sm font-black uppercase opacity-50 mb-4">Composição da Carteira (Leads vs Vendas)</h4>
                                <ResponsiveContainer>
                                    <PieChart>
                                        <Pie data={[{name:'Leads/Negociação', value:leadsCount - salesCount, fill:'#94a3b8'}, {name:'Vendas Fechadas', value:salesCount, fill:'#22c55e'}]} innerRadius={80} outerRadius={110} dataKey="value" />
                                        <Tooltip />
                                        <Legend />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </div>
                )}

                {/* --- CONFIGURAÇÕES (RESTAURADO) --- */}
                {activeTab === 'settings' && (
                    <div className="animate-fadeIn">
                        <div className="flex gap-4 mb-8 overflow-x-auto pb-2">{['perfil', 'seguranca', 'aparencia', 'sistema'].map(tab => (<button key={tab} onClick={() => setSettingsTab(tab)} className={`px-6 py-2 rounded-full font-bold uppercase text-xs transition ${settingsTab === tab ? 'btn-primary' : 'bg-white text-slate-400 border border-slate-200'}`}>{tab}</button>))}</div>
                        {settingsTab === 'perfil' && (
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                                <div className="glass-panel p-8 flex flex-col items-center text-center"><div className="w-32 h-32 rounded-full bg-slate-200 mb-6 border-4 border-white shadow-xl overflow-hidden"><img src={userProfile.photo || `https://ui-avatars.com/api/?name=${userProfile.name}&background=random&size=200`} alt="Avatar" className="w-full h-full object-cover" /></div><h3 className="text-xl font-black uppercase mb-1">{userProfile.name || 'Usuário'}</h3><p className="text-xs font-bold opacity-50 uppercase mb-6">Corretor de Imóveis</p><button onClick={() => {const url = prompt("Cole o link da sua foto:"); if(url) setUserProfile({...userProfile, photo: url})}} className="btn-primary px-6 py-2 rounded-xl text-xs uppercase w-full">Alterar Foto (Link)</button></div>
                                <div className="lg:col-span-2 glass-panel p-8"><h3 className="text-lg font-black uppercase mb-6 opacity-70">Dados Pessoais</h3><div className="grid grid-cols-1 md:grid-cols-2 gap-6"><div><label className="text-xs font-bold opacity-50 uppercase ml-1">Nome Completo</label><input className="settings-input mt-1" value={userProfile.name} onChange={e => setUserProfile({...userProfile, name: e.target.value})} /></div><div><label className="text-xs font-bold opacity-50 uppercase ml-1">CRECI</label><input className="settings-input mt-1" value={userProfile.creci} onChange={e => setUserProfile({...userProfile, creci: e.target.value})} placeholder="00000-F" /></div><div><label className="text-xs font-bold opacity-50 uppercase ml-1">Email (Login)</label><input className="settings-input mt-1 opacity-50 cursor-not-allowed" value={user.email} disabled /></div><div><label className="text-xs font-bold opacity-50 uppercase ml-1">Telefone</label><input className="settings-input mt-1" value={userProfile.phone} onChange={e => setUserProfile({...userProfile, phone: e.target.value})} /></div><div className="md:col-span-2"><label className="text-xs font-bold opacity-50 uppercase ml-1">Bio / Apresentação</label><textarea className="settings-input mt-1 h-24" value={userProfile.bio} onChange={e => setUserProfile({...userProfile, bio: e.target.value})} placeholder="Especialista em imóveis de alto padrão..." /></div></div><div className="mt-8 text-right"><button onClick={saveProfile} className="btn-primary px-8 py-3 rounded-xl text-xs uppercase shadow-lg">Salvar Perfil</button></div></div>
                            </div>
                        )}
                        {settingsTab === 'seguranca' && (
                            <div className="max-w-2xl mx-auto glass-panel p-10"><h3 className="text-xl font-black uppercase mb-2">Segurança da Conta</h3><p className="text-sm opacity-60 mb-8">Gerencie sua senha e acesso ao sistema.</p><div className="space-y-6"><div><label className="text-xs font-bold opacity-50 uppercase ml-1">Nova Senha</label><input type="password" class="settings-input mt-1" value={passwords.new} onChange={e => setPasswords({...passwords, new: e.target.value})} /></div><div><label className="text-xs font-bold opacity-50 uppercase ml-1">Confirmar Nova Senha</label><input type="password" class="settings-input mt-1" value={passwords.confirm} onChange={e => setPasswords({...passwords, confirm: e.target.value})} /></div></div><div className="mt-8 pt-8 border-t border-slate-100 flex justify-between items-center"><p className="text-xs text-red-400 font-bold">Nunca compartilhe sua senha.</p><button onClick={handlePasswordChange} className="btn-primary px-8 py-3 rounded-xl text-xs uppercase shadow-lg">Atualizar Senha</button></div></div>
                        )}
                        {settingsTab === 'aparencia' && (
                            <div className="glass-panel p-10"><h3 className="text-xl font-black uppercase mb-2">Personalização Visual</h3><p className="text-sm opacity-60 mb-8">Escolha um tema que combine com seu estilo de trabalho.</p><div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">{Object.entries(THEMES).map(([key, t]) => (<button key={key} onClick={() => handleThemeChange(key)} className={`relative p-4 rounded-2xl border-2 transition-all group hover:scale-105 ${currentTheme === key ? 'border-blue-500 shadow-xl scale-105' : 'border-transparent hover:border-slate-300'}`} style={{backgroundColor: t.bg}}><div className="h-12 w-full rounded-lg mb-3 shadow-sm" style={{backgroundColor: t.primary}}></div><div className="flex gap-2 mb-2"><div className="h-2 w-full rounded-full opacity-20" style={{backgroundColor: t.text}}></div><div className="h-2 w-1/3 rounded-full opacity-40" style={{backgroundColor: t.text}}></div></div><p className="text-[10px] font-black uppercase text-center" style={{color: t.text}}>{t.name}</p>{currentTheme === key && <div className="absolute top-2 right-2 w-3 h-3 bg-blue-500 rounded-full border-2 border-white"></div>}</button>))}</div></div>
                        )}
                        {settingsTab === 'sistema' && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8"><div className="glass-panel p-8"><h3 className="text-lg font-black uppercase mb-6 opacity-70">Informações da Build</h3><div className="space-y-4"><div className="flex justify-between py-3 border-b border-dashed border-slate-200"><span className="text-xs font-bold opacity-50 uppercase">Versão do CRM</span><span className="text-xs font-black">v2.5.0 (Gold)</span></div><div className="flex justify-between py-3 border-b border-dashed border-slate-200"><span className="text-xs font-bold opacity-50 uppercase">ID da Licença</span><span className="text-xs font-black font-mono">PRO-8829-XJ</span></div><div className="flex justify-between py-3 border-b border-dashed border-slate-200"><span className="text-xs font-bold opacity-50 uppercase">Engine</span><span className="text-xs font-black">React 18 + Firebase 9</span></div><div className="flex justify-between py-3"><span className="text-xs font-bold opacity-50 uppercase">Canal de Atualização</span><span className="text-xs font-bold text-green-500 bg-green-50 px-2 py-0.5 rounded">Stable</span></div></div></div><div className="glass-panel p-8"><h3 className="text-lg font-black uppercase mb-6 opacity-70">Manutenção de Dados</h3><p className="text-xs opacity-50 mb-6">Use esta área para fazer backup dos seus clientes.</p><div className="space-y-6"><button onClick={exportCSV} className="w-full py-4 bg-slate-800 text-white rounded-xl font-black uppercase text-xs hover:bg-slate-900 transition flex items-center justify-center gap-2">💾 Exportar Clientes (Excel/CSV)</button><div className="p-4 bg-yellow-50 rounded-xl border border-yellow-200"><p className="text-[10px] font-bold text-yellow-800 uppercase">Atenção: A exportação gera um arquivo compatível com Excel e Google Sheets.</p></div></div></div></div>
                        )}
                    </div>
                )}
            </main>

            {/* MODAL GLOBAL */}
            {showForm && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-fadeIn">
                    <div className="glass-panel bg-white w-full max-w-lg p-8 max-h-[90vh] overflow-y-auto">
                        <h3 className="text-xl font-black uppercase mb-6" style={{color: theme.text}}>{editingId ? 'Editar Registro' : 'Novo Registro'}</h3>
                        <div className="space-y-4">
                            <div><label className="text-xs font-bold opacity-50 uppercase ml-1">Nome / Título</label><input className="settings-input mt-1" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} /></div>
                            
                            {formData.type === 'client' && (
                                <>
                                    <div className="grid grid-cols-2 gap-4"><div><label className="text-xs font-bold opacity-50 uppercase ml-1">Telefone / Whats</label><input className="settings-input mt-1" value={formData.phone} maxLength={15} onChange={e => setFormData({...formData, phone: maskPhone(e.target.value)})} placeholder="(00) 00000-0000" /></div><div><label className="text-xs font-bold opacity-50 uppercase ml-1">Nascimento</label><input type="date" className="settings-input mt-1" value={formData.birthDate} onChange={e => setFormData({...formData, birthDate: e.target.value})} /></div></div>
                                    <div><label className="text-xs font-bold opacity-50 uppercase ml-1">Email</label><input className="settings-input mt-1" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} /></div>
                                    <div><label className="text-xs font-bold opacity-50 uppercase ml-1">Endereço Completo</label><input className="settings-input mt-1" value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} /></div>
                                    <div><label className="text-xs font-bold opacity-50 uppercase ml-1">Imóvel Desejado</label><input className="settings-input mt-1" value={formData.interest} onChange={e => setFormData({...formData, interest: e.target.value})} placeholder="Ex: Apto 2 quartos Barra" /></div>
                                    <div><label className="text-xs font-bold opacity-50 uppercase ml-1">Observações</label><textarea className="settings-input mt-1 h-20" value={formData.obs} onChange={e => setFormData({...formData, obs: e.target.value})} /></div>
                                </>
                            )}
                            
                            {formData.type === 'property' && (
                                <>
                                    <div><label className="text-xs font-bold opacity-50 uppercase ml-1">Preço (R$)</label><input className="settings-input mt-1" value={formData.price} onChange={e => setFormData({...formData, price: maskCurrency(e.target.value)})} placeholder="R$ 0,00" /></div>
                                    <div className="grid grid-cols-3 gap-2">
                                        <div><label className="text-xs font-bold opacity-50 uppercase ml-1">Quartos</label><input className="settings-input mt-1" type="text" inputMode="numeric" value={formData.bedrooms} onChange={e => setFormData({...formData, bedrooms: maskNumber(e.target.value)})} placeholder="0" /></div>
                                        <div><label className="text-xs font-bold opacity-50 uppercase ml-1">Vagas</label><input className="settings-input mt-1" type="text" inputMode="numeric" value={formData.garage} onChange={e => setFormData({...formData, garage: maskNumber(e.target.value)})} placeholder="0" /></div>
                                        <div><label className="text-xs font-bold opacity-50 uppercase ml-1">Área (m²)</label><input className="settings-input mt-1" type="text" inputMode="numeric" value={formData.area} onChange={e => setFormData({...formData, area: maskNumber(e.target.value)})} placeholder="0" /></div>
                                    </div>
                                    <div><label className="text-xs font-bold opacity-50 uppercase ml-1">URL Imagem</label><input className="settings-input mt-1" value={formData.image} onChange={e => setFormData({...formData, image: e.target.value})} /></div>
                                </>
                            )}
                            
                            {formData.type === 'agenda' && (
                                <div className="grid grid-cols-2 gap-4"><div><label className="text-xs font-bold opacity-50 uppercase ml-1">Data</label><input type="date" className="settings-input mt-1" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} /></div><div><label className="text-xs font-bold opacity-50 uppercase ml-1">Hora</label><input type="time" className="settings-input mt-1" value={formData.time} onChange={e => setFormData({...formData, time: e.target.value})} /></div><div className="col-span-2"><label className="text-xs font-bold opacity-50 uppercase ml-1">Tipo</label><select className="settings-input mt-1" value={formData.obs} onChange={e => setFormData({...formData, obs: e.target.value})}><option>Visita</option><option>Reunião</option><option>Outro</option></select></div></div>
                            )}
                            {!editingId && (<div><label className="text-xs font-bold opacity-50 uppercase ml-1">Categoria</label><select className="settings-input mt-1" value={formData.type} onChange={e => setFormData({...formData, type: e.target.value})}><option value="client">Cliente</option><option value="property">Imóvel</option><option value="agenda">Agenda</option></select></div>)}
                        </div>
                        <div className="flex gap-4 mt-8"><button onClick={handleSave} disabled={saving} className="btn-primary flex-1 py-4 rounded-xl uppercase shadow-lg disabled:opacity-50 disabled:cursor-not-allowed">{saving ? 'SALVANDO...' : 'SALVAR'}</button><button onClick={() => setShowForm(false)} disabled={saving} className="flex-1 bg-slate-100 text-slate-500 font-bold py-4 rounded-xl uppercase hover:bg-slate-200 transition">CANCELAR</button></div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default App;
