import React, { useState, useEffect } from 'react';
import { db, auth } from './firebase/config';
import { collection, addDoc, getDocs, query, where, updateDoc, doc, deleteDoc } from 'firebase/firestore';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import Login from './components/Login';

const TailwindStyle = () => (
  <style>{`
    @import url('https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css');
    .glass { background: rgba(255, 255, 255, 0.9); backdrop-filter: blur(12px); border: 1px solid rgba(255, 255, 255, 0.5); }
    .ai-gradient { background: linear-gradient(135deg, #0f172a 0%, #1e3a8a 100%); }
    .shadow-premium { box-shadow: 0 10px 40px -10px rgba(0, 0, 0, 0.1); }
    .scrollbar-hide::-webkit-scrollbar { display: none; }
    .calendar-grid { display: grid; grid-template-columns: repeat(7, 1fr); gap: 6px; }
    .calendar-day { aspect-ratio: 1 / 1; display: flex; flex-direction: column; align-items: center; justify-content: center; border-radius: 12px; font-size: 16px; font-weight: 800; cursor: pointer; transition: all 0.2s; }
    .calendar-day:hover { background: #eff6ff; color: #1e3a8a; }
    .calendar-day.active { background: #1e3a8a; color: white; box-shadow: 0 4px 15px rgba(30, 58, 138, 0.3); }
    body { font-size: 16px; background-color: #f3f4f6; }
    /* Toggle Switch Custom */
    .toggle-checkbox:checked { right: 0; border-color: #22c55e; }
    .toggle-checkbox:checked + .toggle-label { background-color: #22c55e; }
  `}</style>
);

