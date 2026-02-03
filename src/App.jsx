import React, { useState, useEffect } from 'react';
import { db, auth } from './firebase/config';
import { collection, addDoc, getDocs, query, where, updateDoc, doc, deleteDoc, getDoc } from 'firebase/firestore';
import { onAuthStateChanged, signOut, updatePassword } from 'firebase/auth';
import Login from './components/Login';

// --- ESTILOS GLOBAIS (CSS) ---
const TailwindStyle = () => (
  <style>{`
    @import url('https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css');
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;700;900&display=swap');
    
    body { font-family: 'Inter', sans-serif; background-color: #f3f4f6; }
    .glass { background: rgba(255, 255, 255, 0.75); backdrop-filter: blur(16px); border: 1px solid rgba(255, 255, 255, 0.5); }
    .glass-dark { background: rgba(15, 23, 42, 0.6); backdrop-filter: blur(16px); border: 1px solid rgba(255, 255, 255, 0.1); color: white; }
    .shadow-premium { box-shadow: 0 20px 40px -10px rgba(0, 0, 0, 0.15); }
    .scrollbar-hide::-webkit-scrollbar { display: none; }
    .calendar-grid { display: grid; grid-template-columns: repeat(7, 1fr); gap: 6px; }
    .calendar-day { aspect-ratio: 1 / 1; display: flex; flex-direction: column; align-items: center; justify-content: center; border-radius: 12px; font-size: 16px; font-weight: 800; cursor: pointer; transition: all 0.2s; }
    .kanban-col { min-width: 320px; }
    .settings-input { width: 100%; padding: 1rem; background-color: #f8fafc; border-radius: 1rem; border: 1px solid #e2e8f0; font-weight: 700; color: #1e293b; outline: none; transition: all 0.3s; }
    .settings-input:focus { background-color: #fff; box-shadow: 0 0 0 4px rgba(0, 0, 0, 0.05); }
    
    /* Toggle Switch Personalizado */
    .toggle-checkbox:checked { right: 0; border-color: #22c55e; }
    .toggle-checkbox:checked + .toggle-label { background-color: #22c55e; }

    /* Animações */
    @keyframes slideUp { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
    .animate-slideUp { animation: slideUp 0.5s ease-out forwards; }
  `}</style>
);

// --- DEFINIÇÃO DOS TEMAS (CORES REAIS HEX) ---
const THEMES = {
    'blue': { 
        name: 'Lopes Blue', 
        primary: '#1e3a8a', 
        secondary: '#3b82f6', 
        sidebarBg: '#ffffff', 
        sidebarText: '#1e3a8a',
        bgLight: '#eff6ff',
        icon: '🔵' 
    },
    'mint-dark': { 
        name: 'Linux Mint Dark', 
        primary: '#87cf3e', 
        secondary: '#69a72b', 
        sidebarBg: '#2f2f2f', 
        sidebarText: '#ffffff',
        bgLight: '#f0fdf4',
        icon: '🟢' 
    },
    'cinnamon': { 
        name: 'Cinnamon Orange', 
        primary: '#d97706', 
        secondary: '#f59e0b', 
        sidebarBg: '#ffffff', 
        sidebarText: '#78350f',
        bgLight: '#fffbeb',
        icon: '🟠' 
    },
    'purple': { 
        name: 'Futura Purple', 
        primary: '#581c87', 
        secondary: '#7e22ce', 
        sidebarBg: '#ffffff', 
        sidebarText: '#581c87',
        bgLight: '#faf5ff',
        icon: '🟣' 
    },
};

// --- COMPONENTE DE VISUALIZAÇÃO PÚBLICA (LANDING PAGE) ---
const PublicPropertyView = ({ propertyId }) => {
    const [prop, setProp] = useState(null);
    useEffect(() => {
        const fetchProp = async () => {
            if (!propertyId) return;
            const docRef = doc(db, 'properties', propertyId);
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) setProp(docSnap.data());
        };
        fetchProp();
    }, [propertyId]);

    if (!prop) return <div className="min-h-screen flex items-center justify-center font-bold text-slate-400">Carregando Imóvel...</div>;

    return (
        <div className="min-h-screen bg-white font-sans text-slate-900">
            <TailwindStyle />
            <div className="h-[60vh] w-full relative">
                {prop.image ? <img src={prop.image} className="w-full h-full object-cover" alt="Capa" /> : <div className="w-full h-full bg-slate-200 flex items-center justify-center font-black text-slate-300 text-4xl">SEM FOTO</div>}
                <div className="absolute inset-0 bg-black/40"></div>
                <div className="absolute bottom-10 left-6 lg:left-20 text-white">
                    <span className="bg-green-500 px-4 py-2 rounded-full text-xs font-black uppercase tracking-widest mb-4 inline-block">Disponível</span>
                    <h1 className="text-4xl lg:text-6xl font-black uppercase italic tracking-tighter mb-2">{prop.title}</h1>
                    <p className="text-2xl lg:text-3xl font-bold opacity-90">{prop.price}</p>
                </div>
            </div>
            <div className="max-w-5xl mx-auto p-8 lg:p-12 -mt-20 relative z-10">
                <div className="bg-white rounded-[3rem] shadow-2xl p-10 border border-slate-100 flex flex-col lg:flex-row gap-10 items-center">
                    <div className="flex-1">
                        <p className="text-slate-400 text-sm font-black uppercase tracking-widest mb-2">Valor de Investimento</p>
                        <p className="text-5xl lg:text-6xl font-black text-slate-900 tracking-tighter">{prop.price}</p>
                    </div>
                    <button onClick={() => window.open(`https://wa.me/5521999999999?text=Olá, interesse no imóvel ${prop.title}`, '_blank')} className="bg-green-500 hover:bg-green-600 text-white py-5 px-10 rounded-[2rem] font-black uppercase tracking-widest shadow-xl transition hover:scale-105">Agendar Visita</button>
                </div>
            </div>
        </div>
    );
};

