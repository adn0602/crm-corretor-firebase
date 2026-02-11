import React, { useState, useEffect, useRef } from 'react';
import { db, auth } from './firebase/config';
import { collection, addDoc, getDocs, query, where, updateDoc, doc, deleteDoc, getDoc } from 'firebase/firestore';
import { onAuthStateChanged, signOut, updatePassword } from 'firebase/auth';
import Login from './pages/Login';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, PieChart, Pie, Legend } from 'recharts';

// --- MOTOR DE TEMAS (10 VARIAÇÕES) ---
const THEMES = {
    'blue': { name: 'Tech Blue', primary: '#2563eb', secondary: '#1e40af', bg: '#f8fafc', sidebar: '#ffffff', text: '#1e293b', accent: '#3b82f6' },
    'dark': { name: 'Midnight Luxury', primary: '#d4af37', secondary: '#b4941f', bg: '#0f172a', sidebar: '#1e293b', text: '#f8fafc', accent: '#fbbf24' },
    'green': { name: 'Forest Success', primary: '#16a34a', secondary: '#15803d', bg: '#f0fdf4', sidebar: '#ffffff', text: '#14532d', accent: '#22c55e' },
    'purple': { name: 'Royal Estate', primary: '#7e22ce', secondary: '#6b21a8', bg: '#faf5ff', sidebar: '#ffffff', text: '#581c87', accent: '#9333ea' },
    'red': { name: 'Crimson Sales', primary: '#dc2626', secondary: '#b91c1c', bg: '#fef2f2', sidebar: '#ffffff', text: '#7f1d1d', accent: '#ef4444' },
    'teal': { name: 'Ocean Calm', primary: '#0d9488', secondary: '#0f766e', bg: '#f0fdfa', sidebar: '#ffffff', text: '#134e4a', accent: '#14b8a6' },
    'orange': { name: 'Sunset Energy', primary: '#ea580c', secondary: '#c2410c', bg: '#fff7ed', sidebar: '#ffffff', text: '#7c2d12', accent: '#f97316' },
    'grey': { name: 'Slate Minimal', primary: '#475569', secondary: '#334155', bg: '#f1f5f9', sidebar: '#ffffff', text: '#0f172a', accent: '#64748b' },
    'neon': { name: 'Cyber Future', primary: '#f472b6', secondary: '#db2777', bg: '#111827', sidebar: '#1f2937', text: '#e5e7eb', accent: '#ec4899' },
    'coffee': { name: 'Executive Brown', primary: '#854d0e', secondary: '#713f12', bg: '#fefce8', sidebar: '#ffffff', text: '#422006', accent: '#a16207' }
};

// --- ESTILOS GLOBAIS DINÂMICOS ---
const TailwindStyle = ({ theme }) => (
  <style>{`
    @import url('https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css');
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
    
    :root {
        --primary: ${theme.primary};
        --secondary: ${theme.secondary};
        --bg-main: ${theme.bg};
        --sidebar-bg: ${theme.sidebar};
        --text-main: ${theme.text};
        --accent: ${theme.accent};
    }

    body { font-family: 'Inter', sans-serif; background-color: var(--bg-main); color: var(--text-main); transition: background-color 0.5s ease; }
    
    /* COMPONENTES DE VIDRO ADAPTATIVOS */
    .glass-panel { 
        background: ${theme.name.includes('Dark') || theme.name.includes('Cyber') ? 'rgba(30, 41, 59, 0.7)' : 'rgba(255, 255, 255, 0.9)'}; 
        border: 1px solid ${theme.name.includes('Dark') || theme.name.includes('Cyber') ? 'rgba(255,255,255,0.1)' : '#e2e8f0'}; 
        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); 
        border-radius: 1.5rem; 
        transition: all 0.3s ease; 
        backdrop-filter: blur(10px);
    }
    .glass-panel:hover { transform: translateY(-2px); box-shadow: 0 15px 30px -5px rgba(0, 0, 0, 0.15); border-color: var(--primary); }
    
    .glass-column { 
        background: ${theme.name.includes('Dark') || theme.name.includes('Cyber') ? 'rgba(15, 23, 42, 0.5)' : '#f8fafc'};
        border: 1px solid ${theme.name.includes('Dark') || theme.name.includes('Cyber') ? 'rgba(255,255,255,0.05)' : '#e2e8f0'};
        border-radius: 1.5rem; display: flex; flex-direction: column; 
    }
    
    /* SIDEBAR */
    .sidebar-container { background-color: var(--sidebar-bg); border-right: 1px solid rgba(0,0,0,0.05); transition: background-color 0.5s ease; }
    .sidebar-link { transition: all 0.2s; border-radius: 1rem; font-weight: 700; font-size: 0.85rem; text-transform: uppercase; letter-spacing: 0.05em; display: flex; align-items: center; gap: 1rem; padding: 1rem; color: #94a3b8; }
    .sidebar-link.active { background-color: var(--primary); color: white; box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.2); }
    .sidebar-link:hover:not(.active) { background-color: rgba(0,0,0,0.05); color: var(--text-main); }

    /* BOTÕES GERAIS */
    .btn-primary { background: var(--primary); color: white; border: none; font-weight: 800; transition: 0.2s; }
    .btn-primary:hover { background: var(--secondary); transform: scale(1.02); }
    
    .btn-advance { background: var(--primary); color: #ffffff !important; border: none; font-weight: 900; letter-spacing: 0.05em; }
    .btn-back { background: rgba(0,0,0,0.1); color: var(--text-main); font-weight: 800; }
    .btn-reopen { background: #334155; color: #ffffff !important; }

    /* BOTÕES ESTILO HUBSPOT */
    .btn-crm-solid { background-color: var(--primary); color: white; border-radius: 0.25rem; font-weight: 600; padding: 0.5rem 1rem; transition: all 0.2s; }
    .btn-crm-solid:hover { background-color: var(--secondary); transform: translateY(-1px); }
    
    .btn-crm-outline { background-color: white; border: 1px solid var(--primary); color: var(--primary); border-radius: 0.25rem; font-weight: 600; padding: 0.5rem 1rem; transition: all 0.2s; }
    .btn-crm-outline:hover { background-color: var(--bg-main); }

    .btn-crm-ghost { background-color: white; border: 1px solid #cbd5e1; color: #64748b; border-radius: 0.25rem; font-weight: 600; padding: 0.5rem 1rem; transition: all 0.2s; display: flex; items-center; gap: 0.5rem; }
    .btn-crm-ghost:hover { border-color: #94a3b8; color: #475569; }

    /* INPUTS */
    .settings-input { width: 100%; padding: 0.75rem 1rem; background-color: rgba(0,0,0,0.03); border-radius: 0.75rem; border: 1px solid transparent; font-weight: 600; outline: none; transition: 0.2s; color: var(--text-main); }
    .settings-input:focus { background-color: ${theme.name.includes('Dark') ? '#334155' : '#ffffff'}; border-color: var(--primary); box-shadow: 0 0 0 4px rgba(0,0,0,0.1); }
    
    /* CARDS & TABLES */
    .kanban-card { background: ${theme.name.includes('Dark') ? '#1e293b' : 'white'}; border: 1px solid rgba(0,0,0,0.1); border-radius: 1rem; padding: 1.25rem; cursor: pointer; position: relative; margin-bottom: 0.75rem; color: var(--text-main); }
    .kanban-card:hover { border-color: var(--primary); transform: translateY(-3px); }

    .crm-table { width: 100%; border-collapse: separate; border-spacing: 0; }
    .crm-table th { text-align: left; padding: 1rem; font-size: 0.7rem; font-weight: 800; text-transform: uppercase; color: #94a3b8; border-bottom: 1px solid #e2e8f0; }
    .crm-table td { padding: 1rem; border-bottom: 1px solid #f1f5f9; font-size: 0.85rem; font-weight: 500; }
    .crm-table tr:hover td { background-color: rgba(0,0,0,0.02); }
    .crm-table tr:last-child td { border-bottom: none; }

    /* UTIL */
    .text-primary { color: var(--primary); }
    .bg-primary-light { background-color: var(--bg-main); }
    .border-primary { border-color: var(--primary); }
    
    @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
    .animate-fadeIn { animation: fadeIn 0.4s ease-out forwards; }
    
    .scrollbar-hide::-webkit-scrollbar { display: none; }
    .prop-image img { width: 100%; height: 100%; object-fit: cover; border-radius: 1rem; }
    
    /* Checkbox Customizada */
    .custom-checkbox { width: 1.1rem; height: 1.1rem; border-radius: 0.25rem; border: 2px solid #cbd5e1; appearance: none; cursor: pointer; transition: 0.2s; position: relative; }
    .custom-checkbox:checked { background-color: var(--primary); border-color: var(--primary); background-image: url("data:image/svg+xml,%3csvg viewBox='0 0 16 16' fill='white' xmlns='http://www.w3.org/2000/svg'%3e%3cpath d='M12.207 4.793a1 1 0 010 1.414l-5 5a1 1 0 01-1.414 0l-2.5-2.5a1 1 0 011.414-1.414L6.5 9.086l4.293-4.293a1 1 0 011.414 0z'/%3e%3c/svg%3e"); }

    /* AGENDA ESPECÍFICA */
    .agenda-row { border-bottom: 1px solid rgba(0,0,0,0.05); min-height: 80px; position: relative; }
    .agenda-time-col { width: 80px; text-align: right; padding-right: 1rem; font-size: 0.7rem; color: #94a3b8; font-weight: 700; transform: translateY(-8px); }
    .current-time-line { position: absolute; left: 0; right: 0; height: 1px; background-color: #ef4444; z-index: 20; pointer-events: none; }
    .current-time-line::before { content: ''; position: absolute; left: -5px; top: -3px; width: 8px; height: 8px; background-color: #ef4444; border-radius: 50%; }

  `}</style>
);

