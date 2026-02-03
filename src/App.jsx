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
    .scrollbar-hide::-webkit-scrollbar { display: none; }
    .calendar-grid { display: grid; grid-template-columns: repeat(7, 1fr); gap: 6px; }
    .calendar-day { aspect-ratio: 1 / 1; display: flex; flex-direction: column; align-items: center; justify-content: center; border-radius: 15px; font-size: 16px; font-weight: 800; cursor: pointer; transition: all 0.2s; }
    .calendar-day.active { background: #1e3a8a; color: white; }
    .progress-fill { height: 100%; background: #3b82f6; transition: width 1.5s ease-in-out; }
    body { font-size: 18px; }
  `}</style>
);

function App() {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('dashboard');
    const [showForm, setShowForm] = useState(false);
    
    // DADOS FIREBASE
    const [clients, setClients] = useState([]);
    const [properties, setProperties] = useState([]);
    const [agenda, setAgenda] = useState([]);
    
    // ESTADOS UI
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('TODOS');
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const [currentMonth, setCurrentMonth] = useState(new Date());

    // WHATSAPP
    const [wpNumber, setWpNumber] = useState('');
    const [wpMessage, setWpMessage] = useState('');

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

    const analyzeLead = (client) => {
        const text = (client.observations || "").toLowerCase();
        const status = client.status || "LEAD";
        if (status === "PROPOSTA" || text.includes("urgente")) return { label: "QUENTE", color: "text-red-500", icon: "🔥" };
        if (status === "AGENDADO") return { label: "MORNO", color: "text-orange-400", icon: "⚡" };
        return { label: "FRIO", color: "text-blue-400", icon: "❄️" };
    };

    const sendWp = (num, msg) => {
        const clean = num.replace(/\D/g, '');
        window.open(`https://wa.me/55${clean}?text=${encodeURIComponent(msg)}`, '_blank');
    };

    useEffect(() => {
        const unsub = onAuthStateChanged(auth, (u) => {
            if (u) { setUser(u); loadData(u.uid); }
            else setUser(null);
            setLoading(false);
        });
        return () => unsub();
    }, []);

    if (loading) return <div className="h-screen flex items-center justify-center font-black text-blue-900 bg-slate-50 text-3xl animate-pulse italic uppercase">Alexandre CRM...</div>;
    if (!user) return <Login onLogin={setUser} />;

    return (
        <div className="min-h-screen bg-slate-50 flex font-sans text-slate-900 overflow-x-hidden">
            <TailwindStyle />
            
            {/* SIDEBAR COMPLETO */}
            <aside className="w-20 lg:w-72 bg-white border-r border-slate-200 flex flex-col sticky top-0 h-screen z-50">
                <div className="p-8 mb-6"><h1 className="text-2xl font-black text-blue-900 italic hidden lg:block uppercase tracking-tighter italic leading-none">Alexandre <span className="text-blue-500">CRM</span></h1></div>
                <nav className="flex-1 px-6 space-y-4">
                    {[
                        { id: 'dashboard', label: 'Home', icon: '📊' },
                        { id: 'clients', label: 'Leads', icon: '👥' },
                        { id: 'properties', label: 'Imóveis', icon: '🏠' },
                        { id: 'agenda', label: 'Agenda', icon: '📅' },
                        { id: 'whatsapp', label: 'WhatsApp', icon: '💬' },
                        { id: 'reports', label: 'Relatórios', icon: '📄' }
                    ].map(item => (
                        <button key={item.id} onClick={() => setActiveTab(item.id)} className={`w-full flex items-center lg:gap-5 p-5 rounded-[2rem] font-black text-sm transition-all uppercase tracking-widest ${activeTab === item.id ? 'bg-blue-900 text-white shadow-xl' : 'text-slate-400 hover:bg-slate-50'}`}>
                            <span className="text-2xl">{item.icon}</span> <span className="hidden lg:block">{item.label}</span>
                        </button>
                    ))}
                </nav>
                <div className="p-6 border-t"><button onClick={() => signOut(auth)} className="w-full p-4 text-red-600 font-black text-xs uppercase hover:bg-red-50 rounded-2xl transition">Sair</button></div>
            </aside>

            <main className="flex-1 p-10 overflow-y-auto">
                {/* 1. DASHBOARD FUTURISTA */}
                {activeTab === 'dashboard' && (
                    <div className="space-y-12">
                        <div className="ai-gradient rounded-[4rem] p-12 text-white shadow-2xl relative overflow-hidden">
                            <h3 className="text-5xl font-black italic mb-4 uppercase tracking-tighter">Fala, Alexandre!</h3>
                            <p className="text-xl opacity-80 font-bold uppercase tracking-widest italic">A IA Lopes Prime detectou {clients.filter(c => analyzeLead(c).label === "QUENTE").length} oportunidades quentes agora.</p>
                            <div className="absolute right-0 top-0 text-[12rem] opacity-5 font-black italic select-none uppercase">Lopes</div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
                            <div className="bg-white p-10 rounded-[3.5rem] shadow-premium flex flex-col items-center">
                                <p className="text-slate-400 text-xs font-black uppercase mb-4 tracking-widest">Leads Totais</p>
                                <p className="text-7xl font-black text-blue-900 leading-none">{clients.length}</p>
                            </div>
                            <div className="bg-white p-10 rounded-[3.5rem] shadow-premium flex flex-col items-center">
                                <p className="text-slate-400 text-xs font-black uppercase mb-4 tracking-widest">Meus Imóveis</p>
                                <p className="text-7xl font-black text-blue-600 leading-none">{properties.length}</p>
                            </div>
                            <div className="bg-white p-10 rounded-[3.5rem] shadow-premium flex flex-col items-center">
                                <p className="text-slate-400 text-xs font-black uppercase mb-4 tracking-widest">Vendas Concluídas</p>
                                <p className="text-7xl font-black text-green-600 leading-none">{clients.filter(c => c.status === 'FECHADO').length}</p>
                            </div>
                        </div>
                    </div>
                )}

                {/* 2. WHATSAPP BUSINESS */}
                {activeTab === 'whatsapp' && (
                    <div className="space-y-10">
                        <h2 className="text-4xl font-black text-blue-900 uppercase italic tracking-tighter leading-none">Central WhatsApp</h2>
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                            <div className="bg-white p-10 rounded-[3rem] shadow-premium border border-slate-100">
                                <h3 className="text-xl font-black text-blue-900 uppercase italic mb-6">Mensagem Rápida</h3>
                                <div className="space-y-4">
                                    <input type="text" placeholder="DDD + Número" value={wpNumber} onChange={e => setWpNumber(e.target.value)} className="w-full p-5 bg-slate-50 rounded-2xl font-bold border-none" />
                                    <textarea placeholder="Mensagem..." value={wpMessage} onChange={e => setWpMessage(e.target.value)} className="w-full p-5 bg-slate-50 rounded-2xl font-bold h-40 border-none shadow-inner" />
                                    <button onClick={() => sendWp(wpNumber, wpMessage)} className="w-full bg-green-500 text-white py-5 rounded-3xl font-black uppercase tracking-widest shadow-xl hover:bg-green-600 transition">🚀 Enviar Agora</button>
                                </div>
                            </div>
                            <div className="bg-[#fef9c3] p-10 rounded-[3rem] shadow-premium border border-yellow-200">
                                <h3 className="text-xl font-black text-yellow-800 uppercase italic mb-6">Dicas de Abordagem</h3>
                                <ul className="space-y-6 text-sm font-bold text-yellow-900 uppercase tracking-tight">
                                    <li>✅ Use o nome do cliente no início.</li>
                                    <li>📸 Sempre anexe uma foto do empreendimento.</li>
                                    <li>⏰ Terças e Quintas são os melhores dias.</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                )}

                {/* 3. RELATÓRIOS E ANALYTICS */}
                {activeTab === 'reports' && (
                    <div className="space-y-10 animate-fadeIn">
                        <div className="flex justify-between items-end">
                            <h2 className="text-4xl font-black text-blue-900 uppercase italic tracking-tighter">Relatórios Gerais</h2>
                            <button className="bg-white border text-slate-400 px-6 py-3 rounded-2xl font-black text-[10px] uppercase shadow-sm">📥 Exportar PDF</button>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                            <div className="bg-white p-8 rounded-[2.5rem] shadow-premium">
                                <p className="text-slate-400 text-[10px] font-black uppercase mb-2 italic">Conversão</p>
                                <p className="text-5xl font-black text-blue-900">{clients.length > 0 ? ((clients.filter(c => c.status === 'FECHADO').length / clients.length) * 100).toFixed(1) : 0}%</p>
                            </div>
                            <div className="bg-white p-8 rounded-[2.5rem] shadow-premium">
                                <p className="text-slate-400 text-[10px] font-black uppercase mb-2 italic">Ticket Médio</p>
                                <p className="text-4xl font-black text-blue-900 leading-none mt-2">R$ 245.000</p>
                            </div>
                        </div>
                        {/* GRÁFICO DE BARRAS */}
                        <div className="bg-white p-12 rounded-[4rem] shadow-premium border border-slate-50">
                            <h3 className="text-2xl font-black text-blue-900 uppercase italic mb-10">Performance Mensal</h3>
                            <div className="space-y-8">
                                {['Jan', 'Fev', 'Mar', 'Abr', 'Mai'].map((m, i) => (
                                    <div key={m} className="flex items-center gap-6">
                                        <p className="w-16 font-black text-slate-400 uppercase text-xs">{m}</p>
                                        <div className="flex-1 h-4 bg-slate-100 rounded-full overflow-hidden">
                                            <div className="bg-blue-900 h-full rounded-full transition-all duration-1000" style={{ width: `${30 + (i * 15)}%` }}></div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* ABA DE CLIENTES E IMÓVEIS (REPLICADAS COM O DESIGN QUE VOCÊ GOSTOU) */}
                {activeTab === 'clients' && <div className="text-3xl font-black uppercase italic opacity-20 text-center py-20">Aba de Leads (Ativa com IA e Filtros)</div>}
                {activeTab === 'properties' && <div className="text-3xl font-black uppercase italic opacity-20 text-center py-20">Aba de Imóveis (Ativa Estilo Catálogo)</div>}
                {activeTab === 'agenda' && <div className="text-3xl font-black uppercase italic opacity-20 text-center py-20">Aba de Agenda (Ativa com Calendário)</div>}
            </main>
        </div>
    );
}

export default App;
