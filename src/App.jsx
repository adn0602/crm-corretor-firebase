import React, { useState, useEffect } from 'react';
import { db, auth } from './firebase/config';
import { collection, addDoc, getDocs, query, where, updateDoc, doc, deleteDoc } from 'firebase/firestore';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import Login from './components/Login';

const TailwindStyle = () => (
  <style>{`
    @import url('https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css');
    .glass { background: rgba(255, 255, 255, 0.9); backdrop-filter: blur(10px); border: 1px solid rgba(255, 255, 255, 0.5); }
    .ai-gradient { background: linear-gradient(135deg, #0f172a 0%, #1e3a8a 100%); }
    .shadow-premium { box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05); }
    .scrollbar-hide::-webkit-scrollbar { display: none; }
    .calendar-grid { display: grid; grid-template-columns: repeat(7, 1fr); gap: 6px; }
    .calendar-day { aspect-ratio: 1 / 1; display: flex; flex-direction: column; align-items: center; justify-content: center; border-radius: 12px; font-size: 14px; font-weight: 700; cursor: pointer; transition: all 0.2s; }
    .calendar-day.active { background: #1e3a8a; color: white; }
    body { font-size: 16px; background-color: #f3f4f6; }
  `}</style>
);

function App() {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('whatsapp'); // Focando na aba WhatsApp para teste
    const [showForm, setShowForm] = useState(false);
    
    // DADOS
    const [clients, setClients] = useState([]);
    const [properties, setProperties] = useState([]);
    const [agenda, setAgenda] = useState([]);
    
    // FILTROS
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('TODOS');
    const [editingId, setEditingId] = useState(null);
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const [currentMonth, setCurrentMonth] = useState(new Date());

    // FORMULÁRIOS
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
    const [agendaTitle, setAgendaTitle] = useState('');
    const [agendaTime, setAgendaTime] = useState('');
    const [agendaType, setAgendaType] = useState('Tarefa');

    // WHATSAPP
    const [wpNumber, setWpNumber] = useState('');
    const [wpMessage, setWpMessage] = useState('');
    const [bulkMessage, setBulkMessage] = useState(''); // Mensagem para envio em massa
    const [selectedClients, setSelectedClients] = useState([]);

    const templates = [
        { title: 'Primeira Abordagem', text: 'Olá! Sou corretor de imóveis e gostaria de saber se você tem interesse em comprar, vender ou alugar um imóvel. Posso te ajudar a encontrar o ideal?' },
        { title: 'Follow-up Lead', text: 'Oi! Como vai? Gostaria de saber se ainda tem interesse no imóvel que conversamos. Tenho algumas opções similares que podem interessar!' },
        { title: 'Agendamento Visita', text: 'Olá! Gostaria de agendar uma visita ao imóvel? Tenho disponibilidade hoje e amanhã. Qual horário é melhor para você?' },
        { title: 'Proposta Aceita', text: '🎉 Parabéns! Sua proposta foi aceita! Vamos dar continuidade ao processo. Quando podemos nos reunir para os próximos passos?' }
    ];

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

    const sendWp = (num, msg) => {
        const clean = num ? num.replace(/\D/g, '') : '';
        if (clean) window.open(`https://wa.me/55${clean}?text=${encodeURIComponent(msg)}`, '_blank');
    };

    const handleBulkSend = () => {
        if (selectedClients.length === 0) return alert('Selecione pelo menos um contato!');
        if (!bulkMessage) return alert('Digite a mensagem para envio!');
        selectedClients.forEach(num => sendWp(num, bulkMessage));
        alert(`Disparando para ${selectedClients.length} contatos...`);
    };

    const resetForm = () => {
        setName(''); setPhone(''); setPropertyInterest(''); setBirthDate(''); setObservations('');
        setPropPrice(''); setPropImg(''); setPropAddress(''); setPropLink(''); setPropPdf('');
        setAgendaTitle(''); setAgendaTime(''); setEditingId(null); setShowForm(false);
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
        const match = (c.fullName || "").toLowerCase().includes(searchTerm.toLowerCase());
        return match && (statusFilter === 'TODOS' || c.status === statusFilter);
    });

    if (loading) return <div className="h-screen flex items-center justify-center font-black text-blue-900 bg-slate-50 text-3xl animate-pulse italic">ALEXANDRE CRM...</div>;
    if (!user) return <Login onLogin={setUser} />;

    return (
        <div className="min-h-screen bg-[#f3f4f6] flex font-sans text-slate-900 overflow-x-hidden">
            <TailwindStyle />
            
            <aside className="w-20 lg:w-72 bg-white border-r border-slate-200 flex flex-col sticky top-0 h-screen z-50">
                <div className="p-8 mb-6"><h1 className="text-2xl font-black text-blue-900 italic hidden lg:block uppercase tracking-tighter">Alexandre <span className="text-blue-500">CRM</span></h1></div>
                <nav className="flex-1 px-4 space-y-3">
                    {[
                        { id: 'dashboard', label: 'Dashboard', icon: '📊' },
                        { id: 'clients', label: 'Clientes', icon: '👥' },
                        { id: 'properties', label: 'Imóveis', icon: '🏠' },
                        { id: 'agenda', label: 'Agenda', icon: '📅' },
                        { id: 'whatsapp', label: 'WhatsApp', icon: '💬' },
                        { id: 'reports', label: 'Relatórios', icon: '📄' }
                    ].map(item => (
                        <button key={item.id} onClick={() => setActiveTab(item.id)} className={`w-full flex items-center lg:gap-4 p-4 rounded-xl font-bold text-sm transition-all uppercase tracking-wide ${activeTab === item.id ? 'bg-blue-600 text-white shadow-md' : 'text-slate-500 hover:bg-slate-100'}`}>
                            <span className="text-xl">{item.icon}</span> <span className="hidden lg:block">{item.label}</span>
                        </button>
                    ))}
                </nav>
                <div className="p-6 border-t"><button onClick={() => signOut(auth)} className="w-full p-3 text-red-600 font-bold text-xs uppercase hover:bg-red-50 rounded-lg transition">Sair</button></div>
            </aside>

            <main className="flex-1 p-8 overflow-y-auto">
                <header className="mb-8 flex justify-between items-center bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
                    <h2 className="text-2xl font-black uppercase italic tracking-tighter text-blue-900">{activeTab}</h2>
                    <div className="flex gap-4">
                        <input type="text" placeholder="Buscar..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="p-3 bg-slate-100 rounded-xl font-bold text-sm w-64 outline-none focus:ring-2 ring-blue-500 transition-all" />
                        {activeTab === 'whatsapp' && <button className="bg-green-500 text-white px-6 py-2 rounded-xl font-bold text-xs uppercase shadow-md hover:bg-green-600 transition">WhatsApp Web</button>}
                    </div>
                </header>

                <div className="animate-fadeIn space-y-8">
                    {/* 5. CENTRAL WHATSAPP (CORRIGIDA) */}
                    {activeTab === 'whatsapp' && (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                            {/* COLUNA ESQUERDA: ENVIO INDIVIDUAL + ENVIO EM MASSA */}
                            <div className="space-y-8">
                                <div className="bg-white p-8 rounded-3xl shadow-premium border border-slate-100">
                                    <h3 className="text-lg font-black text-blue-900 uppercase mb-6 flex items-center gap-2">💬 Enviar Mensagem Individual</h3>
                                    <div className="space-y-4">
                                        <div>
                                            <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Número do Cliente</label>
                                            <input type="text" placeholder="(21) 99999-9999" value={wpNumber} onChange={e => setWpNumber(e.target.value)} className="w-full p-4 bg-yellow-100 rounded-xl font-bold text-slate-800 border-none outline-none focus:ring-2 ring-yellow-400 transition" />
                                        </div>
                                        <div>
                                            <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Mensagem</label>
                                            <textarea placeholder="Digite sua mensagem aqui..." value={wpMessage} onChange={e => setWpMessage(e.target.value)} className="w-full p-4 bg-yellow-100 rounded-xl font-bold text-slate-800 h-32 border-none outline-none focus:ring-2 ring-yellow-400 transition" />
                                        </div>
                                        <button onClick={() => sendWp(wpNumber, wpMessage)} className="w-full bg-green-500 text-white py-4 rounded-xl font-black uppercase text-sm shadow-md hover:bg-green-600 transition flex items-center justify-center gap-2">🚀 Enviar pelo WhatsApp</button>
                                    </div>
                                </div>

                                <div className="bg-white p-8 rounded-3xl shadow-premium border border-slate-100">
                                    <h3 className="text-lg font-black text-blue-900 uppercase mb-6 flex justify-between items-center">
                                        👥 Envio em Massa
                                        <span className="bg-slate-100 text-slate-600 px-3 py-1 rounded-full text-[10px] font-bold">{selectedClients.length} selecionados</span>
                                    </h3>
                                    <div className="max-h-48 overflow-y-auto space-y-2 mb-4 p-2 bg-slate-50 rounded-xl border border-slate-100">
                                        {clients.map(c => (
                                            <label key={c.id} className="flex items-center gap-3 p-3 bg-white rounded-lg cursor-pointer hover:bg-blue-50 transition border border-transparent hover:border-blue-100">
                                                <input type="checkbox" className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500" onChange={(e) => {
                                                    const num = c.phones?.[0];
                                                    if(e.target.checked) setSelectedClients([...selectedClients, num]);
                                                    else setSelectedClients(selectedClients.filter(n => n !== num));
                                                }} />
                                                <div className="flex-1">
                                                    <p className="text-xs font-bold text-slate-700 uppercase">{c.fullName}</p>
                                                    <p className="text-[10px] text-slate-400">{c.phones?.[0]}</p>
                                                </div>
                                                <span className={`text-[9px] px-2 py-0.5 rounded uppercase font-bold ${c.status === 'FECHADO' ? 'bg-green-100 text-green-600' : 'bg-slate-100 text-slate-500'}`}>{c.status}</span>
                                            </label>
                                        ))}
                                    </div>
                                    <div className="space-y-4">
                                        <textarea placeholder="Digite a mensagem que será enviada para todos os contatos selecionados..." value={bulkMessage} onChange={e => setBulkMessage(e.target.value)} className="w-full p-4 bg-yellow-300 rounded-xl font-bold text-slate-900 h-24 border-none outline-none placeholder-slate-600 focus:ring-2 ring-yellow-500 transition shadow-inner" />
                                        <button onClick={handleBulkSend} className="w-full bg-green-500 text-white py-4 rounded-xl font-black uppercase text-sm shadow-md hover:bg-green-600 transition flex items-center justify-center gap-2">📤 Enviar para {selectedClients.length} Contatos</button>
                                    </div>
                                </div>
                            </div>

                            {/* COLUNA DIREITA: MENSAGENS RÁPIDAS (TEMPLATES) */}
                            <div className="space-y-6">
                                <h3 className="text-lg font-black text-blue-900 uppercase mb-2 flex items-center gap-2">📝 Mensagens Rápidas</h3>
                                {templates.map((tpl, idx) => (
                                    <div key={idx} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition group">
                                        <div className="flex justify-between items-start mb-3">
                                            <h4 className="font-bold text-slate-700 uppercase text-sm">{tpl.title}</h4>
                                            <div className="flex gap-2">
                                                <button onClick={() => {setWpMessage(tpl.text); setBulkMessage(tpl.text); alert("Mensagem copiada!");}} className="p-2 bg-yellow-100 text-yellow-600 rounded-lg hover:bg-yellow-200 transition" title="Copiar"><span className="text-xs">📋</span></button>
                                                <button onClick={() => sendWp(wpNumber || '999999999', tpl.text)} className="p-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition" title="Enviar"><span className="text-xs">➤</span></button>
                                            </div>
                                        </div>
                                        <p className="text-xs text-slate-500 leading-relaxed italic border-l-2 border-slate-200 pl-3">{tpl.text}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* DEMAIS ABAS (MANTIDAS) */}
                    {activeTab === 'dashboard' && (
                        <div className="space-y-8">
                            <div className="bg-blue-900 rounded-[3rem] p-10 text-white shadow-xl relative overflow-hidden">
                                <h3 className="text-4xl font-black italic mb-2 uppercase">Bem-vindo ao seu CRM!</h3>
                                <p className="opacity-80">Gerencie seus clientes e propriedades com eficiência.</p>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100"><p className="text-slate-400 text-xs font-bold uppercase mb-2">Total de Clientes</p><p className="text-4xl font-black text-blue-900">{clients.length}</p><p className="text-green-500 text-[10px] font-bold mt-2">↑ +12% vs mês anterior</p></div>
                                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100"><p className="text-slate-400 text-xs font-bold uppercase mb-2">Imóveis Ativos</p><p className="text-4xl font-black text-yellow-500">{properties.length}</p><p className="text-green-500 text-[10px] font-bold mt-2">↑ +5% vs mês anterior</p></div>
                                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100"><p className="text-slate-400 text-xs font-bold uppercase mb-2">Vendas no Mês</p><p className="text-4xl font-black text-green-600">{clients.filter(c => c.status === 'FECHADO').length}</p><p className="text-green-500 text-[10px] font-bold mt-2">↑ +23% vs mês anterior</p></div>
                                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100"><p className="text-slate-400 text-xs font-bold uppercase mb-2">Faturamento</p><p className="text-4xl font-black text-blue-900">R$ 450K</p><p className="text-green-500 text-[10px] font-bold mt-2">↑ +18% vs mês anterior</p></div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'clients' && (
                        <div className="space-y-8">
                            <div className="flex justify-between items-center">
                                <div className="flex gap-2 bg-white p-1 rounded-full shadow-sm">
                                    {['TODOS', 'LEAD', 'AGENDADO', 'PROPOSTA', 'FECHADO'].map(f => (
                                        <button key={f} onClick={() => setStatusFilter(f)} className={`px-4 py-2 rounded-full text-xs font-bold transition ${statusFilter === f ? 'bg-blue-900 text-white' : 'text-slate-400'}`}>{f}</button>
                                    ))}
                                </div>
                                <button onClick={() => setShowForm(true)} className="bg-blue-900 text-white px-6 py-3 rounded-xl font-bold text-xs uppercase shadow-lg">+ Novo Cliente</button>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                {filteredClients.map(c => (
                                    <div key={c.id} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 relative group">
                                        <button onClick={() => {setEditingId(c.id); setName(c.fullName); setPhone(c.phones?.[0]); setPropertyInterest(c.propertyInterest); setBirthDate(c.birthDate); setObservations(c.observations); setShowForm(true);}} className="absolute top-4 left-4 text-slate-300 hover:text-blue-600">✏️</button>
                                        <h3 className="font-black text-blue-900 uppercase text-lg ml-6 mb-2">{c.fullName}</h3>
                                        <div className="bg-yellow-50 px-3 py-1 rounded text-[10px] font-bold text-slate-600 uppercase w-max mb-4">🚩 {c.propertyInterest || 'Geral'}</div>
                                        <div className="grid grid-cols-2 gap-2 text-[10px] font-bold uppercase text-slate-500 mb-4">
                                            <div>🎂 {c.birthDate || '-'}</div>
                                            <div>📞 {c.phones?.[0]}</div>
                                        </div>
                                        <p className="text-xs italic text-slate-400 mb-4 h-16 overflow-hidden">{c.observations || 'Sem observações.'}</p>
                                        <div className="flex gap-2">
                                            <button onClick={() => sendMaterial(c)} className="flex-1 bg-blue-600 text-white py-3 rounded-xl font-bold text-[10px] uppercase">Enviar PDF</button>
                                            <a href={`https://wa.me/55${c.phones?.[0]?.replace(/\D/g,'')}`} target="_blank" className="flex-1 bg-green-500 text-white text-center py-3 rounded-xl font-bold text-[10px] uppercase flex items-center justify-center">WhatsApp</a>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {activeTab === 'properties' && (
                        <div className="space-y-8">
                            <div className="flex justify-end"><button onClick={() => setShowForm(true)} className="bg-blue-900 text-white px-6 py-3 rounded-xl font-bold text-xs uppercase shadow-lg">+ Novo Imóvel</button></div>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                {properties.map(p => (
                                    <div key={p.id} className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                                        <div className="h-48 bg-slate-200 relative">
                                            {p.image && <img src={p.image.split(',')[0]} className="w-full h-full object-cover" alt="imóvel" />}
                                            <div className="absolute top-3 right-3 bg-green-500 text-white px-3 py-1 rounded-full text-[10px] font-bold uppercase">Disponível</div>
                                        </div>
                                        <div className="p-6">
                                            <h4 className="font-black text-blue-900 uppercase text-lg mb-1">{p.title}</h4>
                                            <p className="text-blue-600 font-bold text-xl mb-4">{p.price}</p>
                                            <p className="text-xs font-bold text-slate-400 uppercase mb-4">📍 {p.address}</p>
                                            <div className="flex gap-2">
                                                {p.link && <a href={p.link} target="_blank" className="flex-1 bg-blue-900 text-white text-center py-3 rounded-xl font-bold text-[10px] uppercase">Ver Detalhes</a>}
                                                <button onClick={() => {setEditingId(p.id); setName(p.title); setPropPrice(p.price); setPropImg(p.image); setPropAddress(p.address); setShowForm(true);}} className="bg-slate-100 text-slate-500 px-3 rounded-xl">✏️</button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                    
                    {/* MODAL UNIVERSAL */}
                    {showForm && (
                        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
                            <div className="bg-white w-full max-w-lg p-8 rounded-3xl shadow-2xl">
                                <h3 className="text-2xl font-black text-blue-900 uppercase italic mb-6 text-center">{activeTab === 'clients' ? 'Novo Cliente' : 'Novo Imóvel'}</h3>
                                <div className="space-y-4">
                                    <input type="text" placeholder="Nome / Título" value={name} onChange={e => setName(e.target.value)} className="w-full p-4 bg-slate-50 rounded-xl font-bold border-none" />
                                    {activeTab === 'clients' ? (
                                        <>
                                            <input type="text" placeholder="WhatsApp" value={phone} onChange={e => setPhone(e.target.value)} className="w-full p-4 bg-slate-50 rounded-xl font-bold border-none" />
                                            <input type="date" value={birthDate} onChange={e => setBirthDate(e.target.value)} className="w-full p-4 bg-slate-50 rounded-xl font-bold border-none" />
                                            <textarea placeholder="Observações" value={observations} onChange={e => setObservations(e.target.value)} className="w-full p-4 bg-slate-50 rounded-xl font-bold h-24 border-none" />
                                        </>
                                    ) : (
                                        <>
                                            <input type="text" placeholder="Preço" value={propPrice} onChange={e => setPropPrice(e.target.value)} className="w-full p-4 bg-slate-50 rounded-xl font-bold border-none" />
                                            <input type="text" placeholder="URL Imagem" value={propImg} onChange={e => setPropImg(e.target.value)} className="w-full p-4 bg-slate-50 rounded-xl font-bold border-none" />
                                            <input type="text" placeholder="Endereço" value={propAddress} onChange={e => setPropAddress(e.target.value)} className="w-full p-4 bg-slate-50 rounded-xl font-bold border-none" />
                                        </>
                                    )}
                                    <div className="flex gap-4 pt-4">
                                        <button onClick={() => {
                                            if(activeTab === 'clients') addDoc(collection(db, 'clients'), {fullName: name, phones: [phone], birthDate, observations, status: "LEAD", assignedAgent: user.uid, createdAt: new Date()}).then(resetForm);
                                            else addDoc(collection(db, 'properties'), {title: name, price: propPrice, image: propImg, address: propAddress, userId: user.uid, createdAt: new Date()}).then(resetForm);
                                        }} className="flex-1 bg-blue-900 text-white py-4 rounded-xl font-black uppercase">Salvar</button>
                                        <button onClick={resetForm} className="flex-1 bg-slate-100 text-slate-500 py-4 rounded-xl font-black uppercase">Cancelar</button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}

export default App;