function App() {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('settings'); // Foco na aba Settings para visualização
    const [showForm, setShowForm] = useState(false);
    
    // --- DADOS ---
    const [clients, setClients] = useState([]);
    const [properties, setProperties] = useState([]);
    const [agenda, setAgenda] = useState([]);
    
    // --- CONFIGURAÇÕES ---
    const [settings, setSettings] = useState({
        userName: 'Alexandre',
        creci: '',
        soundEnabled: true,
        themeColor: 'blue' // blue, black, purple
    });

    // --- FILTROS ---
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('TODOS');
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [editingId, setEditingId] = useState(null);

    // --- INPUTS FORMULÁRIO ---
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

    // --- WHATSAPP ---
    const [wpNumber, setWpNumber] = useState('');
    const [wpMessage, setWpMessage] = useState('');
    const [bulkMessage, setBulkMessage] = useState('');
    const [selectedClients, setSelectedClients] = useState([]);

    const playSuccessSound = () => {
        if(settings.soundEnabled) {
            const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
            audio.play().catch(() => {});
        }
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

    const exportData = (type) => {
        const data = type === 'clients' ? clients : properties;
        const csvContent = "data:text/csv;charset=utf-8," + data.map(e => Object.values(e).join(",")).join("\n");
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `${type}_backup.csv`);
        document.body.appendChild(link);
        link.click();
    };

    const analyzeLead = (client) => {
        const text = (client.observations || "").toLowerCase();
        const status = client.status || "LEAD";
        let score = 0;
        if (status === "PROPOSTA") score += 50;
        if (status === "AGENDADO") score += 30;
        if (text.includes("urgente") || text.includes("comprar")) score += 20;
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
        const pdfLink = prop?.pdf || "Link em breve";
        const msg = `Olá ${client.fullName}! Aqui é o ${settings.userName}. Segue o material do ${client.propertyInterest}: ${pdfLink}`;
        sendWp(client.phones?.[0], msg);
    };

    const handleBulkSend = () => {
        if (selectedClients.length === 0) return alert('Selecione contatos!');
        if (!bulkMessage) return alert('Digite a mensagem!');
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
            if (u) { setUser(u); loadData(u.uid); }
            else setUser(null);
            setLoading(false);
        });
        return () => unsub();
    }, []);

    const filteredClients = clients.filter(c => {
        const match = (c.fullName || "").toLowerCase().includes(searchTerm.toLowerCase()) || (c.propertyInterest || "").toLowerCase().includes(searchTerm.toLowerCase());
        return match && (statusFilter === 'TODOS' || c.status === statusFilter);
    });

    const templates = [
        { title: 'Primeira Abordagem', text: `Olá! Sou ${settings.userName}, da Lopes Prime. Gostaria de saber se você tem interesse em comprar ou alugar um imóvel. Posso ajudar?` },
        { title: 'Follow-up', text: 'Oi! Como vai? Ainda tem interesse naquele imóvel? Tenho novas opções que podem te interessar.' },
        { title: 'Agendar Visita', text: 'Olá! Vamos agendar uma visita para conhecer o decorado? Tenho horários disponíveis.' },
        { title: 'Proposta', text: 'Parabéns! Sua proposta foi bem recebida. Vamos conversar sobre os próximos passos?' }
    ];

    const mainColor = settings.themeColor === 'black' ? 'bg-slate-900' : settings.themeColor === 'purple' ? 'bg-purple-900' : 'bg-blue-900';
    const textColor = settings.themeColor === 'black' ? 'text-slate-900' : settings.themeColor === 'purple' ? 'text-purple-900' : 'text-blue-900';

    if (loading) return <div className="h-screen flex items-center justify-center font-black text-blue-900 bg-slate-50 text-3xl animate-pulse italic">ALEXANDRE CRM...</div>;
    if (!user) return <Login onLogin={setUser} />;

    return (
        <div className="min-h-screen bg-[#f3f4f6] flex font-sans text-slate-900 overflow-x-hidden">
            <TailwindStyle />
            
            {/* SIDEBAR */}
            <aside className="w-20 lg:w-72 bg-white border-r border-slate-200 flex flex-col sticky top-0 h-screen z-50">
                <div className="p-8 mb-6"><h1 className={`text-2xl font-black italic hidden lg:block uppercase tracking-tighter ${textColor}`}>{settings.userName} <span className="text-blue-500">CRM</span></h1></div>
                <nav className="flex-1 px-4 space-y-3">
                    {[
                        { id: 'dashboard', label: 'Dashboard', icon: '📊' },
                        { id: 'clients', label: 'Clientes', icon: '👥' },
                        { id: 'properties', label: 'Imóveis', icon: '🏠' },
                        { id: 'agenda', label: 'Agenda', icon: '📅' },
                        { id: 'whatsapp', label: 'WhatsApp', icon: '💬' },
                        { id: 'reports', label: 'Relatórios', icon: '📄' },
                        { id: 'settings', label: 'Configuração', icon: '⚙️' }
                    ].map(item => (
                        <button key={item.id} onClick={() => setActiveTab(item.id)} className={`w-full flex items-center lg:gap-4 p-5 rounded-[2rem] font-black text-sm transition-all uppercase tracking-widest ${activeTab === item.id ? `${mainColor} text-white shadow-xl` : 'text-slate-400 hover:bg-slate-50'}`}>
                            <span className="text-2xl">{item.icon}</span> <span className="hidden lg:block">{item.label}</span>
                        </button>
                    ))}
                </nav>
                <div className="p-6 border-t"><button onClick={() => signOut(auth)} className="w-full p-4 text-red-600 font-black text-xs uppercase hover:bg-red-50 rounded-2xl transition">Sair</button></div>
            </aside>

            <main className="flex-1 p-10 overflow-y-auto">
                <header className="mb-8 flex justify-between items-center bg-white p-6 rounded-3xl border border-white shadow-sm">
                    <h2 className={`text-3xl font-black uppercase italic tracking-tighter ${textColor}`}>{activeTab === 'settings' ? 'Configurações' : activeTab}</h2>
                    {activeTab !== 'settings' && <input type="text" placeholder="Pesquisar..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="p-4 bg-slate-100 rounded-2xl font-bold text-lg w-64 lg:w-96 outline-none focus:ring-4 ring-blue-100 transition-all" />}
                </header>

                <div className="animate-fadeIn">
                    
                    {/* 1. DASHBOARD */}
                    {activeTab === 'dashboard' && (
                        <div className="space-y-12">
                            <div className={`rounded-[4rem] p-12 text-white shadow-2xl relative overflow-hidden ${mainColor}`}>
                                <h3 className="text-5xl font-black italic mb-4 uppercase tracking-tighter">Fala, {settings.userName}!</h3>
                                <p className="text-xl opacity-80 font-bold uppercase tracking-widest italic">Detectamos {clients.filter(c => analyzeLead(c).label === "QUENTE").length} oportunidades quentes hoje.</p>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
                                <div className="bg-white p-10 rounded-[3.5rem] shadow-premium flex flex-col items-center">
                                    <p className="text-slate-400 text-xs font-black uppercase mb-4 tracking-widest">Leads Totais</p>
                                    <p className={`text-7xl font-black leading-none ${textColor}`}>{clients.length}</p>
                                </div>
                                <div className="bg-white p-10 rounded-[3.5rem] shadow-premium flex flex-col items-center">
                                    <p className="text-slate-400 text-xs font-black uppercase mb-4 tracking-widest">Meus Imóveis</p>
                                    <p className="text-7xl font-black text-blue-600 leading-none">{properties.length}</p>
                                </div>
                                <div className="bg-white p-10 rounded-[3.5rem] shadow-premium flex flex-col items-center">
                                    <p className="text-slate-400 text-xs font-black uppercase mb-4 tracking-widest">Agenda</p>
                                    <p className="text-7xl font-black text-purple-600 leading-none">{agenda.filter(a => a.date === selectedDate).length}</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* 2. CLIENTES */}
                    {activeTab === 'clients' && (
                        <div className="space-y-10">
                            <div className="flex justify-between items-center flex-wrap gap-4">
                                <div className="flex gap-2 bg-white p-2 rounded-full shadow-sm overflow-x-auto">
                                    {['TODOS', 'LEAD', 'AGENDADO', 'PROPOSTA', 'FECHADO'].map(f => (
                                        <button key={f} onClick={() => setStatusFilter(f)} className={`px-5 py-3 rounded-full text-xs font-black transition-all ${statusFilter === f ? `${mainColor} text-white shadow-lg` : 'text-slate-400'}`}>{f}</button>
                                    ))}
                                </div>
                                <button onClick={() => setShowForm(true)} className={`${mainColor} text-white px-8 py-4 rounded-[2rem] font-black text-xs uppercase tracking-widest shadow-xl hover:scale-105 transition`}>+ Novo Cliente</button>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
                                {filteredClients.map(c => {
                                    const ai = analyzeLead(c);
                                    return (
                                        <div key={c.id} className={`bg-white rounded-[3rem] shadow-premium p-10 border border-slate-50 relative hover:shadow-2xl transition duration-500 ${ai.glow}`}>
                                            <button onClick={() => {setEditingId(c.id); setName(c.fullName); setPhone(c.phones?.[0]); setPropertyInterest(c.propertyInterest); setBirthDate(c.birthDate); setObservations(c.observations); setShowForm(true);}} className="absolute top-6 left-6 text-slate-300 hover:text-blue-600 text-2xl">✏️</button>
                                            <div className="flex justify-between items-start mb-6 pt-4">
                                                <h3 className={`font-black uppercase text-2xl truncate ml-8 leading-none tracking-tighter ${textColor}`}>{c.fullName}</h3>
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
                                    )
                                })}
                            </div>
                        </div>
                    )}

                    {/* 3. IMÓVEIS */}
                    {activeTab === 'properties' && (
                        <div className="space-y-12">
                            <div className="flex justify-end"><button onClick={() => setShowForm(true)} className={`${mainColor} text-white px-10 py-5 rounded-[2rem] font-black text-xs uppercase tracking-widest shadow-2xl hover:scale-105 transition`}>+ Novo Imóvel</button></div>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
                                {properties.map(p => (
                                    <div key={p.id} className="bg-white rounded-[4rem] shadow-premium overflow-hidden border border-slate-100 flex flex-col hover:shadow-2xl transition duration-500 group relative">
                                        <button onClick={() => {setEditingId(p.id); setName(p.title); setPropPrice(p.price); setPropImg(p.image); setPropLink(p.link); setPropPdf(p.pdf); setPropAddress(p.address); setShowForm(true);}} className="absolute top-6 left-6 z-10 p-3 bg-white/90 backdrop-blur rounded-full text-slate-400 hover:text-blue-600 shadow-lg opacity-0 group-hover:opacity-100 transition duration-300">✏️</button>
                                        <div className="h-80 relative overflow-hidden bg-slate-100">
                                            {p.image ? <img src={p.image.split(',')[0]} className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110" alt="imóvel" /> : <div className="h-full flex items-center justify-center font-black text-slate-200 text-5xl italic">Lopes</div>}
                                            <div className="absolute top-6 right-6 bg-green-500 text-white px-6 py-2 rounded-full text-xs font-black uppercase tracking-widest shadow-xl">Disponível</div>
                                        </div>
                                        <div className="p-10 flex-1 flex flex-col">
                                            <h4 className={`font-black text-3xl uppercase mb-3 italic leading-none tracking-tighter ${textColor}`}>{p.title}</h4>
                                            <p className="text-blue-600 font-black text-4xl mb-6 italic tracking-tighter leading-none">{p.price}</p>
                                            <p className="text-sm font-bold text-slate-400 uppercase mb-8 leading-tight italic border-l-4 border-slate-100 pl-4">📍 {p.address}</p>
                                            <div className="mt-auto grid grid-cols-2 gap-4">
                                                {p.link && <a href={p.link} target="_blank" className="bg-blue-900 text-white text-center py-5 rounded-3xl font-black text-[10px] uppercase tracking-widest shadow-xl hover:bg-black transition">Site</a>}
                                                {p.pdf && <a href={p.pdf} target="_blank" className="bg-red-600 text-white text-center py-5 rounded-3xl font-black text-[10px] uppercase tracking-widest shadow-xl hover:bg-red-700 transition">PDF</a>}
                                            </div>
                                            <button onClick={() => deleteDoc(doc(db, 'properties', p.id)).then(() => loadData(user.uid))} className="w-full text-xs font-black text-slate-200 hover:text-red-500 uppercase tracking-widest text-center mt-6 transition">Excluir Produto</button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* 4. AGENDA */}
                    {activeTab === 'agenda' && (
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
                            <div className="lg:col-span-5 space-y-8">
                                <div className="glass p-10 rounded-[3.5rem] shadow-premium bg-white">
                                    <div className={`flex justify-between items-center mb-10 text-xl font-black uppercase italic ${textColor}`}>
                                        <button onClick={() => setCurrentMonth(new Date(currentMonth.setMonth(currentMonth.getMonth() - 1)))} className="p-4 bg-slate-50 rounded-full">◀</button>
                                        <span>{currentMonth.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}</span>
                                        <button onClick={() => setCurrentMonth(new Date(currentMonth.setMonth(currentMonth.getMonth() + 1)))} className="p-4 bg-slate-50 rounded-full">▶</button>
                                    </div>
                                    <div className="calendar-grid mb-6 text-xs font-black text-slate-300 uppercase text-center">{['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(d => <div key={d}>{d}</div>)}</div>
                                    <div className="calendar-grid">
                                        {generateCalendarDays().map((day, idx) => {
                                            if (!day) return <div key={idx}></div>;
                                            const dateStr = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                                            const hasEvents = agenda.some(a => a.date === dateStr);
                                            return (
                                                <div key={idx} onClick={() => setSelectedDate(dateStr)} className={`calendar-day ${selectedDate === dateStr ? 'active' : ''}`}>
                                                    {day}
                                                    {hasEvents && <div className={`dot ${selectedDate === dateStr ? 'bg-white' : 'bg-blue-500'}`}></div>}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                                <button onClick={() => setShowForm(true)} className={`${mainColor} w-full text-white py-6 rounded-[2.5rem] font-black text-xs uppercase tracking-widest shadow-2xl transition hover:scale-105`}>+ Novo Compromisso</button>
                            </div>
                            <div className="lg:col-span-7 bg-white p-12 rounded-[4rem] shadow-premium min-h-[600px]">
                                <h3 className={`text-3xl font-black uppercase italic mb-10 border-b border-slate-100 pb-8 flex justify-between items-center ${textColor}`}>
                                    {new Date(selectedDate + 'T00:00:00').toLocaleDateString('pt-BR')}
                                    <span className="text-xs not-italic text-slate-400 uppercase font-black">{agenda.filter(a => a.date === selectedDate).length} Atividades</span>
                                </h3>
                                <div className="space-y-8">
                                    {agenda.filter(a => a.date === selectedDate).map(item => (
                                        <div key={item.id} className="group bg-slate-50 p-10 rounded-[3rem] border border-slate-100 flex items-center gap-10 hover:shadow-2xl transition-all duration-300">
                                            <div className={`w-3 h-20 rounded-full ${item.type === 'Evento' ? 'bg-blue-500 shadow-xl shadow-blue-200' : 'bg-green-500'}`}></div>
                                            <div className="flex-1">
                                                <div className="flex justify-between items-center mb-3">
                                                    <h4 className={`font-black uppercase text-3xl tracking-tighter leading-none ${textColor}`}>{item.title}</h4>
                                                    <span className={`text-[10px] font-black px-5 py-2 rounded-2xl uppercase ${item.type === 'Evento' ? 'bg-blue-100 text-blue-600' : 'bg-green-100 text-green-600'}`}>{item.type}</span>
                                                </div>
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

                    {/* 5. WHATSAPP */}
                    {activeTab === 'whatsapp' && (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                            <div className="space-y-8">
                                <div className="bg-white p-10 rounded-[3rem] shadow-premium border border-slate-100">
                                    <h3 className={`text-2xl font-black uppercase italic mb-8 ${textColor}`}>Envio Individual</h3>
                                    <div className="space-y-6">
                                        <input type="text" placeholder="DDD + Número" value={wpNumber} onChange={e => setWpNumber(e.target.value)} className="w-full p-6 bg-slate-50 rounded-3xl font-bold border-none" />
                                        <textarea placeholder="Mensagem..." value={wpMessage} onChange={e => setWpMessage(e.target.value)} className="w-full p-6 bg-slate-50 rounded-3xl font-bold h-40 border-none shadow-inner text-lg" />
                                        <button onClick={() => sendWp(wpNumber, wpMessage)} className="w-full bg-green-500 text-white py-6 rounded-[2.5rem] font-black uppercase tracking-widest shadow-xl hover:bg-green-600 transition">🚀 Enviar</button>
                                    </div>
                                </div>
                                <div className="bg-white p-10 rounded-[3rem] shadow-premium border border-slate-100">
                                    <h3 className={`text-2xl font-black uppercase italic mb-8 flex justify-between ${textColor}`}>
                                        Envio em Massa
                                        <span className="bg-blue-100 text-blue-800 text-xs px-4 py-1 rounded-full">{selectedClients.length} Selecionados</span>
                                    </h3>
                                    <div className="max-h-60 overflow-y-auto space-y-3 mb-6 p-4 bg-slate-50 rounded-3xl">
                                        {clients.map(c => (
                                            <label key={c.id} className="flex items-center gap-4 p-4 bg-white rounded-2xl cursor-pointer hover:bg-blue-50 transition">
                                                <input type="checkbox" className="w-6 h-6" onChange={(e) => {
                                                    const num = c.phones?.[0];
                                                    if(e.target.checked) setSelectedClients([...selectedClients, num]);
                                                    else setSelectedClients(selectedClients.filter(n => n !== num));
                                                }} />
                                                <div className="text-sm font-bold uppercase">{c.fullName}</div>
                                            </label>
                                        ))}
                                    </div>
                                    <div className="space-y-4">
                                        <textarea placeholder="Digite a mensagem para todos..." value={bulkMessage} onChange={e => setBulkMessage(e.target.value)} className="w-full p-6 bg-yellow-300 rounded-3xl font-black text-slate-900 h-32 border-none outline-none placeholder-slate-600 focus:ring-4 ring-yellow-500 transition shadow-inner text-lg" />
                                        <button onClick={handleBulkSend} className={`w-full ${mainColor} text-white py-6 rounded-[2.5rem] font-black uppercase tracking-widest shadow-xl hover:bg-black transition`}>📤 Disparar para Todos</button>
                                    </div>
                                </div>
                            </div>
                            <div className="space-y-6">
                                <h3 className={`text-2xl font-black uppercase italic mb-4 ${textColor}`}>Mensagens Rápidas</h3>
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
                    )}

                    {/* 6. RELATÓRIOS */}
                    {activeTab === 'reports' && (
                        <div className="space-y-12 animate-fadeIn">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                                <div className="bg-white p-10 rounded-[3rem] shadow-premium">
                                    <p className="text-slate-400 text-xs font-black uppercase mb-4 tracking-widest">Conversão de Vendas</p>
                                    <p className={`text-6xl font-black ${textColor}`}>{clients.length > 0 ? ((clients.filter(c => c.status === 'FECHADO').length / clients.length) * 100).toFixed(1) : 0}%</p>
                                </div>
                                <div className="bg-white p-10 rounded-[3rem] shadow-premium">
                                    <p className="text-slate-400 text-xs font-black uppercase mb-4 tracking-widest">Ticket Médio Estimado</p>
                                    <p className="text-6xl font-black text-green-600">R$ 245K</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* 7. CONFIGURAÇÕES (CARTÕES) */}
                    {activeTab === 'settings' && (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
                            <div className="bg-white p-10 rounded-[3rem] shadow-premium border border-slate-100">
                                <h3 className={`text-xl font-black uppercase italic mb-6 ${textColor}`}>Perfil Profissional</h3>
                                <div className="space-y-6">
                                    <div><label className="text-xs font-bold uppercase text-slate-400">Nome</label><input type="text" value={settings.userName} onChange={e => setSettings({...settings, userName: e.target.value})} className="w-full p-4 bg-slate-50 rounded-2xl font-black border-none" /></div>
                                    <div><label className="text-xs font-bold uppercase text-slate-400">CRECI</label><input type="text" value={settings.creci} onChange={e => setSettings({...settings, creci: e.target.value})} className="w-full p-4 bg-slate-50 rounded-2xl font-black border-none" /></div>
                                </div>
                            </div>
                            <div className="bg-white p-10 rounded-[3rem] shadow-premium border border-slate-100">
                                <h3 className={`text-xl font-black uppercase italic mb-6 ${textColor}`}>Sistema & Tema</h3>
                                <div className="space-y-6">
                                    <div className="flex justify-between items-center"><span className="font-bold text-slate-600 uppercase text-xs">Sons de Efeito</span><button onClick={() => setSettings({...settings, soundEnabled: !settings.soundEnabled})} className={`w-12 h-6 rounded-full relative ${settings.soundEnabled ? 'bg-green-500' : 'bg-slate-300'}`}><div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-all ${settings.soundEnabled ? 'right-1' : 'left-1'}`}></div></button></div>
                                    <div className="grid grid-cols-3 gap-2">
                                        <button onClick={() => setSettings({...settings, themeColor: 'blue'})} className={`h-10 rounded-xl bg-blue-900 ${settings.themeColor === 'blue' ? 'ring-4 ring-blue-300' : ''}`}></button>
                                        <button onClick={() => setSettings({...settings, themeColor: 'black'})} className={`h-10 rounded-xl bg-slate-900 ${settings.themeColor === 'black' ? 'ring-4 ring-slate-300' : ''}`}></button>
                                        <button onClick={() => setSettings({...settings, themeColor: 'purple'})} className={`h-10 rounded-xl bg-purple-900 ${settings.themeColor === 'purple' ? 'ring-4 ring-purple-300' : ''}`}></button>
                                    </div>
                                </div>
                            </div>
                            <div className="bg-white p-10 rounded-[3rem] shadow-premium border border-slate-100">
                                <h3 className={`text-xl font-black uppercase italic mb-6 ${textColor}`}>Segurança de Dados</h3>
                                <div className="flex flex-col gap-4">
                                    <button onClick={() => exportData('clients')} className="bg-green-100 text-green-700 py-4 rounded-2xl font-black uppercase text-xs hover:bg-green-200 transition">📥 Baixar Clientes</button>
                                    <button onClick={() => exportData('properties')} className="bg-blue-100 text-blue-700 py-4 rounded-2xl font-black uppercase text-xs hover:bg-blue-200 transition">📥 Baixar Imóveis</button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* MODAL UNIVERSAL */}
                {showForm && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-8 bg-slate-900/60 backdrop-blur-md">
                        <div className="glass w-full max-w-2xl p-14 rounded-[4rem] shadow-2xl border-2 border-white/50">
                            <h2 className={`text-4xl font-black mb-12 uppercase italic tracking-tighter text-center leading-none ${textColor}`}>
                                {activeTab === 'clients' ? (editingId ? 'Editar Lead' : 'Novo Cliente') : activeTab === 'properties' ? (editingId ? 'Editar Imóvel' : 'Novo Imóvel') : 'Novo Compromisso'}
                            </h2>
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
                                    if(activeTab === 'clients') {
                                        if(editingId) updateDoc(doc(db, 'clients', editingId), {fullName: name, phones: [phone], birthDate, propertyInterest, observations}).then(() => {resetForm(); loadData(user.uid);});
                                        else addDoc(collection(db, 'clients'), {fullName: name, phones: [phone], propertyInterest, observations, birthDate, status: "LEAD", assignedAgent: user.uid, createdAt: new Date()}).then(() => {resetForm(); loadData(user.uid);});
                                    } else if(activeTab === 'properties') {
                                        if(editingId) updateDoc(doc(db, 'properties', editingId), {title: name, price: propPrice, image: propImg, link: propLink, pdf: propPdf, address: propAddress}).then(() => {resetForm(); loadData(user.uid);});
                                        else addDoc(collection(db, 'properties'), {title: name, price: propPrice, image: propImg, link: propLink, pdf: propPdf, address: propAddress, userId: user.uid, createdAt: new Date()}).then(() => {resetForm(); loadData(user.uid);});
                                    } else {
                                        addDoc(collection(db, 'agenda'), {title: agendaTitle, date: selectedDate, time: agendaTime, type: agendaType, observations, userId: user.uid, createdAt: new Date()}).then(() => {resetForm(); loadData(user.uid);});
                                    }
                                }} className={`flex-1 ${mainColor} text-white font-black py-7 rounded-[3rem] shadow-2xl uppercase tracking-widest text-2xl transition hover:scale-105 active:scale-95`}>Salvar</button>
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
