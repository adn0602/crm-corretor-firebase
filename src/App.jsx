import React, { useState, useEffect } from 'react';
import { db, auth } from './firebase/config';
import { collection, addDoc, getDocs, query, where, updateDoc, doc, deleteDoc } from 'firebase/firestore';
import { onAuthStateChanged, signOut } from 'firebase/auth';
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
      margin: 0; 
      font-size: 16px; 
    }
    
    .glass-panel { 
      background: white; 
      border: 1px solid #e2e8f0; 
      border-radius: 1rem; 
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
    }
    
    .btn-primary { 
      background: var(--primary); 
      color: white; 
      font-weight: 700; 
      border-radius: 0.75rem; 
      transition: 0.2s; 
      cursor: pointer; 
      border: none; 
      font-size: 1rem; 
      padding: 12px 24px;
    }
    
    .btn-primary:hover { 
      background: var(--secondary); 
      transform: scale(1.02); 
    }
    
    .settings-input { 
      width: 100%; 
      padding: 0.85rem 1rem; 
      background-color: #f8fafc; 
      border-radius: 0.75rem; 
      border: 1px solid #cbd5e1; 
      outline: none; 
      font-size: 1rem; 
      transition: border-color 0.2s;
    }
    
    .settings-input:focus { 
      border-color: var(--primary); 
      box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
    }
    
    .sidebar-active { 
      background-color: #eff6ff; 
      color: #2563eb; 
      border-left: 4px solid #2563eb; 
    }
    
    .custom-checkbox { 
      width: 1.4rem; 
      height: 1.4rem; 
      border-radius: 0.4rem; 
      border: 2px solid #cbd5e1; 
      appearance: none; 
      cursor: pointer; 
      position: relative;
    }
    
    .custom-checkbox:checked { 
      background-color: var(--primary); 
      border-color: var(--primary); 
    }
    
    .custom-checkbox:checked::after {
      content: '✓';
      position: absolute;
      color: white;
      font-weight: bold;
      font-size: 0.9rem;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
    }
    
    .agenda-card { 
      padding: 16px; 
      border-radius: 8px; 
      border-left: 4px solid; 
      margin-bottom: 10px; 
      font-size: 0.95rem; 
      background: #fff; 
      box-shadow: 0 2px 4px rgba(0,0,0,0.05); 
    }
    
    /* SCROLLBAR CUSTOMIZADA */
    .modal-scroll::-webkit-scrollbar { width: 8px; }
    .modal-scroll::-webkit-scrollbar-track { background: #f1f1f1; border-radius: 4px; }
    .modal-scroll::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 4px; }
    .modal-scroll::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
    
    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(10px); }
      to { opacity: 1; transform: translateY(0); }
    }
    
    .animate-fadeIn { 
      animation: fadeIn 0.4s ease-out forwards; 
    }
  `}</style>
);

const formatDate = (val) => {
    if(!val) return '-';
    if(val?.seconds) return new Date(val.seconds * 1000).toLocaleDateString('pt-BR');
    const d = String(val);
    if(d.includes('T')) {
        const dateObj = new Date(d);
        return new Date(dateObj.valueOf() + dateObj.getTimezoneOffset() * 60000).toLocaleDateString('pt-BR');
    }
    const parts = d.split('-');
    if(parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
    return d;
};

const maskPhone = (v) => {
    let r = String(v || '').replace(/\D/g, "");
    if (r.length > 10) return r.replace(/^(\d\d)(\d{5})(\d{4}).*/, "($1) $2-$3");
    return r.replace(/^(\d\d)(\d{4})(\d{0,4}).*/, "($1) $2-$3");
};

const maskCurrency = (v) => {
    let r = String(v || '').replace(/\D/g, "");
    r = (Number(r) / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    return r;
};

const parseCurrency = (v) => {
    if (typeof v === 'number') return v;
    return parseFloat(String(v).replace('R$', '').replace(/\./g, '').replace(',', '.').trim()) || 0;
};

const formatCurrency = (val) => val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

function App() {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
    const [activeModule, setActiveModule] = useState('Página Inicial');
    
    // DADOS DO FIREBASE
    const [clients, setClients] = useState([]);
    const [properties, setProperties] = useState([]);
    const [agenda, setAgenda] = useState([]);
    const [currentTheme, setCurrentTheme] = useState('blue');
    
    // ESTADOS DE FILTRO E BUSCA
    const [clientSearch, setClientSearch] = useState('');
    const [propertySearch, setPropertySearch] = useState('');
    
    // ESTADOS AUXILIARES ATUALIZADOS
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [saving, setSaving] = useState(false);
    const [viewingProperty, setViewingProperty] = useState(null);
    
    // FORM DATA UNIFICADO (AGORA COM A FICHA COMPLETA DO IMÓVEL)
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
    
    // MENSAGENS WHATSAPP
    const [wpMessages, setWpMessages] = useState({});
    const [bulkMessage, setBulkMessage] = useState('');
    const [selectedClients, setSelectedClients] = useState([]);
    
    const [userProfile, setUserProfile] = useState({ 
        name: 'Alexandre', 
        creci: '', 
        phone: '', 
        address: '', 
        bio: '', 
        photo: '' 
    });
    
    const [currentImgIndex, setCurrentImgIndex] = useState(0);
    const [fluxo, setFluxo] = useState({ 
        ato: 0, 
        mensaisQtd: 36, 
        mensaisVal: 0, 
        interQtd: 5, 
        interVal: 0, 
        chaves: 0 
    });

    const theme = THEMES[currentTheme] || THEMES['blue'];

    const loadData = async (userId) => {
        try {
            // Carregar clientes
            const qC = query(collection(db, 'clients'), where("assignedAgent", "==", userId));
            const snapC = await getDocs(qC);
            setClients(snapC.docs.map(d => ({ id: d.id, ...d.data() })));
            
            // Carregar propriedades
            const qP = query(collection(db, 'properties'), where("userId", "==", userId));
            const snapP = await getDocs(qP);
            setProperties(snapP.docs.map(d => ({ id: d.id, ...d.data() })));
            
            // Carregar agenda
            const qA = query(collection(db, 'agenda'), where("userId", "==", userId));
            const snapA = await getDocs(qA);
            setAgenda(snapA.docs.map(d => ({ id: d.id, ...d.data() })));
            
            // Carregar perfil salvo
            const savedProfile = localStorage.getItem('crm_profile');
            if(savedProfile) {
                try {
                    setUserProfile(JSON.parse(savedProfile));
                } catch (e) {
                    console.error('Erro ao carregar perfil:', e);
                }
            }
        } catch (e) { 
            console.error('Erro ao carregar dados:', e); 
        }
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

    const sendWp = (phone, msg) => {
        const num = String(phone || '').replace(/\D/g, '');
        if (num && msg) {
            window.open(`https://wa.me/55${num}?text=${encodeURIComponent(msg)}`, '_blank');
        } else {
            alert("Número de telefone ou mensagem inválida.");
        }
    };

    // FUNÇÃO openEdit ATUALIZADA
    const openEdit = (item, type) => {
        setEditingId(item.id);
        if (type === 'client') {
            setFormData({ 
                ...formData,
                type: 'client',
                name: item.fullName || '', 
                phone: item.phones?.[0] || '', 
                email: item.email || '', 
                birthDate: item.birthDate || '', 
                address: item.address || '', 
                interest: item.interest || '', 
                obs: item.observations || '' 
            });
        } else if (type === 'property') {
            setFormData({
                ...formData,
                type: 'property',
                title: item.title || '', 
                price: item.price || '', 
                image: item.image || '',
                developer: item.developer || '', 
                linktree: item.linktree || '', 
                paymentPlan: item.paymentPlan || '', 
                units: item.units || '', 
                ebookUrl: item.ebookUrl || '',
                bedrooms: item.bedrooms || '', 
                bathrooms: item.bathrooms || '', 
                garage: item.garage || '',
                salesStart: item.salesStart || '', 
                constructionStart: item.constructionStart || '', 
                deliveryDate: item.deliveryDate || '', 
                constructionStatus: item.constructionStatus || 'Planta',
                address: item.address || ''
            });
        } else if (type === 'agenda') {
            setFormData({ 
                ...formData,
                type: 'agenda',
                name: item.title || '', 
                date: item.date || '', 
                time: item.time || '', 
                obs: item.type || 'Visita' 
            });
        }
        setShowForm(true);
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const now = new Date().toISOString();
            
            if (formData.type === 'client') {
                const clientData = { 
                    fullName: formData.name, 
                    phones: [formData.phone], 
                    email: formData.email,
                    birthDate: formData.birthDate, 
                    address: formData.address, 
                    interest: formData.interest,
                    observations: formData.obs,
                    updatedAt: now
                };
                
                if (editingId) {
                    await updateDoc(doc(db, 'clients', editingId), clientData);
                } else {
                    await addDoc(collection(db, 'clients'), { 
                        ...clientData, 
                        status: 'LEAD', 
                        assignedAgent: user.uid, 
                        createdAt: now 
                    });
                }

            } else if (formData.type === 'property') {
                const propertyData = {
                    title: formData.title, 
                    price: formData.price, 
                    image: formData.image,
                    developer: formData.developer,
                    linktree: formData.linktree, 
                    paymentPlan: formData.paymentPlan, 
                    units: formData.units, 
                    ebookUrl: formData.ebookUrl,
                    bedrooms: formData.bedrooms, 
                    bathrooms: formData.bathrooms, 
                    garage: formData.garage,
                    salesStart: formData.salesStart, 
                    constructionStart: formData.constructionStart, 
                    deliveryDate: formData.deliveryDate,
                    constructionStatus: formData.constructionStatus, 
                    address: formData.address,
                    updatedAt: now
                };
                
                if (editingId) {
                    await updateDoc(doc(db, 'properties', editingId), propertyData);
                } else {
                    await addDoc(collection(db, 'properties'), { 
                        ...propertyData, 
                        userId: user.uid, 
                        createdAt: now 
                    });
                }
            
            } else if (formData.type === 'agenda') {
                const agendaData = { 
                    title: formData.name, 
                    date: formData.date, 
                    time: formData.time, 
                    type: formData.obs,
                    updatedAt: now 
                };
                
                if (editingId) {
                    await updateDoc(doc(db, 'agenda', editingId), agendaData);
                } else {
                    await addDoc(collection(db, 'agenda'), { 
                        ...agendaData, 
                        userId: user.uid, 
                        createdAt: now 
                    });
                }
            }
            
            setShowForm(false); 
            setEditingId(null);
            setFormData({ 
                name: '', phone: '', email: '', birthDate: '', address: '', interest: '', 
                type: 'client', obs: '', date: '', time: '',
                title: '', price: '', image: '', developer: '', linktree: '', paymentPlan: '', 
                units: '', ebookUrl: '', bedrooms: '', bathrooms: '', garage: '',
                salesStart: '', constructionStart: '', deliveryDate: '', constructionStatus: 'Planta'
            });
            
            loadData(user.uid);
            alert("Salvo com sucesso!");
            
        } catch (e) { 
            console.error('Erro ao salvar:', e);
            alert("Erro ao salvar: " + e.message); 
        } finally { 
            setSaving(false); 
        }
    };

    const deleteItem = async (collectionName, id, e) => {
        if (e) e.stopPropagation();
        if (window.confirm("Tem certeza que deseja excluir este item?")) {
            try {
                await deleteDoc(doc(db, collectionName, id));
                loadData(user.uid);
                alert("Item excluído com sucesso!");
            } catch (error) {
                console.error('Erro ao excluir:', error);
                alert("Erro ao excluir item.");
            }
        }
    };

    const openPropertyDetails = (p) => {
        setViewingProperty(p);
        setCurrentImgIndex(0);
        const price = parseCurrency(p.price);
        setFluxo({ 
            ato: price * 0.1, 
            mensaisQtd: 36, 
            mensaisVal: (price * 0.4) / 36, 
            interQtd: 3, 
            interVal: (price * 0.2) / 3, 
            chaves: price * 0.3 
        });
    };

    const totalVGV = properties.reduce((acc, c) => acc + parseCurrency(c.price || 0), 0);
    const funnelData = [
        { 
            name: 'Lead', 
            value: clients.filter(c => !c.status || c.status === 'LEAD').length, 
            color: '#94a3b8' 
        },
        { 
            name: 'Visita', 
            value: clients.filter(c => c.status === 'AGENDADO').length, 
            color: '#f59e0b' 
        },
        { 
            name: 'Proposta', 
            value: clients.filter(c => c.status === 'PROPOSTA').length, 
            color: '#8b5cf6' 
        },
        { 
            name: 'Fechado', 
            value: clients.filter(c => c.status === 'FECHADO').length, 
            color: '#10b981' 
        },
    ];

    if (loading) {
        return (
            <div className="h-screen flex items-center justify-center font-bold text-gray-400 text-lg">
                CARREGANDO SISTEMA...
            </div>
        );
    }

    if (!user) {
        return <Login onLogin={setUser} />;
    }

    const filteredClients = clients.filter(c => 
        c.fullName?.toLowerCase().includes(clientSearch.toLowerCase()) ||
        c.email?.toLowerCase().includes(clientSearch.toLowerCase()) ||
        c.phones?.[0]?.includes(clientSearch)
    );

    const filteredProperties = properties.filter(p => 
        p.title?.toLowerCase().includes(propertySearch.toLowerCase()) ||
        p.developer?.toLowerCase().includes(propertySearch.toLowerCase()) ||
        p.address?.toLowerCase().includes(propertySearch.toLowerCase())
    );

    return (
        <div className="flex h-screen bg-gray-50 overflow-hidden text-base">
            <TailwindStyle theme={theme} />
            
            {/* SIDEBAR */}
            <aside className={`bg-white border-r flex flex-col transition-all duration-300 ${isSidebarCollapsed ? 'w-24' : 'w-72'}`}>
                <div className="p-6 border-b flex items-center justify-between">
                    {!isSidebarCollapsed && (
                        <span className="font-bold text-2xl tracking-tighter">
                            ALEXANDRE<span className="text-blue-600">CRM</span>
                        </span>
                    )}
                    <button 
                        onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)} 
                        className="p-2 border-none bg-transparent cursor-pointer hover:bg-gray-100 rounded-lg"
                    >
                        {isSidebarCollapsed ? '▶' : '◀'}
                    </button>
                </div>
                
                <nav className="flex-1 p-4 space-y-2">
                    {[
                        {id: 'Página Inicial', i: '📊'},
                        {id: 'Relatórios', i: '📈'},
                        {id: 'Clientes Potenciais', i: '👥'},
                        {id: 'Imóveis', i: '🏠'},
                        {id: 'WhatsApp', i: '💬'},
                        {id: 'Agenda', i: '📅'}
                    ].map(m => (
                        <button 
                            key={m.id} 
                            onClick={() => setActiveModule(m.id)}
                            className={`w-full flex items-center gap-4 p-4 rounded-xl transition border-none cursor-pointer text-left ${
                                activeModule === m.id ? 'sidebar-active' : 'text-gray-600 bg-transparent hover:bg-gray-50'
                            }`}
                        >
                            <span className="text-xl">{m.i}</span>
                            {!isSidebarCollapsed && (
                                <span className="text-base font-semibold">{m.id}</span>
                            )}
                        </button>
                    ))}
                </nav>
                
                <div className="p-4 border-t">
                    <button 
                        onClick={() => signOut(auth)}
                        className="w-full py-3 text-red-500 hover:bg-red-50 rounded-xl font-bold text-sm"
                    >
                        Sair
                    </button>
                </div>
            </aside>

            {/* CONTEÚDO PRINCIPAL */}
            <main className="flex-1 overflow-y-auto p-8">
                <header className="flex justify-between items-center mb-10">
                    <div>
                        <h1 className="text-4xl font-bold text-gray-900">{activeModule}</h1>
                        <p className="text-gray-600 mt-2">
                            Bem-vindo ao seu CRM. Gerencie seus clientes e negócios de forma eficiente.
                        </p>
                    </div>
                    
                    <div className="flex items-center gap-4">
                        <div className="text-right">
                            <p className="text-sm font-bold uppercase">{userProfile.name}</p>
                            <p className="text-xs text-blue-600 font-bold">
                                CRECI {userProfile.creci || 'NÃO INFORMADO'}
                            </p>
                        </div>
                        {userProfile.photo ? (
                            <img 
                                src={userProfile.photo} 
                                className="w-12 h-12 rounded-full border" 
                                alt="perfil" 
                            />
                        ) : (
                            <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold">
                                {userProfile.name?.charAt(0) || 'A'}
                            </div>
                        )}
                    </div>
                </header>

                {/* PÁGINA INICIAL */}
                {activeModule === 'Página Inicial' && (
                    <div className="space-y-8 animate-fadeIn">
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                            <div className="glass-panel p-8 border-l-4 border-blue-500">
                                <p className="text-sm font-bold text-gray-400 uppercase">Leads Ativos</p>
                                <p className="text-4xl font-black">{clients.length}</p>
                            </div>
                            <div className="glass-panel p-8 border-l-4 border-green-500">
                                <p className="text-sm font-bold text-gray-400 uppercase">VGV Carteira</p>
                                <p className="text-3xl font-black">{formatCurrency(totalVGV)}</p>
                            </div>
                            <div className="glass-panel p-8 border-l-4 border-purple-500">
                                <p className="text-sm font-bold text-gray-400 uppercase">Vendas Fechadas</p>
                                <p className="text-4xl font-black">
                                    {clients.filter(c => c.status === 'FECHADO').length}
                                </p>
                            </div>
                            <div className="glass-panel p-8 border-l-4 border-orange-500">
                                <p className="text-sm font-bold text-gray-400 uppercase">Total Imóveis</p>
                                <p className="text-4xl font-black">{properties.length}</p>
                            </div>
                        </div>
                        
                        <div className="glass-panel p-8 h-[500px]">
                            <h3 className="font-bold text-lg mb-6 text-gray-500">Funil de Conversão</h3>
                            <ResponsiveContainer width="100%" height="90%">
                                <BarChart data={funnelData} layout="vertical">
                                    <XAxis type="number" hide />
                                    <YAxis 
                                        dataKey="name" 
                                        type="category" 
                                        width={100} 
                                        tick={{fontSize: 14, fontWeight: 700}} 
                                        axisLine={false} 
                                    />
                                    <Tooltip />
                                    <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={45}>
                                        {funnelData.map((e, i) => (
                                            <Cell key={i} fill={e.color} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                )}

                {/* RELATÓRIOS */}
                {activeModule === 'Relatórios' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-fadeIn">
                        <div className="glass-panel p-8">
                            <h3 className="font-bold text-sm uppercase opacity-50 mb-6">Distribuição</h3>
                            <div className="h-80">
                                <ResponsiveContainer>
                                    <PieChart>
                                        <Pie 
                                            data={funnelData} 
                                            dataKey="value" 
                                            innerRadius={80} 
                                            outerRadius={110} 
                                            paddingAngle={5}
                                        >
                                            {funnelData.map((e, i) => (
                                                <Cell key={i} fill={e.color} />
                                            ))}
                                        </Pie>
                                        <Tooltip />
                                        <Legend />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                        
                        <div className="glass-panel p-8">
                            <h3 className="font-bold text-sm uppercase opacity-50 mb-6">Resumo</h3>
                            <p className="text-3xl font-black mb-6">
                                {formatCurrency(totalVGV)} em carteira
                            </p>
                            <div className="space-y-4">
                                <div>
                                    <p className="text-sm text-gray-500">Total de Clientes</p>
                                    <p className="text-2xl font-bold">{clients.length}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500">Taxa de Conversão</p>
                                    <p className="text-2xl font-bold">
                                        {clients.length > 0 
                                            ? `${((clients.filter(c => c.status === 'FECHADO').length / clients.length) * 100).toFixed(1)}%`
                                            : '0%'
                                        }
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* CLIENTES POTENCIAIS */}
                {activeModule === 'Clientes Potenciais' && (
                    <div className="space-y-8 animate-fadeIn">
                        <div className="flex justify-between items-center gap-4">
                            <input 
                                placeholder="🔍 Buscar por nome, email ou telefone..." 
                                value={clientSearch}
                                onChange={e => setClientSearch(e.target.value)}
                                className="settings-input"
                            />
                            <button 
                                onClick={() => { 
                                    setEditingId(null); 
                                    setFormData({
                                        name: '', phone: '', email: '', birthDate: '', 
                                        address: '', interest: '', type: 'client'
                                    }); 
                                    setShowForm(true); 
                                }} 
                                className="btn-primary px-8 py-4 shadow-lg"
                            >
                                + Novo Cliente
                            </button>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {filteredClients.map(client => (
                                <div key={client.id} className="glass-panel p-6 group relative">
                                    <div className="flex items-start justify-between mb-4">
                                        <div className="flex items-center gap-4">
                                            <div className="w-14 h-14 rounded-full bg-slate-100 flex items-center justify-center text-xl font-black text-slate-400">
                                                {client.fullName?.charAt(0) || 'C'}
                                            </div>
                                            <div className="overflow-hidden">
                                                <h4 className="font-black text-lg uppercase leading-tight truncate">
                                                    {client.fullName || 'Nome não informado'}
                                                </h4>
                                                <span className="inline-block mt-2 text-xs font-bold uppercase px-3 py-1 rounded-md bg-blue-50 text-blue-600">
                                                    {client.status || 'LEAD'}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button 
                                                onClick={() => openEdit(client, 'client')}
                                                className="p-2 text-blue-500 bg-blue-50 rounded-lg hover:bg-blue-100 border-none cursor-pointer"
                                                title="Editar"
                                            >
                                                ✏️
                                            </button>
                                            <button 
                                                onClick={(e) => deleteItem('clients', client.id, e)}
                                                className="p-2 text-red-500 bg-red-50 rounded-lg hover:bg-red-100 border-none cursor-pointer"
                                                title="Excluir"
                                            >
                                                🗑️
                                            </button>
                                        </div>
                                    </div>
                                    
                                    <div className="bg-slate-50 rounded-xl p-4 space-y-3 mb-4 text-xs font-bold text-gray-600">
                                        <div className="flex justify-between border-b pb-2 border-slate-200">
                                            <span>📞 {maskPhone(client.phones?.[0]) || 'Sem telefone'}</span>
                                            <span>🎂 {client.birthDate ? formatDate(client.birthDate) : '-'}</span>
                                        </div>
                                        <p className="truncate">📧 {client.email || 'Sem email'}</p>
                                        <p className="truncate">📍 {client.address || 'Sem endereço'}</p>
                                        <div className="pt-2 border-t border-slate-200 mt-2">
                                            <span className="text-[10px] uppercase text-gray-400">Interesse:</span>
                                            <p className="text-blue-600 truncate">{client.interest || 'Não informado'}</p>
                                        </div>
                                    </div>
                                    
                                    <textarea 
                                        placeholder="Mensagem rápida para WhatsApp..." 
                                        className="w-full text-sm p-3 border rounded-lg mb-2 h-20 outline-none focus:border-green-400"
                                        value={wpMessages[client.id] || ''}
                                        onChange={(e) => setWpMessages({...wpMessages, [client.id]: e.target.value})}
                                    />
                                    
                                    <button 
                                        onClick={() => sendWp(client.phones?.[0], wpMessages[client.id] || 'Olá, gostaria de conversar sobre imóveis!')}
                                        className="w-full py-4 bg-green-500 text-white rounded-xl font-black uppercase text-sm shadow-lg cursor-pointer border-none hover:bg-green-600 transition"
                                    >
                                        WhatsApp ➜
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* IMÓVEIS */}
                {activeModule === 'Imóveis' && (
                   <div className="space-y-6 animate-fadeIn">
                       <div className="flex justify-between items-center">
                           <input 
                               placeholder="🔍 Buscar imóveis..." 
                               value={propertySearch}
                               onChange={e => setPropertySearch(e.target.value)}
                               className="settings-input w-96"
                           />
                           <button 
                               onClick={() => { 
                                   setEditingId(null); 
                                   setFormData({ 
                                       type: 'property', 
                                       title: '', price: '', image: '', developer: '', 
                                       linktree: '', paymentPlan: '', units: '', ebookUrl: '', 
                                       bedrooms: '', bathrooms: '', garage: '',
                                       salesStart: '', constructionStart: '', deliveryDate: '', 
                                       constructionStatus: 'Planta', address: '' 
                                   }); 
                                   setShowForm(true); 
                               }} 
                               className="btn-primary px-6 py-3 rounded-xl text-xs uppercase shadow-lg"
                           >
                               + Novo Imóvel
                           </button>
                       </div>
                       
                       <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                           {filteredProperties.map(p => (
                               <div key={p.id} className="glass-panel overflow-hidden group flex flex-col">
                                   {/* Imagem e Badges */}
                                   <div className="prop-image h-48 relative">
                                       {p.image ? (
                                           <img 
                                               src={p.image} 
                                               alt={p.title} 
                                               className="w-full h-full object-cover transition duration-500 group-hover:scale-105" 
                                           />
                                       ) : (
                                           <div className="w-full h-full flex items-center justify-center bg-slate-100 text-slate-300 font-black text-4xl">
                                               🏠
                                           </div>
                                       )}
                                       
                                       <div className="absolute top-4 left-4 flex flex-col gap-1">
                                            <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase shadow-lg ${
                                                p.constructionStatus === 'Pronto' 
                                                    ? 'bg-green-500 text-white' 
                                                    : 'bg-blue-500 text-white'
                                            }`}>
                                                {p.constructionStatus || 'Planta'}
                                            </span>
                                            {p.units && (
                                                <span className="px-3 py-1 rounded-full bg-slate-900 text-white text-[10px] font-bold uppercase shadow-lg">
                                                    {p.units} Unidades
                                                </span>
                                            )}
                                       </div>

                                       <div className="absolute top-4 right-4 flex gap-2">
                                            <button 
                                                onClick={() => openEdit(p, 'property')}
                                                className="w-8 h-8 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center text-slate-600 hover:text-blue-600 shadow-sm transition"
                                            >
                                                ✎
                                            </button>
                                            <button 
                                                onClick={(e) => deleteItem('properties', p.id, e)}
                                                className="w-8 h-8 rounded-full bg-white/90 backdrop-blur-sm flex items-center justify-center text-slate-600 hover:text-red-500 shadow-sm transition"
                                            >
                                                ✕
                                            </button>
                                       </div>
                                   </div>

                                   {/* Corpo do Card */}
                                   <div className="p-6 flex-1 flex flex-col">
                                       <div className="flex justify-between items-start mb-2">
                                           <div>
                                               <p className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">
                                                   {p.developer || 'Incorporadora'}
                                               </p>
                                               <h3 className="font-black text-xl uppercase leading-tight text-slate-800">
                                                   {p.title || 'Sem título'}
                                               </h3>
                                           </div>
                                           <div className="text-right">
                                               <p className="text-xl font-black text-blue-600">
                                                   {p.price || 'Preço não informado'}
                                               </p>
                                           </div>
                                       </div>
                                       
                                       <p className="text-xs text-slate-500 font-medium mb-4 flex items-center gap-1">
                                           📍 {p.address || 'Localização não informada'}
                                       </p>

                                       {/* Especificações */}
                                       <div className="grid grid-cols-3 gap-2 mb-4">
                                           <div className="bg-slate-50 rounded-lg p-2 text-center border border-slate-100">
                                               <span className="block text-lg">🛏️</span>
                                               <span className="text-[10px] font-bold uppercase text-slate-500">
                                                   {p.bedrooms || 0} Quartos
                                               </span>
                                           </div>
                                           <div className="bg-slate-50 rounded-lg p-2 text-center border border-slate-100">
                                               <span className="block text-lg">🚿</span>
                                               <span className="text-[10px] font-bold uppercase text-slate-500">
                                                   {p.bathrooms || 0} Banheiros
                                               </span>
                                           </div>
                                           <div className="bg-slate-50 rounded-lg p-2 text-center border border-slate-100">
                                               <span className="block text-lg">🚗</span>
                                               <span className="text-[10px] font-bold uppercase text-slate-500">
                                                   {p.garage || 0} Vagas
                                               </span>
                                           </div>
                                       </div>

                                       {/* Datas e Fluxo */}
                                       <div className="bg-slate-50 rounded-xl p-3 border border-slate-100 mb-4 space-y-2">
                                           <div className="flex justify-between border-b border-dashed border-slate-200 pb-2">
                                               <span className="text-[10px] font-bold uppercase text-slate-400">Início Obras</span>
                                               <span className="text-[10px] font-bold text-slate-700">
                                                   {p.constructionStart ? new Date(p.constructionStart).toLocaleDateString('pt-BR') : '-'}
                                               </span>
                                           </div>
                                           <div className="flex justify-between border-b border-dashed border-slate-200 pb-2">
                                               <span className="text-[10px] font-bold uppercase text-slate-400">Entrega</span>
                                               <span className="text-[10px] font-bold text-slate-700">
                                                   {p.deliveryDate ? new Date(p.deliveryDate).toLocaleDateString('pt-BR') : '-'}
                                               </span>
                                           </div>
                                           <div>
                                               <span className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Fluxo de Pagamento</span>
                                               <p className="text-xs font-bold text-slate-800">
                                                   {p.paymentPlan || 'Consulte condições'}
                                               </p>
                                           </div>
                                       </div>

                                       {/* Ações */}
                                       <div className="grid grid-cols-2 gap-3 mt-auto">
                                            {p.linktree && (
                                                <a 
                                                    href={p.linktree} 
                                                    target="_blank" 
                                                    rel="noopener noreferrer" 
                                                    className="col-span-2 py-2 bg-slate-100 text-slate-600 rounded-lg font-bold uppercase text-[10px] hover:bg-slate-200 transition text-center no-underline"
                                                >
                                                    🔗 Acessar Linktree / Site
                                                </a>
                                            )}
                                            
                                            {p.ebookUrl ? (
                                                <button 
                                                    onClick={() => {
                                                        const msg = `Olá! Segue o eBook/Apresentação do *${p.title}* que você solicitou: ${p.ebookUrl}`;
                                                        window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank');
                                                    }}
                                                    className="col-span-2 py-3 bg-green-500 text-white rounded-xl font-bold uppercase text-xs hover:bg-green-600 transition shadow-lg flex items-center justify-center gap-2"
                                                >
                                                    📥 Enviar eBook p/ Cliente
                                                </button>
                                            ) : (
                                                <button 
                                                    disabled 
                                                    className="col-span-2 py-3 bg-slate-200 text-slate-400 rounded-xl font-bold uppercase text-xs cursor-not-allowed"
                                                >
                                                    Sem eBook Cadastrado
                                                </button>
                                            )}
                                       </div>
                                   </div>
                               </div>
                           ))}
                       </div>
                   </div>
                )}

                {/* WHATSAPP */}
                {activeModule === 'WhatsApp' && (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-fadeIn h-[calc(100vh-150px)]">
                        <div className="glass-panel p-6 flex flex-col">
                            <h3 className="font-bold text-sm uppercase mb-4">Selecionar Clientes</h3>
                            <div className="flex-1 overflow-y-auto space-y-3">
                                {clients.map(c => (
                                    <div 
                                        key={c.id} 
                                        onClick={() => setSelectedClients(prev => 
                                            prev.includes(c.id) ? prev.filter(x => x !== c.id) : [...prev, c.id]
                                        )} 
                                        className={`p-4 rounded-xl border flex items-center justify-between cursor-pointer transition ${
                                            selectedClients.includes(c.id) 
                                                ? 'bg-blue-50 border-blue-400' 
                                                : 'bg-white border-gray-200'
                                        }`}
                                    >
                                        <p className="text-sm font-bold uppercase truncate max-w-[150px]">
                                            {c.fullName || 'Cliente sem nome'}
                                        </p>
                                        <input 
                                            type="checkbox" 
                                            checked={selectedClients.includes(c.id)} 
                                            readOnly 
                                            className="custom-checkbox"
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>
                        
                        <div className="lg:col-span-2 flex flex-col gap-6">
                            <div className="glass-panel p-6">
                                <h3 className="font-bold text-sm uppercase mb-4">Mensagem em Massa</h3>
                                <textarea 
                                    value={bulkMessage}
                                    onChange={e => setBulkMessage(e.target.value)}
                                    className="w-full h-40 p-5 bg-gray-50 rounded-xl border-none outline-none font-medium text-base resize-none"
                                    placeholder="Escreva aqui sua mensagem para enviar em massa..."
                                />
                            </div>
                            
                            <div className="glass-panel p-10 bg-slate-900 text-white flex flex-col items-center justify-center">
                                <p className="text-sm font-bold opacity-50 uppercase mb-6">
                                    {selectedClients.length} contatos selecionados
                                </p>
                                <button 
                                    onClick={() => {
                                        if (selectedClients.length === 0) {
                                            alert("Selecione pelo menos um cliente.");
                                            return;
                                        }
                                        if (!bulkMessage.trim()) {
                                            alert("Digite uma mensagem para enviar.");
                                            return;
                                        }
                                        
                                        selectedClients.forEach(id => {
                                            const client = clients.find(c => c.id === id);
                                            if (client) {
                                                sendWp(client.phones?.[0], bulkMessage);
                                            }
                                        });
                                    }}
                                    className="px-16 py-5 bg-green-500 text-white rounded-xl font-black uppercase text-sm border-none cursor-pointer hover:bg-green-600 transition"
                                >
                                    🚀 Disparar WhatsApp
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* AGENDA */}
                {activeModule === 'Agenda' && (
                    <div className="space-y-8 animate-fadeIn">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-2xl font-black uppercase text-gray-700">Agenda Integrada</h3>
                            <button 
                                onClick={() => { 
                                    setFormData({
                                        ...formData,
                                        type: 'agenda', 
                                        date: selectedDate, 
                                        obs: 'Visita'
                                    }); 
                                    setShowForm(true); 
                                }} 
                                className="btn-primary px-8 py-4 shadow-lg"
                            >
                                + Novo Compromisso
                            </button>
                        </div>
                        
                        <div className="glass-panel overflow-hidden mb-8 shadow-md">
                            <iframe 
                                src="https://calendar.google.com/calendar/embed?src=pt.brazilian%23holiday%40group.v.calendar.google.com&ctz=America%2FSao_Paulo&showTitle=0&showNav=1&showDate=1&showPrint=0&showTabs=0&showCalendars=0&showTz=0" 
                                style={{border: 0, width: '100%', height: '800px', overflow: 'hidden'}} 
                                frameBorder="0" 
                                scrolling="no" 
                                title="Google Calendar"
                            ></iframe>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            {['Tarefa', 'Visita', 'Reunião', 'Evento'].map(cat => {
                                const catAgenda = agenda.filter(a => (a.type || 'Reunião') === cat);
                                
                                return (
                                    <div key={cat} className="glass-panel p-5 bg-gray-50 min-h-[250px]">
                                        <div className="flex justify-between items-center mb-4 border-b pb-3 border-gray-200">
                                            <h4 className="font-black uppercase text-sm text-gray-500">{cat}s</h4>
                                            <span className="bg-white px-3 py-1 rounded text-xs font-bold shadow-sm">
                                                {catAgenda.length}
                                            </span>
                                        </div>
                                        <div className="space-y-3">
                                            {catAgenda.map(a => (
                                                <div 
                                                    key={a.id} 
                                                    className="agenda-card group relative"
                                                    style={{
                                                        borderLeftColor: cat === 'Visita' ? '#f59e0b' 
                                                                    : cat === 'Reunião' ? '#2563eb' 
                                                                    : cat === 'Tarefa' ? '#10b981' 
                                                                    : '#8b5cf6'
                                                    }}
                                                >
                                                    <div className="flex justify-between">
                                                        <span className="font-bold text-gray-800 text-sm truncate max-w-[150px]">
                                                            {a.title || 'Sem título'}
                                                        </span>
                                                        <span className="text-xs font-bold opacity-50">
                                                            {a.time || '--:--'}
                                                        </span>
                                                    </div>
                                                    <div className="text-xs text-gray-400 mt-2">
                                                        {formatDate(a.date)}
                                                    </div>
                                                    <button 
                                                        onClick={(e) => deleteItem('agenda', a.id, e)}
                                                        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 text-red-500 font-bold border-none bg-transparent cursor-pointer text-sm hover:text-red-700"
                                                    >
                                                        ✕
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}
            </main>

            {/* MODAL DE FORMULÁRIO */}
            {showForm && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
                    <div className="glass-panel bg-white w-full max-w-2xl p-8 max-h-[90vh] overflow-y-auto">
                        <h3 className="text-xl font-black uppercase mb-6 text-gray-900">
                            {editingId ? 'Editar Registro' : 'Novo Registro'}
                        </h3>
                        
                        <div className="space-y-4">
                            {/* CAMPOS COMUNS */}
                            {(formData.type === 'client' || formData.type === 'agenda') && (
                                <div>
                                    <label className="text-xs font-bold opacity-50 uppercase ml-1 mb-1 block">
                                        Nome / Título
                                    </label>
                                    <input 
                                        className="settings-input mt-1" 
                                        value={formData.name} 
                                        onChange={e => setFormData({...formData, name: e.target.value})}
                                        placeholder={formData.type === 'client' ? 'Nome do cliente' : 'Título do compromisso'}
                                    />
                                </div>
                            )}

                            {/* FORMULÁRIO DE CLIENTE */}
                            {formData.type === 'client' && (
                                <>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="text-xs font-bold opacity-50 uppercase ml-1 mb-1 block">
                                                Telefone / Whats
                                            </label>
                                            <input 
                                                className="settings-input mt-1" 
                                                value={formData.phone} 
                                                onChange={e => setFormData({...formData, phone: e.target.value})}
                                                placeholder="(11) 99999-9999"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-xs font-bold opacity-50 uppercase ml-1 mb-1 block">
                                                Nascimento
                                            </label>
                                            <input 
                                                type="date" 
                                                className="settings-input mt-1" 
                                                value={formData.birthDate} 
                                                onChange={e => setFormData({...formData, birthDate: e.target.value})}
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold opacity-50 uppercase ml-1 mb-1 block">
                                            Email
                                        </label>
                                        <input 
                                            className="settings-input mt-1" 
                                            value={formData.email} 
                                            onChange={e => setFormData({...formData, email: e.target.value})}
                                            placeholder="cliente@email.com"
                                            type="email"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold opacity-50 uppercase ml-1 mb-1 block">
                                            Imóvel Desejado
                                        </label>
                                        <input 
                                            className="settings-input mt-1" 
                                            value={formData.interest} 
                                            onChange={e => setFormData({...formData, interest: e.target.value})}
                                            placeholder="Ex: Apartamento 2 quartos na região central"
                                        />
                                    </div>
                                </>
                            )}
                            
                            {/* FORMULÁRIO DE IMÓVEL */}
                            {formData.type === 'property' && (
                                <div className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="col-span-2">
                                            <label className="text-xs font-bold opacity-50 uppercase ml-1 mb-1 block">
                                                Nome do Empreendimento
                                            </label>
                                            <input 
                                                className="settings-input mt-1" 
                                                value={formData.title} 
                                                onChange={e => setFormData({...formData, title: e.target.value})}
                                                placeholder="Ex: Residencial Jardins"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-xs font-bold opacity-50 uppercase ml-1 mb-1 block">
                                                Incorporadora
                                            </label>
                                            <input 
                                                className="settings-input mt-1" 
                                                value={formData.developer} 
                                                onChange={e => setFormData({...formData, developer: e.target.value})}
                                                placeholder="Nome da construtora"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-xs font-bold opacity-50 uppercase ml-1 mb-1 block">
                                                Preço (A partir de)
                                            </label>
                                            <input 
                                                className="settings-input mt-1" 
                                                value={formData.price} 
                                                onChange={e => setFormData({...formData, price: e.target.value})}
                                                placeholder="R$ 500.000,00"
                                            />
                                        </div>
                                    </div>
                                    
                                    <div>
                                        <label className="text-xs font-bold opacity-50 uppercase ml-1 mb-1 block">
                                            Endereço do Imóvel
                                        </label>
                                        <input 
                                            className="settings-input mt-1" 
                                            value={formData.address} 
                                            onChange={e => setFormData({...formData, address: e.target.value})}
                                            placeholder="Rua, número, bairro, cidade"
                                        />
                                    </div>

                                    <div className="grid grid-cols-4 gap-2">
                                        <div>
                                            <label className="text-xs font-bold opacity-50 uppercase ml-1 mb-1 block">
                                                Quartos
                                            </label>
                                            <input 
                                                type="number" 
                                                className="settings-input mt-1" 
                                                value={formData.bedrooms} 
                                                onChange={e => setFormData({...formData, bedrooms: e.target.value})}
                                                min="0"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-xs font-bold opacity-50 uppercase ml-1 mb-1 block">
                                                Banheiros
                                            </label>
                                            <input 
                                                type="number" 
                                                className="settings-input mt-1" 
                                                value={formData.bathrooms} 
                                                onChange={e => setFormData({...formData, bathrooms: e.target.value})}
                                                min="0"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-xs font-bold opacity-50 uppercase ml-1 mb-1 block">
                                                Vagas
                                            </label>
                                            <input 
                                                type="number" 
                                                className="settings-input mt-1" 
                                                value={formData.garage} 
                                                onChange={e => setFormData({...formData, garage: e.target.value})}
                                                min="0"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-xs font-bold opacity-50 uppercase ml-1 mb-1 block">
                                                Unidades
                                            </label>
                                            <input 
                                                type="number" 
                                                className="settings-input mt-1" 
                                                value={formData.units} 
                                                onChange={e => setFormData({...formData, units: e.target.value})}
                                                min="0"
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-3 gap-2">
                                        <div>
                                            <label className="text-xs font-bold opacity-50 uppercase ml-1 mb-1 block">
                                                Início Vendas
                                            </label>
                                            <input 
                                                type="date" 
                                                className="settings-input mt-1" 
                                                value={formData.salesStart} 
                                                onChange={e => setFormData({...formData, salesStart: e.target.value})}
                                            />
                                        </div>
                                        <div>
                                            <label className="text-xs font-bold opacity-50 uppercase ml-1 mb-1 block">
                                                Início Obras
                                            </label>
                                            <input 
                                                type="date" 
                                                className="settings-input mt-1" 
                                                value={formData.constructionStart} 
                                                onChange={e => setFormData({...formData, constructionStart: e.target.value})}
                                            />
                                        </div>
                                        <div>
                                            <label className="text-xs font-bold opacity-50 uppercase ml-1 mb-1 block">
                                                Entrega
                                            </label>
                                            <input 
                                                type="date" 
                                                className="settings-input mt-1" 
                                                value={formData.deliveryDate} 
                                                onChange={e => setFormData({...formData, deliveryDate: e.target.value})}
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="text-xs font-bold opacity-50 uppercase ml-1 mb-1 block">
                                                Status da Obra
                                            </label>
                                            <select 
                                                className="settings-input mt-1" 
                                                value={formData.constructionStatus} 
                                                onChange={e => setFormData({...formData, constructionStatus: e.target.value})}
                                            >
                                                <option value="Planta">Planta</option>
                                                <option value="Em Construção">Em Construção</option>
                                                <option value="Pronto">Pronto</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="text-xs font-bold opacity-50 uppercase ml-1 mb-1 block">
                                                Fluxo Pagamento
                                            </label>
                                            <input 
                                                className="settings-input mt-1" 
                                                value={formData.paymentPlan} 
                                                onChange={e => setFormData({...formData, paymentPlan: e.target.value})}
                                                placeholder="Ex: 30% obra + financ."
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="text-xs font-bold opacity-50 uppercase ml-1 mb-1 block">
                                            Link URL da Foto
                                        </label>
                                        <input 
                                            className="settings-input mt-1" 
                                            value={formData.image} 
                                            onChange={e => setFormData({...formData, image: e.target.value})}
                                            placeholder="https://..."
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold opacity-50 uppercase ml-1 mb-1 block">
                                            Link PDF eBook (Google Drive/Dropbox)
                                        </label>
                                        <input 
                                            className="settings-input mt-1" 
                                            value={formData.ebookUrl} 
                                            onChange={e => setFormData({...formData, ebookUrl: e.target.value})}
                                            placeholder="https://..."
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold opacity-50 uppercase ml-1 mb-1 block">
                                            Linktree / Site Oficial
                                        </label>
                                        <input 
                                            className="settings-input mt-1" 
                                            value={formData.linktree} 
                                            onChange={e => setFormData({...formData, linktree: e.target.value})}
                                            placeholder="https://..."
                                        />
                                    </div>
                                </div>
                            )}
                            
                            {/* FORMULÁRIO DE AGENDA */}
                            {formData.type === 'agenda' && (
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-xs font-bold opacity-50 uppercase ml-1 mb-1 block">
                                            Data
                                        </label>
                                        <input 
                                            type="date" 
                                            className="settings-input mt-1" 
                                            value={formData.date} 
                                            onChange={e => setFormData({...formData, date: e.target.value})}
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold opacity-50 uppercase ml-1 mb-1 block">
                                            Hora
                                        </label>
                                        <input 
                                            type="time" 
                                            className="settings-input mt-1" 
                                            value={formData.time} 
                                            onChange={e => setFormData({...formData, time: e.target.value})}
                                        />
                                    </div>
                                    <div className="col-span-2">
                                        <label className="text-xs font-bold opacity-50 uppercase ml-1 mb-1 block">
                                            Tipo
                                        </label>
                                        <select 
                                            className="settings-input mt-1" 
                                            value={formData.obs} 
                                            onChange={e => setFormData({...formData, obs: e.target.value})}
                                        >
                                            <option value="Visita">Visita</option>
                                            <option value="Reunião">Reunião</option>
                                            <option value="Tarefa">Tarefa</option>
                                            <option value="Evento">Evento</option>
                                        </select>
                                    </div>
                                </div>
                            )}

                            {!editingId && (
                                <div>
                                    <label className="text-xs font-bold opacity-50 uppercase ml-1 mb-1 block">
                                        Categoria
                                    </label>
                                    <select 
                                        className="settings-input mt-1" 
                                        value={formData.type} 
                                        onChange={e => setFormData({...formData, type: e.target.value})}
                                    >
                                        <option value="client">Cliente</option>
                                        <option value="property">Imóvel</option>
                                        <option value="agenda">Agenda</option>
                                    </select>
                                </div>
                            )}
                        </div>

                        <div className="flex gap-4 mt-8">
                            <button 
                                onClick={handleSave}
                                disabled={saving}
                                className={`btn-primary flex-1 py-4 rounded-xl uppercase shadow-lg ${
                                    saving ? 'opacity-50 cursor-not-allowed' : ''
                                }`}
                            >
                                {saving ? 'SALVANDO...' : 'SALVAR'}
                            </button>
                            <button 
                                onClick={() => {
                                    setShowForm(false);
                                    setEditingId(null);
                                    setFormData({ 
                                        name: '', phone: '', email: '', birthDate: '', address: '', interest: '', 
                                        type: 'client', obs: '', date: '', time: '',
                                        title: '', price: '', image: '', developer: '', linktree: '', paymentPlan: '', 
                                        units: '', ebookUrl: '', bedrooms: '', bathrooms: '', garage: '',
                                        salesStart: '', constructionStart: '', deliveryDate: '', constructionStatus: 'Planta'
                                    });
                                }}
                                className="flex-1 bg-slate-100 text-slate-500 font-bold py-4 rounded-xl uppercase hover:bg-slate-200 transition"
                            >
                                CANCELAR
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL DE DETALHES DO IMÓVEL */}
            {viewingProperty && (
                <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/80 p-6">
                    <div className="bg-white w-full max-w-6xl h-[90vh] rounded-2xl overflow-hidden flex flex-col relative">
                        <button 
                            onClick={() => setViewingProperty(null)}
                            className="absolute top-6 right-6 z-20 w-12 h-12 bg-white rounded-full shadow-lg font-bold cursor-pointer border-none text-xl hover:bg-gray-100 transition"
                        >
                            ✕
                        </button>
                        
                        <div className="flex-1 overflow-y-auto p-12">
                            <div className="mb-10 border-b pb-8">
                                <p className="text-sm font-bold uppercase text-gray-400 mb-2">
                                    {viewingProperty.developer || 'Incorporadora não informada'}
                                </p>
                                <h2 className="text-5xl font-black uppercase mb-4 text-gray-900">
                                    {viewingProperty.title || 'Sem título'}
                                </h2>
                                <p className="text-xl text-gray-600 mb-6 flex items-center gap-2">
                                    📍 {viewingProperty.address || 'Endereço não informado'}
                                </p>
                                <div className="flex gap-4">
                                    {viewingProperty.ebookUrl && (
                                        <a 
                                            href={viewingProperty.ebookUrl} 
                                            target="_blank" 
                                            rel="noopener noreferrer"
                                            className="px-6 py-3 bg-red-50 text-red-600 font-bold rounded-lg uppercase text-xs flex items-center gap-2 no-underline hover:bg-red-100 transition"
                                        >
                                            📄 Ver Apresentação (PDF)
                                        </a>
                                    )}
                                    {viewingProperty.linktree && (
                                        <a 
                                            href={viewingProperty.linktree} 
                                            target="_blank" 
                                            rel="noopener noreferrer"
                                            className="px-6 py-3 bg-green-50 text-green-600 font-bold rounded-lg uppercase text-xs flex items-center gap-2 no-underline hover:bg-green-100 transition"
                                        >
                                            🌳 Ver Linktree
                                        </a>
                                    )}
                                </div>
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                                <div className="lg:col-span-2 space-y-10">
                                    <div className="h-96 bg-gray-200 rounded-2xl overflow-hidden shadow-inner">
                                        {viewingProperty.image ? (
                                            <img 
                                                src={viewingProperty.image} 
                                                className="w-full h-full object-cover" 
                                                alt="Imóvel" 
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-gray-400 text-2xl">
                                                🏠 Sem imagem
                                            </div>
                                        )}
                                    </div>
                                    
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                                        <div className="p-4 bg-gray-50 rounded-xl">
                                            <p className="text-[10px] font-bold uppercase text-gray-400">Status</p>
                                            <p className="font-bold">{viewingProperty.constructionStatus || 'Planta'}</p>
                                        </div>
                                        <div className="p-4 bg-gray-50 rounded-xl">
                                            <p className="text-[10px] font-bold uppercase text-gray-400">Entrega</p>
                                            <p className="font-bold">
                                                {viewingProperty.deliveryDate 
                                                    ? new Date(viewingProperty.deliveryDate).toLocaleDateString('pt-BR') 
                                                    : 'A definir'
                                                }
                                            </p>
                                        </div>
                                        <div className="p-4 bg-gray-50 rounded-xl">
                                            <p className="text-[10px] font-bold uppercase text-gray-400">Quartos</p>
                                            <p className="font-bold">{viewingProperty.bedrooms || 0}</p>
                                        </div>
                                        <div className="p-4 bg-gray-50 rounded-xl">
                                            <p className="text-[10px] font-bold uppercase text-gray-400">Vagas</p>
                                            <p className="font-bold">{viewingProperty.garage || 0}</p>
                                        </div>
                                    </div>
                                </div>
                                
                                <div className="space-y-8">
                                    <div className="bg-slate-900 text-white p-8 rounded-3xl shadow-2xl">
                                        <p className="text-sm font-bold uppercase opacity-50 mb-2">A partir de</p>
                                        <p className="text-4xl font-black text-green-400">
                                            {viewingProperty.price || 'Preço não informado'}
                                        </p>
                                    </div>
                                    
                                    <div className="bg-slate-50 p-8 rounded-3xl border border-slate-200">
                                        <h3 className="font-black text-xl uppercase mb-6 text-slate-700">Calculadora Rápida</h3>
                                        <div className="space-y-4">
                                            <div>
                                                <span className="text-xs font-bold uppercase opacity-50">Sinal (10%)</span>
                                                <input 
                                                    type="text" 
                                                    disabled 
                                                    className="settings-input bg-white mt-1" 
                                                    value={formatCurrency(fluxo.ato)} 
                                                />
                                            </div>
                                            <div>
                                                <span className="text-xs font-bold uppercase opacity-50">Mensais (36x)</span>
                                                <input 
                                                    type="text" 
                                                    disabled 
                                                    className="settings-input bg-white mt-1" 
                                                    value={formatCurrency(fluxo.mensaisVal)} 
                                                />
                                            </div>
                                            <div>
                                                <span className="text-xs font-bold uppercase opacity-50">Anuais (3x)</span>
                                                <input 
                                                    type="text" 
                                                    disabled 
                                                    className="settings-input bg-white mt-1" 
                                                    value={formatCurrency(fluxo.interVal)} 
                                                />
                                            </div>
                                            <div className="pt-4 mt-4 border-t">
                                                <span className="text-xs font-bold uppercase opacity-50">Financiamento</span>
                                                <input 
                                                    type="text" 
                                                    disabled 
                                                    className="settings-input bg-green-50 text-green-600 border-green-200 mt-1" 
                                                    value={formatCurrency(fluxo.chaves)} 
                                                />
                                            </div>
                                        </div>
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
