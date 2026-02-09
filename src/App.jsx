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
    
    :root { 
      --primary: ${theme.primary}; 
      --secondary: ${theme.secondary}; 
      --bg-main: ${theme.bg}; 
      --sidebar-bg: ${theme.sidebar}; 
      --text-main: ${theme.text}; 
      --accent: ${theme.accent}; 
    }
    
    body { 
      font-family: 'Inter', sans-serif; 
      background-color: var(--bg-main); 
      color: var(--text-main); 
      transition: background-color 0.5s ease; 
    }
    
    .glass-panel { 
      background: ${theme.name.includes('Dark') ? 'rgba(30, 41, 59, 0.7)' : 'rgba(255, 255, 255, 1)'}; 
      border: 1px solid ${theme.name.includes('Dark') ? 'rgba(255,255,255,0.1)' : '#e2e8f0'}; 
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05); 
      border-radius: 1rem; 
      transition: all 0.3s ease; 
    }
    
    .glass-panel:hover { 
      transform: translateY(-2px); 
      box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1); 
      border-color: var(--primary); 
    }
    
    .sidebar-link { 
      transition: all 0.2s; 
      border-radius: 0.75rem; 
      font-weight: 600; 
      font-size: 0.9rem; 
      display: flex; 
      align-items: center; 
      gap: 0.75rem; 
      padding: 0.85rem 1rem; 
      color: #64748b; 
    }
    
    .sidebar-link.active { 
      background-color: var(--primary); 
      color: white; 
      box-shadow: 0 4px 12px -2px rgba(0, 0, 0, 0.2); 
    }
    
    .sidebar-link:hover:not(.active) { 
      background-color: rgba(0,0,0,0.03); 
      color: var(--text-main); 
    }

    .btn-primary { 
      background: var(--primary); 
      color: white; 
      border: none; 
      font-weight: 700; 
      transition: 0.2s; 
    }
    
    .btn-primary:hover { 
      background: var(--secondary); 
      transform: scale(1.02); 
    }
    
    .btn-primary:disabled { 
      opacity: 0.5; 
      cursor: not-allowed; 
      transform: none; 
    }
    
    .settings-input { 
      width: 100%; 
      padding: 0.75rem 1rem; 
      background-color: rgba(0,0,0,0.03); 
      border-radius: 0.75rem; 
      border: 1px solid #cbd5e1; 
      font-weight: 500; 
      outline: none; 
      transition: 0.2s; 
      color: var(--text-main); 
    }
    
    .settings-input:focus { 
      background-color: ${theme.name.includes('Dark') ? '#334155' : '#ffffff'}; 
      border-color: var(--primary); 
      box-shadow: 0 0 0 3px rgba(0,0,0,0.1); 
    }
    
    @keyframes fadeIn { 
      from { opacity: 0; transform: translateY(10px); } 
      to { opacity: 1; transform: translateY(0); } 
    }
    
    .animate-fadeIn { 
      animation: fadeIn 0.4s ease-out forwards; 
    }
    
    .scrollbar-hide::-webkit-scrollbar { 
      display: none; 
    }
    
    .custom-checkbox { 
      width: 1.2rem; 
      height: 1.2rem; 
      border-radius: 0.4rem; 
      border: 2px solid #cbd5e1; 
      appearance: none; 
      cursor: pointer; 
      transition: 0.2s; 
    }
    
    .custom-checkbox:checked { 
      background-color: var(--primary); 
      border-color: var(--primary); 
      background-image: url("data:image/svg+xml,%3csvg viewBox='0 0 16 16' fill='white' xmlns='http://www.w3.org/2000/svg'%3e%3cpath d='M12.207 4.793a1 1 0 010 1.414l-5 5a1 1 0 01-1.414 0l-2.5-2.5a1 1 0 011.414-1.414L6.5 9.086l4.293-4.293a1 1 0 011.414 0z'/%3e%3c/svg%3e"); 
    }

    @media print {
        .no-print { display: none !important; }
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

const parseCurrency = (v) => {
    if (typeof v === 'number') return v;
    return parseFloat(String(v).replace('R$', '').replace(/\./g, '').replace(',', '.').trim()) || 0;
};

// --- ÍCONES SIMPLIFICADOS (sem lucide-react) ---
const Icon = ({ name, className = '' }) => {
  const icons = {
    home: '🏠',
    chart: '📊',
    search: '🔍',
    users: '👥',
    userCheck: '✅',
    target: '🎯',
    fileText: '📝',
    calendar: '📅',
    phone: '📞',
    mapPin: '📍',
    folder: '📁',
    file: '📄',
    megaphone: '📢',
    bell: '🔔',
    settings: '⚙️',
    zap: '⚡',
    trendingUp: '📈',
    clock: '🕐',
    checkCircle: '✅',
    eye: '👁️',
    edit: '✏️',
    trash: '🗑️',
    plus: '➕',
    chevronLeft: '◀',
    chevronRight: '▶'
  };
  
  return <span className={`inline-block ${className}`}>{icons[name] || '🔘'}</span>;
};

function App() {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
    const [activeModule, setActiveModule] = useState('Página Inicial');
    const [settingsTab, setSettingsTab] = useState('perfil');
    
    // DADOS DO FIREBASE
    const [currentTheme, setCurrentTheme] = useState('blue');
    const [clients, setClients] = useState([]);
    const [properties, setProperties] = useState([]);
    const [agenda, setAgenda] = useState([]);
    
    // FILTROS
    const [timeFilter, setTimeFilter] = useState('TODOS');
    const [clientSearch, setClientSearch] = useState('');
    const [clientFilter, setClientFilter] = useState('TODOS');
    const [propertySearch, setPropertySearch] = useState('');
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    
    const [showForm, setShowForm] = useState(false);
    const [viewingProperty, setViewingProperty] = useState(null);
    const [editingId, setEditingId] = useState(null);
    const [saving, setSaving] = useState(false);
    
    // FORM DATA
    const [formData, setFormData] = useState({ 
        name: '', phone: '', email: '', birthDate: '', address: '', interest: '', 
        price: '', type: 'client', obs: '', image: '', date: '', time: '',
        bedrooms: '', garage: '', area: '', propertyStatus: 'PRONTO', developer: '',
        imagesStr: '', videoUrl: '', pdfUrl: '' 
    });
    
    const [wpMessages, setWpMessages] = useState({});
    const [bulkMessage, setBulkMessage] = useState('');
    const [selectedClients, setSelectedClients] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [userProfile, setUserProfile] = useState({ name: 'Alexandre', creci: '', phone: '', address: '', bio: '', photo: '' });
    const [passwords, setPasswords] = useState({ current: '', new: '', confirm: '' });

    const theme = THEMES[currentTheme] || THEMES['blue'];

    // Módulos da Sidebar
    const mainModules = [
        { id: 'dashboard', name: 'Página Inicial', icon: 'home', count: 24, color: 'text-blue-600', bgColor: 'bg-blue-50', borderColor: 'border-blue-200' },
        { id: 'relatorios', name: 'Relatórios', icon: 'chart', count: 12, color: 'text-green-600', bgColor: 'bg-green-50', borderColor: 'border-green-200' },
        { id: 'search', name: 'Pesquisar', icon: 'search', count: null, color: 'text-gray-600', bgColor: 'bg-gray-50', borderColor: 'border-gray-200' },
    ];

    const crmModules = [
        { id: 'clients', name: 'Clientes Potenciais', icon: 'userCheck', count: 24, color: 'text-blue-600', bgColor: 'bg-blue-50', borderColor: 'border-blue-200' },
        { id: 'contacts', name: 'Contatos', icon: 'users', count: 156, color: 'text-green-600', bgColor: 'bg-green-50', borderColor: 'border-green-200' },
        { id: 'deals', name: 'Negócios', icon: 'target', count: 18, color: 'text-orange-600', bgColor: 'bg-orange-50', borderColor: 'border-orange-200' },
        { id: 'tasks', name: 'Tarefas', icon: 'fileText', count: 8, color: 'text-red-600', bgColor: 'bg-red-50', borderColor: 'border-red-200' },
        { id: 'meetings', name: 'Reuniões', icon: 'calendar', count: 5, color: 'text-purple-600', bgColor: 'bg-purple-50', borderColor: 'border-purple-200' },
        { id: 'calls', name: 'Chamadas', icon: 'phone', count: 15, color: 'text-cyan-600', bgColor: 'bg-cyan-50', borderColor: 'border-cyan-200' },
    ];

    const additionalModules = [
        { id: 'campaigns', name: 'Campanhas', icon: 'megaphone', count: 7, color: 'text-pink-600', bgColor: 'bg-pink-50', borderColor: 'border-pink-200' },
        { id: 'documents', name: 'Documentos', icon: 'file', count: 34, color: 'text-yellow-600', bgColor: 'bg-yellow-50', borderColor: 'border-yellow-200' },
        { id: 'visits', name: 'Visitas', icon: 'mapPin', count: 3, color: 'text-teal-600', bgColor: 'bg-teal-50', borderColor: 'border-teal-200' },
        { id: 'projects', name: 'Projects', icon: 'folder', count: 6, color: 'text-indigo-600', bgColor: 'bg-indigo-50', borderColor: 'border-indigo-200' },
    ];

    // LOAD DATA
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
            
        } catch (error) { console.error("Erro ao carregar dados:", error); }
    };

    useEffect(() => {
        const unsub = onAuthStateChanged(auth, (u) => {
            if (u) { 
                setUser(u); 
                loadData(u.uid); 
            } else { 
                setUser(null); 
            }
            setLoading(false);
        });
        return () => unsub();
    }, []);

    // ACTIONS
    const handleThemeChange = (t) => { 
        setCurrentTheme(t); 
        localStorage.setItem('crm_theme', t); 
    };
    
    const saveProfile = () => {
        localStorage.setItem('crm_profile', JSON.stringify(userProfile));
        alert("Perfil salvo!");
    };

    const handlePasswordChange = async () => {
        if(passwords.new !== passwords.confirm) return alert("As senhas não coincidem.");
        if(passwords.new.length < 6) return alert("Senha muito curta.");
        try { 
            await updatePassword(user, passwords.new); 
            alert("Senha atualizada!"); 
            setPasswords({ current: '', new: '', confirm: '' }); 
        } catch (e) { alert("Erro ao atualizar. Faça logout e login."); }
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
            try { 
                await deleteDoc(doc(db, collectionName, id)); 
                loadData(user.uid); 
            } catch (e) { alert("Erro ao excluir."); }
        }
    };

    const openEdit = (item, type) => {
        setEditingId(item.id);
        if (type === 'client') {
            setFormData({ 
                name: item.fullName, 
                phone: maskPhone(item.phones?.[0] || ''), 
                email: item.email || '', 
                birthDate: item.birthDate || '', 
                address: item.address || '', 
                interest: item.interest || '', 
                type: 'client', 
                obs: item.observations || '' 
            });
        }
        if (type === 'property') {
            setFormData({ 
                name: item.title, 
                price: item.price, 
                type: 'property', 
                image: item.image || '',
                bedrooms: item.bedrooms || '', 
                garage: item.garage || '', 
                area: item.area || '',
                propertyStatus: item.propertyStatus || 'PRONTO', 
                developer: item.developer || '',
                videoUrl: item.videoUrl || '', 
                pdfUrl: item.pdfUrl || '',
                imagesStr: item.images ? item.images.join('\n') : ''
            });
        }
        if (type === 'agenda') {
            setFormData({ 
                name: item.title, 
                date: item.date, 
                time: item.time, 
                type: 'agenda', 
                obs: item.type || 'Visita' 
            });
        }
        setShowForm(true);
    };

    const handleSave = async () => {
        if(!formData.name && formData.type !== 'property') return alert("Nome é obrigatório.");
        setSaving(true);
        try {
            const now = new Date().toISOString();
            if(editingId) {
                if(formData.type === 'client') {
                    await updateDoc(doc(db, 'clients', editingId), { 
                        fullName: formData.name, 
                        phones: [formData.phone], 
                        email: formData.email, 
                        birthDate: formData.birthDate, 
                        address: formData.address, 
                        interest: formData.interest, 
                        observations: formData.obs, 
                        updatedAt: now 
                    });
                } else if(formData.type === 'property') {
                    const imgs = formData.imagesStr.split('\n').filter(i => i.trim() !== '');
                    await updateDoc(doc(db, 'properties', editingId), { 
                        title: formData.name, 
                        price: formData.price, 
                        image: formData.image,
                        bedrooms: formData.bedrooms, 
                        garage: formData.garage, 
                        area: formData.area,
                        propertyStatus: formData.propertyStatus, 
                        developer: formData.developer,
                        videoUrl: formData.videoUrl, 
                        pdfUrl: formData.pdfUrl, 
                        images: imgs
                    });
                } else if(formData.type === 'agenda') {
                    await updateDoc(doc(db, 'agenda', editingId), { 
                        title: formData.name, 
                        date: formData.date, 
                        time: formData.time, 
                        type: formData.obs 
                    });
                }
            } else {
                if(formData.type === 'property') {
                    const imgs = formData.imagesStr.split('\n').filter(i => i.trim() !== '');
                    await addDoc(collection(db, 'properties'), { 
                        title: formData.name, 
                        price: formData.price, 
                        image: formData.image, 
                        userId: user.uid,
                        bedrooms: formData.bedrooms, 
                        garage: formData.garage, 
                        area: formData.area,
                        propertyStatus: formData.propertyStatus, 
                        developer: formData.developer,
                        videoUrl: formData.videoUrl, 
                        pdfUrl: formData.pdfUrl, 
                        images: imgs
                    });
                } else if(formData.type === 'agenda') {
                    await addDoc(collection(db, 'agenda'), { 
                        title: formData.name, 
                        date: formData.date, 
                        time: formData.time, 
                        type: formData.obs, 
                        userId: user.uid 
                    });
                } else {
                    await addDoc(collection(db, 'clients'), { 
                        fullName: formData.name, 
                        phones: [formData.phone], 
                        email: formData.email,
                        birthDate: formData.birthDate, 
                        address: formData.address, 
                        interest: formData.interest,
                        observations: formData.obs, 
                        status: 'LEAD', 
                        assignedAgent: user.uid,
                        createdAt: now, 
                        updatedAt: now
                    });
                }
            }
            alert("Salvo com sucesso!"); 
            setShowForm(false); 
            setEditingId(null); 
            setFormData({ 
                name: '', phone: '', email: '', birthDate: '', address: '', interest: '', 
                price: '', type: 'client', obs: '', image: '', date: '', time: '',
                bedrooms: '', garage: '', area: '', propertyStatus: 'PRONTO', developer: '',
                imagesStr: '', videoUrl: '', pdfUrl: '' 
            }); 
            loadData(user.uid);
        } catch (error) { 
            alert("Erro: " + error.message); 
        } finally { 
            setSaving(false); 
        }
    };

    const toggleSelectClient = (id) => {
        if (selectedClients.includes(id)) {
            setSelectedClients(selectedClients.filter(c => c !== id));
        } else {
            setSelectedClients([...selectedClients, id]);
        }
    };

    const sendWp = (phone, msg) => {
        const num = String(phone || '').replace(/\D/g, '');
        if (num) {
            window.open(`https://wa.me/55${num}?text=${encodeURIComponent(msg)}`, '_blank');
        } else {
            alert("Sem telefone.");
        }
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

    // --- CÁLCULOS ---
    const hour = new Date().getHours();
    const greeting = hour < 12 ? 'Bom dia' : hour < 18 ? 'Boa tarde' : 'Boa noite';
    
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

    // FILTROS DE BUSCA
    const filteredClients = clients.filter(c => {
        const matchesSearch = c.fullName.toLowerCase().includes(clientSearch.toLowerCase()) || 
                             String(c.phones?.[0]).includes(clientSearch);
        const matchesFilter = clientFilter === 'TODOS' ? true : (c.status || 'LEAD') === clientFilter;
        return matchesSearch && matchesFilter;
    });

    const filteredProperties = properties.filter(p => 
        p.title.toLowerCase().includes(propertySearch.toLowerCase())
    );

    const dailyEvents = agenda
        .filter(a => a.date === selectedDate)
        .sort((a, b) => (a.time || '').localeCompare(b.time || ''));

    if (loading) return <div className="h-screen flex items-center justify-center font-bold text-slate-400">CARREGANDO SISTEMA...</div>;
    if (!user) return <Login onLogin={setUser} />;

    return (
        <div className="flex h-screen bg-gray-50">
            <TailwindStyle theme={theme} />
            
            {/* Sidebar Nova - Zoho Style */}
            <div className={`flex flex-col bg-white border-r border-gray-200 transition-all duration-300 ${isSidebarCollapsed ? 'w-20' : 'w-64'}`}>
                
                {/* Logo e Toggle */}
                <div className="flex items-center justify-between p-4 border-b border-gray-200">
                    {!isSidebarCollapsed && (
                        <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-800 rounded-lg flex items-center justify-center">
                                <span className="text-white font-bold text-lg">C</span>
                            </div>
                            <div>
                                <h1 className="text-xl font-bold text-gray-900">Meu CRM</h1>
                                <p className="text-xs text-gray-500">Professional</p>
                            </div>
                        </div>
                    )}
                    
                    <button
                        onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors ml-auto"
                    >
                        {isSidebarCollapsed ? (
                            <Icon name="chevronRight" className="text-gray-500 text-lg" />
                        ) : (
                            <Icon name="chevronLeft" className="text-gray-500 text-lg" />
                        )}
                    </button>
                </div>

                {/* Barra de pesquisa */}
                {!isSidebarCollapsed && (
                    <div className="p-4 border-b border-gray-200">
                        <div className="relative">
                            <Icon name="search" className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-lg" />
                            <input
                                type="text"
                                placeholder="Pesquisar módulos..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                        </div>
                    </div>
                )}

                {/* Seção Principal */}
                <div className="p-4">
                    {!isSidebarCollapsed && (
                        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                            Principal
                        </h3>
                    )}
                    <div className="space-y-1">
                        {mainModules.map((module) => (
                            <button
                                key={module.id}
                                onClick={() => setActiveModule(module.name)}
                                className={`w-full flex items-center justify-between p-3 rounded-lg transition-colors ${
                                    activeModule === module.name 
                                        ? `${module.bgColor} ${module.color} border-l-4 ${module.borderColor}` 
                                        : 'hover:bg-gray-50 text-gray-700'
                                }`}
                            >
                                <div className="flex items-center space-x-3">
                                    <div className={`p-2 rounded-md ${activeModule === module.name ? module.bgColor : 'bg-gray-100'}`}>
                                        <Icon name={module.icon} className={`text-lg ${activeModule === module.name ? module.color : 'text-gray-500'}`} />
                                    </div>
                                    {!isSidebarCollapsed && <span className="font-medium">{module.name}</span>}
                                </div>
                                {!isSidebarCollapsed && module.count !== null && (
                                    <span className={`text-xs font-semibold px-2 py-1 rounded-full ${module.bgColor} ${module.color}`}>
                                        {module.count}
                                    </span>
                                )}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Seção Módulos */}
                <div className="p-4 border-t border-gray-100">
                    {!isSidebarCollapsed && (
                        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                            Módulos
                        </h3>
                    )}
                    <div className="space-y-1">
                        {crmModules.map((module) => (
                            <button
                                key={module.id}
                                onClick={() => setActiveModule(module.name)}
                                className={`w-full flex items-center justify-between p-3 rounded-lg transition-colors ${
                                    activeModule === module.name 
                                        ? `${module.bgColor} ${module.color} border-l-4 ${module.borderColor}` 
                                        : 'hover:bg-gray-50 text-gray-700'
                                }`}
                            >
                                <div className="flex items-center space-x-3">
                                    <div className={`p-2 rounded-md ${activeModule === module.name ? module.bgColor : 'bg-gray-100'}`}>
                                        <Icon name={module.icon} className={`text-lg ${activeModule === module.name ? module.color : 'text-gray-500'}`} />
                                    </div>
                                    {!isSidebarCollapsed && <span className="font-medium">{module.name}</span>}
                                </div>
                                {!isSidebarCollapsed && module.count !== null && (
                                    <span className={`text-xs font-semibold px-2 py-1 rounded-full ${module.bgColor} ${module.color}`}>
                                        {module.count}
                                    </span>
                                )}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Seção Adicionais */}
                <div className="p-4 border-t border-gray-100">
                    {!isSidebarCollapsed && (
                        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                            Adicionais
                        </h3>
                    )}
                    <div className="space-y-1">
                        {additionalModules.map((module) => (
                            <button
                                key={module.id}
                                onClick={() => setActiveModule(module.name)}
                                className={`w-full flex items-center justify-between p-3 rounded-lg transition-colors ${
                                    activeModule === module.name 
                                        ? `${module.bgColor} ${module.color} border-l-4 ${module.borderColor}` 
                                        : 'hover:bg-gray-50 text-gray-700'
                                }`}
                            >
                                <div className="flex items-center space-x-3">
                                    <div className={`p-2 rounded-md ${activeModule === module.name ? module.bgColor : 'bg-gray-100'}`}>
                                        <Icon name={module.icon} className={`text-lg ${activeModule === module.name ? module.color : 'text-gray-500'}`} />
                                    </div>
                                    {!isSidebarCollapsed && <span className="font-medium">{module.name}</span>}
                                </div>
                                {!isSidebarCollapsed && module.count !== null && (
                                    <span className={`text-xs font-semibold px-2 py-1 rounded-full ${module.bgColor} ${module.color}`}>
                                        {module.count}
                                    </span>
                                )}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Perfil do Usuário */}
                <div className="mt-auto p-4 border-t border-gray-200 bg-gray-50">
                    <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-700 rounded-full flex items-center justify-center">
                            <span className="text-white font-bold">JS</span>
                        </div>
                        {!isSidebarCollapsed && (
                            <div>
                                <p className="text-sm font-semibold text-gray-800">João Silva</p>
                                <p className="text-xs text-gray-500">Administrador</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Conteúdo Principal */}
            <div className="flex-1 overflow-auto">
                <div className="max-w-7xl mx-auto p-6">
                    {/* Header */}
                    <div className="mb-8">
                        <h1 className="text-3xl font-bold text-gray-900">{activeModule}</h1>
                        <p className="text-gray-600 mt-2">
                            Bem-vindo ao seu CRM. Gerencie seus clientes e negócios de forma eficiente.
                        </p>
                    </div>

                    {/* DASHBOARD */}
                    {activeModule === 'Página Inicial' && (
                        <div className="space-y-8 animate-fadeIn">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                {/* Visão Geral */}
                                <div className="bg-white rounded-xl shadow border border-gray-200 p-6">
                                    <div className="flex items-center justify-between mb-6">
                                        <h3 className="text-lg font-semibold text-gray-800">Visão Geral</h3>
                                        <Icon name="chart" className="text-blue-500 text-2xl" />
                                    </div>
                                    <div className="space-y-4">
                                        <div className="flex justify-between items-center py-3 border-b border-gray-100">
                                            <div className="flex items-center space-x-3">
                                                <div className="p-2 rounded-lg bg-blue-50">
                                                    <Icon name="target" className="text-blue-600 text-lg" />
                                                </div>
                                                <span className="text-gray-700">Negócios Ativos</span>
                                            </div>
                                            <span className="text-xl font-bold text-blue-600">18</span>
                                        </div>
                                        <div className="flex justify-between items-center py-3 border-b border-gray-100">
                                            <div className="flex items-center space-x-3">
                                                <div className="p-2 rounded-lg bg-green-50">
                                                    <Icon name="users" className="text-green-600 text-lg" />
                                                </div>
                                                <span className="text-gray-700">Contatos</span>
                                            </div>
                                            <span className="text-xl font-bold text-green-600">156</span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <div className="flex items-center space-x-3">
                                                <div className="p-2 rounded-lg bg-red-50">
                                                    <Icon name="fileText" className="text-red-600 text-lg" />
                                                </div>
                                                <span className="text-gray-700">Tarefas Pendentes</span>
                                            </div>
                                            <span className="text-xl font-bold text-red-600">8</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Atividades Recentes */}
                                <div className="bg-white rounded-xl shadow border border-gray-200 p-6">
                                    <div className="flex items-center justify-between mb-6">
                                        <h3 className="text-lg font-semibold text-gray-800">Atividades Recentes</h3>
                                        <Icon name="clock" className="text-green-500 text-2xl" />
                                    </div>
                                    <div className="space-y-4">
                                        <div className="flex items-start space-x-3 group hover:bg-gray-50 p-2 rounded-lg transition-colors">
                                            <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                                            <div className="flex-1">
                                                <p className="text-gray-700 text-sm">Novo cliente potencial adicionado</p>
                                                <p className="text-xs text-gray-500 mt-1">5 min atrás</p>
                                            </div>
                                        </div>
                                        <div className="flex items-start space-x-3 group hover:bg-gray-50 p-2 rounded-lg transition-colors">
                                            <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                                            <div className="flex-1">
                                                <p className="text-gray-700 text-sm">Reunião agendada para amanhã</p>
                                                <p className="text-xs text-gray-500 mt-1">1 hora atrás</p>
                                            </div>
                                        </div>
                                        <div className="flex items-start space-x-3 group hover:bg-gray-50 p-2 rounded-lg transition-colors">
                                            <div className="w-2 h-2 bg-orange-500 rounded-full mt-2 flex-shrink-0"></div>
                                            <div className="flex-1">
                                                <p className="text-gray-700 text-sm">Negócio em andamento</p>
                                                <p className="text-xs text-gray-500 mt-1">2 horas atrás</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Ações Rápidas */}
                                <div className="bg-white rounded-xl shadow border border-gray-200 p-6">
                                    <div className="flex items-center justify-between mb-6">
                                        <h3 className="text-lg font-semibold text-gray-800">Ações Rápidas</h3>
                                        <Icon name="zap" className="text-orange-500 text-2xl" />
                                    </div>
                                    <div className="space-y-3">
                                        <button className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 px-4 rounded-lg font-medium transition-colors flex items-center justify-center space-x-2">
                                            <Icon name="plus" className="text-lg" />
                                            <span>Novo Cliente Potencial</span>
                                        </button>
                                        <button className="w-full border border-blue-600 text-blue-600 hover:bg-blue-50 py-3 px-4 rounded-lg font-medium transition-colors flex items-center justify-center space-x-2">
                                            <Icon name="calendar" className="text-lg" />
                                            <span>Agendar Reunião</span>
                                        </button>
                                        <button className="w-full border border-gray-300 text-gray-700 hover:bg-gray-50 py-3 px-4 rounded-lg font-medium transition-colors flex items-center justify-center space-x-2">
                                            <Icon name="fileText" className="text-lg" />
                                            <span>Criar Tarefa</span>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* CLIENTES POTENCIAIS */}
                    {activeModule === 'Clientes Potenciais' && (
                        <div className="space-y-6 animate-fadeIn">
                            <div className="flex flex-col lg:flex-row justify-between items-end lg:items-center gap-4">
                                <div className="flex-1 w-full lg:w-auto flex flex-col gap-4">
                                    <div className="relative">
                                        <input 
                                            placeholder="Buscar por nome ou telefone..." 
                                            value={clientSearch} 
                                            onChange={e => setClientSearch(e.target.value)} 
                                            className="settings-input pl-10" 
                                        />
                                        <Icon name="search" className="absolute left-3 top-3.5 text-slate-400" />
                                    </div>
                                    <div className="flex gap-2 overflow-x-auto pb-1">
                                        {['TODOS', 'LEAD', 'AGENDADO', 'PROPOSTA', 'FECHADO'].map(status => (
                                            <button 
                                                key={status} 
                                                onClick={() => setClientFilter(status)}
                                                className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase transition whitespace-nowrap ${
                                                    clientFilter === status 
                                                        ? 'bg-blue-600 text-white shadow-md' 
                                                        : 'bg-white text-slate-500 border border-slate-200'
                                                }`}
                                            >
                                                {status}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <button 
                                    onClick={() => { 
                                        setEditingId(null); 
                                        setFormData({ 
                                            name: '', phone: '', email: '', birthDate: '', address: '', interest: '', 
                                            obs: '', type: 'client' 
                                        }); 
                                        setShowForm(true); 
                                    }} 
                                    className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl text-xs uppercase shadow-lg whitespace-nowrap transition-colors"
                                >
                                    + Novo Cliente
                                </button>
                            </div>
                            
                            <p className="text-xs font-bold opacity-50 uppercase">
                                Mostrando {filteredClients.length} de {clients.length} clientes
                            </p>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {filteredClients.map(client => (
                                    <div key={client.id} className="glass-panel p-6 relative group hover:border-blue-400 flex flex-col">
                                        <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition z-10">
                                            <button onClick={() => openEdit(client, 'client')} className="p-2 bg-slate-100 rounded-lg text-slate-500 hover:text-blue-600 shadow-sm transition">
                                                <Icon name="edit" className="text-sm" />
                                            </button>
                                            <button onClick={(e) => deleteItem('clients', client.id, e)} className="p-2 bg-slate-100 rounded-lg text-slate-500 hover:text-red-500 shadow-sm transition">
                                                <Icon name="trash" className="text-sm" />
                                            </button>
                                        </div>
                                        <div className="flex items-start gap-4 mb-4">
                                            <div className="w-12 h-12 rounded-full bg-slate-100 border border-white shadow-inner flex items-center justify-center text-lg font-black text-slate-400 flex-shrink-0">
                                                {client.fullName.charAt(0)}
                                            </div>
                                            <div className="overflow-hidden">
                                                <h4 className="font-black text-base uppercase leading-tight truncate">{client.fullName}</h4>
                                                <p className="text-[10px] font-bold text-blue-500 uppercase mt-1">{client.interest || 'Interesse não informado'}</p>
                                                <span className={`inline-block mt-2 text-[9px] font-bold uppercase px-2 py-0.5 rounded-md ${
                                                    client.status === 'FECHADO' ? 'bg-green-100 text-green-700' : 
                                                    client.status === 'PROPOSTA' ? 'bg-purple-100 text-purple-700' : 
                                                    'bg-slate-100 text-slate-500'
                                                }`}>
                                                    {client.status || 'LEAD'}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="bg-slate-50/50 rounded-xl p-3 space-y-2 mb-4 border border-slate-100">
                                            <div className="grid grid-cols-2 gap-2">
                                                <div>
                                                    <p className="text-[9px] font-bold uppercase opacity-50">Telefone</p>
                                                    <p className="text-[10px] font-bold truncate">{maskPhone(client.phones?.[0])}</p>
                                                </div>
                                                <div>
                                                    <p className="text-[9px] font-bold uppercase opacity-50">Nascimento</p>
                                                    <p className="text-[10px] font-bold truncate">{formatDate(client.birthDate)}</p>
                                                </div>
                                            </div>
                                            <div>
                                                <p className="text-[9px] font-bold uppercase opacity-50">Email</p>
                                                <p className="text-[10px] font-bold truncate">{client.email || '-'}</p>
                                            </div>
                                        </div>
                                        {client.observations && (
                                            <div className="mb-4 text-[10px] italic opacity-60 bg-yellow-50 p-2 rounded-lg border border-yellow-100 line-clamp-3">
                                                "{client.observations}"
                                            </div>
                                        )}
                                        <div className="mt-auto pt-2">
                                            <textarea 
                                                placeholder="Escreva a mensagem aqui..." 
                                                className="w-full text-xs p-2 bg-white border border-slate-200 rounded-lg mb-2 h-16 outline-none focus:border-green-400 transition resize-none" 
                                                value={wpMessages[client.id] || ''} 
                                                onChange={(e) => setWpMessages({...wpMessages, [client.id]: e.target.value})} 
                                                onClick={(e) => e.stopPropagation()} 
                                            />
                                            <button 
                                                onClick={() => sendWp(client.phones?.[0], wpMessages[client.id] || '')} 
                                                className="flex items-center justify-center gap-2 w-full py-3 bg-green-500 text-white rounded-xl font-black uppercase text-xs tracking-wider shadow-lg hover:bg-green-600 transition"
                                            >
                                                Enviar WhatsApp ➜
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* RELATÓRIOS */}
                    {activeModule === 'Relatórios' && (
                        <div className="space-y-8 animate-fadeIn">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div className="glass-panel p-8 border-t-4 border-blue-500">
                                    <p className="opacity-50 text-xs font-bold uppercase mb-2">Conversão</p>
                                    <p className="text-4xl font-black">{conversionRate}%</p>
                                    <p className="text-[10px] opacity-50 mt-2">{salesCount} vendas de {clients.length} leads</p>
                                </div>
                                <div className="glass-panel p-8 border-t-4 border-blue-500">
                                    <p className="opacity-50 text-xs font-bold uppercase mb-2">Ticket Médio (Imóveis)</p>
                                    <p className="text-3xl font-black">{avgTicket.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })}</p>
                                    <p className="text-[10px] opacity-50 mt-2">Baseado em {properties.length} imóveis</p>
                                </div>
                                <div className="glass-panel p-8 border-t-4 border-green-500 bg-green-50 border-green-500">
                                    <p className="opacity-50 text-xs font-bold uppercase mb-2 text-green-800">Comissão Potencial (5%)</p>
                                    <p className="text-3xl font-black text-green-600">{(totalVGV * 0.05).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })}</p>
                                    <p className="text-[10px] opacity-50 mt-2 text-green-700">Se vender toda a carteira</p>
                                </div>
                            </div>
                            
                            <div className="glass-panel p-6">
                                <h3 className="text-lg font-black uppercase mb-4">Funil de Vendas</h3>
                                <div className="h-64">
                                    <ResponsiveContainer width="100%" height="100%">
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
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default App;