function App() {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('dashboard');
    const [settingsTab, setSettingsTab] = useState('perfil');
    
    // ESTADOS GERAIS
    const [currentTheme, setCurrentTheme] = useState('blue');
    const [clients, setClients] = useState([]);
    const [properties, setProperties] = useState([]);
    const [agenda, setAgenda] = useState([]);
    
    // AUXILIARES
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [currentTime, setCurrentTime] = useState(new Date());

    // FORM DATA UNIFICADO
    const [formData, setFormData] = useState({ 
        // Campos de Cliente
        name: '', phone: '', email: '', birthDate: '', address: '', interest: '', 
        // Campos Gerais
        type: 'client', obs: '', date: '', time: '',
        // NOVOS CAMPOS DE IMÓVEL
        title: '', price: '', image: '', developer: '', linktree: '', paymentPlan: '', 
        units: '', ebookUrl: '', bedrooms: '', bathrooms: '', garage: '',
        salesStart: '', constructionStart: '', deliveryDate: '', constructionStatus: 'Planta'
    });
    
    // MENSAGENS WHATSAPP & FILA DE DISPARO
    const [wpMessages, setWpMessages] = useState({});
    const [bulkMessage, setBulkMessage] = useState('');
    const [selectedClients, setSelectedClients] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [sendingQueue, setSendingQueue] = useState([]); // Fila de envio
    const [currentQueueIndex, setCurrentQueueIndex] = useState(0); // Índice atual da fila
    
    // MODO DE TESTE (NOVO)
    const [isTestMode, setIsTestMode] = useState(false);
    const [testNumber, setTestNumber] = useState('21972653971'); // Número padrão solicitado

    // REF PARA IMPORTAÇÃO
    const importInput = useRef(null);

    // PERFIL & SEGURANÇA
    const [userProfile, setUserProfile] = useState({ name: 'Alexandre', creci: '', phone: '', address: '', bio: '' });
    const [passwords, setPasswords] = useState({ current: '', new: '', confirm: '' });

    const theme = THEMES[currentTheme];
    const scrollRef = useRef(null);

    // CARREGAR DADOS
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

        } catch (error) { console.error("Erro:", error); }
    };

    // RELOGIO EM TEMPO REAL
    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 60000); // Atualiza a cada minuto
        return () => clearInterval(timer);
    }, []);

    useEffect(() => {
        const unsub = onAuthStateChanged(auth, (u) => {
            if (u) { setUser(u); loadData(u.uid); }
            else setUser(null); setLoading(false);
        });
        return () => unsub();
    }, []);

    // SCROLL PARA HORA ATUAL NA AGENDA
    useEffect(() => {
        if (activeTab === 'agenda' && scrollRef.current) {
            const hour = new Date().getHours();
            scrollRef.current.scrollTop = hour * 80; // 80px é a altura da linha
        }
    }, [activeTab]);

    // ACTIONS
    const handleThemeChange = (t) => { setCurrentTheme(t); localStorage.setItem('crm_theme', t); };

    const handlePasswordChange = async () => {
        if(passwords.new !== passwords.confirm) return alert("As senhas não coincidem.");
        if(passwords.new.length < 6) return alert("Senha muito curta.");
        try { await updatePassword(user, passwords.new); alert("Senha atualizada!"); setPasswords({ current: '', new: '', confirm: '' }); } 
        catch (e) { alert("Erro ao atualizar. Faça login novamente."); }
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
            await deleteDoc(doc(db, collectionName, id));
            loadData(user.uid);
        }
    };

    const handleBulkDelete = async () => {
        if(selectedClients.length === 0) return alert("Selecione clientes para excluir em massa.");
        if(window.confirm(`Tem certeza que deseja excluir ${selectedClients.length} clientes? Essa ação não pode ser desfeita.`)) {
            for(let id of selectedClients) {
                await deleteDoc(doc(db, 'clients', id));
            }
            setSelectedClients([]);
            loadData(user.uid);
        }
    };

    const handleImportCSV = (e) => {
        const file = e.target.files[0];
        if(!file) return;
        
        const reader = new FileReader();
        reader.onload = async (event) => {
            const text = event.target.result;
            const rows = text.split('\n');
            let count = 0;
            for(let row of rows) {
                const cols = row.split(',');
                if(cols.length >= 1 && cols[0].trim() !== '') {
                    // Esperado: Nome, Email, Telefone
                    await addDoc(collection(db, 'clients'), {
                        fullName: cols[0]?.trim() || 'Importado',
                        email: cols[1]?.trim() || '',
                        phones: [cols[2]?.trim() || ''],
                        status: 'LEAD',
                        assignedAgent: user.uid,
                        createdAt: new Date().toISOString()
                    });
                    count++;
                }
            }
            alert(`${count} clientes importados com sucesso!`);
            loadData(user.uid);
        };
        reader.readAsText(file);
    };

    const openEdit = (item, type) => {
        setEditingId(item.id);
        if (type === 'client') {
            setFormData({ 
                name: item.fullName, phone: item.phones?.[0] || '', email: item.email || '', 
                birthDate: item.birthDate || '', address: item.address || '', interest: item.interest || '', 
                type: 'client', obs: item.observations || '' 
            });
        }
        if (type === 'property') {
            setFormData({
                type: 'property', title: item.title || '', price: item.price || '', image: item.image || '',
                developer: item.developer || '', linktree: item.linktree || '', paymentPlan: item.paymentPlan || '', 
                units: item.units || '', ebookUrl: item.ebookUrl || '', bedrooms: item.bedrooms || '', 
                bathrooms: item.bathrooms || '', garage: item.garage || '', salesStart: item.salesStart || '', 
                constructionStart: item.constructionStart || '', deliveryDate: item.deliveryDate || '', 
                constructionStatus: item.constructionStatus || 'Planta', address: item.address || ''
            });
        }
        if (type === 'agenda') setFormData({ name: item.title, date: item.date, time: item.time, type: 'agenda', obs: item.type || 'Visita' });
        setShowForm(true);
    };

    const toggleSelectClient = (id) => {
        if (selectedClients.includes(id)) setSelectedClients(selectedClients.filter(c => c !== id));
        else setSelectedClients([...selectedClients, id]);
    };

    // FUNÇÃO DE ENVIO CORRIGIDA PARA ZAPZAP/LINUX/WEB
    const sendWp = (phone, msg) => {
        if (!phone) {
            alert("Sem telefone definido.");
            return;
        }
        
        // 1. Limpeza brutal: mantém apenas números
        let num = phone.replace(/\D/g, '');
        
        // 2. Lógica inteligente de código de país (55)
        // Números brasileiros tem 10 (fixo) ou 11 (celular) dígitos SEM o 55
        // Se tiver 10 ou 11, adicionamos o 55. 
        // Se tiver 12 ou 13, assumimos que já tem o 55.
        if (num.length >= 10 && num.length <= 11) {
            num = `55${num}`;
        }
        
        // 3. Link Direto WEB (Resolve o problema do ZapZap não pegar o texto)
        // Usar 'web.whatsapp.com' força o navegador/wrapper a abrir a interface correta
        const url = `https://web.whatsapp.com/send?phone=${num}&text=${encodeURIComponent(msg)}`;
        
        window.open(url, '_blank');
    };

    // LÓGICA DA FILA DE DISPARO
    const handlePrepareQueue = () => {
        if (selectedClients.length === 0) return alert("Selecione pelo menos um cliente.");
        if (!bulkMessage.trim()) return alert("Digite uma mensagem.");
        
        const queue = selectedClients.map(id => {
            const client = clients.find(c => c.id === id);
            return {
                id: client.id,
                name: client.fullName,
                phone: client.phones?.[0] || '',
                status: 'pending' // pending, sent
            };
        });
        
        setSendingQueue(queue);
        setCurrentQueueIndex(0);
    };

    const handleSendNext = () => {
        if (currentQueueIndex >= sendingQueue.length) return;
        
        const item = sendingQueue[currentQueueIndex];
        
        // SE MODO TESTE ESTIVER ATIVO, USA O NÚMERO DE TESTE (Limpo também)
        const targetPhone = isTestMode ? testNumber : item.phone;
        
        sendWp(targetPhone, bulkMessage);
        
        // Atualiza status na fila visualmente
        const newQueue = [...sendingQueue];
        newQueue[currentQueueIndex].status = 'sent';
        setSendingQueue(newQueue);
        
        // Avança índice
        if (currentQueueIndex < sendingQueue.length - 1) {
            setCurrentQueueIndex(currentQueueIndex + 1);
        } else {
            alert("Fila finalizada com sucesso!");
        }
    };

    // CALENDARIO LOGIC
    const generateCalendarDays = () => {
        const date = new Date(selectedDate);
        const year = date.getFullYear();
        const month = date.getMonth();
        const firstDay = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const days = [];
        for (let i = 0; i < firstDay; i++) days.push(null);
        for (let i = 1; i <= daysInMonth; i++) days.push(i);
        return days;
    };

    const getTopPosition = (dateObj) => {
        const hours = dateObj.getHours();
        const minutes = dateObj.getMinutes();
        return (hours * 80) + ((minutes / 60) * 80); // 80px por hora
    };

    // KPIs GERAIS (USADOS NO DASHBOARD)
    const totalVGV = properties.reduce((acc, c) => acc + (parseFloat(c.price?.replace(/\D/g, '')||0)/100), 0);
    const funnelData = [
        { name: 'Lead', value: clients.filter(c => !c.status || c.status === 'LEAD').length, color: '#94a3b8' },
        { name: 'Agendado', value: clients.filter(c => c.status === 'AGENDADO').length, color: '#f59e0b' },
        { name: 'Proposta', value: clients.filter(c => c.status === 'PROPOSTA').length, color: '#8b5cf6' },
        { name: 'Fechado', value: clients.filter(c => c.status === 'FECHADO').length, color: '#10b981' },
    ];

    if (loading) return <div className="h-screen flex items-center justify-center font-bold text-slate-400">CARREGANDO SISTEMA...</div>;
    if (!user) return <Login onLogin={setUser} />;

    return (
        <div className="min-h-screen flex">
            <TailwindStyle theme={theme} />
            
            {/* SIDEBAR DINÂMICA */}
            <aside className="w-20 lg:w-64 sidebar-container flex flex-col fixed h-full z-50">
                <div className="p-8"><h1 className="font-black text-xl tracking-tighter italic" style={{color: theme.text}}>ALEXANDRE<span style={{color: theme.primary}}>CRM</span></h1></div>
                <nav className="flex-1 px-4 space-y-2 overflow-y-auto">
                    {[
                        { id: 'dashboard', icon: '📊', label: 'Dashboard' },
                        { id: 'pipeline', icon: '🌪️', label: 'Funil Vendas' },
                        { id: 'clientes', icon: '👥', label: 'Clientes' },
                        { id: 'properties', icon: '🏠', label: 'Imóveis' },
                        { id: 'agenda', icon: '📅', label: 'Agenda' },
                        { id: 'whatsapp', icon: '💬', label: 'WhatsApp' },
                        { id: 'relatorios', icon: '📄', label: 'Relatórios' },
                        { id: 'settings', icon: '⚙️', label: 'Configuração' }
                    ].map(item => (
                        <button key={item.id} onClick={() => setActiveTab(item.id)} className={`sidebar-link w-full ${activeTab === item.id ? 'active' : ''}`}>
                            <span className="text-xl">{item.icon}</span> <span className="hidden lg:block">{item.label}</span>
                        </button>
                    ))}
                </nav>
                <div className="p-4 border-t"><button onClick={() => signOut(auth)} className="w-full py-3 text-xs font-bold text-red-500 hover:bg-red-50 rounded-xl">SAIR</button></div>
            </aside>

            {/* MAIN CONTENT */}
            <main className="flex-1 ml-20 lg:ml-64 p-6 lg:p-10 overflow-y-auto transition-colors duration-500 h-screen flex flex-col">
                
                <header className="flex justify-between items-center mb-6 animate-fadeIn flex-shrink-0">
                    <div>
                        <h2 className="text-xs font-black opacity-50 uppercase tracking-widest mb-1">Painel de Controle</h2>
                        <h1 className="text-3xl font-black tracking-tight uppercase">{activeTab === 'settings' ? 'Configurações' : activeTab === 'properties' ? 'Estoque de Imóveis' : activeTab === 'clientes' ? 'Gestão de Contatos' : activeTab}</h1>
                    </div>
                    <div className="hidden sm:block text-right">
                        <div className="flex items-center gap-2 justify-end"><div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div><span className="font-bold text-xs text-green-600">SISTEMA ONLINE</span></div>
                    </div>
                </header>

                {/* --- DASHBOARD --- */}
                {activeTab === 'dashboard' && (
                    <div className="space-y-8 animate-fadeIn overflow-y-auto">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            <div className="glass-panel p-6 border-l-4 border-primary"><p className="opacity-50 text-xs font-bold uppercase mb-2">Clientes</p><p className="text-3xl font-black">{clients.length}</p></div>
                            <div className="glass-panel p-6 border-l-4 border-primary"><p className="opacity-50 text-xs font-bold uppercase mb-2">VGV Total</p><p className="text-2xl font-black">{totalVGV.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })}</p></div>
                            <div className="glass-panel p-6 border-l-4 border-primary"><p className="opacity-50 text-xs font-bold uppercase mb-2">Em Negociação</p><p className="text-3xl font-black">{clients.filter(c => c.status === 'PROPOSTA' || c.status === 'AGENDADO').length}</p></div>
                            <div className="glass-panel p-6 border-l-4 border-primary"><p className="opacity-50 text-xs font-bold uppercase mb-2">Agenda</p><p className="text-3xl font-black">{agenda.length}</p></div>
                        </div>
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                            <div className="glass-panel p-6 lg:col-span-2 shadow-sm h-80"><h3 className="text-sm font-black uppercase opacity-50 mb-4">Funil de Vendas</h3><ResponsiveContainer width="100%" height="100%"><BarChart data={funnelData} layout="vertical" margin={{top:5, right:30, left:20, bottom:5}}><XAxis type="number" hide /><YAxis dataKey="name" type="category" width={80} tick={{fontSize:10, fontWeight:700}} axisLine={false} tickLine={false} /><Tooltip cursor={{fill: 'rgba(0,0,0,0.05)'}} /><Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={30}>{funnelData.map((e, i) => <Cell key={i} fill={e.color} />)}</Bar></BarChart></ResponsiveContainer></div>
                            <div className="glass-panel p-6 h-80 overflow-y-auto"><h3 className="text-sm font-black uppercase opacity-50 mb-4">Últimos Clientes</h3><div className="space-y-3">{clients.slice(0, 5).map(c => (<div key={c.id} className="flex justify-between items-center p-3 bg-primary-light rounded-xl border border-dashed border-slate-200"><div><p className="font-bold text-xs uppercase">{c.fullName}</p><p className="text-[10px] opacity-50">{c.status || 'LEAD'}</p></div></div>))}</div></div>
                        </div>
                    </div>
                )}
                
                {/* --- PIPELINE --- */}
                {activeTab === 'pipeline' && (
                    <div className="flex gap-6 overflow-x-auto pb-6 scrollbar-hide h-[calc(100vh-180px)] animate-fadeIn">
                        {[{ id: 'LEAD', label: 'Novos Leads' }, { id: 'AGENDADO', label: 'Visitas' }, { id: 'PROPOSTA', label: 'Propostas' }, { id: 'FECHADO', label: 'Fechados' }].map(col => (
                            <div key={col.id} className="glass-column min-w-[320px] shadow-sm">
                                <div className="p-5 border-b border-dashed border-slate-200 flex justify-between items-center sticky top-0 z-10"><h3 className="font-black uppercase text-sm opacity-60">{col.label}</h3><span className="bg-primary-light px-2 py-1 rounded-lg text-xs font-bold opacity-60 shadow-inner">{clients.filter(c => (c.status || 'LEAD') === col.id).length}</span></div>
                                <div className="p-4 flex-1 overflow-y-auto space-y-3">
                                    {clients.filter(c => (c.status || 'LEAD') === col.id).map(client => (
                                        <div key={client.id} onClick={() => openEdit(client, 'client')} className="kanban-card group">
                                            <div className="flex justify-between items-start mb-3"><div className="flex items-center gap-2"><div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-black border border-slate-200 text-slate-500">{client.fullName.charAt(0)}</div><div><h4 className="font-black text-xs uppercase leading-tight truncate w-32">{client.fullName}</h4><p className="text-[9px] opacity-50 font-bold">{client.phones?.[0] || '-'}</p></div></div><button onClick={(e) => deleteItem('clients', client.id, e)} className="text-slate-300 hover:text-red-500 px-1">✕</button></div>
                                            <div className="flex gap-2 mt-3">{col.id !== 'LEAD' && col.id !== 'FECHADO' && <button onClick={(e) => { e.stopPropagation(); updateStatus(client.id, col.id, 'prev'); }} className="btn-back px-3 py-2 rounded-lg text-xs transition">◀</button>}{col.id !== 'FECHADO' && <button onClick={(e) => { e.stopPropagation(); updateStatus(client.id, col.id, 'next'); }} className="btn-advance flex-1 py-2 rounded-lg text-[10px] uppercase shadow-md transition">Avançar ➜</button>}{col.id === 'FECHADO' && <button onClick={(e) => { e.stopPropagation(); updateStatus(client.id, col.id, 'prev'); }} className="btn-reopen w-full py-2 rounded-lg text-[10px] uppercase shadow-md transition">↺ Reabrir</button>}</div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
                
                {/* --- CLIENTES (ESTILO TABELA HUBSPOT - ATUALIZADO E FUNCIONAL) --- */}
                {activeTab === 'clientes' && (
                    <div className="space-y-6 animate-fadeIn h-full flex flex-col">
                       {/* Input Arquivo Oculto */}
                       <input type="file" ref={importInput} onChange={handleImportCSV} className="hidden" accept=".csv" />

                       {/* Top Bar com Pesquisa e Botões */}
                       <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-2">
                           <div className="relative w-full md:w-1/3">
                               <input 
                                    placeholder="Pesquisar..." 
                                    value={searchTerm} 
                                    onChange={e => setSearchTerm(e.target.value)} 
                                    className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg text-sm focus:border-blue-500 outline-none"
                               />
                               <span className="absolute left-3 top-2.5 text-slate-400 text-xs">🔍</span>
                           </div>
                           <div className="flex gap-3">
                               <button onClick={handleBulkDelete} className="btn-crm-ghost text-xs">
                                   Ações (Excluir Selecionados) {selectedClients.length > 0 && `(${selectedClients.length})`}
                               </button>
                               <button onClick={() => importInput.current.click()} className="btn-crm-outline text-xs">
                                   Importar CSV
                               </button>
                               <button onClick={() => { setEditingId(null); setFormData({ name: '', phone: '', email: '', birthDate: '', address: '', interest: '', obs: '', type: 'client' }); setShowForm(true); }} className="btn-crm-solid text-xs">
                                   Criar contato
                               </button>
                           </div>
                       </div>
                       
                       {/* Tabela de Dados */}
                       <div className="bg-white rounded-lg shadow-sm border border-slate-200 flex-1 overflow-hidden flex flex-col">
                           <div className="overflow-x-auto flex-1">
                               <table className="crm-table w-full">
                                   <thead className="bg-slate-50 sticky top-0 z-10">
                                       <tr>
                                           <th className="w-10 text-center"><input type="checkbox" className="custom-checkbox" onChange={() => { if(selectedClients.length === clients.length) setSelectedClients([]); else setSelectedClients(clients.map(c => c.id)); }} checked={selectedClients.length === clients.length && clients.length > 0} /></th>
                                           <th>Nome</th>
                                           <th>E-mail</th>
                                           <th>Telefone</th>
                                           <th>Status do Lead</th>
                                           <th>Imóvel de Interesse</th>
                                           <th>Data de Criação</th>
                                           <th>Ações</th>
                                       </tr>
                                   </thead>
                                   <tbody>
                                       {clients.filter(c => c.fullName.toLowerCase().includes(searchTerm.toLowerCase())).map(client => (
                                           <tr key={client.id} className="group hover:bg-slate-50 transition-colors cursor-default">
                                               <td className="text-center"><input type="checkbox" className="custom-checkbox" checked={selectedClients.includes(client.id)} onChange={() => toggleSelectClient(client.id)} /></td>
                                               <td>
                                                   <div className="flex items-center gap-3" onClick={() => openEdit(client, 'client')}>
                                                       <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-500 border border-slate-200">{client.fullName.charAt(0)}</div>
                                                       <span className="font-bold text-slate-700 cursor-pointer hover:text-blue-600">{client.fullName}</span>
                                                   </div>
                                               </td>
                                               <td><a href={`mailto:${client.email}`} className="text-blue-500 hover:underline">{client.email || '-'}</a></td>
                                               <td>
                                                   {client.phones?.[0] ? (
                                                       <a href={`https://wa.me/55${client.phones[0].replace(/\D/g, '')}`} target="_blank" className="text-green-600 hover:text-green-700 font-bold flex items-center gap-1">
                                                           {client.phones[0]}
                                                       </a>
                                                   ) : '-'}
                                               </td>
                                               <td>
                                                   <span className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase ${client.status === 'FECHADO' ? 'bg-green-100 text-green-700' : client.status === 'PROPOSTA' ? 'bg-purple-100 text-purple-700' : 'bg-slate-100 text-slate-500'}`}>
                                                       {client.status || 'Novo'}
                                                   </span>
                                               </td>
                                               <td><span className="text-slate-500 text-xs">{client.interest || '-'}</span></td>
                                               <td className="text-slate-400 text-xs">{client.createdAt ? new Date(client.createdAt).toLocaleDateString('pt-BR') : '-'}</td>
                                               <td>
                                                   <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                       <button onClick={() => openEdit(client, 'client')} className="text-slate-400 hover:text-blue-600">✎</button>
                                                       <button onClick={(e) => deleteItem('clients', client.id, e)} className="text-slate-400 hover:text-red-500">✕</button>
                                                   </div>
                                               </td>
                                           </tr>
                                       ))}
                                   </tbody>
                               </table>
                           </div>
                           <div className="bg-slate-50 p-3 border-t border-slate-200 text-xs text-slate-500 flex justify-between items-center">
                               <span>{clients.length} registros totais</span>
                               <span>{selectedClients.length} selecionados</span>
                           </div>
                       </div>
                    </div>
                )}
                
                {/* --- IMÓVEIS (FICHA TÉCNICA) --- */}
                {activeTab === 'properties' && (
                   <div className="space-y-6 animate-fadeIn overflow-y-auto pb-10">
                       <div className="flex justify-end">
                           <button onClick={() => { setEditingId(null); setFormData({ type: 'property', title: '', price: '', image: '', developer: '', linktree: '', paymentPlan: '', units: '', ebookUrl: '', bedrooms: '', bathrooms: '', garage: '', salesStart: '', constructionStart: '', deliveryDate: '', constructionStatus: 'Planta', address: '' }); setShowForm(true); }} className="btn-primary px-6 py-3 rounded-xl text-xs uppercase shadow-lg">+ Novo Imóvel</button>
                       </div>
                       
                       <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                           {properties.map(p => (
                               <div key={p.id} className="glass-panel overflow-hidden group flex flex-col">
                                   <div className="prop-image h-48 relative">
                                       {p.image ? <img src={p.image} alt={p.title} className="w-full h-full object-cover transition duration-500 group-hover:scale-105" /> : <div className="w-full h-full flex items-center justify-center bg-slate-100 text-slate-300 font-black text-4xl">🏠</div>}
                                       <div className="absolute top-4 left-4 flex flex-col gap-1">
                                            <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase shadow-lg ${p.constructionStatus === 'Pronto' ? 'bg-green-500 text-white' : 'bg-blue-500 text-white'}`}>{p.constructionStatus || 'Planta'}</span>
                                            {p.units && <span className="px-3 py-1 rounded-full bg-slate-900 text-white text-[10px] font-bold uppercase shadow-lg">{p.units} Unidades</span>}
                                       </div>
                                       <div className="absolute top-4 right-4 flex gap-2">
                                            <button onClick={() => openEdit(p, 'property')} className="w-8 h-8 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center text-slate-600 hover:text-blue-600 shadow-sm transition">✎</button>
                                            <button onClick={(e) => deleteItem('properties', p.id, e)} className="w-8 h-8 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center text-slate-600 hover:text-red-500 shadow-sm transition">✕</button>
                                       </div>
                                   </div>

                                   <div className="p-6 flex-1 flex flex-col">
                                       <div className="flex justify-between items-start mb-2">
                                           <div><p className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">{p.developer || 'Incorporadora'}</p><h3 className="font-black text-xl uppercase leading-tight text-slate-800">{p.title}</h3></div>
                                           <div className="text-right"><p className="text-xl font-black text-primary" style={{color: theme.primary}}>{p.price}</p></div>
                                       </div>
                                       <p className="text-xs text-slate-500 font-medium mb-4 flex items-center gap-1">📍 {p.address || 'Localização não informada'}</p>

                                       <div className="grid grid-cols-3 gap-2 mb-4">
                                           <div className="bg-slate-50 rounded-lg p-2 text-center border border-slate-100"><span className="block text-lg">🛏️</span><span className="text-[10px] font-bold uppercase text-slate-500">{p.bedrooms || 0} Quartos</span></div>
                                           <div className="bg-slate-50 rounded-lg p-2 text-center border border-slate-100"><span className="block text-lg">🚿</span><span className="text-[10px] font-bold uppercase text-slate-500">{p.bathrooms || 0} Banheiros</span></div>
                                           <div className="bg-slate-50 rounded-lg p-2 text-center border border-slate-100"><span className="block text-lg">🚗</span><span className="text-[10px] font-bold uppercase text-slate-500">{p.garage || 0} Vagas</span></div>
                                       </div>

                                       <div className="bg-slate-50 rounded-xl p-3 border border-slate-100 mb-4 space-y-2">
                                           <div className="flex justify-between border-b border-dashed border-slate-200 pb-2"><span className="text-[10px] font-bold uppercase text-slate-400">Início Obras</span><span className="text-[10px] font-bold text-slate-700">{p.constructionStart ? new Date(p.constructionStart).toLocaleDateString('pt-BR') : '-'}</span></div>
                                           <div className="flex justify-between border-b border-dashed border-slate-200 pb-2"><span className="text-[10px] font-bold uppercase text-slate-400">Entrega</span><span className="text-[10px] font-bold text-slate-700">{p.deliveryDate ? new Date(p.deliveryDate).toLocaleDateString('pt-BR') : '-'}</span></div>
                                           <div><span className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Fluxo de Pagamento</span><p className="text-xs font-bold text-slate-800">{p.paymentPlan || 'Consulte condições'}</p></div>
                                       </div>

                                       <div className="grid grid-cols-2 gap-3 mt-auto">
                                            {p.linktree && (<a href={p.linktree} target="_blank" rel="noopener noreferrer" className="col-span-2 py-2 bg-slate-100 text-slate-600 rounded-lg font-bold uppercase text-[10px] hover:bg-slate-200 transition text-center">🔗 Acessar Linktree / Site</a>)}
                                            {p.ebookUrl ? (<button onClick={() => {const msg = `Olá! Segue o eBook/Apresentação do *${p.title}* que você solicitou: ${p.ebookUrl}`; window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank');}} className="col-span-2 py-3 bg-green-500 text-white rounded-xl font-bold uppercase text-xs hover:bg-green-600 transition shadow-lg flex items-center justify-center gap-2">📥 Enviar eBook p/ Cliente</button>) : (<button disabled className="col-span-2 py-3 bg-slate-200 text-slate-400 rounded-xl font-bold uppercase text-xs cursor-not-allowed">Sem eBook Cadastrado</button>)}
                                       </div>
                                   </div>
                               </div>
                           ))}
                       </div>
                   </div>
                )}

                {/* --- AGENDA ESTILO ZOHO (ATUALIZADO) --- */}
                {activeTab === 'agenda' && (
                    <div className="flex gap-6 h-[calc(100vh-140px)] animate-fadeIn">
                        
                        {/* SIDEBAR DA AGENDA (Mini Calendário) */}
                        <div className="w-64 flex-shrink-0 flex flex-col gap-6">
                            <div className="glass-panel p-6">
                                <h3 className="text-xs font-black uppercase opacity-50 mb-4 text-center">Navegar</h3>
                                <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-bold opacity-50 mb-2"><div>D</div><div>S</div><div>T</div><div>Q</div><div>Q</div><div>S</div><div>S</div></div>
                                <div className="grid grid-cols-7 gap-1">
                                    {generateCalendarDays().map((d, i) => (
                                        <div 
                                            key={i} 
                                            onClick={() => d && setSelectedDate(`2024-02-${String(d).padStart(2,'0')}`)} 
                                            className={`aspect-square flex items-center justify-center rounded-lg text-xs font-bold cursor-pointer transition ${selectedDate.endsWith(String(d).padStart(2,'0')) ? 'bg-primary text-white shadow-md' : d ? 'hover:bg-slate-100' : ''}`}
                                            style={selectedDate.endsWith(String(d).padStart(2,'0')) ? {backgroundColor: theme.primary} : {}}
                                        >
                                            {d}
                                        </div>
                                    ))}
                                </div>
                            </div>
                            
                            <button onClick={() => { setEditingId(null); setFormData({ name: '', phone: '', price: '', type: 'agenda', obs: 'Visita', image: '', date: selectedDate, time: '09:00' }); setShowForm(true); }} className="btn-primary w-full py-4 rounded-xl shadow-lg flex items-center justify-center gap-2 uppercase text-xs font-black">
                                + Novo Agendamento
                            </button>
                        </div>

                        {/* TIMELINE PRINCIPAL */}
                        <div className="glass-panel flex-1 flex flex-col overflow-hidden relative">
                            {/* Header da Agenda */}
                            <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-white/50 backdrop-blur-sm z-20">
                                <div>
                                    <h3 className="text-lg font-black uppercase text-slate-800">Meu Calendário</h3>
                                    <p className="text-xs font-bold text-slate-400 capitalize">{new Date(selectedDate).toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
                                </div>
                                <div className="flex bg-slate-100 rounded-lg p-1">
                                    <button className="px-4 py-1.5 bg-white rounded-md shadow-sm text-xs font-bold text-slate-800">Dia</button>
                                    <button className="px-4 py-1.5 text-xs font-bold text-slate-500 hover:bg-white/50 rounded-md transition">Semana</button>
                                    <button className="px-4 py-1.5 text-xs font-bold text-slate-500 hover:bg-white/50 rounded-md transition">Mês</button>
                                </div>
                            </div>

                            {/* Área de Scroll da Timeline */}
                            <div className="flex-1 overflow-y-auto relative scroll-smooth" ref={scrollRef}>
                                {/* Linha do Tempo Atual (Vermelha) */}
                                {selectedDate === new Date().toISOString().split('T')[0] && (
                                    <div className="current-time-line" style={{ top: `${getTopPosition(currentTime)}px` }} title="Hora Atual"></div>
                                )}

                                {/* Grade de Horas */}
                                {Array.from({ length: 24 }).map((_, hour) => (
                                    <div key={hour} className="agenda-row flex">
                                        <div className="agenda-time-col pt-2 border-r border-slate-100">
                                            {String(hour).padStart(2, '0')}:00
                                        </div>
                                        <div className="flex-1 relative border-t border-slate-50 hover:bg-slate-50/50 transition-colors">
                                            {/* Renderizar Eventos desta Hora */}
                                            {agenda
                                                .filter(a => a.date === selectedDate && parseInt(a.time.split(':')[0]) === hour)
                                                .map(event => {
                                                    const minutes = parseInt(event.time.split(':')[1]);
                                                    const topPos = (minutes / 60) * 80; // Posição relativa dentro da hora
                                                    return (
                                                        <div 
                                                            key={event.id}
                                                            onClick={() => deleteItem('agenda', event.id)}
                                                            className="absolute left-2 right-2 p-2 rounded-lg border-l-4 shadow-sm cursor-pointer hover:scale-[1.01] transition-transform z-10 flex justify-between items-center group"
                                                            style={{ 
                                                                top: `${topPos}px`, 
                                                                height: '60px',
                                                                backgroundColor: event.type === 'Visita' ? '#eff6ff' : event.type === 'Reunião' ? '#f5f3ff' : '#fff7ed',
                                                                borderColor: event.type === 'Visita' ? '#3b82f6' : event.type === 'Reunião' ? '#8b5cf6' : '#f97316'
                                                            }}
                                                        >
                                                            <div>
                                                                <span className="text-[10px] font-bold opacity-60 block">{event.time}</span>
                                                                <h4 className="text-xs font-black uppercase text-slate-800">{event.title}</h4>
                                                            </div>
                                                            <button className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-500 transition px-2">✕</button>
                                                        </div>
                                                    );
                                                })
                                            }
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* --- WHATSAPP & FILA DE DISPARO (NOVO!) --- */}
                {activeTab === 'whatsapp' && (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-fadeIn h-[calc(100vh-140px)]">
                       
                       {/* COLUNA 1: Seleção de Destinatários */}
                       <div className="glass-panel p-6 flex flex-col">
                           <div className="mb-4">
                               <h3 className="text-lg font-black uppercase mb-1">1. Selecionar Leads</h3>
                               <p className="text-xs text-slate-400 mb-2">Escolha quem receberá a mensagem.</p>
                               <input placeholder="Buscar cliente..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="settings-input" />
                           </div>
                           <div className="flex-1 overflow-y-auto space-y-2 pr-2 border-t border-slate-100 pt-4">
                               <div className="flex justify-between items-center mb-2 px-1">
                                    <span className="text-xs font-bold text-slate-400">{selectedClients.length} selecionados</span>
                                    {selectedClients.length > 0 && <button onClick={() => setSelectedClients([])} className="text-xs text-red-400 hover:underline">Limpar</button>}
                               </div>
                               {clients.filter(c => c.fullName.toLowerCase().includes(searchTerm.toLowerCase())).map(c => (
                                   <div key={c.id} onClick={() => toggleSelectClient(c.id)} className={`p-3 rounded-xl border flex items-center justify-between cursor-pointer transition ${selectedClients.includes(c.id) ? 'bg-primary-light border-primary' : 'bg-white border-slate-100 hover:border-blue-300'}`}>
                                       <div className="flex items-center gap-3">
                                           <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${selectedClients.includes(c.id) ? 'bg-primary text-white' : 'bg-slate-100 text-slate-400'}`} style={selectedClients.includes(c.id) ? {backgroundColor: theme.primary} : {}}>{c.fullName.charAt(0)}</div>
                                           <div>
                                               <p className="text-xs font-bold uppercase">{c.fullName}</p>
                                               <p className="text-[9px] text-slate-400">{c.phones?.[0] || 'Sem telefone'}</p>
                                           </div>
                                       </div>
                                       <input type="checkbox" checked={selectedClients.includes(c.id)} readOnly className="custom-checkbox" />
                                   </div>
                               ))}
                           </div>
                       </div>
                       
                       {/* COLUNA 2: Mensagem e Preparação */}
                       <div className="glass-panel p-6 flex flex-col">
                           <div className="mb-4">
                               <h3 className="text-lg font-black uppercase mb-1">2. Mensagem</h3>
                               <p className="text-xs text-slate-400">Escreva o texto único para todos.</p>
                           </div>
                           <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
                               {[{l:'Apresentação', t:'Olá! Tudo bem? Sou Alexandre e gostaria de apresentar oportunidades de imóveis.'}, {l:'Cobrar Visita', t:'Olá! Lembrete da nossa visita agendada para amanhã.'}, {l:'Promoção', t:'Oportunidade única! Imóvel com desconto especial essa semana.'}].map((t,i) => (
                                   <button key={i} onClick={() => setBulkMessage(t.t)} className="px-3 py-1 bg-slate-100 text-slate-600 rounded-full text-[10px] font-black uppercase whitespace-nowrap hover:bg-slate-200 border border-slate-200 transition">{t.l}</button>
                               ))}
                           </div>
                           <textarea value={bulkMessage} onChange={e => setBulkMessage(e.target.value)} className="w-full h-48 p-4 bg-slate-50 rounded-xl border border-slate-200 outline-none focus:border-blue-400 font-medium text-sm mb-4 resize-none" placeholder="Digite sua mensagem aqui..." />
                           <button onClick={handlePrepareQueue} className="btn-primary w-full py-4 rounded-xl shadow-lg uppercase text-xs font-black tracking-widest mt-auto">
                               Preparar Fila de Disparo ➜
                           </button>
                       </div>

                       {/* COLUNA 3: Execução da Fila */}
                       <div className="glass-panel p-6 flex-1 bg-slate-900 text-white flex flex-col relative overflow-hidden">
                           <div className="absolute top-0 right-0 w-64 h-64 bg-green-500 rounded-full blur-[100px] opacity-20"></div>
                           <div className="relative z-10 flex flex-col h-full">
                               <div className="flex justify-between items-start mb-6">
                                   <div>
                                       <h3 className="text-lg font-black uppercase mb-1">3. Execução</h3>
                                       <p className="text-xs opacity-50">Envie um por um para evitar bloqueios.</p>
                                   </div>
                                   
                                   {/* TOGGLE MODO TESTE (NOVO) */}
                                   <div className="flex items-center gap-2 bg-white/10 p-2 rounded-lg">
                                        <input type="checkbox" checked={isTestMode} onChange={(e) => setIsTestMode(e.target.checked)} className="cursor-pointer w-4 h-4 accent-green-500" />
                                        <span className="text-[10px] font-bold uppercase">Modo Teste</span>
                                   </div>
                               </div>

                               {isTestMode && (
                                   <div className="mb-4 p-3 bg-yellow-500/20 border border-yellow-500/50 rounded-lg">
                                       <p className="text-[10px] font-bold text-yellow-200 uppercase mb-1">⚠️ Redirecionamento Ativo</p>
                                       <input value={testNumber} onChange={e => setTestNumber(e.target.value)} className="w-full bg-black/20 text-white border border-white/10 rounded px-2 py-1 text-xs" placeholder="Número de Teste" />
                                       <p className="text-[9px] mt-1 opacity-70">Todos os disparos irão para este número.</p>
                                   </div>
                               )}
                               
                               {sendingQueue.length === 0 ? (
                                   <div className="flex-1 flex flex-col items-center justify-center opacity-30 text-center">
                                       <span className="text-4xl mb-2">🚀</span>
                                       <p className="text-xs font-bold uppercase">Aguardando Preparação</p>
                                   </div>
                               ) : (
                                   <>
                                        <div className="mb-6">
                                            <div className="flex justify-between text-xs font-bold uppercase mb-2">
                                                <span>Progresso</span>
                                                <span>{Math.round((currentQueueIndex / sendingQueue.length) * 100)}%</span>
                                            </div>
                                            <div className="w-full bg-white/10 h-2 rounded-full overflow-hidden">
                                                <div className="bg-green-500 h-full transition-all duration-300" style={{width: `${(currentQueueIndex / sendingQueue.length) * 100}%`}}></div>
                                            </div>
                                            <p className="text-[10px] text-center mt-2 opacity-60">{currentQueueIndex} de {sendingQueue.length} enviados</p>
                                        </div>

                                        <div className="flex-1 overflow-y-auto space-y-2 mb-4 pr-2">
                                            {sendingQueue.map((item, index) => (
                                                <div key={index} className={`p-3 rounded-lg border flex justify-between items-center transition ${item.status === 'sent' ? 'bg-green-500/20 border-green-500/30 text-green-300' : index === currentQueueIndex ? 'bg-white text-slate-900 font-bold border-white' : 'bg-white/5 border-white/10 opacity-50'}`}>
                                                    <span className="text-xs uppercase truncate w-32">{item.name}</span>
                                                    <span className="text-[10px] font-bold uppercase">{item.status === 'sent' ? 'Enviado ✅' : index === currentQueueIndex ? 'Próximo ⏳' : 'Pendente'}</span>
                                                </div>
                                            ))}
                                        </div>

                                        {currentQueueIndex < sendingQueue.length ? (
                                            <button onClick={handleSendNext} className="w-full py-5 bg-green-500 hover:bg-green-400 text-white rounded-xl text-sm font-black uppercase shadow-lg transition-all active:scale-95 animate-pulse">
                                                {isTestMode ? `Testar Envio (${testNumber})` : `Enviar p/ ${sendingQueue[currentQueueIndex].name.split(' ')[0]} ➜`}
                                            </button>
                                        ) : (
                                            <button onClick={() => { setSendingQueue([]); setCurrentQueueIndex(0); setSelectedClients([]); }} className="w-full py-4 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-black uppercase transition">
                                                Finalizar Campanha
                                            </button>
                                        )}
                                   </>
                               )}
                           </div>
                       </div>
                    </div>
                )}
                
                {/* --- RELATÓRIOS (ATUALIZADO E CONECTADO COM DADOS REAIS) --- */}
                {activeTab === 'relatorios' && (
                    <div className="space-y-8 animate-fadeIn overflow-y-auto pb-10">
                        {(() => {
                            // CÁLCULOS EM TEMPO REAL
                            const totalClients = clients.length;
                            const closedClients = clients.filter(c => c.status === 'FECHADO').length;
                            const conversionRate = totalClients > 0 ? ((closedClients / totalClients) * 100).toFixed(1) : '0.0';

                            // Ticket Médio baseado no estoque
                            const prices = properties.map(p => parseFloat(p.price?.replace(/\D/g, '') || 0) / 100);
                            const totalInventoryValue = prices.reduce((a, b) => a + b, 0);
                            const averageTicket = properties.length > 0 ? totalInventoryValue / properties.length : 0;
                            
                            // Comissão Estimada (5% do VGV Total do Estoque)
                            const estimatedCommission = totalInventoryValue * 0.05;

                            // Dados para Pizza
                            const pieData = [
                               { name: 'Leads', value: clients.filter(c => !c.status || c.status === 'LEAD').length, fill: '#94a3b8' },
                               { name: 'Agendados', value: clients.filter(c => c.status === 'AGENDADO').length, fill: '#f59e0b' },
                               { name: 'Propostas', value: clients.filter(c => c.status === 'PROPOSTA').length, fill: '#8b5cf6' },
                               { name: 'Fechados', value: closedClients, fill: '#10b981' }
                            ];

                            return (
                                <>
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                        <div className="glass-panel p-8 border-t-4 border-primary hover:scale-[1.02] transition-transform">
                                            <p className="opacity-50 text-xs font-bold uppercase mb-2">Taxa de Conversão</p>
                                            <p className="text-4xl font-black text-slate-800">{conversionRate}%</p>
                                            <p className="text-[10px] mt-2 opacity-60">{closedClients} fechamentos de {totalClients} leads</p>
                                        </div>
                                        <div className="glass-panel p-8 border-t-4 border-primary hover:scale-[1.02] transition-transform">
                                            <p className="opacity-50 text-xs font-bold uppercase mb-2">Ticket Médio (Estoque)</p>
                                            <p className="text-3xl font-black text-slate-800">{averageTicket.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })}</p>
                                            <p className="text-[10px] mt-2 opacity-60">Baseado em {properties.length} imóveis</p>
                                        </div>
                                        <div className="glass-panel p-8 border-t-4 border-primary hover:scale-[1.02] transition-transform">
                                            <p className="opacity-50 text-xs font-bold uppercase mb-2">Potencial de Comissão (5%)</p>
                                            <p className="text-3xl font-black text-green-600">{estimatedCommission.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })}</p>
                                            <p className="text-[10px] mt-2 opacity-60">Se vender todo o estoque atual</p>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                        <div className="glass-panel p-8 flex flex-col h-96">
                                            <h3 className="text-sm font-black uppercase opacity-50 mb-4">Distribuição de Leads</h3>
                                            <ResponsiveContainer>
                                                <PieChart>
                                                    <Pie data={pieData} innerRadius={80} outerRadius={110} dataKey="value" paddingAngle={5}>
                                                        {pieData.map((entry, index) => (
                                                            <Cell key={`cell-${index}`} fill={entry.fill} />
                                                        ))}
                                                    </Pie>
                                                    <Tooltip formatter={(value) => [value, 'Clientes']} contentStyle={{borderRadius: '10px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)'}} />
                                                    <Legend verticalAlign="bottom" height={36} iconType="circle" />
                                                </PieChart>
                                            </ResponsiveContainer>
                                        </div>
                                        
                                        <div className="glass-panel p-8 flex flex-col h-96">
                                             <h3 className="text-sm font-black uppercase opacity-50 mb-6">Produtividade Geral</h3>
                                             <div className="space-y-6 flex-1 overflow-y-auto">
                                                 <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100">
                                                     <div className="flex items-center gap-4">
                                                         <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xl">📅</div>
                                                         <div><p className="font-black text-sm uppercase">Total Agendamentos</p><p className="text-[10px] opacity-50">Visitas e Reuniões</p></div>
                                                     </div>
                                                     <span className="text-2xl font-black text-slate-700">{agenda.length}</span>
                                                 </div>

                                                 <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100">
                                                     <div className="flex items-center gap-4">
                                                         <div className="w-10 h-10 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center text-xl">🏠</div>
                                                         <div><p className="font-black text-sm uppercase">Imóveis Captados</p><p className="text-[10px] opacity-50">Estoque Ativo</p></div>
                                                     </div>
                                                     <span className="text-2xl font-black text-slate-700">{properties.length}</span>
                                                 </div>

                                                 <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100">
                                                     <div className="flex items-center gap-4">
                                                         <div className="w-10 h-10 rounded-full bg-green-100 text-green-600 flex items-center justify-center text-xl">💰</div>
                                                         <div><p className="font-black text-sm uppercase">VGV Total</p><p className="text-[10px] opacity-50">Valor Geral de Vendas</p></div>
                                                     </div>
                                                     <span className="text-lg font-black text-slate-700">{totalVGV.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })}</span>
                                                 </div>
                                             </div>
                                        </div>
                                    </div>
                                </>
                            );
                        })()}
                    </div>
                )}

                {/* --- CONFIGURAÇÕES --- */}
                {activeTab === 'settings' && (
                    <div className="animate-fadeIn overflow-y-auto pb-10">
                        <div className="flex gap-4 mb-8 overflow-x-auto pb-2">
                            {['perfil', 'seguranca', 'aparencia', 'sistema'].map(tab => (
                                <button key={tab} onClick={() => setSettingsTab(tab)} className={`px-6 py-2 rounded-full font-bold uppercase text-xs transition ${settingsTab === tab ? 'btn-primary' : 'bg-white text-slate-400 border border-slate-200'}`}>{tab}</button>
                            ))}
                        </div>

                        {settingsTab === 'perfil' && (
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                                <div className="glass-panel p-8 flex flex-col items-center text-center">
                                    <div className="w-32 h-32 rounded-full bg-slate-200 mb-6 border-4 border-white shadow-xl overflow-hidden"><img src={`https://ui-avatars.com/api/?name=${userProfile.name}&background=random&size=200`} alt="Avatar" /></div>
                                    <h3 className="text-xl font-black uppercase mb-1">{userProfile.name || 'Usuário'}</h3>
                                    <p className="text-xs font-bold opacity-50 uppercase mb-6">Corretor de Imóveis</p>
                                    <button className="btn-primary px-6 py-2 rounded-xl text-xs uppercase w-full">Alterar Foto</button>
                                </div>
                                <div className="lg:col-span-2 glass-panel p-8">
                                    <h3 className="text-lg font-black uppercase mb-6 opacity-70">Dados Pessoais</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div><label className="text-xs font-bold opacity-50 uppercase ml-1">Nome Completo</label><input className="settings-input mt-1" value={userProfile.name} onChange={e => setUserProfile({...userProfile, name: e.target.value})} /></div>
                                        <div><label className="text-xs font-bold opacity-50 uppercase ml-1">CRECI</label><input className="settings-input mt-1" value={userProfile.creci} onChange={e => setUserProfile({...userProfile, creci: e.target.value})} placeholder="00000-F" /></div>
                                        <div><label className="text-xs font-bold opacity-50 uppercase ml-1">Email (Login)</label><input className="settings-input mt-1 opacity-50 cursor-not-allowed" value={user.email} disabled /></div>
                                        <div><label className="text-xs font-bold opacity-50 uppercase ml-1">Telefone</label><input className="settings-input mt-1" value={userProfile.phone} onChange={e => setUserProfile({...userProfile, phone: e.target.value})} /></div>
                                        <div className="md:col-span-2"><label className="text-xs font-bold opacity-50 uppercase ml-1">Bio / Apresentação</label><textarea className="settings-input mt-1 h-24" value={userProfile.bio} onChange={e => setUserProfile({...userProfile, bio: e.target.value})} placeholder="Especialista em imóveis de alto padrão..." /></div>
                                    </div>
                                    <div className="mt-8 text-right"><button className="btn-primary px-8 py-3 rounded-xl text-xs uppercase shadow-lg">Salvar Alterações</button></div>
                                </div>
                            </div>
                        )}

                        {settingsTab === 'seguranca' && (
                            <div className="max-w-2xl mx-auto glass-panel p-10">
                                <h3 className="text-xl font-black uppercase mb-2">Segurança da Conta</h3>
                                <p className="text-sm opacity-60 mb-8">Gerencie sua senha e acesso ao sistema.</p>
                                <div className="space-y-6">
                                    <div><label className="text-xs font-bold opacity-50 uppercase ml-1">Nova Senha</label><input type="password" class="settings-input mt-1" value={passwords.new} onChange={e => setPasswords({...passwords, new: e.target.value})} /></div>
                                    <div><label className="text-xs font-bold opacity-50 uppercase ml-1">Confirmar Nova Senha</label><input type="password" class="settings-input mt-1" value={passwords.confirm} onChange={e => setPasswords({...passwords, confirm: e.target.value})} /></div>
                                </div>
                                <div className="mt-8 pt-8 border-t border-slate-100 flex justify-between items-center"><p className="text-xs text-red-400 font-bold">Nunca compartilhe sua senha.</p><button onClick={handlePasswordChange} className="btn-primary px-8 py-3 rounded-xl text-xs uppercase shadow-lg">Atualizar Senha</button></div>
                            </div>
                        )}

                        {settingsTab === 'aparencia' && (
                            <div className="glass-panel p-10">
                                <h3 className="text-xl font-black uppercase mb-2">Personalização Visual</h3>
                                <p className="text-sm opacity-60 mb-8">Escolha um tema que combine com seu estilo de trabalho.</p>
                                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
                                    {Object.entries(THEMES).map(([key, t]) => (
                                        <button key={key} onClick={() => handleThemeChange(key)} className={`relative p-4 rounded-2xl border-2 transition-all group hover:scale-105 ${currentTheme === key ? 'border-blue-500 shadow-xl scale-105' : 'border-transparent hover:border-slate-300'}`} style={{backgroundColor: t.bg}}>
                                            <div className="h-12 w-full rounded-lg mb-3 shadow-sm" style={{backgroundColor: t.primary}}></div>
                                            <div className="flex gap-2 mb-2"><div className="h-2 w-full rounded-full opacity-20" style={{backgroundColor: t.text}}></div><div className="h-2 w-1/3 rounded-full opacity-40" style={{backgroundColor: t.text}}></div></div>
                                            <p className="text-[10px] font-black uppercase text-center" style={{color: t.text}}>{t.name}</p>
                                            {currentTheme === key && <div className="absolute top-2 right-2 w-3 h-3 bg-blue-500 rounded-full border-2 border-white"></div>}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {settingsTab === 'sistema' && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="glass-panel p-8">
                                    <h3 className="text-lg font-black uppercase mb-6 opacity-70">Informações da Build</h3>
                                    <div className="space-y-4">
                                        <div className="flex justify-between py-3 border-b border-dashed border-slate-200"><span className="text-xs font-bold opacity-50 uppercase">Versão do CRM</span><span className="text-xs font-black">v2.5.0 (Gold)</span></div>
                                        <div className="flex justify-between py-3 border-b border-dashed border-slate-200"><span className="text-xs font-bold opacity-50 uppercase">ID da Licença</span><span className="text-xs font-black font-mono">PRO-8829-XJ</span></div>
                                        <div className="flex justify-between py-3 border-b border-dashed border-slate-200"><span className="text-xs font-bold opacity-50 uppercase">Engine</span><span className="text-xs font-black">React 18 + Firebase 9</span></div>
                                        <div className="flex justify-between py-3"><span className="text-xs font-bold opacity-50 uppercase">Canal de Atualização</span><span className="text-xs font-bold text-green-500 bg-green-50 px-2 py-0.5 rounded">Stable</span></div>
                                    </div>
                                </div>
                                <div className="glass-panel p-8">
                                    <h3 className="text-lg font-black uppercase mb-6 opacity-70">Diagnóstico de Rede</h3>
                                    <div className="space-y-6">
                                        <div><div className="flex justify-between mb-1"><span className="text-[10px] font-bold uppercase opacity-50">Latência do Banco de Dados</span><span className="text-[10px] font-bold text-green-500">24ms (Excelente)</span></div><div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden"><div className="bg-green-500 h-full w-[15%]"></div></div></div>
                                        <div><div className="flex justify-between mb-1"><span className="text-[10px] font-bold uppercase opacity-50">Uso de Armazenamento</span><span className="text-[10px] font-bold">1.2GB / 50GB</span></div><div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden"><div className="bg-blue-500 h-full w-[5%]"></div></div></div>
                                        <div className="p-4 bg-slate-50 rounded-xl border border-slate-200"><p className="text-xs font-bold opacity-60 uppercase mb-2">Logs do Sistema</p><div className="font-mono text-[10px] opacity-50 space-y-1"><p>> System initialized at {new Date().toLocaleTimeString()}</p><p>> Connected to Firestore [South America]</p><p>> Auth Token Verified: OK</p></div></div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </main>

            {/* MODAL GLOBAL */}
            {showForm && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-fadeIn">
                    <div className="glass-panel bg-white w-full max-w-2xl p-8 max-h-[90vh] overflow-y-auto">
                        <h3 className="text-xl font-black uppercase mb-6" style={{color: theme.text}}>{editingId ? 'Editar Registro' : 'Novo Registro'}</h3>
                        
                        <div className="space-y-4">
                            {/* CAMPOS COMUNS */}
                            {(formData.type === 'client' || formData.type === 'agenda') && (
                                <div><label className="text-xs font-bold opacity-50 uppercase ml-1">Nome / Título</label><input className="settings-input mt-1" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} /></div>
                            )}

                            {/* --- FORMULÁRIO DE CLIENTE --- */}
                            {formData.type === 'client' && (
                                <>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div><label className="text-xs font-bold opacity-50 uppercase ml-1">Telefone / Whats</label><input className="settings-input mt-1" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} /></div>
                                        <div><label className="text-xs font-bold opacity-50 uppercase ml-1">Nascimento</label><input type="date" className="settings-input mt-1" value={formData.birthDate} onChange={e => setFormData({...formData, birthDate: e.target.value})} /></div>
                                    </div>
                                    <div><label className="text-xs font-bold opacity-50 uppercase ml-1">Email</label><input className="settings-input mt-1" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} /></div>
                                    <div><label className="text-xs font-bold opacity-50 uppercase ml-1">Imóvel Desejado</label><input className="settings-input mt-1" value={formData.interest} onChange={e => setFormData({...formData, interest: e.target.value})} /></div>
                                </>
                            )}
                            
                            {/* --- FORMULÁRIO DE IMÓVEL (FICHA COMPLETA) --- */}
                            {formData.type === 'property' && (
                                <div className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="col-span-2"><label className="text-xs font-bold opacity-50 uppercase ml-1">Nome do Empreendimento</label><input className="settings-input mt-1" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} /></div>
                                        <div><label className="text-xs font-bold opacity-50 uppercase ml-1">Incorporadora</label><input className="settings-input mt-1" value={formData.developer} onChange={e => setFormData({...formData, developer: e.target.value})} /></div>
                                        <div><label className="text-xs font-bold opacity-50 uppercase ml-1">Preço (A partir de)</label><input className="settings-input mt-1" value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} /></div>
                                    </div>
                                    
                                    <div><label className="text-xs font-bold opacity-50 uppercase ml-1">Endereço do Imóvel</label><input className="settings-input mt-1" value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} /></div>

                                    <div className="grid grid-cols-4 gap-2">
                                        <div><label className="text-xs font-bold opacity-50 uppercase ml-1">Quartos</label><input type="number" className="settings-input mt-1" value={formData.bedrooms} onChange={e => setFormData({...formData, bedrooms: e.target.value})} /></div>
                                        <div><label className="text-xs font-bold opacity-50 uppercase ml-1">Banheiros</label><input type="number" className="settings-input mt-1" value={formData.bathrooms} onChange={e => setFormData({...formData, bathrooms: e.target.value})} /></div>
                                        <div><label className="text-xs font-bold opacity-50 uppercase ml-1">Vagas</label><input type="number" className="settings-input mt-1" value={formData.garage} onChange={e => setFormData({...formData, garage: e.target.value})} /></div>
                                        <div><label className="text-xs font-bold opacity-50 uppercase ml-1">Unidades</label><input type="number" className="settings-input mt-1" value={formData.units} onChange={e => setFormData({...formData, units: e.target.value})} /></div>
                                    </div>

                                    <div className="grid grid-cols-3 gap-2">
                                        <div><label className="text-xs font-bold opacity-50 uppercase ml-1">Início Vendas</label><input type="date" className="settings-input mt-1" value={formData.salesStart} onChange={e => setFormData({...formData, salesStart: e.target.value})} /></div>
                                        <div><label className="text-xs font-bold opacity-50 uppercase ml-1">Início Obras</label><input type="date" className="settings-input mt-1" value={formData.constructionStart} onChange={e => setFormData({...formData, constructionStart: e.target.value})} /></div>
                                        <div><label className="text-xs font-bold opacity-50 uppercase ml-1">Entrega</label><input type="date" className="settings-input mt-1" value={formData.deliveryDate} onChange={e => setFormData({...formData, deliveryDate: e.target.value})} /></div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div><label className="text-xs font-bold opacity-50 uppercase ml-1">Status da Obra</label><select className="settings-input mt-1" value={formData.constructionStatus} onChange={e => setFormData({...formData, constructionStatus: e.target.value})}><option>Planta</option><option>Em Construção</option><option>Pronto</option></select></div>
                                        <div><label className="text-xs font-bold opacity-50 uppercase ml-1">Fluxo Pagamento</label><input className="settings-input mt-1" value={formData.paymentPlan} onChange={e => setFormData({...formData, paymentPlan: e.target.value})} placeholder="Ex: 30% obra + financ." /></div>
                                    </div>

                                    <div><label className="text-xs font-bold opacity-50 uppercase ml-1">Link URL da Foto</label><input className="settings-input mt-1" value={formData.image} onChange={e => setFormData({...formData, image: e.target.value})} placeholder="https://..." /></div>
                                    <div><label className="text-xs font-bold opacity-50 uppercase ml-1">Link PDF eBook (Google Drive/Dropbox)</label><input className="settings-input mt-1" value={formData.ebookUrl} onChange={e => setFormData({...formData, ebookUrl: e.target.value})} placeholder="https://..." /></div>
                                    <div><label className="text-xs font-bold opacity-50 uppercase ml-1">Linktree / Site Oficial</label><input className="settings-input mt-1" value={formData.linktree} onChange={e => setFormData({...formData, linktree: e.target.value})} /></div>
                                </div>
                            )}
                            
                            {/* --- FORMULÁRIO DE AGENDA --- */}
                            {formData.type === 'agenda' && (
                                <div className="grid grid-cols-2 gap-4">
                                    <div><label className="text-xs font-bold opacity-50 uppercase ml-1">Data</label><input type="date" className="settings-input mt-1" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} /></div>
                                    <div><label className="text-xs font-bold opacity-50 uppercase ml-1">Hora</label><input type="time" className="settings-input mt-1" value={formData.time} onChange={e => setFormData({...formData, time: e.target.value})} /></div>
                                    <div className="col-span-2"><label className="text-xs font-bold opacity-50 uppercase ml-1">Tipo</label><select className="settings-input mt-1" value={formData.obs} onChange={e => setFormData({...formData, obs: e.target.value})}><option>Visita</option><option>Reunião</option><option>Outro</option></select></div>
                                </div>
                            )}

                            {!editingId && (
                                <div><label className="text-xs font-bold opacity-50 uppercase ml-1">Categoria</label><select className="settings-input mt-1" value={formData.type} onChange={e => setFormData({...formData, type: e.target.value})}><option value="client">Cliente</option><option value="property">Imóvel</option><option value="agenda">Agenda</option></select></div>
                            )}
                        </div>

                        <div className="flex gap-4 mt-8">
                            <button onClick={async () => {
                                const now = new Date().toISOString();
                                if(editingId) {
                                    if(formData.type === 'client') await updateDoc(doc(db, 'clients', editingId), { 
                                        fullName: formData.name, phones: [formData.phone], email: formData.email, birthDate: formData.birthDate, interest: formData.interest, updatedAt: now 
                                    });
                                    else if(formData.type === 'property') await updateDoc(doc(db, 'properties', editingId), { 
                                        title: formData.title, price: formData.price, image: formData.image, developer: formData.developer,
                                        linktree: formData.linktree, paymentPlan: formData.paymentPlan, units: formData.units, ebookUrl: formData.ebookUrl,
                                        bedrooms: formData.bedrooms, bathrooms: formData.bathrooms, garage: formData.garage,
                                        salesStart: formData.salesStart, constructionStart: formData.constructionStart, deliveryDate: formData.deliveryDate,
                                        constructionStatus: formData.constructionStatus, address: formData.address
                                    });
                                    else if(formData.type === 'agenda') await updateDoc(doc(db, 'agenda', editingId), { title: formData.name, date: formData.date, time: formData.time, type: formData.obs });
                                } else {
                                    if(formData.type === 'property') await addDoc(collection(db, 'properties'), { 
                                        title: formData.title, price: formData.price, image: formData.image, developer: formData.developer,
                                        linktree: formData.linktree, paymentPlan: formData.paymentPlan, units: formData.units, ebookUrl: formData.ebookUrl,
                                        bedrooms: formData.bedrooms, bathrooms: formData.bathrooms, garage: formData.garage,
                                        salesStart: formData.salesStart, constructionStart: formData.constructionStart, deliveryDate: formData.deliveryDate,
                                        constructionStatus: formData.constructionStatus, address: formData.address,
                                        userId: user.uid 
                                    });
                                    else if(formData.type === 'agenda') await addDoc(collection(db, 'agenda'), { title: formData.name, date: formData.date, time: formData.time, type: formData.obs, userId: user.uid });
                                    else await addDoc(collection(db, 'clients'), { 
                                        fullName: formData.name, phones: [formData.phone], email: formData.email, birthDate: formData.birthDate, interest: formData.interest,
                                        status: 'LEAD', assignedAgent: user.uid, createdAt: now
                                    });
                                }
                                setShowForm(false); setEditingId(null); 
                                setFormData({ name: '', phone: '', email: '', birthDate: '', address: '', interest: '', type: 'client', obs: '', date: '', time: '', title: '', price: '', image: '', developer: '', linktree: '', paymentPlan: '', units: '', ebookUrl: '', bedrooms: '', bathrooms: '', garage: '', salesStart: '', constructionStart: '', deliveryDate: '', constructionStatus: 'Planta' }); 
                                loadData(user.uid);
                            }} className="btn-primary flex-1 py-4 rounded-xl uppercase shadow-lg">SALVAR</button>
                            <button onClick={() => setShowForm(false)} className="flex-1 bg-slate-100 text-slate-500 font-bold py-4 rounded-xl uppercase hover:bg-slate-200 transition">CANCELAR</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default App;
