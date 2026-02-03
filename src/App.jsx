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
    const [selectedClients, setSelectedClients] = useState([]); // Para envio em massa
    const [wpMessage, setWpMessage] = useState('');
    const [wpNumber, setWpNumber] = useState('');

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

    const sendWp = (number, msg) => {
        const cleanNumber = number.replace(/\D/g, '');
        window.open(`https://wa.me/55${cleanNumber}?text=${encodeURIComponent(msg)}`, '_blank');
    };

    const handleBulkSend = () => {
        if (selectedClients.length === 0 || !wpMessage) return alert("Selecione contatos e digite a mensagem!");
        selectedClients.forEach((num, index) => {
            setTimeout(() => {
                sendWp(num, wpMessage);
            }, index * 2000); // Intervalo de 2s entre envios para evitar bloqueio
        });
    };

    useEffect(() => {
        const unsub = onAuthStateChanged(auth, (u) => {
            if (u) { setUser(u); loadData(u.uid); }
            else setUser(null);
            setLoading(false);
        });
        return () => unsub();
    }, []);

    if (loading) return <div className="h-screen flex items-center justify-center font-black text-blue-900 bg-slate-50 text-3xl animate-pulse italic">ALEXANDRE CRM...</div>;
    if (!user) return <Login onLogin={setUser} />;

    return (
        <div className="min-h-screen bg-slate-50 flex font-sans text-slate-900">
            <TailwindStyle />
            
            <aside className="w-20 lg:w-72 bg-white border-r border-slate-200 flex flex-col sticky top-0 h-screen z-50">
                <div className="p-8 mb-6"><h1 className="text-2xl font-black text-blue-900 italic hidden lg:block uppercase tracking-tighter">ALEXANDRE <span className="text-blue-500">CRM</span></h1></div>
                <nav className="flex-1 px-6 space-y-4">
                    {[
                        { id: 'dashboard', label: 'Dashboard', icon: '📊' },
                        { id: 'clients', label: 'Clientes', icon: '👥' },
                        { id: 'properties', label: 'Imóveis', icon: '🏠' },
                        { id: 'agenda', label: 'Agenda', icon: '📅' },
                        { id: 'whatsapp', label: 'WhatsApp', icon: '💬' }
                    ].map(item => (
                        <button key={item.id} onClick={() => setActiveTab(item.id)} className={`w-full flex items-center lg:gap-5 p-5 rounded-3xl font-black text-sm transition-all uppercase tracking-widest ${activeTab === item.id ? 'bg-blue-900 text-white shadow-xl' : 'text-slate-400 hover:bg-slate-50'}`}>
                            <span className="text-2xl">{item.icon}</span> <span className="hidden lg:block">{item.label}</span>
                        </button>
                    ))}
                </nav>
            </aside>

            <main className="flex-1 p-10 overflow-y-auto">
                {activeTab === 'whatsapp' && (
                    <div className="max-w-7xl mx-auto space-y-10">
                        <div className="flex justify-between items-center">
                            <h2 className="text-4xl font-black text-blue-900 uppercase italic tracking-tighter leading-none">Central WhatsApp<br/><span className="text-green-500 text-lg not-italic font-bold uppercase tracking-widest">Produtividade e Abordagem</span></h2>
                            <button onClick={() => window.open('https://web.whatsapp.com', '_blank')} className="bg-green-600 text-white px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center gap-2 shadow-lg">💬 WhatsApp Web</button>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                            {/* COLUNA ESQUERDA - MENSAGEM INDIVIDUAL E TEMPLATES */}
                            <div className="lg:col-span-7 space-y-8">
                                <div className="bg-white p-10 rounded-[3rem] shadow-premium border border-slate-100">
                                    <h3 className="text-xl font-black text-blue-900 uppercase italic mb-6 flex items-center gap-3">✉️ Enviar Mensagem Rápida</h3>
                                    <div className="space-y-4">
                                        <input type="text" placeholder="Número do Cliente (DDD + Número)" value={wpNumber} onChange={e => setWpNumber(e.target.value)} className="w-full p-5 bg-slate-50 rounded-2xl font-bold border-none shadow-inner" />
                                        <textarea placeholder="Digite sua mensagem aqui..." value={wpMessage} onChange={e => setWpMessage(e.target.value)} className="w-full p-5 bg-slate-50 rounded-2xl font-bold h-32 border-none shadow-inner" />
                                        <button onClick={() => sendWp(wpNumber, wpMessage)} className="w-full bg-green-500 text-white py-5 rounded-3xl font-black uppercase tracking-widest text-sm shadow-xl hover:bg-green-600 transition">🚀 Enviar pelo WhatsApp</button>
                                    </div>
                                </div>

                                <div className="bg-white p-10 rounded-[3rem] shadow-premium border border-slate-100">
                                    <h3 className="text-xl font-black text-blue-900 uppercase italic mb-6">📝 Modelos de Respostas</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {[
                                            { t: 'Abordagem', m: 'Olá! Sou o Alexandre, corretor da Lopes Prime. Gostaria de saber se você tem interesse em comprar ou alugar um imóvel hoje?' },
                                            { t: 'Follow-up', m: 'Oi! Como vai? Gostaria de saber se ainda tem interesse naquele imóvel que conversamos. Temos opções novas no perfil!' },
                                            { t: 'Agendamento', m: 'Olá! Podemos agendar uma visita para amanhã? Tenho horários disponíveis na parte da tarde.' },
                                            { t: 'Proposta', m: 'Parabéns! Sua proposta foi aceita. Vamos dar continuidade aos documentos?' }
                                        ].map(item => (
                                            <div key={item.t} className="p-5 bg-slate-50 rounded-3xl border border-slate-100 group relative">
                                                <p className="font-black text-blue-900 text-xs uppercase mb-2">{item.t}</p>
                                                <p className="text-xs text-slate-500 italic leading-relaxed mb-4">{item.m.substring(0, 60)}...</p>
                                                <div className="flex gap-2">
                                                    <button onClick={() => {setWpMessage(item.m); alert("Mensagem copiada para o campo de envio!");}} className="bg-yellow-400 p-2 rounded-lg text-xs">📋</button>
                                                    <button onClick={() => sendWp(wpNumber || '999999999', item.m)} className="bg-green-500 p-2 rounded-lg text-xs text-white">▶️</button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* COLUNA DIREITA - ENVIO EM MASSA E DICAS */}
                            <div className="lg:col-span-5 space-y-8">
                                <div className="bg-white p-10 rounded-[3rem] shadow-premium border border-slate-100">
                                    <h3 className="text-xl font-black text-blue-900 uppercase italic mb-6 flex justify-between items-center">
                                        📢 Envio em Massa
                                        <span className="text-[10px] bg-blue-100 text-blue-600 px-3 py-1 rounded-full">{selectedClients.length} Selecionados</span>
                                    </h3>
                                    <div className="max-h-64 overflow-y-auto scrollbar-hide space-y-2 mb-6 p-2 bg-slate-50 rounded-2xl">
                                        {clients.map(c => (
                                            <label key={c.id} className="flex items-center gap-3 p-3 bg-white rounded-xl cursor-pointer hover:bg-blue-50 transition">
                                                <input type="checkbox" className="w-5 h-5" onChange={(e) => {
                                                    const num = c.phones?.[0];
                                                    if(e.target.checked) setSelectedClients([...selectedClients, num]);
                                                    else setSelectedClients(selectedClients.filter(n => n !== num));
                                                }} />
                                                <div className="text-xs font-bold uppercase">{c.fullName} <span className="text-slate-300 block text-[9px]">{c.phones?.[0]}</span></div>
                                            </label>
                                        ))}
                                    </div>
                                    <button onClick={handleBulkSend} className="w-full bg-blue-900 text-white py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-lg">Enviar para Selecionados</button>
                                </div>

                                <div className="bg-[#fef9c3] p-10 rounded-[3rem] shadow-premium border border-yellow-200">
                                    <h3 className="text-xl font-black text-yellow-800 uppercase italic mb-6">💡 Dicas WhatsApp</h3>
                                    <div className="space-y-4 text-xs font-bold text-yellow-900">
                                        <div className="flex gap-3"><span>📱</span> <p>Use mensagens personalizadas para cada lead.</p></div>
                                        <div className="flex gap-3"><span>⏰</span> <p>Melhores horários: Terça a Quinta, das 10h às 16h.</p></div>
                                        <div className="flex gap-3"><span>📸</span> <p>Sempre envie fotos reais do imóvel no primeiro contato.</p></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
                
                {/* Outras abas permanecem intocadas */}
                {activeTab === 'dashboard' && <div className="text-4xl font-black italic">Página Dashboard (Ativa)</div>}
                {activeTab === 'clients' && <div className="text-4xl font-black italic">Página Clientes (Ativa)</div>}
                {activeTab === 'properties' && <div className="text-4xl font-black italic">Página Imóveis (Ativa)</div>}
                {activeTab === 'agenda' && <div className="text-4xl font-black italic">Página Agenda (Ativa)</div>}
            </main>
        </div>
    );
}

export default App;
