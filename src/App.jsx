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
    body { font-size: 18px; }
    .progress-bar { height: 12px; border-radius: 6px; background: #e2e8f0; position: relative; overflow: hidden; }
    .progress-fill { height: 100%; background: #3b82f6; transition: width 1.5s ease-in-out; }
  `}</style>
);

function App() {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('dashboard');
    const [clients, setClients] = useState([]);
    const [properties, setProperties] = useState([]);

    const loadData = async (userId) => {
        const qC = query(collection(db, 'clients'), where("assignedAgent", "==", userId));
        const snapC = await getDocs(qC);
        setClients(snapC.docs.map(d => ({ id: d.id, ...d.data() })));

        const qP = query(collection(db, 'properties'), where("userId", "==", userId));
        const snapP = await getDocs(qP);
        setProperties(snapP.docs.map(d => ({ id: d.id, ...d.data() })));
    };

    useEffect(() => {
        const unsub = onAuthStateChanged(auth, (u) => {
            if (u) { setUser(u); loadData(u.uid); }
            else setUser(null);
            setLoading(false);
        });
        return () => unsub();
    }, []);

    // CÁLCULOS PARA O RELATÓRIO
    const totalSales = clients.filter(c => c.status === 'FECHADO').length * 237500; // Simulação de ticket médio
    const conversionRate = clients.length > 0 ? ((clients.filter(c => c.status === 'FECHADO').length / clients.length) * 100).toFixed(1) : 0;

    if (loading) return <div className="h-screen flex items-center justify-center font-black text-blue-900 bg-slate-50 text-3xl animate-pulse italic">ALEXANDRE CRM...</div>;
    if (!user) return <Login onLogin={setUser} />;

    return (
        <div className="min-h-screen bg-[#f8fafc] flex font-sans text-slate-900">
            <TailwindStyle />
            
            <aside className="w-20 lg:w-72 bg-white border-r border-slate-200 flex flex-col sticky top-0 h-screen z-50">
                <div className="p-8 mb-6"><h1 className="text-2xl font-black text-blue-900 italic hidden lg:block uppercase tracking-tighter italic">ALEXANDRE <span className="text-blue-500">CRM</span></h1></div>
                <nav className="flex-1 px-6 space-y-4">
                    {[
                        { id: 'dashboard', label: 'Dashboard', icon: '📊' },
                        { id: 'clients', label: 'Clientes', icon: '👥' },
                        { id: 'properties', label: 'Imóveis', icon: '🏠' },
                        { id: 'reports', label: 'Relatórios', icon: '📄' }
                    ].map(item => (
                        <button key={item.id} onClick={() => setActiveTab(item.id)} className={`w-full flex items-center lg:gap-5 p-5 rounded-3xl font-black text-sm transition-all uppercase tracking-widest ${activeTab === item.id ? 'bg-blue-900 text-white shadow-xl' : 'text-slate-400 hover:bg-slate-50'}`}>
                            <span className="text-2xl">{item.icon}</span> <span className="hidden lg:block">{item.label}</span>
                        </button>
                    ))}
                </nav>
            </aside>

            <main className="flex-1 p-10 overflow-y-auto">
                {activeTab === 'reports' && (
                    <div className="max-w-7xl mx-auto space-y-10">
                        {/* HEADER DE RELATÓRIO */}
                        <div className="flex flex-wrap justify-between items-end gap-6">
                            <div>
                                <h2 className="text-4xl font-black text-blue-900 uppercase italic tracking-tighter leading-none mb-4">Relatórios e Analytics</h2>
                                <select className="p-3 bg-white border rounded-xl font-bold text-xs uppercase text-slate-500 shadow-sm">
                                    <option>Últimos 30 dias</option>
                                    <option>Últimos 6 meses</option>
                                </select>
                            </div>
                            <div className="flex gap-4">
                                <button className="bg-white border text-slate-600 px-6 py-3 rounded-2xl font-black text-[10px] uppercase flex items-center gap-2 shadow-sm hover:bg-slate-50 transition">📥 Exportar PDF</button>
                                <button className="bg-blue-600 text-white px-8 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl active:scale-95 transition">+ Novo Relatório</button>
                            </div>
                        </div>

                        {/* NAVEGAÇÃO INTERNA */}
                        <div className="flex gap-2 bg-slate-100 p-2 rounded-2xl max-w-2xl">
                            {['Visão Geral', 'Vendas', 'Clientes', 'Imóveis'].map((aba, i) => (
                                <button key={aba} className={`flex-1 py-3 rounded-xl font-black text-[10px] uppercase transition ${i === 0 ? 'bg-white text-blue-900 shadow-sm' : 'text-slate-400'}`}>{aba}</button>
                            ))}
                        </div>

                        {/* CARDS DE KPI */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                            <div className="bg-white p-8 rounded-[2.5rem] shadow-premium relative overflow-hidden">
                                <p className="text-slate-400 text-[10px] font-black uppercase mb-2">Vendas Totais</p>
                                <p className="text-3xl font-black text-blue-900 italic leading-none mb-2">R$ {totalSales.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                                <p className="text-green-500 text-[10px] font-bold">↑ +12.3% este mês</p>
                                <span className="absolute top-4 right-6 text-2xl">💰</span>
                            </div>
                            <div className="bg-white p-8 rounded-[2.5rem] shadow-premium relative overflow-hidden">
                                <p className="text-slate-400 text-[10px] font-black uppercase mb-2">Negócios Fechados</p>
                                <p className="text-3xl font-black text-blue-900 leading-none mb-2">{clients.filter(c => c.status === 'FECHADO').length}</p>
                                <p className="text-slate-400 text-[10px] font-bold italic">Meta: 15 negócios</p>
                                <span className="absolute top-4 right-6 text-2xl text-blue-500">🏆</span>
                            </div>
                            <div className="bg-white p-8 rounded-[2.5rem] shadow-premium relative overflow-hidden">
                                <p className="text-slate-400 text-[10px] font-black uppercase mb-2">Ticket Médio</p>
                                <p className="text-3xl font-black text-blue-900 leading-none mb-2">R$ 237.500,00</p>
                                <p className="text-slate-400 text-[10px] font-bold italic">Último período</p>
                                <span className="absolute top-4 right-6 text-2xl text-yellow-500">🎯</span>
                            </div>
                            <div className="bg-white p-8 rounded-[2.5rem] shadow-premium relative overflow-hidden">
                                <p className="text-slate-400 text-[10px] font-black uppercase mb-2">Taxa Conversão</p>
                                <p className="text-4xl font-black text-blue-900 leading-none mb-2">{conversionRate}%</p>
                                <p className="text-slate-400 text-[10px] font-bold italic">Clientes → Vendas</p>
                                <span className="absolute top-4 right-6 text-2xl text-purple-500">📈</span>
                            </div>
                        </div>

                        {/* GRÁFICO DE PERFORMANCE */}
                        <div className="bg-white p-12 rounded-[4rem] shadow-premium">
                            <h3 className="text-2xl font-black text-blue-900 uppercase italic mb-10 flex items-center gap-4">📊 Performance de Vendas</h3>
                            <div className="space-y-8">
                                {[
                                    { mes: 'Jan', valor: 'R$ 1.200.000,00', neg: 5, perc: 40 },
                                    { mes: 'Fev', valor: 'R$ 1.800.000,00', neg: 7, perc: 65 },
                                    { mes: 'Mar', valor: 'R$ 2.100.000,00', neg: 9, perc: 75 },
                                    { mes: 'Abr', valor: 'R$ 1.950.000,00', neg: 8, perc: 70 },
                                    { mes: 'Mai', valor: 'R$ 2.400.000,00', neg: 10, perc: 85 },
                                ].map((item) => (
                                    <div key={item.mes} className="flex items-center gap-8 group">
                                        <p className="w-16 font-black text-slate-400 uppercase text-xs">{item.mes}</p>
                                        <div className="flex-1 progress-bar">
                                            <div className="progress-fill" style={{ width: `${item.perc}%` }}></div>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-black text-blue-900 text-sm tracking-tighter">{item.valor}</p>
                                            <p className="text-[10px] font-bold text-slate-400 uppercase">{item.neg} negócios</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}

export default App;