// --- APLICAÇÃO PRINCIPAL (CRM) ---
function App() {
    const urlParams = new URLSearchParams(window.location.search);
    const publicId = urlParams.get('id');
    const isPublic = urlParams.get('public') === 'true';

    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('dashboard');
    const [settingsTab, setSettingsTab] = useState('perfil'); 
    const [showForm, setShowForm] = useState(false);
    
    // ESTADOS DE DADOS
    const [clients, setClients] = useState([]);
    const [properties, setProperties] = useState([]);
    const [agenda, setAgenda] = useState([]);
    
    // CONFIGURAÇÕES GERAIS
    const [settings, setSettings] = useState({
        userName: 'Alexandre',
        userSurname: 'Corretor',
        userEmail: '',
        userPhone: '',
        userAddress: '',
        creci: '',
        photo: '',
        soundEnabled: true,
        themeColor: 'blue',
        notifications: { email: true, newClient: true, agenda: true },
        language: 'pt-BR'
    });

    // VARIÁVEIS DE UI
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('TODOS');
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [editingId, setEditingId] = useState(null);
    const [newPassword, setNewPassword] = useState('');

    // INPUTS DO FORMULÁRIO (MODAL)
    const [name, setName] = useState('');
    const [phone, setPhone] = useState('');
    const [propertyInterest, setPropertyInterest] = useState('');
    const [birthDate, setBirthDate] = useState('');
    const [observations, setObservations] = useState('');
    const [propPrice, setPropPrice] = useState('');
    const [propAddress, setPropAddress] = useState('');
    const [propLink, setPropLink] = useState('');
    const [propPdf, setPropPdf] = useState('');
    const [propImg, setPropImg] = useState('');
    const [agendaTitle, setAgendaTitle] = useState('');
    const [agendaTime, setAgendaTime] = useState('');
    const [agendaType, setAgendaType] = useState('Tarefa');

    // WHATSAPP & MENSAGENS
    const [wpNumber, setWpNumber] = useState('');
    const [wpMessage, setWpMessage] = useState('');
    const [bulkMessage, setBulkMessage] = useState('');
    const [selectedClients, setSelectedClients] = useState([]);

    // TEMA ATUAL SELECIONADO
    const theme = THEMES[settings.themeColor] || THEMES['blue'];

    // TEMPLATES DE WHATSAPP (Mensagens Rápidas)
    const templates = [
        { title: 'Primeira Abordagem', text: `Olá! Sou ${settings.userName}, da Lopes Prime. Gostaria de saber se você tem interesse em comprar ou alugar um imóvel. Posso ajudar?` },
        { title: 'Follow-up', text: 'Oi! Como vai? Ainda tem interesse naquele imóvel? Tenho novas opções que podem te interessar.' },
        { title: 'Agendar Visita', text: 'Olá! Vamos agendar uma visita para conhecer o decorado? Tenho horários disponíveis.' },
        { title: 'Proposta', text: 'Parabéns! Sua proposta foi bem recebida. Vamos conversar sobre os próximos passos?' }
    ];

    // --- FUNÇÕES AUXILIARES ---

    const playSuccessSound = () => {
        if(settings.soundEnabled) new Audio('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3').play().catch(()=>{});
    };

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
        } catch (error) { console.error(error); }
    };

    const handlePhotoUpload = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => setSettings({...settings, photo: reader.result});
            reader.readAsDataURL(file);
        }
    };

    const handleUpdatePassword = async () => {
        if(newPassword.length < 6) return alert("A senha deve ter no mínimo 6 caracteres.");
        try {
            if(auth.currentUser) {
                await updatePassword(auth.currentUser, newPassword);
                alert("Senha atualizada com sucesso!");
                setNewPassword('');
            }
        } catch (e) { alert("Erro ao atualizar senha: " + e.message); }
    };

    const exportData = (type) => { alert(`Simulação: Exportando ${type} para CSV...`); };

    const updateClientStatus = async (clientId, newStatus) => {
        await updateDoc(doc(db, 'clients', clientId), { status: newStatus });
        loadData(user.uid);
        playSuccessSound();
    };

    const generatePublicLink = (propId) => {
        const url = `${window.location.origin}?public=true&id=${propId}`;
        navigator.clipboard.writeText(url);
        alert("Link copiado! " + url);
    };

    const analyzeLead = (client) => {
        const text = (client.observations || "").toLowerCase();
        const status = client.status || "LEAD";
        let score = 0;
        
        // Critérios de Pontuação
        if (status === "PROPOSTA") score += 50;
        if (status === "AGENDADO") score += 30;
        if (text.includes("urgente") || text.includes("comprar") || text.includes("dinheiro")) score += 20;
        if (client.phones && client.phones.length > 0) score += 10;
        
        if (score >= 50) return { label: "QUENTE", color: "text-red-500", icon: "🔥", glow: "border-red-200 bg-red-50/20" };
        if (score >= 20) return { label: "MORNO", color: "text-orange-400", icon: "⚡", glow: "" };
        return { label: "FRIO", color: "text-blue-400", icon: "❄️", glow: "" };
    };

    const sendWp = (num, msg) => {
        const clean = num ? num.replace(/\D/g, '') : '';
        if (clean) window.open(`https://wa.me/55${clean}?text=${encodeURIComponent(msg)}`, '_blank');
    };

    const sendMaterial = (client) => {
        const prop = properties.find(p => p.title === client.propertyInterest);
        const pdfLink = prop?.pdf || "Link indisponível no momento";
        sendWp(client.phones?.[0], `Olá ${client.fullName}! Aqui é o ${settings.userName}. Segue o material do ${client.propertyInterest}: ${pdfLink}`);
    };

    const handleBulkSend = () => {
        if (selectedClients.length === 0) return alert('Selecione pelo menos um cliente!');
        if (!bulkMessage) return alert('Digite a mensagem para envio!');
        selectedClients.forEach(num => sendWp(num, bulkMessage));
    };

    const resetForm = () => {
        setName(''); setPhone(''); setPropertyInterest(''); setBirthDate(''); setObservations('');
        setPropPrice(''); setPropImg(''); setPropAddress(''); setPropLink(''); setPropPdf('');
        setAgendaTitle(''); setAgendaTime(''); setEditingId(null); setShowForm(false);
    };

    const formatCurrency = (value) => {
        const clean = value.replace(/\D/g, "");
        return clean ? "R$ " + new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2 }).format(parseFloat(clean) / 100) : "";
    };

    // Cálculos para Dashboard
    const totalVGV = properties.reduce((acc, curr) => acc + (parseFloat(curr.price.replace(/\D/g, '')) / 100 || 0), 0);
    const hotLeadsCount = clients.filter(c => analyzeLead(c).label === "QUENTE").length;
    const todayStr = new Date().toISOString().split('T')[0];
    const todaysAgenda = agenda.filter(a => a.date === todayStr);

    const generateCalendarDays = () => {
        const year = currentMonth.getFullYear();
        const month = currentMonth.getMonth();
        const firstDay = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const days = [];
        for (let i = 0; i < firstDay; i++) days.push(null);
        for (let i = 1; i <= daysInMonth; i++) days.push(i);
        return days;
    };

    useEffect(() => {
        const unsub = onAuthStateChanged(auth, (u) => {
            if (u) { setUser(u); loadData(u.uid); setSettings(s => ({...s, userEmail: u.email})); }
            else setUser(null);
            setLoading(false);
        });
        return () => unsub();
    }, []);

    // RENDERIZAÇÃO PÚBLICA
    if (isPublic && publicId) return <PublicPropertyView propertyId={publicId} />;

    // FILTRAGEM DE CLIENTES
    const filteredClients = clients.filter(c => {
        const match = (c.fullName || "").toLowerCase().includes(searchTerm.toLowerCase()) || (c.propertyInterest || "").toLowerCase().includes(searchTerm.toLowerCase());
        return match && (statusFilter === 'TODOS' || c.status === statusFilter);
    });

    if (loading) return <div className="h-screen flex items-center justify-center font-black text-slate-400 bg-slate-50 text-3xl animate-pulse italic">ALEXANDRE CRM...</div>;
    if (!user) return <Login onLogin={setUser} />;

    return (
        <div className="min-h-screen bg-[#f3f4f6] flex font-sans text-slate-900 overflow-x-hidden">
            <TailwindStyle />
            
            {/* --- SIDEBAR --- */}
            <aside className="w-20 lg:w-72 border-r border-slate-200 flex flex-col sticky top-0 h-screen z-50 transition-colors duration-500" 
                   style={{ backgroundColor: theme.sidebarBg }}>
                <div className="p-8 mb-6">
                    <h1 className="text-2xl font-black italic hidden lg:block uppercase tracking-tighter" style={{ color: theme.sidebarText }}>
                        {settings.userName} <span className="opacity-50">CRM</span>
                    </h1>
                </div>
                <nav className="flex-1 px-4 space-y-3">
                    {[
                        { id: 'dashboard', label: 'Dashboard', icon: '📊' },
                        { id: 'pipeline', label: 'Funil Vendas', icon: '🌪️' },
                        { id: 'clients', label: 'Clientes', icon: '👥' },
                        { id: 'properties', label: 'Imóveis', icon: '🏠' },
                        { id: 'agenda', label: 'Agenda', icon: '📅' },
                        { id: 'whatsapp', label: 'WhatsApp', icon: '💬' },
                        { id: 'relatorios', label: 'Relatórios', icon: '📄' },
                        { id: 'settings', label: 'Configuração', icon: '⚙️' }
                    ].map(item => {
                        const isActive = activeTab === item.id;
                        return (
                            <button key={item.id} onClick={() => setActiveTab(item.id)} className={`w-full flex items-center lg:gap-4 p-5 rounded-[2rem] font-black text-sm transition-all uppercase tracking-widest ${isActive ? 'text-white shadow-xl' : 'hover:bg-black/5'}`} style={{ backgroundColor: isActive ? theme.primary : 'transparent', color: isActive ? '#fff' : (settings.themeColor === 'mint-dark' ? '#aaa' : '#94a3b8') }}>
                                <span className="text-2xl">{item.icon}</span> <span className="hidden lg:block">{item.label}</span>
                            </button>
                        );
                    })}
                </nav>
                <div className="p-6 border-t border-white/10">
                    <button onClick={() => signOut(auth)} className="w-full p-4 text-red-500 font-black text-xs uppercase hover:bg-red-50 rounded-2xl transition">Sair</button>
                </div>
            </aside>

            {/* --- ÁREA PRINCIPAL --- */}
            <main className="flex-1 p-10 overflow-y-auto">
                <header className="mb-8 flex justify-between items-center bg-white p-6 rounded-3xl border border-white shadow-sm transition-colors duration-500">
                    <h2 className="text-3xl font-black uppercase italic tracking-tighter" style={{ color: theme.primary }}>
                        {activeTab === 'settings' ? 'Configurações' : activeTab === 'relatorios' ? 'Relatórios' : activeTab}
                    </h2>
                    <div className="flex gap-4 items-center">
                        {activeTab !== 'settings' && <input type="text" placeholder="Pesquisar..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="p-4 bg-slate-100 rounded-2xl font-bold text-lg w-64 lg:w-96 outline-none focus:ring-4 transition-all" style={{ '--tw-ring-color': theme.bgLight }} />}
                        {settings.photo && <img src={settings.photo} className="w-12 h-12 rounded-full object-cover border-2 border-white shadow-md" alt="Perfil" />}
                    </div>
                </header>

                <div className="animate-fadeIn">
                    
                    {/* --- DASHBOARD FUTURISTA --- */}
                    {activeTab === 'dashboard' && (
                        <div className="space-y-10 animate-slideUp">
                            <div className="relative rounded-[4rem] p-12 overflow-hidden shadow-2xl transition-colors duration-500" style={{ background: `linear-gradient(135deg, ${theme.primary} 0%, ${theme.secondary} 100%)` }}>
                                <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-10 rounded-full -mr-20 -mt-20 blur-3xl"></div>
                                <div className="relative z-10 text-white">
                                    <h3 className="text-5xl font-black italic mb-2 uppercase tracking-tighter">Fala, {settings.userName}!</h3>
                                    <p className="text-xl opacity-90 font-bold uppercase tracking-widest italic mb-8">O mercado está aquecido hoje.</p>
                                    <div className="flex gap-4 flex-wrap">
                                        <div className="glass-dark p-6 rounded-3xl flex items-center gap-4 min-w-[200px]">
                                            <span className="text-4xl">💰</span>
                                            <div><p className="text-[10px] uppercase font-bold opacity-70">VGV Total (Carteira)</p><p className="text-xl font-black">{totalVGV.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })}</p></div>
                                        </div>
                                        <div className="glass-dark p-6 rounded-3xl flex items-center gap-4 min-w-[200px]">
                                            <span className="text-4xl">🔥</span>
                                            <div><p className="text-[10px] uppercase font-bold opacity-70">Leads Quentes</p><p className="text-xl font-black">{hotLeadsCount} Oportunidades</p></div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                                <div className="lg:col-span-2 bg-white p-10 rounded-[3.5rem] shadow-premium border border-slate-100">
                                    <div className="flex justify-between items-center mb-8"><h4 className="text-xl font-black uppercase italic text-slate-700">Funil em Tempo Real</h4><button onClick={() => setActiveTab('pipeline')} className="text-xs font-bold uppercase text-blue-500 hover:underline">Ver Detalhes</button></div>
                                    <div className="space-y-6">
                                        {[{ label: 'Novos Leads', count: clients.filter(c => c.status === 'LEAD').length, total: clients.length, color: 'bg-blue-500' }, { label: 'Visitas Agendadas', count: clients.filter(c => c.status === 'AGENDADO').length, total: clients.length, color: 'bg-yellow-400' }, { label: 'Propostas na Mesa', count: clients.filter(c => c.status === 'PROPOSTA').length, total: clients.length, color: 'bg-purple-500' }, { label: 'Negócios Fechados', count: clients.filter(c => c.status === 'FECHADO').length, total: clients.length, color: 'bg-green-500' }].map((item, idx) => (
                                            <div key={idx}><div className="flex justify-between text-xs font-bold uppercase mb-2 text-slate-500"><span>{item.label}</span><span>{item.count} Clientes</span></div><div className="h-4 bg-slate-100 rounded-full overflow-hidden"><div className={`h-full ${item.color} transition-all duration-1000`} style={{ width: `${(item.count / (item.total || 1)) * 100}%` }}></div></div></div>
                                        ))}
                                    </div>
                                </div>
                                <div className="bg-white p-10 rounded-[3.5rem] shadow-premium border border-slate-100">
                                    <h4 className="text-xl font-black uppercase italic text-slate-700 mb-8">Agenda Hoje</h4>
                                    <div className="space-y-4">
                                        {todaysAgenda.length === 0 ? (<div className="text-center py-10 opacity-40 font-bold uppercase text-sm">Livre por hoje 🏖️</div>) : (todaysAgenda.map(task => (<div key={task.id} className="p-5 bg-slate-50 rounded-3xl border border-slate-100 flex gap-4 items-center"><div className={`w-2 h-10 rounded-full ${task.type === 'Evento' ? 'bg-blue-500' : 'bg-green-500'}`}></div><div><p className="font-black text-sm uppercase text-slate-800">{task.time} - {task.title}</p><p className="text-[10px] font-bold text-slate-400 uppercase truncate w-32">{task.observations}</p></div></div>)))}
                                        <button onClick={() => setActiveTab('agenda')} className="w-full py-4 mt-4 bg-slate-100 rounded-2xl text-xs font-black uppercase text-slate-400 hover:bg-slate-200 transition">Ver Agenda Completa</button>
                                    </div>
                                </div>
                            </div>
                            <div className="bg-white p-8 rounded-[3rem] shadow-premium border border-slate-100">
                                <h4 className="text-lg font-black uppercase italic text-slate-700 mb-6 ml-4">Radar de Novos Clientes</h4>
                                <div className="flex gap-6 overflow-x-auto pb-4 scrollbar-hide">
                                    {clients.slice(0, 5).map(c => {
                                        const analysis = analyzeLead(c);
                                        return (
                                            <div key={c.id} className="min-w-[220px] p-6 rounded-[2rem] bg-slate-50 border border-slate-100 flex flex-col gap-2 hover:shadow-lg transition">
                                                <div className="flex justify-between items-center"><span className="font-black text-xs uppercase truncate w-24">{c.fullName}</span><span className="text-lg">{analysis.icon}</span></div>
                                                <p className="text-[10px] font-bold text-slate-400 uppercase">{c.propertyInterest || 'Sem interesse definido'}</p>
                                                <div className={`text-[9px] font-black uppercase px-2 py-1 rounded-lg w-max ${analysis.color} bg-white`}>{analysis.label}</div>
                                            </div>
                                        )
                                    })}
                                    <button onClick={() => setActiveTab('clients')} className="min-w-[100px] flex items-center justify-center font-black text-xs uppercase text-slate-400 hover:text-blue-500">Ver Todos →</button>
                                </div>
                            </div>
                        </div>
                    )}
                    
                    {/* --- FUNIL DE VENDAS (KANBAN) --- */}
                    {activeTab === 'pipeline' && (
                         <div className="flex gap-8 overflow-x-auto pb-8 scrollbar-hide">
                            {[{ id: 'LEAD', label: 'Novos', c: '#3b82f6' }, { id: 'AGENDADO', label: 'Visitas', c: '#eab308' }, { id: 'PROPOSTA', label: 'Propostas', c: '#a855f7' }, { id: 'FECHADO', label: 'Fechados', c: '#22c55e' }].map(col => (
                                <div key={col.id} className="kanban-col bg-white p-6 rounded-[2.5rem] shadow-premium border-t-8 flex flex-col h-[70vh] min-w-[350px]" style={{ borderColor: col.c }}>
                                    <h3 className="text-xl font-black uppercase italic mb-6 text-slate-700">{col.label} <span className="text-slate-300 ml-2">{clients.filter(c => c.status === col.id).length}</span></h3>
                                    <div className="flex-1 overflow-y-auto space-y-4 pr-2">
                                        {clients.filter(c => c.status === col.id).map(c => (
                                            <div key={c.id} className="bg-slate-50 p-5 rounded-3xl border border-slate-100 hover:shadow-lg transition group">
                                                <p className="font-black uppercase text-sm mb-1" style={{ color: theme.primary }}>{c.fullName}</p>
                                                <div className="flex justify-between items-center gap-2 mt-4">
                                                    {col.id !== 'LEAD' && <button onClick={() => updateClientStatus(c.id, col.id === 'AGENDADO' ? 'LEAD' : col.id === 'PROPOSTA' ? 'AGENDADO' : 'PROPOSTA')} className="p-2 bg-slate-200 rounded-lg text-[10px] font-bold">◀</button>}
                                                    {col.id !== 'FECHADO' && <button onClick={() => updateClientStatus(c.id, col.id === 'LEAD' ? 'AGENDADO' : col.id === 'AGENDADO' ? 'PROPOSTA' : 'FECHADO')} className="flex-1 py-2 text-white rounded-lg text-[10px] font-bold uppercase transition" style={{ backgroundColor: theme.primary }}>Avançar ▶</button>}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* --- IMÓVEIS --- */}
                    {activeTab === 'properties' && (
                        <div className="space-y-12">
                            <div className="flex justify-end"><button onClick={() => setShowForm(true)} className="text-white px-10 py-5 rounded-[2rem] font-black text-xs uppercase tracking-widest shadow-2xl hover:scale-105 transition" style={{ backgroundColor: theme.primary }}>+ Novo Imóvel</button></div>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
                                {properties.map(p => (
                                    <div key={p.id} className="bg-white rounded-[4rem] shadow-premium overflow-hidden border border-slate-100 flex flex-col hover:shadow-2xl transition duration-500 relative">
                                        <button onClick={() => {setEditingId(p.id); setName(p.title); setPropPrice(p.price); setPropImg(p.image); setPropLink(p.link); setPropPdf(p.pdf); setPropAddress(p.address); setShowForm(true);}} className="absolute top-6 left-6 z-10 p-3 bg-white/90 backdrop-blur rounded-full text-slate-400 hover:text-blue-600 shadow-lg">✏️</button>
                                        <div className="h-80 relative bg-slate-100">{p.image ? <img src={p.image.split(',')[0]} className="w-full h-full object-cover" alt="imóvel" /> : <div className="h-full flex items-center justify-center font-black text-slate-200 text-5xl italic">Lopes</div>}</div>
                                        <div className="p-10 flex-1 flex flex-col">
                                            <h4 className="font-black text-3xl uppercase mb-3 italic leading-none tracking-tighter" style={{ color: theme.primary }}>{p.title}</h4>
                                            <p className="text-slate-600 font-black text-4xl mb-6 italic tracking-tighter leading-none">{p.price}</p>
                                            <div className="mt-auto grid grid-cols-2 gap-4">
                                                <button onClick={() => generatePublicLink(p.id)} className="col-span-2 bg-yellow-400 text-yellow-900 text-center py-5 rounded-3xl font-black text-[10px] uppercase tracking-widest shadow-xl hover:bg-yellow-500 transition">🔗 Copiar Link Público</button>
                                                <button onClick={() => deleteDoc(doc(db, 'properties', p.id)).then(() => loadData(user.uid))} className="col-span-2 text-xs font-black text-slate-300 hover:text-red-500 uppercase tracking-widest text-center mt-2 transition">Excluir</button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* --- CLIENTES (CORRIGIDO) --- */}
                    {activeTab === 'clients' && (
                        <div className="space-y-10">
                            <div className="flex justify-between items-center flex-wrap gap-4">
                                <div className="flex gap-2 bg-white p-2 rounded-full shadow-sm overflow-x-auto">{['TODOS', 'LEAD', 'AGENDADO', 'PROPOSTA', 'FECHADO'].map(f => (<button key={f} onClick={() => setStatusFilter(f)} className={`px-5 py-3 rounded-full text-xs font-black transition-all ${statusFilter === f ? 'text-white shadow-lg' : 'text-slate-400'}`} style={{ backgroundColor: statusFilter === f ? theme.primary : 'transparent' }}>{f}</button>))}</div>
                                <button onClick={() => setShowForm(true)} className="text-white px-8 py-4 rounded-[2rem] font-black text-xs uppercase tracking-widest shadow-xl hover:scale-105 transition" style={{ backgroundColor: theme.primary }}>+ Novo Cliente</button>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
                                {filteredClients.map(c => {
                                    const ai = analyzeLead(c);
                                    return (
                                        <div key={c.id} className={`bg-white rounded-[3rem] shadow-premium p-10 border border-slate-50 relative hover:shadow-2xl transition duration-500 ${ai.glow}`}>
                                            {/* BOTÃO LÁPIS CORRIGIDO - PREVENÇÃO DE NULL */}
                                            <button onClick={() => {
                                                setEditingId(c.id);
                                                setName(c.fullName || '');
                                                setPhone(c.phones?.[0] || '');
                                                setPropertyInterest(c.propertyInterest || '');
                                                setBirthDate(c.birthDate || '');
                                                setObservations(c.observations || '');
                                                setShowForm(true);
                                            }} className="absolute top-6 left-6 text-slate-300 hover:text-blue-600 text-2xl">✏️</button>
                                            
                                            <div className="flex justify-between items-start mb-6 pt-4">
                                                <h3 className="font-black uppercase text-2xl truncate ml-8 leading-none tracking-tighter" style={{ color: theme.primary }}>{c.fullName}</h3>
                                                <span className={`text-[10px] font-black px-3 py-1.5 rounded-xl uppercase ${ai.color} bg-slate-50 shadow-inner`}>{ai.icon} {ai.label}</span>
                                            </div>
                                            <div className="bg-yellow-50 border-l-8 border-yellow-400 p-4 mb-6 rounded-r-3xl text-xs font-black italic uppercase text-slate-700 tracking-tight shadow-sm">🚩 {c.propertyInterest || 'Geral'}</div>
                                            <div className="grid grid-cols-2 gap-4 mb-6 text-xs font-black uppercase">
                                                <div className="bg-slate-50 p-4 rounded-2xl"><p className="text-blue-800 text-[8px] mb-2 uppercase font-bold">🎂 Nascimento</p>{c.birthDate ? new Date(c.birthDate).toLocaleDateString('pt-BR') : '-'}</div>
                                                <div className="bg-slate-50 p-4 rounded-2xl"><p className="text-green-700 text-[8px] mb-2 uppercase font-bold">📞 WhatsApp</p>{c.phones?.[0]}</div>
                                            </div>
                                            <div className="mb-8 bg-slate-50/50 p-6 rounded-[2.5rem] border border-slate-100 h-36 overflow-y-auto text-sm italic font-bold text-slate-500 leading-relaxed scrollbar-hide shadow-inner">
                                                {c.observations || 'Nenhuma nota.'}
                                            </div>
                                            <div className="flex flex-col gap-3">
                                                <button onClick={() => sendMaterial(c)} className="bg-blue-600 hover:bg-blue-700 text-white font-black py-4 rounded-[2rem] shadow-lg text-xs uppercase tracking-widest transition active:scale-95">Enviar Material</button>
                                                <a href={`https://wa.me/55${c.phones?.[0]?.replace(/\D/g,'')}`} target="_blank" className="bg-green-500 hover:bg-green-600 text-white text-center font-black py-4 rounded-[2rem] shadow-lg text-xs uppercase tracking-widest transition active:scale-95">Zap Direto</a>
                                                <button onClick={() => deleteDoc(doc(db, 'clients', c.id)).then(() => loadData(user.uid))} className="w-full text-xs font-black text-slate-200 hover:text-red-500 uppercase tracking-widest text-center mt-2 transition">Remover Lead</button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* --- AGENDA --- */}
                    {activeTab === 'agenda' && (
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
                            <div className="lg:col-span-5 space-y-8">
                                <div className="bg-white p-10 rounded-[3.5rem] shadow-premium">
                                    <div className="flex justify-between items-center mb-10 text-xl font-black uppercase italic" style={{ color: theme.primary }}>
                                        <button onClick={() => setCurrentMonth(new Date(currentMonth.setMonth(currentMonth.getMonth() - 1)))} className="p-4 bg-slate-50 rounded-full hover:bg-slate-100">◀</button>
                                        <span>{currentMonth.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}</span>
                                        <button onClick={() => setCurrentMonth(new Date(currentMonth.setMonth(currentMonth.getMonth() + 1)))} className="p-4 bg-slate-50 rounded-full hover:bg-slate-100">▶</button>
                                    </div>
                                    <div className="calendar-grid mb-6 text-xs font-black text-slate-300 uppercase text-center">{['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(d => <div key={d}>{d}</div>)}</div>
                                    <div className="calendar-grid">
                                        {generateCalendarDays().map((day, idx) => {
                                            if (!day) return <div key={idx}></div>;
                                            const dateStr = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                                            const hasEvents = agenda.some(a => a.date === dateStr);
                                            return (
                                                <div key={idx} onClick={() => setSelectedDate(dateStr)} className={`calendar-day ${selectedDate === dateStr ? 'text-white shadow-lg' : ''}`} style={{ backgroundColor: selectedDate === dateStr ? theme.primary : 'transparent' }}>
                                                    {day}
                                                    {hasEvents && <div className={`w-1.5 h-1.5 rounded-full mt-1 ${selectedDate === dateStr ? 'bg-white' : 'bg-blue-500'}`}></div>}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                                <button onClick={() => setShowForm(true)} className="w-full text-white py-6 rounded-[2.5rem] font-black text-xs uppercase tracking-widest shadow-2xl transition hover:scale-105" style={{ backgroundColor: theme.primary }}>+ Novo Compromisso</button>
                            </div>
                            <div className="lg:col-span-7 bg-white p-12 rounded-[4rem] shadow-premium min-h-[600px]">
                                <h3 className="text-3xl font-black uppercase italic mb-10 border-b border-slate-100 pb-8 flex justify-between items-center" style={{ color: theme.primary }}>
                                    {new Date(selectedDate + 'T00:00:00').toLocaleDateString('pt-BR')}
                                    <span className="text-xs not-italic text-slate-400 uppercase font-black">{agenda.filter(a => a.date === selectedDate).length} Atividades</span>
                                </h3>
                                <div className="space-y-8">
                                    {agenda.filter(a => a.date === selectedDate).map(item => (
                                        <div key={item.id} className="group bg-slate-50 p-10 rounded-[3rem] border border-slate-100 flex items-center gap-10 hover:shadow-2xl transition-all duration-300">
                                            <div className={`w-3 h-20 rounded-full ${item.type === 'Evento' ? 'bg-blue-500' : 'bg-green-500'}`}></div>
                                            <div className="flex-1">
                                                <h4 className="font-black uppercase text-3xl tracking-tighter leading-none mb-2" style={{ color: theme.primary }}>{item.title}</h4>
                                                <p className="text-sm font-black text-slate-500 uppercase tracking-wide">🕒 {item.time || 'Sem hora'} | 📍 {item.observations}</p>
                                            </div>
                                            <button onClick={() => deleteDoc(doc(db, 'agenda', item.id)).then(() => loadData(user.uid))} className="opacity-0 group-hover:opacity-100 text-red-300 hover:text-red-500 font-bold uppercase text-[9px] transition">Excluir</button>
                                        </div>
                                    ))}
                                    {agenda.filter(a => a.date === selectedDate).length === 0 && <div className="text-center py-20 text-slate-200 font-black italic uppercase text-2xl opacity-20">Nenhum registro</div>}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* --- WHATSAPP (COMPLETO) --- */}
                    {activeTab === 'whatsapp' && (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                            <div className="space-y-8">
                                <div className="bg-white p-10 rounded-[3rem] shadow-premium border border-slate-100">
                                    <h3 className="text-2xl font-black uppercase italic mb-8" style={{ color: theme.primary }}>Envio Individual</h3>
                                    <div className="space-y-6">
                                        <input type="text" placeholder="DDD + Número" value={wpNumber} onChange={e => setWpNumber(e.target.value)} className="w-full p-6 bg-slate-50 rounded-3xl font-bold border-none" />
                                        <textarea placeholder="Mensagem..." value={wpMessage} onChange={e => setWpMessage(e.target.value)} className="w-full p-6 bg-slate-50 rounded-3xl font-bold h-40 border-none shadow-inner text-lg" />
                                        <button onClick={() => sendWp(wpNumber, wpMessage)} className="w-full bg-green-500 text-white py-6 rounded-[2.5rem] font-black uppercase tracking-widest shadow-xl hover:bg-green-600 transition">🚀 Enviar</button>
                                    </div>
                                </div>
                                <div className="space-y-6">
                                    <h3 className="text-2xl font-black uppercase italic mb-4" style={{ color: theme.primary }}>Mensagens Rápidas</h3>
                                    {templates.map((tpl, idx) => (
                                        <div key={idx} className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 hover:shadow-lg transition group">
                                            <div className="flex justify-between items-center mb-4">
                                                <h4 className="font-black text-slate-700 uppercase text-sm">{tpl.title}</h4>
                                                <div className="flex gap-2">
                                                    <button onClick={() => {setWpMessage(tpl.text); setBulkMessage(tpl.text);}} className="p-3 bg-yellow-100 text-yellow-600 rounded-xl hover:bg-yellow-200 transition" title="Copiar">📋</button>
                                                    <button onClick={() => sendWp(wpNumber, tpl.text)} className="p-3 bg-green-500 text-white rounded-xl hover:bg-green-600 transition" title="Enviar">➤</button>
                                                </div>
                                            </div>
                                            <p className="text-sm text-slate-500 italic border-l-4 border-slate-200 pl-4">{tpl.text}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <div className="space-y-8">
                                <div className="bg-white p-10 rounded-[3rem] shadow-premium border border-slate-100">
                                    <h3 className="text-2xl font-black uppercase italic mb-8" style={{ color: theme.primary }}>Envio em Massa ({selectedClients.length})</h3>
                                    <div className="max-h-60 overflow-y-auto space-y-3 mb-6 p-4 bg-slate-50 rounded-3xl">
                                        {clients.map(c => (
                                            <label key={c.id} className="flex items-center gap-4 p-4 bg-white rounded-2xl cursor-pointer hover:bg-blue-50 transition">
                                                <input type="checkbox" className="w-6 h-6" onChange={(e) => { const num = c.phones?.[0]; if(e.target.checked) setSelectedClients([...selectedClients, num]); else setSelectedClients(selectedClients.filter(n => n !== num)); }} />
                                                <div className="text-sm font-bold uppercase">{c.fullName}</div>
                                            </label>
                                        ))}
                                    </div>
                                    <textarea placeholder="Mensagem para todos..." value={bulkMessage} onChange={e => setBulkMessage(e.target.value)} className="w-full p-6 bg-yellow-300 rounded-3xl font-black text-slate-900 h-32 border-none shadow-inner text-lg mb-4" />
                                    <button onClick={handleBulkSend} className="w-full text-white py-6 rounded-[2.5rem] font-black uppercase tracking-widest shadow-xl hover:opacity-90 transition" style={{ backgroundColor: theme.primary }}>📤 Disparar</button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* --- RELATÓRIOS --- */}
                    {activeTab === 'relatorios' && (
                        <div className="space-y-12 animate-fadeIn">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                                <div className="bg-white p-10 rounded-[3rem] shadow-premium">
                                    <p className="text-slate-400 text-xs font-black uppercase mb-4 tracking-widest">Conversão de Vendas</p>
                                    <p className="text-6xl font-black" style={{ color: theme.primary }}>{clients.length > 0 ? ((clients.filter(c => c.status === 'FECHADO').length / clients.length) * 100).toFixed(1) : 0}%</p>
                                </div>
                                <div className="bg-white p-10 rounded-[3rem] shadow-premium">
                                    <p className="text-slate-400 text-xs font-black uppercase mb-4 tracking-widest">Ticket Médio Estimado</p>
                                    <p className="text-6xl font-black text-green-600">R$ 245K</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* --- CONFIGURAÇÕES --- */}
                    {activeTab === 'settings' && (
                        <div className="space-y-8">
                            <div className="flex flex-wrap gap-4 bg-white p-2 rounded-[2rem] shadow-sm w-max">
                                {['perfil', 'seguranca', 'aparencia', 'sistema'].map(tab => (
                                    <button key={tab} onClick={() => setSettingsTab(tab)} className={`px-8 py-3 rounded-[1.5rem] font-black text-xs uppercase tracking-widest transition-all ${settingsTab === tab ? 'bg-yellow-400 text-yellow-900 shadow-md' : 'text-slate-400 hover:bg-slate-50'}`}>{tab}</button>
                                ))}
                            </div>

                            {settingsTab === 'perfil' && (
                                <div className="bg-white p-10 rounded-[3rem] shadow-premium border border-slate-100 animate-fadeIn">
                                    <div className="flex items-center gap-8 mb-10">
                                        <div className="relative group">
                                            <div className="w-32 h-32 rounded-full bg-slate-100 flex items-center justify-center overflow-hidden border-4 border-white shadow-lg">
                                                {settings.photo ? <img src={settings.photo} className="w-full h-full object-cover" alt="Perfil" /> : <span className="text-4xl">👤</span>}
                                            </div>
                                            <label className="absolute bottom-0 right-0 text-white p-3 rounded-full cursor-pointer shadow-lg hover:brightness-110 transition" style={{ backgroundColor: theme.primary }}>📷 <input type="file" className="hidden" accept="image/*" onChange={handlePhotoUpload} /></label>
                                        </div>
                                        <div><h3 className="text-3xl font-black italic" style={{ color: theme.primary }}>{settings.userName} {settings.userSurname}</h3><p className="text-slate-400 font-bold uppercase text-sm">Corretor Imobiliário</p></div>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                        <div><label className="text-xs font-bold uppercase text-slate-400 mb-2 block">Nome</label><input type="text" value={settings.userName} onChange={e => setSettings({...settings, userName: e.target.value})} className="settings-input" /></div>
                                        <div><label className="text-xs font-bold uppercase text-slate-400 mb-2 block">Sobrenome</label><input type="text" value={settings.userSurname} onChange={e => setSettings({...settings, userSurname: e.target.value})} className="settings-input" /></div>
                                        <div><label className="text-xs font-bold uppercase text-slate-400 mb-2 block">Email</label><input type="email" value={settings.userEmail} onChange={e => setSettings({...settings, userEmail: e.target.value})} className="settings-input" /></div>
                                        <div><label className="text-xs font-bold uppercase text-slate-400 mb-2 block">Telefone</label><input type="text" value={settings.userPhone} onChange={e => setSettings({...settings, userPhone: e.target.value})} className="settings-input" /></div>
                                        <div className="md:col-span-2"><label className="text-xs font-bold uppercase text-slate-400 mb-2 block">Endereço Completo</label><input type="text" value={settings.userAddress} onChange={e => setSettings({...settings, userAddress: e.target.value})} className="settings-input" /></div>
                                        <div><label className="text-xs font-bold uppercase text-slate-400 mb-2 block">CRECI</label><input type="text" value={settings.creci} onChange={e => setSettings({...settings, creci: e.target.value})} className="settings-input" /></div>
                                    </div>
                                    <div className="mt-8 flex justify-end"><button onClick={() => alert('Perfil Salvo!')} className="text-white px-10 py-4 rounded-[2rem] font-black uppercase tracking-widest shadow-xl hover:scale-105 transition" style={{ backgroundColor: theme.primary }}>Salvar Alterações</button></div>
                                </div>
                            )}

                            {settingsTab === 'seguranca' && (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-fadeIn">
                                    <div className="bg-white p-10 rounded-[3rem] shadow-premium border border-slate-100">
                                        <h3 className="text-xl font-black uppercase italic mb-6" style={{ color: theme.primary }}>Trocar Senha</h3>
                                        <div className="space-y-4">
                                            <input type="password" placeholder="Nova Senha" value={newPassword} onChange={e => setNewPassword(e.target.value)} className="settings-input" />
                                            <button onClick={handleUpdatePassword} className="w-full bg-slate-900 text-white py-4 rounded-xl font-black uppercase text-xs shadow-lg hover:bg-black transition">Atualizar Senha</button>
                                        </div>
                                    </div>
                                    <div className="bg-white p-10 rounded-[3rem] shadow-premium border border-slate-100">
                                        <h3 className="text-xl font-black uppercase italic mb-6" style={{ color: theme.primary }}>Backup de Dados</h3>
                                        <div className="flex flex-col gap-4">
                                            <button onClick={() => exportData('clients')} className="bg-green-100 text-green-700 py-4 rounded-xl font-black uppercase text-xs hover:bg-green-200 transition">📥 Baixar Clientes</button>
                                            <button onClick={() => exportData('properties')} className="bg-blue-100 text-blue-700 py-4 rounded-xl font-black uppercase text-xs hover:bg-blue-200 transition">📥 Baixar Imóveis</button>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {settingsTab === 'aparencia' && (
                                <div className="bg-white p-10 rounded-[3rem] shadow-premium border border-slate-100 animate-fadeIn">
                                    <h3 className="text-xl font-black uppercase italic mb-8" style={{ color: theme.primary }}>Temas do Sistema</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                        {Object.entries(THEMES).map(([key, t]) => (
                                            <button key={key} onClick={() => setSettings({...settings, themeColor: key})} className={`relative p-6 rounded-2xl border-2 transition-all duration-300 flex flex-col items-center justify-center gap-3 group ${settings.themeColor === key ? 'bg-slate-50 ring-2 ring-offset-2 ring-slate-200' : 'bg-white border-slate-100 hover:border-slate-300'}`} style={{ borderColor: settings.themeColor === key ? t.primary : '' }}>
                                                <span className="text-4xl">{t.icon}</span>
                                                <div className="text-center"><p className="font-black text-slate-700 uppercase text-xs">{t.name}</p></div>
                                                <div className="flex gap-1 mt-2"><div className="w-4 h-4 rounded-full" style={{ background: t.primary }}></div><div className="w-4 h-4 rounded-full" style={{ background: t.sidebarBg, border: '1px solid #ddd' }}></div></div>
                                            </button>
                                        ))}
                                    </div>
                                    <div className="mt-8 p-6 bg-slate-50 rounded-2xl flex items-center justify-between">
                                        <div><h4 className="font-bold text-slate-700 uppercase">Sons de Efeito</h4><p className="text-xs text-slate-400 font-bold">Feedback sonoro ao salvar</p></div>
                                        <div className="relative inline-block w-14 align-middle select-none"><input type="checkbox" checked={settings.soundEnabled} onChange={() => setSettings({...settings, soundEnabled: !settings.soundEnabled})} className="toggle-checkbox absolute block w-8 h-8 rounded-full bg-white border-4 appearance-none cursor-pointer border-slate-200"/><label className={`toggle-label block overflow-hidden h-8 rounded-full cursor-pointer ${settings.soundEnabled ? 'bg-green-400' : 'bg-slate-300'}`}></label></div>
                                    </div>
                                </div>
                            )}

                            {settingsTab === 'sistema' && (
                                <div className="bg-white p-10 rounded-[3rem] shadow-premium border border-slate-100 animate-fadeIn">
                                    <h3 className="text-xl font-black uppercase italic mb-8" style={{ color: theme.primary }}>Preferências</h3>
                                    <div className="space-y-4">
                                        {['Notificações por Email', 'Alerta de Novos Leads', 'Lembretes de Agenda'].map((l, i) => (
                                            <div key={i} className="flex justify-between items-center p-4 bg-slate-50 rounded-xl">
                                                <span className="font-bold text-slate-600 uppercase text-sm">{l}</span>
                                                <div className="w-10 h-5 bg-green-400 rounded-full relative"><div className="w-5 h-5 bg-white rounded-full absolute right-0"></div></div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* MODAL UNIVERSAL COM CORREÇÃO DE SALVAMENTO */}
                {showForm && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-8 bg-slate-900/60 backdrop-blur-md">
                        <div className="glass w-full max-w-2xl p-14 rounded-[4rem] shadow-2xl border-2 border-white/50">
                            <h2 className="text-4xl font-black mb-12 uppercase italic tracking-tighter text-center leading-none" style={{ color: theme.primary }}>{activeTab === 'clients' ? 'Novo Cliente' : 'Novo Registro'}</h2>
                            <div className="space-y-6 max-h-[60vh] overflow-y-auto px-2 scrollbar-hide">
                                <input type="text" placeholder={activeTab === 'agenda' ? "Título do Compromisso" : "Nome / Título"} value={activeTab === 'agenda' ? agendaTitle : name} onChange={e => activeTab === 'agenda' ? setAgendaTitle(e.target.value) : setName(e.target.value)} className="w-full p-6 bg-white rounded-3xl font-black text-xl border-none shadow-inner" />
                                
                                {activeTab === 'clients' && (
                                    <>
                                        <input type="text" placeholder="WhatsApp (219...)" value={phone} onChange={e => setPhone(e.target.value)} className="w-full p-6 bg-white rounded-3xl font-black text-xl border-none shadow-inner" />
                                        <input type="date" value={birthDate} onChange={e => setBirthDate(e.target.value)} className="w-full p-6 bg-white rounded-3xl font-black text-xl border-none shadow-inner uppercase" />
                                        <select value={propertyInterest} onChange={e => setPropertyInterest(e.target.value)} className="w-full p-6 bg-yellow-50 rounded-3xl font-black text-xl border-none shadow-sm outline-none"><option value="">Interesse em...</option>{properties.map(p => <option key={p.id} value={p.title}>{p.title}</option>)}</select>
                                    </>
                                )}

                                {activeTab === 'properties' && (
                                    <>
                                        <input type="text" placeholder="Valor (R$)" value={propPrice} onChange={e => setPropPrice(formatCurrency(e.target.value))} className="w-full p-6 bg-green-50 rounded-3xl font-black text-xl text-green-700 border-none shadow-inner" />
                                        <input type="text" placeholder="URL da Foto" value={propImg} onChange={e => setPropImg(e.target.value)} className="w-full p-6 bg-white rounded-3xl font-bold italic border-none shadow-inner text-sm" />
                                        <input type="text" placeholder="Endereço" value={propAddress} onChange={e => setPropAddress(e.target.value)} className="w-full p-6 bg-white rounded-3xl font-bold border-none shadow-inner text-lg" />
                                        <input type="text" placeholder="Link Site" value={propLink} onChange={e => setPropLink(e.target.value)} className="w-full p-6 bg-blue-50 rounded-3xl font-bold border-none shadow-inner text-sm" />
                                        <input type="text" placeholder="Link PDF" value={propPdf} onChange={e => setPropPdf(e.target.value)} className="w-full p-6 bg-red-50 rounded-3xl font-bold border-none shadow-inner text-sm" />
                                    </>
                                )}

                                {activeTab === 'agenda' && (
                                    <div className="grid grid-cols-2 gap-6">
                                        <input type="time" value={agendaTime} onChange={e => setAgendaTime(e.target.value)} className="w-full p-6 bg-white rounded-3xl font-black text-xl border-none" />
                                        <select value={agendaType} onChange={e => setAgendaType(e.target.value)} className="w-full p-6 bg-slate-100 rounded-3xl font-black text-xl border-none"><option value="Tarefa">Tarefa</option><option value="Evento">Evento</option></select>
                                    </div>
                                )}

                                <textarea placeholder="Observações / Detalhes..." value={observations} onChange={e => setObservations(e.target.value)} className="w-full p-6 bg-white rounded-3xl font-bold h-40 border-none shadow-inner text-xl" />
                            </div>
                            <div className="flex gap-6 pt-10">
                                <button onClick={() => {
                                    playSuccessSound();
                                    
                                    // --- LÓGICA DE SALVAMENTO CORRIGIDA (EVITA APAGAR DADOS) ---
                                    if(activeTab === 'clients') {
                                        // Garante que não enviamos undefined
                                        const cleanData = {
                                            fullName: name || 'Sem Nome',
                                            phones: [phone || ''],
                                            birthDate: birthDate || '',
                                            propertyInterest: propertyInterest || '',
                                            observations: observations || ''
                                        };
                                        if(editingId) {
                                            updateDoc(doc(db, 'clients', editingId), cleanData).then(() => {resetForm(); loadData(user.uid);});
                                        } else {
                                            addDoc(collection(db, 'clients'), { ...cleanData, status: "LEAD", assignedAgent: user.uid, createdAt: new Date() }).then(() => {resetForm(); loadData(user.uid);});
                                        }
                                    } 
                                    else if(activeTab === 'properties') {
                                        const cleanProp = { title: name || '', price: propPrice || '', image: propImg || '', link: propLink || '', pdf: propPdf || '', address: propAddress || '' };
                                        if(editingId) updateDoc(doc(db, 'properties', editingId), cleanProp).then(() => {resetForm(); loadData(user.uid);});
                                        else addDoc(collection(db, 'properties'), { ...cleanProp, userId: user.uid, createdAt: new Date() }).then(() => {resetForm(); loadData(user.uid);});
                                    } 
                                    else {
                                        const cleanAgenda = { title: agendaTitle || '', date: selectedDate, time: agendaTime || '', type: agendaType, observations: observations || '' };
                                        addDoc(collection(db, 'agenda'), { ...cleanAgenda, userId: user.uid, createdAt: new Date() }).then(() => {resetForm(); loadData(user.uid);});
                                    }
                                }} className="flex-1 text-white font-black py-7 rounded-[3rem] shadow-2xl uppercase tracking-widest text-2xl transition hover:scale-105 active:scale-95" style={{ backgroundColor: theme.primary }}>Salvar</button>
                                <button onClick={resetForm} className="flex-1 bg-slate-100 text-slate-400 font-black py-7 rounded-[3rem] uppercase tracking-widest text-2xl transition hover:bg-slate-200">Cancelar</button>
                            </div>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}

export default App;
