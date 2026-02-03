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
    .calendar-day { aspect-ratio: 1 / 1; display: flex; flex-direction: column; align-items: center; justify-content: center; border-radius: 15px; font-size: 14px; font-weight: 800; cursor: pointer; transition: all 0.2s; }
    .calendar-day:hover { background: #eff6ff; color: #1e3a8a; }
    .calendar-day.active { background: #1e3a8a; color: white; box-shadow: 0 4px 12px rgba(30, 58, 138, 0.3); }
    .dot { width: 6px; height: 6px; border-radius: 50%; background: #3b82f6; margin-top: 4px; }
    body { font-size: 16px; } /* Aumento da base da fonte */
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

    const [name, setName] = useState('');
    const [phone, setPhone] = useState('');
    const [propertyInterest, setPropertyInterest] = useState('');
    const [birthDate, setBirthDate] = useState('');
    const [observations, setObservations] = useState('');
    const [propPrice, setPropPrice] = useState('');
    const [propImg, setPropImg] = useState('');
    
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

    const addClient = async () => {
        await addDoc(collection(db, 'clients'), { fullName: name, phones: [phone], propertyInterest, birthDate, observations, status: "LEAD", assignedAgent: user.uid, createdAt: new Date() });
        playSuccessSound(); resetForm(); loadData(user.uid);
    };

    const addAgendaItem = async () => {
        await addDoc(collection(db, 'agenda'), { title: agendaTitle, date: selectedDate, time: agendaTime, type: agendaType, observations, userId: user.uid, createdAt: new Date() });
        playSuccessSound(); resetForm(); loadData(user.uid);
    };

    const resetForm = () => {
        setName(''); setPhone(''); setPropertyInterest(''); setBirthDate(''); setObservations('');
        setPropPrice(''); setPropImg(''); setAgendaTitle(''); setAgendaTime('');
        setShowForm(false);
    };

    useEffect(() => {
        const unsub = onAuthStateChanged(auth, (u) => {
            if (u) { setUser(u); loadData(u.uid); }
            else setUser(null);
            setLoading(false);
        });
        return () => unsub();
    }, []);

    if (loading) return <div className="h-screen flex items-center justify-center font-black text-blue-900 bg-slate-50 text-2xl animate-pulse">ALEXANDRE CRM...</div>;
    if (!user) return <Login onLogin={setUser} />;

    return (
        <div className="min-h-screen bg-slate-50 flex font-sans text-slate-900">
            <TailwindStyle />
            {/* SIDEBAR - Fontes Maiores */}
            <aside className="w-20 lg:w-72 bg-white border-r border-slate-200 flex flex-col sticky top-0 h-screen z-50 transition-all">
                <div className="p-8 mb-10 text-center lg:text-left"><h1 className="text-2xl font-black text-blue-900 italic hidden lg:block uppercase tracking-tighter">ALEXANDRE <span className="text-blue-500">CRM</span></h1></div>
                <nav className="flex-1 px-6 space-y-6">
                    {['dashboard', 'clients', 'properties', 'agenda'].map(id => (
                        <button key={id} onClick={() => setActiveTab(id)} className={`w-full flex items-center lg:gap-5 p-5 rounded-2xl font-black text-sm transition-all uppercase tracking-widest ${activeTab === id ? 'bg-blue-900 text-white shadow-xl scale-105' : 'text-slate-400 hover:bg-slate-100'}`}>
                            <span className="text-2xl">{id === 'dashboard' ? '📊' : id === 'clients' ? '👥' : id === 'properties' ? '🏠' : '📅'}</span> 
                            <span className="hidden lg:block">{id === 'clients' ? 'Clientes' : id === 'properties' ? 'Imóveis' : id}</span>
                        </button>
                    ))}
                </nav>
            </aside>

            <main className="flex-1 p-10 overflow-y-auto">
                {activeTab === 'agenda' && (
                    <div className="max-w-7xl mx-auto space-y-10">
                        <div className="flex justify-between items-end">
                            <h2 className="text-5xl font-black text-blue-900 uppercase italic tracking-tighter leading-none">Minha Agenda <br/><span className="text-blue-500 text-lg tracking-widest uppercase not-italic font-bold">Compromissos e Visitas</span></h2>
                            <button onClick={() => setShowForm(true)} className="bg-blue-900 text-white px-10 py-5 rounded-3xl font-black text-xs uppercase tracking-widest shadow-2xl hover:scale-105 transition">+ Agendar</button>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
                            {/* CALENDÁRIO */}
                            <div className="lg:col-span-5">
                                <div className="glass p-10 rounded-[3.5rem] shadow-premium bg-white">
                                    <div className="flex justify-between items-center mb-10 text-xl font-black text-blue-900 uppercase italic">
                                        <button onClick={() => setCurrentMonth(new Date(currentMonth.setMonth(currentMonth.getMonth() - 1)))} className="p-3 bg-slate-50 rounded-full">◀</button>
                                        <span>{currentMonth.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}</span>
                                        <button onClick={() => setCurrentMonth(new Date(currentMonth.setMonth(currentMonth.getMonth() + 1)))} className="p-3 bg-slate-50 rounded-full">▶</button>
                                    </div>
                                    <div className="calendar-grid mb-6 text-xs font-black text-slate-300 uppercase text-center">
                                        {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(d => <div key={d}>{d}</div>)}
                                    </div>
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
                            </div>

                            {/* LISTA */}
                            <div className="lg:col-span-7">
                                <div className="bg-white p-12 rounded-[4rem] shadow-premium min-h-[600px]">
                                    <h3 className="text-3xl font-black text-blue-900 uppercase italic mb-10 border-b border-slate-100 pb-8 flex items-center justify-between">
                                        {new Date(selectedDate + 'T00:00:00').toLocaleDateString('pt-BR')}
                                        <span className="text-xs not-italic text-slate-400 font-bold uppercase tracking-widest">{agenda.filter(a => a.date === selectedDate).length} Atividades</span>
                                    </h3>
                                    <div className="space-y-8">
                                        {agenda.filter(a => a.date === selectedDate).map(item => (
                                            <div key={item.id} className="group bg-slate-50 p-8 rounded-[3rem] border border-slate-100 flex items-center gap-8 hover:shadow-2xl transition-all">
                                                <div className={`w-2 h-16 rounded-full ${item.type === 'Evento' ? 'bg-blue-500' : 'bg-green-500'}`}></div>
                                                <div className="flex-1">
                                                    <div className="flex justify-between items-center mb-2">
                                                        <h4 className="font-black text-blue-900 uppercase text-2xl tracking-tighter leading-none">{item.title}</h4>
                                                        <span className={`text-[10px] font-black px-4 py-2 rounded-xl uppercase ${item.type === 'Evento' ? 'bg-blue-100 text-blue-600' : 'bg-green-100 text-green-600'}`}>{item.type}</span>
                                                    </div>
                                                    <p className="text-sm font-bold text-slate-500 uppercase">🕒 {item.time || 'Sem horário'} | {item.observations}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* MODAL / FORMULÁRIO - Fontes Grandes */}
                {showForm && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-md">
                        <div className="glass w-full max-w-2xl p-14 rounded-[4rem] shadow-2xl border-2 border-white/50">
                            <h2 className="text-4xl font-black mb-12 text-blue-900 uppercase italic tracking-tighter text-center leading-none">Novo Registro</h2>
                            <div className="space-y-6">
                                <input type="text" placeholder="Título / Nome" value={activeTab === 'agenda' ? agendaTitle : name} onChange={e => activeTab === 'agenda' ? setAgendaTitle(e.target.value) : setName(e.target.value)} className="w-full p-6 bg-white rounded-3xl font-black text-lg border-none shadow-inner" />
                                {activeTab === 'agenda' ? (
                                    <div className="grid grid-cols-2 gap-6">
                                        <input type="time" value={agendaTime} onChange={e => setAgendaTime(e.target.value)} className="w-full p-6 bg-white rounded-3xl font-black text-lg border-none" />
                                        <select value={agendaType} onChange={e => setAgendaType(e.target.value)} className="w-full p-6 bg-slate-100 rounded-3xl font-black text-lg">
                                            <option value="Tarefa">Tarefa</option>
                                            <option value="Evento">Evento</option>
                                        </select>
                                    </div>
                                ) : (
                                    <input type="text" placeholder="WhatsApp" value={phone} onChange={e => setPhone(e.target.value)} className="w-full p-6 bg-white rounded-3xl font-black text-lg border-none shadow-inner" />
                                )}
                                <textarea placeholder="Detalhes / Observações" value={observations} onChange={e => setObservations(e.target.value)} className="w-full p-6 bg-white rounded-3xl font-bold h-40 border-none shadow-inner text-lg" />
                                <div className="flex gap-6 pt-10">
                                    <button onClick={activeTab === 'agenda' ? addAgendaItem : addClient} className="flex-1 bg-blue-900 text-white font-black py-6 rounded-[3rem] shadow-2xl uppercase tracking-widest text-xl transition hover:bg-black">Salvar</button>
                                    <button onClick={() => setShowForm(false)} className="flex-1 bg-slate-100 text-slate-400 font-black py-6 rounded-[3rem] uppercase tracking-widest text-xl">Cancelar</button>
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
