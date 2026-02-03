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
    .calendar-grid { display: grid; grid-template-columns: repeat(7, 1fr); gap: 4px; }
    .calendar-day { aspect-ratio: 1 / 1; display: flex; flex-direction: column; align-items: center; justify-content: center; border-radius: 12px; font-size: 10px; font-weight: 800; cursor: pointer; transition: all 0.2s; }
    .calendar-day:hover { background: #eff6ff; color: #1e3a8a; }
    .calendar-day.active { background: #1e3a8a; color: white; box-shadow: 0 4px 12px rgba(30, 58, 138, 0.3); }
    .dot { width: 4px; height: 4px; border-radius: 50%; background: #3b82f6; margin-top: 2px; }
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

    const [agendaTitle, setAgendaTitle] = useState('');
    const [agendaTime, setAgendaTime] = useState('');
    const [agendaType, setAgendaType] = useState('Tarefa');
    const [observations, setObservations] = useState('');

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

    const addAgendaItem = async () => {
        await addDoc(collection(db, 'agenda'), {
            title: agendaTitle, date: selectedDate, time: agendaTime, type: agendaType,
            observations, userId: user.uid, createdAt: new Date()
        });
        playSuccessSound();
        setAgendaTitle(''); setAgendaTime(''); setShowForm(false);
        loadData(user.uid);
    };

    useEffect(() => {
        const unsub = onAuthStateChanged(auth, (u) => {
            if (u) { setUser(u); loadData(u.uid); }
            else setUser(null);
            setLoading(false);
        });
        return () => unsub();
    }, []);

    if (loading) return <div className="h-screen flex items-center justify-center font-black text-blue-900 bg-slate-50 animate-pulse uppercase italic">Alexandre CRM...</div>;
    if (!user) return <Login onLogin={setUser} />;

    return (
        <div className="min-h-screen bg-slate-50 flex font-sans text-slate-900 overflow-x-hidden">
            <TailwindStyle />
            <aside className="w-20 lg:w-64 bg-white border-r border-slate-200 flex flex-col sticky top-0 h-screen z-50">
                <div className="p-6 mb-8 text-center lg:text-left"><h1 className="text-xl font-black text-blue-900 italic hidden lg:block uppercase tracking-tighter italic">ALEXANDRE <span className="text-blue-500 font-black">CRM</span></h1></div>
                <nav className="flex-1 px-4 space-y-4">
                    {['dashboard', 'clients', 'properties', 'agenda'].map(id => (
                        <button key={id} onClick={() => setActiveTab(id)} className={`w-full flex items-center lg:gap-4 p-4 rounded-2xl font-black text-[10px] transition-all uppercase tracking-widest ${activeTab === id ? 'bg-blue-900 text-white shadow-xl' : 'text-slate-400 hover:bg-slate-50'}`}>
                            {id === 'dashboard' ? '📊' : id === 'clients' ? '👥' : id === 'properties' ? '🏠' : '📅'} <span className="hidden lg:block">{id}</span>
                        </button>
                    ))}
                </nav>
            </aside>

            <main className="flex-1 p-8 overflow-y-auto">
                {activeTab === 'agenda' && (
                    <div className="max-w-7xl mx-auto space-y-8">
                        <div className="flex justify-between items-center">
                            <h2 className="text-4xl font-black text-blue-900 uppercase italic tracking-tighter leading-none">Agenda <br/><span className="text-blue-500 text-sm tracking-widest uppercase not-italic font-bold">Gerencie seus compromissos e visitas</span></h2>
                            <button onClick={() => setShowForm(true)} className="bg-blue-900 text-white px-8 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-2xl hover:scale-105 transition">+ Novo Compromisso</button>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                            {/* CALENDÁRIO VISUAL */}
                            <div className="lg:col-span-5">
                                <div className="glass p-8 rounded-[3rem] shadow-premium bg-white/80">
                                    <div className="flex justify-between items-center mb-8">
                                        <button onClick={() => setCurrentMonth(new Date(currentMonth.setMonth(currentMonth.getMonth() - 1)))} className="p-2 hover:bg-slate-100 rounded-full">◀</button>
                                        <h3 className="font-black text-blue-900 uppercase italic tracking-widest">{currentMonth.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}</h3>
                                        <button onClick={() => setCurrentMonth(new Date(currentMonth.setMonth(currentMonth.getMonth() + 1)))} className="p-2 hover:bg-slate-100 rounded-full">▶</button>
                                    </div>
                                    <div className="calendar-grid mb-4 text-[9px] font-black text-slate-300 uppercase text-center">
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

                            {/* LISTA DE COMPROMISSOS */}
                            <div className="lg:col-span-7">
                                <div className="bg-white p-10 rounded-[3rem] shadow-premium min-h-[500px]">
                                    <h3 className="text-2xl font-black text-blue-900 uppercase italic mb-8 border-b border-slate-100 pb-6 flex items-center justify-between">
                                        {new Date(selectedDate + 'T00:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                                        <span className="text-[10px] not-italic text-slate-400">{agenda.filter(a => a.date === selectedDate).length} COMPROMISSO(S)</span>
                                    </h3>
                                    <div className="space-y-6">
                                        {agenda.filter(a => a.date === selectedDate).map(item => (
                                            <div key={item.id} className="group relative bg-slate-50 p-6 rounded-[2.5rem] border border-slate-100 flex items-center gap-6 hover:shadow-xl transition-all duration-300">
                                                <div className={`w-1.5 h-12 rounded-full ${item.type === 'Evento' ? 'bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]' : 'bg-green-500'}`}></div>
                                                <div className="flex-1">
                                                    <div className="flex justify-between items-center">
                                                        <h4 className="font-black text-blue-900 uppercase tracking-tighter text-lg leading-none">{item.title}</h4>
                                                        <span className={`text-[8px] font-black px-3 py-1 rounded-full uppercase ${item.type === 'Evento' ? 'bg-blue-100 text-blue-600' : 'bg-green-100 text-green-600'}`}>{item.type}</span>
                                                    </div>
                                                    <div className="flex gap-4 mt-2">
                                                        <p className="text-[10px] font-bold text-slate-400 uppercase">🕒 {item.time || 'Sem hora'}</p>
                                                        <p className="text-[10px] font-bold text-slate-400 uppercase">📍 {item.observations?.substring(0, 30)}...</p>
                                                    </div>
                                                </div>
                                                <button onClick={() => deleteDoc(doc(db, 'agenda', item.id)).then(() => loadData(user.uid))} className="opacity-0 group-hover:opacity-100 p-3 text-red-300 hover:text-red-500 transition">✕</button>
                                            </div>
                                        ))}
                                        {agenda.filter(a => a.date === selectedDate).length === 0 && (
                                            <div className="flex flex-col items-center justify-center py-20 opacity-20">
                                                <span className="text-6xl mb-4">📅</span>
                                                <p className="font-black uppercase italic text-slate-900">Nenhum compromisso</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
                
                {/* O FORMULÁRIO MODAL DA AGENDA */}
                {showForm && activeTab === 'agenda' && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
                        <div className="glass w-full max-w-lg p-12 rounded-[3.5rem] shadow-2xl border-2 border-white/50 animate-fadeIn">
                            <h2 className="text-3xl font-black mb-10 text-blue-900 uppercase italic tracking-tighter text-center leading-none">Novo Compromisso<br/><span className="text-blue-500 text-[10px] tracking-[0.3em] uppercase not-italic">Agenda de Visitas e Tarefas</span></h2>
                            <div className="space-y-5">
                                <input type="text" placeholder="Título do Compromisso" value={agendaTitle} onChange={e => setAgendaTitle(e.target.value)} className="w-full p-5 bg-white rounded-3xl font-bold border-none shadow-inner" />
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1"><label className="text-[8px] font-black uppercase text-slate-400 ml-4">Data</label><input type="date" value={selectedDate} onChange={e => setSelectedDate(e.target.value)} className="w-full p-4 bg-white rounded-2xl font-bold border-none text-xs" /></div>
                                    <div className="space-y-1"><label className="text-[8px] font-black uppercase text-slate-400 ml-4">Horário</label><input type="time" value={agendaTime} onChange={e => setAgendaTime(e.target.value)} className="w-full p-4 bg-white rounded-2xl font-bold border-none text-xs" /></div>
                                </div>
                                <select value={agendaType} onChange={e => setAgendaType(e.target.value)} className="w-full p-5 bg-slate-100 rounded-3xl font-black uppercase text-[10px] tracking-widest outline-none">
                                    <option value="Tarefa">Tarefa (Checklist)</option>
                                    <option value="Evento">Evento (Visita/Reunião)</option>
                                </select>
                                <textarea placeholder="Detalhes, local ou observações..." value={observations} onChange={e => setObservations(e.target.value)} className="w-full p-5 bg-white rounded-3xl font-bold h-28 border-none shadow-inner text-sm" />
                                <div className="flex gap-4 pt-6">
                                    <button onClick={addAgendaItem} className="flex-1 bg-blue-900 text-white font-black py-5 rounded-[2.5rem] shadow-2xl uppercase tracking-widest hover:bg-black transition">Salvar Agenda</button>
                                    <button onClick={() => setShowForm(false)} className="flex-1 bg-slate-100 text-slate-400 font-black py-5 rounded-[2.5rem] uppercase tracking-widest hover:bg-slate-200 transition">Cancelar</button>
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
