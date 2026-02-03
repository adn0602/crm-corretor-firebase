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
    .calendar-grid { display: grid; grid-template-columns: repeat(7, 1fr); gap: 6px; }
    .calendar-day { aspect-ratio: 1 / 1; display: flex; flex-direction: column; align-items: center; justify-content: center; border-radius: 15px; font-size: 16px; font-weight: 800; cursor: pointer; transition: all 0.2s; }
    .calendar-day:hover { background: #eff6ff; color: #1e3a8a; }
    .calendar-day.active { background: #1e3a8a; color: white; box-shadow: 0 4px 12px rgba(30, 58, 138, 0.3); }
    .dot { width: 6px; height: 6px; border-radius: 50%; background: #3b82f6; margin-top: 4px; }
    body { font-size: 18px; }
  `}</style>
);

function App() {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('dashboard');
    const [showForm, setShowForm] = useState(false);
    
    const [clients, setClients] = useState([]);
    const [properties, setProperties] = useState([]);
    const [agenda, setAgenda] = useState([]);
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('TODOS');
    const [editingId, setEditingId] = useState(null);

    // INPUTS GERAIS
    const [name, setName] = useState('');
    const [phone, setPhone] = useState('');
    const [propertyInterest, setPropertyInterest] = useState('');
    const [birthDate, setBirthDate] = useState('');
    const [observations, setObservations] = useState('');
    const [propPrice, setPropPrice] = useState('');
    const [propImg, setPropImg] = useState('');
    const [propAddress, setPropAddress] = useState('');
    const [propLink, setPropLink] = useState('');
    const [propPdf, setPropPdf] = useState('');

    // INPUTS AGENDA
    const [agendaTitle, setAgendaTitle] = useState('');
    const [agendaTime, setAgendaTime] = useState('');
    const [agendaType, setAgendaType] = useState('Tarefa');

    const playSuccessSound = () => {
        const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
        audio.play().catch(() => {});
    };

    const loadData = async (userId) => {
        const qC = query(collection(db, 'clients'), where("assignedAgent", "==", userId));
        const snapC = await getDocs(qC);
        setClients(snapC.docs.map(d => ({ id: d.id, ...d.data() })));

        const qP = query(collection(db, 'properties'), where("userId", "==", userId));
        const snapP = await getDocs(qP);
        setProperties(snapP.docs.map(d => ({ id: d.id, ...d.data() })));

        const qA = query(collection(db, 'agenda'), where("userId", "==", userId));
        const snapA = await getDocs(qA);
        setAgenda(snapA.docs.map(d => ({ id: d.id, ...d.data() })));
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

    const resetForm = () => {
        setName(''); setPhone(''); setPropertyInterest(''); setBirthDate(''); setObservations('');
        setPropPrice(''); setPropImg(''); setPropAddress(''); setPropLink(''); setPropPdf('');
        setAgendaTitle(''); setAgendaTime(''); setEditingId(null); setShowForm(false);
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

    if (loading) return <div className="h-screen flex items-center justify-center font-black text-blue-900 bg-slate-50 text-3xl animate-pulse italic">ALEXANDRE CRM...</div>;
    if (!user) return <Login onLogin={setUser} />;

    return (
        <div className="min-h-screen bg-slate-50 flex font-sans text-slate-900">
            <TailwindStyle />
            
            {/* SIDEBAR ROBUSTA */}
            <aside className="w-20 lg:w-72 bg-white border-r border-slate-200 flex flex-col sticky top-0 h-screen z-50">
                <div className="p-8 mb-10 text-center lg:text-left"><h1 className="text-2xl font-black text-blue-900 italic hidden lg:block uppercase tracking-tighter">ALEXANDRE <span className="text-blue-500">CRM</span></h1></div>
                <nav className="flex-1 px-6 space-y-6">
                    {['dashboard', 'clients', 'properties', 'agenda'].map(id => (
                        <button key={id} onClick={() => {setActiveTab(id); resetForm();}} className={`w-full flex items-center lg:gap-5 p-5 rounded-3xl font-black text-sm transition-all uppercase tracking-widest ${activeTab === id ? 'bg-blue-900 text-white shadow-xl scale-105' : 'text-slate-400 hover:bg-slate-100'}`}>
                            <span className="text-2xl">{id === 'dashboard' ? '📊' : id === 'clients' ? '👥' : id === 'properties' ? '🏠' : '📅'}</span> 
                            <span className="hidden lg:block">{id === 'clients' ? 'Clientes' : id === 'properties' ? 'Imóveis' : id}</span>
                        </button>
                    ))}
                </nav>
                <div className="p-6 border-t"><button onClick={() => signOut(auth)} className="w-full p-4 text-red-600 font-black text-xs uppercase hover:bg-red-50 rounded-2xl">Sair</button></div>
            </aside>

            <main className="flex-1 p-10 overflow-y-auto">
                {/* HEADER COM BUSCA */}
                <header className="mb-10 flex justify-between items-center bg-white/50 backdrop-blur-md p-6 rounded-3xl border border-white">
                    <h2 className="text-3xl font-black uppercase italic tracking-tighter text-blue-900 leading-none">{activeTab}</h2>
                    <input type="text" placeholder="Pesquisar..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="p-4 bg-slate-100 rounded-2xl font-bold text-lg w-48 lg:w-96 outline-none focus:ring-4 ring-blue-100 transition-all" />
                </header>

                {/* CONTEÚDO DINÂMICO */}
                {activeTab === 'dashboard' && (
                    <div className="space-y-12">
                        <div className="ai-gradient rounded-[4rem] p-12 text-white shadow-2xl relative overflow-hidden">
                            <h3 className="text-5xl font-black italic mb-4 uppercase tracking-tighter">Fala, Alexandre!</h3>
                            <p className="text-xl opacity-80 font-bold uppercase tracking-widest">Sua IA detectou {clients.filter(c => analyzeLead(c).label === "QUENTE").length} oportunidades quentes hoje.</p>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
                            <div className="bg-white p-10 rounded-[3.5rem] shadow-premium"><p className="text-slate-400 text-xs font-black uppercase mb-4 tracking-widest">Leads Ativos</p><p className="text-6xl font-black text-blue-900">{clients.length}</p></div>
                            <div className="bg-white p-10 rounded-[3.5rem] shadow-premium"><p className="text-slate-400 text-xs font-black uppercase mb-4 tracking-widest">Produtos</p><p className="text-6xl font-black text-blue-600">{properties.length}</p></div>
                            <div className="bg-white p-10 rounded-[3.5rem] shadow-premium"><p className="text-slate-400 text-xs font-black uppercase mb-4 tracking-widest">Compromissos</p><p className="text-6xl font-black text-purple-600">{agenda.filter(a => a.date === selectedDate).length}</p></div>
                        </div>
                    </div>
                )}

                {activeTab === 'clients' && (
                    <div className="space-y-10">
                        <div className="flex justify-between items-center">
                            <div className="flex gap-3 bg-white p-2 rounded-full shadow-sm">
                                {['TODOS', 'LEAD', 'AGENDADO', 'PROPOSTA', 'FECHADO'].map(f => (
                                    <button key={f} onClick={() => setStatusFilter(f)} className={`px-6 py-3 rounded-full text-xs font-black transition-all ${statusFilter === f ? 'bg-blue-900 text-white shadow-lg' : 'text-slate-400'}`}>{f}</button>
                                ))}
                            </div>
                            <button onClick={() => setShowForm(true)} className="bg-blue-900 text-white px-10 py-5 rounded-[2rem] font-black text-xs uppercase tracking-widest shadow-2xl">+ Adicionar Lead</button>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
                            {filteredClients.map(c => {
                                const ai = analyzeLead(c);
                                return (
                                    <div key={c.id} className="bg-white rounded-[3.5rem] shadow-premium p-10 border border-slate-100 relative hover:shadow-2xl transition duration-500">
                                        <button onClick={() => {setEditingId(c.id); setName(c.fullName); setPhone(c.phones?.[0]); setPropertyInterest(c.propertyInterest); setBirthDate(c.birthDate); setObservations(c.observations); setShowForm(true);}} className="absolute top-6 left-6 text-slate-300 hover:text-blue-600 text-2xl">✏️</button>
                                        <div className="flex justify-between items-start mb-6 pt-4">
                                            <h3 className="font-black text-blue-900 uppercase text-2xl truncate ml-8 leading-none tracking-tighter">{c.fullName}</h3>
                                            <span className={`text-[10px] font-black px-4 py-2 rounded-xl uppercase ${ai.color} bg-slate-50 shadow-inner`}>{ai.icon} {ai.label}</span>
                                        </div>
                                        <div className="bg-yellow-50 border-l-8 border-yellow-400 p-4 mb-6 rounded-r-3xl text-xs font-black italic uppercase text-slate-700 tracking-tight shadow-sm">🚩 {c.propertyInterest || 'Geral'}</div>
                                        <div className="grid grid-cols-2 gap-4 mb-6 text-xs font-black uppercase">
                                            <div className="bg-slate-50 p-4 rounded-2xl"><p className="text-blue-800 text-[8px] mb-2 uppercase font-bold">🎂 Nascimento</p>{c.birthDate ? new Date(c.birthDate).toLocaleDateString('pt-BR') : '-'}</div>
                                            <div className="bg-slate-50 p-4 rounded-2xl"><p className="text-green-700 text-[8px] mb-2 uppercase font-bold">📞 WhatsApp</p>{c.phones?.[0]}</div>
                                        </div>
                                        <div className="mb-8 bg-slate-50/50 p-6 rounded-[2.5rem] border border-slate-100 h-36 overflow-y-auto text-sm italic font-bold text-slate-500 leading-relaxed scrollbar-hide shadow-inner">
                                            {c.observations || 'Nenhuma nota registrada.'}
                                        </div>
                                        <div className="flex flex-col gap-3">
                                            <a href={`https://wa.me/55${c.phones?.[0]?.replace(/\D/g,'')}`} target="_blank" className="bg-green-500 hover:bg-green-600 text-white text-center font-black py-5 rounded-[2rem] shadow-xl text-xs uppercase tracking-widest transition active:scale-95">WhatsApp Direto</a>
                                            <button onClick={() => deleteDoc(doc(db, 'clients', c.id)).then(() => loadData(user.uid))} className="w-full text-xs font-black text-slate-200 hover:text-red-500 uppercase tracking-widest transition mt-4">Remover Lead</button>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                )}

                {activeTab === 'properties' && (
                    <div className="space-y-12">
                        <div className="flex justify-end"><button onClick={() => setShowForm(true)} className="bg-blue-900 text-white px-10 py-5 rounded-[2rem] font-black text-xs uppercase tracking-widest shadow-2xl">+ Novo Imóvel</button></div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
                            {properties.map(p => (
                                <div key={p.id} className="bg-white rounded-[4rem] shadow-premium overflow-hidden border border-slate-100 flex flex-col hover:shadow-2xl transition duration-500 group">
                                    <div className="h-80 relative overflow-hidden bg-slate-100">
                                        {p.image ? <img src={p.image.split(',')[0]} className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110" alt="imóvel" /> : <div className="h-full flex items-center justify-center font-black text-slate-200 text-5xl italic">Lopes</div>}
                                        <div className="absolute top-6 right-6 bg-green-500 text-white px-6 py-2 rounded-full text-xs font-black uppercase tracking-widest shadow-xl">Disponível</div>
                                    </div>
                                    <div className="p-10 flex-1 flex flex-col">
                                        <h4 className="font-black text-3xl uppercase text-blue-900 mb-3 italic leading-none tracking-tighter">{p.title}</h4>
                                        <p className="text-blue-600 font-black text-4xl mb-6 italic tracking-tighter leading-none">{p.price}</p>
                                        <p className="text-sm font-bold text-slate-400 uppercase mb-8 leading-tight italic border-l-4 border-slate-100 pl-4">📍 {p.address}</p>
                                        <div className="mt-auto grid grid-cols-2 gap-4">
                                            {p.link && <a href={p.link} target="_blank" className="bg-blue-900 text-white text-center py-5 rounded-3xl font-black text-[10px] uppercase tracking-widest shadow-xl hover:bg-black transition">Ver Site</a>}
                                            {p.pdf && <a href={p.pdf} target="_blank" className="bg-red-600 text-white text-center py-5 rounded-3xl font-black text-[10px] uppercase tracking-widest shadow-xl hover:bg-red-700 transition">E-book</a>}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {activeTab === 'agenda' && (
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
                        <div className="lg:col-span-5 space-y-8">
                            <div className="glass p-10 rounded-[3.5rem] shadow-premium bg-white">
                                <div className="flex justify-between items-center mb-10 text-xl font-black text-blue-900 uppercase italic">
                                    <button onClick={() => setCurrentMonth(new Date(currentMonth.setMonth(currentMonth.getMonth() - 1)))} className="p-4 bg-slate-50 rounded-full transition">◀</button>
                                    <span>{currentMonth.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}</span>
                                    <button onClick={() => setCurrentMonth(new Date(currentMonth.setMonth(currentMonth.getMonth() + 1)))} className="p-4 bg-slate-50 rounded-full transition">▶</button>
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
                            <button onClick={() => setShowForm(true)} className="w-full bg-blue-900 text-white py-6 rounded-[2.5rem] font-black text-xs uppercase tracking-widest shadow-2xl transition hover:scale-105">+ Novo Compromisso</button>
                        </div>
                        <div className="lg:col-span-7 bg-white p-12 rounded-[4rem] shadow-premium min-h-[600px]">
                            <h3 className="text-3xl font-black text-blue-900 uppercase italic mb-10 border-b border-slate-100 pb-8 flex justify-between items-center">
                                {new Date(selectedDate + 'T00:00:00').toLocaleDateString('pt-BR')}
                                <span className="text-xs not-italic text-slate-400 uppercase font-black">{agenda.filter(a => a.date === selectedDate).length} Atividades</span>
                            </h3>
                            <div className="space-y-8">
                                {agenda.filter(a => a.date === selectedDate).map(item => (
                                    <div key={item.id} className="group bg-slate-50 p-10 rounded-[3rem] border border-slate-100 flex items-center gap-10 hover:shadow-2xl transition-all duration-300">
                                        <div className={`w-3 h-20 rounded-full ${item.type === 'Evento' ? 'bg-blue-500 shadow-xl shadow-blue-200' : 'bg-green-500'}`}></div>
                                        <div className="flex-1">
                                            <div className="flex justify-between items-center mb-3">
                                                <h4 className="font-black text-blue-900 uppercase text-3xl tracking-tighter leading-none">{item.title}</h4>
                                                <span className={`text-[10px] font-black px-5 py-2 rounded-2xl uppercase ${item.type === 'Evento' ? 'bg-blue-100 text-blue-600' : 'bg-green-100 text-green-600'}`}>{item.type}</span>
                                            </div>
                                            <p className="text-sm font-black text-slate-500 uppercase tracking-wide">🕒 {item.time || 'Sem hora'} | 📍 {item.observations}</p>
                                        </div>
                                    </div>
                                ))}
                                {agenda.filter(a => a.date === selectedDate).length === 0 && (
                                    <div className="text-center py-20 text-slate-200 font-black italic uppercase text-2xl opacity-20">Nenhum registro</div>
                                )}
                            </div>
                        </div>
                    </div>
                )}
                
                {/* FORMULÁRIO MODAL GIGANTE */}
                {showForm && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-8 bg-slate-900/60 backdrop-blur-md">
                        <div className="glass w-full max-w-2xl p-14 rounded-[4rem] shadow-2xl border-2 border-white/50">
                            <h2 className="text-4xl font-black mb-12 text-blue-900 uppercase italic tracking-tighter text-center leading-none">Novo Registro</h2>
                            <div className="space-y-6">
                                <input type="text" placeholder="Nome / Título" value={activeTab === 'agenda' ? agendaTitle : name} onChange={e => activeTab === 'agenda' ? setAgendaTitle(e.target.value) : setName(e.target.value)} className="w-full p-6 bg-white rounded-3xl font-black text-xl border-none shadow-inner" />
                                {activeTab === 'agenda' ? (
                                    <div className="grid grid-cols-2 gap-6">
                                        <input type="time" value={agendaTime} onChange={e => setAgendaTime(e.target.value)} className="w-full p-6 bg-white rounded-3xl font-black text-xl border-none" />
                                        <select value={agendaType} onChange={e => setAgendaType(e.target.value)} className="w-full p-6 bg-slate-100 rounded-3xl font-black text-xl">
                                            <option value="Tarefa">Tarefa</option>
                                            <option value="Evento">Evento</option>
                                        </select>
                                    </div>
                                ) : (
                                    <>
                                        <input type="text" placeholder="WhatsApp (219XXXXXXXX)" value={phone} onChange={e => setPhone(e.target.value)} className="w-full p-6 bg-white rounded-3xl font-black text-xl border-none shadow-inner" />
                                        <select value={propertyInterest} onChange={e => setPropertyInterest(e.target.value)} className="w-full p-6 bg-yellow-50 rounded-3xl font-black text-xl border-none shadow-sm outline-none">
                                            <option value="">Imóvel de Interesse...</option>
                                            {properties.map(p => <option key={p.id} value={p.title}>{p.title}</option>)}
                                        </select>
                                    </>
                                )}
                                <textarea placeholder="Anotações Importantes..." value={observations} onChange={e => setObservations(e.target.value)} className="w-full p-6 bg-white rounded-3xl font-bold h-48 border-none shadow-inner text-xl" />
                                <div className="flex gap-6 pt-10">
                                    <button onClick={activeTab === 'agenda' ? () => addDoc(collection(db, 'agenda'), {title: agendaTitle, date: selectedDate, time: agendaTime, type: agendaType, observations, userId: user.uid, createdAt: new Date()}).then(() => {playSuccessSound(); resetForm(); loadData(user.uid);}) : () => addDoc(collection(db, 'clients'), {fullName: name, phones: [phone], propertyInterest, observations, status: "LEAD", assignedAgent: user.uid, createdAt: new Date()}).then(() => {playSuccessSound(); resetForm(); loadData(user.uid);})} className="flex-1 bg-blue-900 text-white font-black py-7 rounded-[3rem] shadow-2xl uppercase tracking-widest text-2xl transition hover:bg-black active:scale-95">Salvar</button>
                                    <button onClick={resetForm} className="flex-1 bg-slate-100 text-slate-400 font-black py-7 rounded-[3rem] uppercase tracking-widest text-2xl transition hover:bg-slate-200">Cancelar</button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}

export default App;
