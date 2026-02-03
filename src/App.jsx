import React, { useState, useEffect } from 'react';
import { db, auth } from './firebase/config';
import { collection, addDoc, getDocs, query, where, updateDoc, doc, deleteDoc, Timestamp } from 'firebase/firestore';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import Login from './components/Login';

const TailwindStyle = () => (
  <style>{`
    @import url('https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css');
    .glass { background: rgba(255, 255, 255, 0.75); backdrop-filter: blur(15px); border: 1px solid rgba(255, 255, 255, 0.4); }
    .ai-gradient { background: linear-gradient(135deg, #0f172a 0%, #1e3a8a 100%); }
    .shadow-premium { box-shadow: 0 10px 30px -5px rgba(0, 0, 0, 0.1); }
    .scrollbar-hide::-webkit-scrollbar { display: none; }
    .calendar-dot { width: 4px; height: 4px; background: #3b82f6; border-radius: 50%; margin: 0 auto; }
  `}</style>
);

function App() {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('dashboard');
    const [showForm, setShowForm] = useState(false);
    
    const [clients, setClients] = useState([]);
    const [properties, setProperties] = useState([]);
    const [agenda, setAgenda] = useState([]); // Coleção de Tarefas/Eventos
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const [editingId, setEditingId] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('TODOS');

    // ESTADOS DE INPUT
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

    // INPUTS DA AGENDA
    const [agendaTitle, setAgendaTitle] = useState('');
    const [agendaTime, setAgendaTime] = useState('');
    const [agendaType, setAgendaType] = useState('Tarefa'); // Tarefa ou Evento

    const playSuccessSound = () => {
        const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2568/2568-preview.mp3');
        audio.play();
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

    const addAgendaItem = async () => {
        if (!agendaTitle || !selectedDate) return alert("Preencha título e data!");
        await addDoc(collection(db, 'agenda'), {
            title: agendaTitle,
            date: selectedDate,
            time: agendaTime,
            type: agendaType,
            userId: user.uid,
            clientRef: propertyInterest, // Reutilizando estado para vincular cliente
            observations: observations,
            createdAt: new Date()
        });
        playSuccessSound();
        resetForm(); loadData(user.uid);
    };

    const resetForm = () => {
        setName(''); setPhone(''); setPropertyInterest(''); setBirthDate(''); 
        setObservations(''); setPropPrice(''); setPropAddress(''); setPropLink(''); setPropPdf(''); setPropImg('');
        setAgendaTitle(''); setAgendaTime(''); setAgendaType('Tarefa');
        setEditingId(null); setShowForm(false);
    };

    useEffect(() => {
        const unsub = onAuthStateChanged(auth, (u) => {
            if (u) { setUser(u); loadData(u.uid); }
            else setUser(null);
            setLoading(false);
        });
        return () => unsub();
    }, []);

    if (loading) return <div className="h-screen flex items-center justify-center font-black text-blue-900 bg-slate-50 animate-pulse uppercase">ALEXANDRE CRM...</div>;
    if (!user) return <Login onLogin={setUser} />;

    return (
        <div className="min-h-screen bg-slate-50 flex font-sans text-slate-900">
            <TailwindStyle />
            
            {/* SIDEBAR */}
            <aside className="w-20 lg:w-64 bg-white border-r border-slate-200 flex flex-col sticky top-0 h-screen z-50">
                <div className="p-6 mb-8 text-center lg:text-left">
                    <h1 className="text-xl font-black text-blue-900 italic hidden lg:block uppercase tracking-tighter italic">Alexandre <span className="text-blue-500">CRM</span></h1>
                </div>
                <nav className="flex-1 px-4 space-y-4">
                    {[
                        { id: 'dashboard', label: 'Dashboard', icon: '📊' },
                        { id: 'clients', label: 'Clientes', icon: '👥' },
                        { id: 'properties', label: 'Imóveis', icon: '🏠' },
                        { id: 'agenda', label: 'Agenda', icon: '📅' }
                    ].map(item => (
                        <button key={item.id} onClick={() => {setActiveTab(item.id); resetForm();}} className={`w-full flex items-center lg:gap-4 p-4 rounded-2xl font-bold text-sm transition-all ${activeTab === item.id ? 'bg-blue-900 text-white shadow-xl' : 'text-slate-400 hover:bg-slate-50'}`}>
                            <span className="text-lg">{item.icon}</span> <span className="hidden lg:block uppercase text-[10px] tracking-widest">{item.label}</span>
                        </button>
                    ))}
                </nav>
                <div className="p-4 border-t"><button onClick={() => signOut(auth)} className="w-full p-4 text-red-600 font-black text-[9px] uppercase hover:bg-red-50 rounded-2xl">Sair</button></div>
            </aside>

            <main className="flex-1 overflow-y-auto">
                <header className="p-8 flex justify-between items-center bg-white/70 backdrop-blur-md sticky top-0 z-40 border-b border-slate-100">
                    <h2 className="text-2xl font-black uppercase italic tracking-tighter text-blue-900">{activeTab}</h2>
                    <input type="text" placeholder="Buscar..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="p-3 bg-slate-100 rounded-2xl text-xs font-bold w-48 lg:w-80 outline-none" />
                </header>

                <div className="p-8">
                    {/* AGENDA SECTION */}
                    {activeTab === 'agenda' && (
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                            {/* CALENDARIO ESQUERDA */}
                            <div className="lg:col-span-4 space-y-6">
                                <div className="glass p-8 rounded-[3rem] shadow-premium">
                                    <h3 className="font-black text-blue-900 uppercase italic mb-6">Calendário</h3>
                                    <input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} className="w-full p-4 bg-slate-50 rounded-2xl font-bold border-none shadow-inner mb-6" />
                                    <button onClick={() => setShowForm(true)} className="w-full bg-blue-900 text-white py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl">Novo Compromisso +</button>
                                </div>
                            </div>

                            {/* LISTA DE TAREFAS DIREITA */}
                            <div className="lg:col-span-8 space-y-6">
                                <div className="bg-white p-8 rounded-[3rem] shadow-premium min-h-[500px]">
                                    <h3 className="text-xl font-black text-blue-900 uppercase italic mb-8 border-b pb-4">
                                        Compromissos para {new Date(selectedDate + 'T00:00:00').toLocaleDateString('pt-BR')}
                                    </h3>
                                    <div className="space-y-4">
                                        {agenda.filter(item => item.date === selectedDate).length > 0 ? (
                                            agenda.filter(item => item.date === selectedDate).map(item => (
                                                <div key={item.id} className="flex items-center gap-6 p-6 bg-slate-50 rounded-[2rem] border border-slate-100 group hover:shadow-lg transition">
                                                    <div className={`w-3 h-12 rounded-full ${item.type === 'Evento' ? 'bg-purple-500' : 'bg-green-500'}`}></div>
                                                    <div className="flex-1">
                                                        <div className="flex justify-between">
                                                            <p className="font-black text-blue-900 uppercase tracking-tighter text-lg">{item.title}</p>
                                                            <span className="text-[10px] font-black text-slate-400">{item.time || '--:--'}</span>
                                                        </div>
                                                        <p className="text-[10px] font-bold text-slate-500 uppercase mt-1">📍 {item.clientRef || 'Geral'}</p>
                                                        <p className="text-xs italic text-slate-400 mt-2">{item.observations}</p>
                                                    </div>
                                                    <button onClick={() => deleteDoc(doc(db, 'agenda', item.id)).then(() => loadData(user.uid))} className="opacity-0 group-hover:opacity-100 text-red-300 hover:text-red-500 font-bold uppercase text-[9px]">Remover</button>
                                                </div>
                                            ))
                                        ) : (
                                            <div className="text-center py-20 text-slate-300 font-black italic uppercase">Nenhum compromisso agendado</div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* DASHBOARD (REDUZIDO PARA EXEMPLO) */}
                    {activeTab === 'dashboard' && (
                        <div className="space-y-10">
                            <div className="ai-gradient rounded-[3rem] p-10 text-white shadow-2xl">
                                <h3 className="text-3xl font-black italic mb-2 uppercase leading-none">Bem-vindo, Alexandre!</h3>
                                <p className="opacity-70 font-bold text-sm uppercase">Você tem {agenda.filter(i => i.date === new Date().toISOString().split('T')[0]).length} compromissos hoje.</p>
                            </div>
                        </div>
                    )}

                    {/* AS OUTRAS SEÇÕES (CLIENTES E IMÓVEIS) PERMANECEM IGUAIS AO CÓDIGO ANTERIOR NO SEU ARQUIVO */}
                    {/* [O código de Clientes e Imóveis deve ser mantido aqui conforme a versão anterior] */}
                </div>

                {/* MODAL PARA NOVA TAREFA / EVENTO */}
                {showForm && activeTab === 'agenda' && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
                        <div className="glass w-full max-w-lg p-10 rounded-[3rem] shadow-2xl relative">
                            <h2 className="text-2xl font-black mb-8 text-blue-900 uppercase italic text-center">Novo Compromisso</h2>
                            <div className="space-y-4">
                                <input type="text" placeholder="Título (ex: Visita Ilha Pura)" value={agendaTitle} onChange={e => setAgendaTitle(e.target.value)} className="w-full p-4 bg-white rounded-2xl font-bold border-none shadow-sm" />
                                <div className="grid grid-cols-2 gap-4">
                                    <input type="time" value={agendaTime} onChange={e => setAgendaTime(e.target.value)} className="p-4 bg-white rounded-2xl font-bold border-none shadow-sm" />
                                    <select value={agendaType} onChange={e => setAgendaType(e.target.value)} className="p-4 bg-white rounded-2xl font-bold border-none shadow-sm">
                                        <option value="Tarefa">Tarefa</option>
                                        <option value="Evento">Evento</option>
                                    </select>
                                </div>
                                <select value={propertyInterest} onChange={e => setPropertyInterest(e.target.value)} className="w-full p-4 bg-yellow-50 rounded-2xl font-black border-none shadow-sm">
                                    <option value="">Vincular a Cliente/Imóvel...</option>
                                    {clients.map(c => <option key={c.id} value={c.fullName}>{c.fullName}</option>)}
                                    {properties.map(p => <option key={p.id} value={p.title}>{p.title}</option>)}
                                </select>
                                <textarea placeholder="Detalhes do compromisso..." value={observations} onChange={e => setObservations(e.target.value)} className="w-full p-4 bg-white rounded-2xl font-bold h-24 border-none shadow-sm" />
                                <div className="flex gap-4 pt-4">
                                    <button onClick={addAgendaItem} className="flex-1 bg-blue-900 text-white font-black py-4 rounded-[2rem] shadow-xl uppercase tracking-widest">Agendar</button>
                                    <button onClick={resetForm} className="flex-1 bg-slate-100 text-slate-400 font-black py-4 rounded-[2rem] uppercase tracking-widest">Cancelar</button>
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
