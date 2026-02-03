import React, { useState, useEffect } from 'react';
import { db, auth } from './firebase/config';
import { collection, addDoc, getDocs, query, where, updateDoc, doc, deleteDoc } from 'firebase/firestore';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import Login from './components/Login';

const TailwindStyle = () => (
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" />
);

function App() {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('clients-list'); // clients-list, clients-add, prop-list, prop-add
    const [openMenu, setOpenMenu] = useState(null); // Para controlar qual sub-menu está aberto
    
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('TODOS');
    const [clients, setClients] = useState([]);
    const [properties, setProperties] = useState([]);
    const [editingId, setEditingId] = useState(null);

    // ESTADOS PARA FORMULÁRIOS
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [propertyInterest, setPropertyInterest] = useState('');
    const [birthDate, setBirthDate] = useState('');
    const [observations, setObservations] = useState('');
    const [propPrice, setPropPrice] = useState('');
    const [propAddress, setPropAddress] = useState('');
    const [propLink, setPropLink] = useState('');
    const [propPdf, setPropPdf] = useState('');
    const [propImg, setPropImg] = useState('');

    const loadData = async (userId) => {
        try {
            const qC = query(collection(db, 'clients'), where("assignedAgent", "==", userId));
            const snapC = await getDocs(qC);
            const listC = snapC.docs.map(d => ({ id: d.id, ...d.data() }));
            listC.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
            setClients(listC);

            const qP = query(collection(db, 'properties'), where("userId", "==", userId));
            const snapP = await getDocs(qP);
            const listP = snapP.docs.map(d => ({ id: d.id, ...d.data() }));
            listP.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
            setProperties(listP);
        } catch (error) { console.error(error); }
    };

    const resetForm = () => {
        setName(''); setEmail(''); setPhone(''); setPropertyInterest(''); setBirthDate(''); 
        setObservations(''); setPropPrice(''); setPropAddress(''); setPropLink(''); setPropPdf(''); setPropImg('');
        setEditingId(null);
        setOpenMenu(null);
    };

    const addClient = async () => {
        if (!name.trim() || !phone.trim()) return alert('Nome e WhatsApp são obrigatórios!');
        await addDoc(collection(db, 'clients'), {
            fullName: name, email, phones: [phone], propertyInterest, birthDate, observations,
            status: "LEAD", assignedAgent: user.uid, createdAt: new Date()
        });
        alert("✅ Cliente Cadastrado!");
        resetForm(); setActiveTab('clients-list'); loadData(user.uid);
    };

    const addProperty = async () => {
        if (!name.trim()) return alert('Nome do Imóvel é obrigatório!');
        await addDoc(collection(db, 'properties'), {
            title: name, price: propPrice, address: propAddress, description: observations,
            link: propLink, pdf: propPdf, image: propImg, userId: user.uid, createdAt: new Date()
        });
        alert("🏠 Imóvel Cadastrado!");
        resetForm(); setActiveTab('prop-list'); loadData(user.uid);
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

    if (loading) return <div className="h-screen flex items-center justify-center font-black text-blue-900 animate-pulse">LOPES PRIME...</div>;
    if (!user) return <Login onLogin={setUser} />;

    return (
        <div className="min-h-screen bg-gray-50 pb-20 font-sans text-gray-900">
            <TailwindStyle />
            
            {/* CABEÇALHO COM MENU E SUBMENU */}
            <header className="bg-blue-900 text-white shadow-xl sticky top-0 z-50">
                <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
                    <h1 className="text-lg font-black italic tracking-tighter uppercase leading-none">🏠 CRM</h1>
                    
                    <div className="flex gap-6 items-center">
                        {/* SUBMENU CLIENTES */}
                        <div className="relative">
                            <button onClick={() => setOpenMenu(openMenu === 'clients' ? null : 'clients')} className="font-black text-[10px] uppercase tracking-widest flex items-center gap-1">
                                👥 Clientes {openMenu === 'clients' ? '▲' : '▼'}
                            </button>
                            {openMenu === 'clients' && (
                                <div className="absolute top-8 left-0 bg-white text-blue-900 rounded-lg shadow-2xl py-2 w-32 border border-gray-100 animate-fadeIn">
                                    <button onClick={() => {setActiveTab('clients-list'); setOpenMenu(null);}} className="w-full text-left px-4 py-2 text-[9px] font-black hover:bg-gray-100 uppercase">Listar</button>
                                    <button onClick={() => {setActiveTab('clients-add'); setOpenMenu(null);}} className="w-full text-left px-4 py-2 text-[9px] font-black hover:bg-gray-100 uppercase text-green-600 border-t">Novo +</button>
                                </div>
                            )}
                        </div>

                        {/* SUBMENU IMÓVEIS */}
                        <div className="relative">
                            <button onClick={() => setOpenMenu(openMenu === 'props' ? null : 'props')} className="font-black text-[10px] uppercase tracking-widest flex items-center gap-1">
                                🏠 Imóveis {openMenu === 'props' ? '▲' : '▼'}
                            </button>
                            {openMenu === 'props' && (
                                <div className="absolute top-8 left-0 bg-white text-blue-900 rounded-lg shadow-2xl py-2 w-32 border border-gray-100 animate-fadeIn">
                                    <button onClick={() => {setActiveTab('prop-list'); setOpenMenu(null);}} className="w-full text-left px-4 py-2 text-[9px] font-black hover:bg-gray-100 uppercase">Listar</button>
                                    <button onClick={() => {setActiveTab('prop-add'); setOpenMenu(null);}} className="w-full text-left px-4 py-2 text-[9px] font-black hover:bg-gray-100 uppercase text-purple-600 border-t">Novo +</button>
                                </div>
                            )}
                        </div>

                        <button onClick={() => signOut(auth)} className="bg-red-600 px-3 py-1.5 rounded-lg text-[9px] font-black shadow-md uppercase">Sair</button>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto p-4 mt-4">
                {/* SEÇÃO LISTA DE CLIENTES */}
                {activeTab === 'clients-list' && (
                    <>
                        <div className="max-w-2xl mx-auto mb-8 space-y-4">
                            <input type="text" placeholder="🔍 Buscar cliente ou imóvel..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full p-4 bg-white border-2 rounded-2xl font-bold shadow-md outline-none focus:border-blue-500 transition-all" />
                            <div className="flex flex-wrap justify-center gap-2">
                                {['TODOS', 'LEAD', 'AGENDADO', 'PROPOSTA', 'FECHADO'].map(f => (
                                    <button key={f} onClick={() => setStatusFilter(f)} className={`px-4 py-2 rounded-full text-[9px] font-black border-2 transition ${statusFilter === f ? 'bg-blue-900 text-white' : 'bg-white text-gray-400'}`}>{f}</button>
                                ))}
                            </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {filteredClients.map(c => (
                                <div key={c.id} className="bg-white rounded-[2rem] shadow-lg p-6 border-t-8 border-blue-900 relative flex flex-col hover:shadow-2xl transition duration-300">
                                    <div className="flex justify-between items-start mb-4">
                                        <h3 className="font-black text-blue-900 uppercase text-lg truncate mr-2">{c.fullName}</h3>
                                        <span className={`text-[9px] font-black px-2 py-1 rounded uppercase ${c.status === 'FECHADO' ? 'bg-green-600' : 'bg-blue-600'} text-white shadow-sm`}>{c.status || 'LEAD'}</span>
                                    </div>
                                    <div className="bg-yellow-50 border-l-4 border-yellow-400 p-3 mb-4 rounded-r-lg text-[10px] font-black italic uppercase text-gray-800 leading-tight">Interesse: {c.propertyInterest || 'Geral'}</div>
                                    <div className="grid grid-cols-2 gap-2 mb-4 text-[9px] font-bold uppercase">
                                        <div className="bg-gray-50 p-2 rounded-lg leading-tight"><p className="text-blue-800 text-[7px]">🎂 Nasc.</p>{c.birthDate ? new Date(c.birthDate).toLocaleDateString('pt-BR') : '-'}</div>
                                        <div className="bg-gray-50 p-2 rounded-lg leading-tight"><p className="text-green-700 text-[7px]">📞 Zap</p>{c.phones?.[0]}</div>
                                    </div>
                                    <div className="mb-4 bg-gray-50 p-3 rounded-xl border border-gray-100 h-24 overflow-y-auto text-xs italic font-medium text-gray-600 scrollbar-hide">{c.observations || 'Sem anotações.'}</div>
                                    <div className="mt-auto space-y-2">
                                        <a href={`https://wa.me/55${c.phones?.[0]?.replace(/\D/g,'')}`} target="_blank" className="flex items-center justify-center w-full bg-green-500 hover:bg-green-600 text-white font-black py-4 rounded-2xl shadow-lg text-[11px] uppercase tracking-widest transition active:scale-95">WhatsApp</a>
                                        <button onClick={() => deleteDoc(doc(db, 'clients', c.id)).then(() => loadData(user.uid))} className="w-full text-[9px] font-black text-red-200 hover:text-red-600 uppercase transition tracking-widest text-center mt-2">Remover</button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </>
                )}

                {/* SEÇÃO NOVO CLIENTE */}
                {activeTab === 'clients-add' && (
                    <div className="max-w-xl mx-auto bg-white p-10 rounded-[3rem] shadow-2xl border-2 border-gray-50">
                        <h2 className="text-2xl font-black mb-8 text-center uppercase italic tracking-tighter text-blue-900">Novo Cadastro de Cliente</h2>
                        <div className="space-y-4">
                            <input type="text" placeholder="Nome Completo" value={name} onChange={e => setName(e.target.value)} className="w-full p-4 bg-gray-50 rounded-2xl font-bold border-2 border-transparent focus:border-blue-500 outline-none transition shadow-inner" />
                            <input type="text" placeholder="WhatsApp" value={phone} onChange={e => setPhone(e.target.value)} className="w-full p-4 bg-gray-50 rounded-2xl font-bold border-2 border-transparent focus:border-blue-500 outline-none transition shadow-inner" />
                            <input type="date" value={birthDate} onChange={e => setBirthDate(e.target.value)} className="w-full p-4 bg-gray-50 rounded-2xl font-bold border-2 border-transparent focus:border-blue-500 outline-none transition shadow-inner uppercase text-xs" />
                            <select value={propertyInterest} onChange={e => setPropertyInterest(e.target.value)} className="w-full p-4 bg-yellow-50 rounded-2xl font-black border-2 border-yellow-100 outline-none focus:border-yellow-400 transition">
                                <option value="">Vincular Imóvel...</option>
                                {properties.map(p => <option key={p.id} value={p.title}>{p.title}</option>)}
                            </select>
                            <textarea placeholder="Observações..." value={observations} onChange={e => setObservations(e.target.value)} className="w-full p-4 bg-gray-50 rounded-2xl font-bold border-2 border-transparent focus:border-blue-500 outline-none h-32" />
                            <div className="flex gap-4 pt-4">
                                <button onClick={addClient} className="flex-1 bg-blue-900 text-white font-black py-5 rounded-3xl shadow-2xl uppercase tracking-widest text-lg transition hover:bg-black active:scale-95">Salvar</button>
                                <button onClick={() => setActiveTab('clients-list')} className="flex-1 bg-gray-100 text-gray-400 font-black py-5 rounded-3xl uppercase tracking-widest text-lg transition hover:bg-gray-200">Cancelar</button>
                            </div>
                        </div>
                    </div>
                )}

                {/* SEÇÃO LISTA DE IMÓVEIS */}
                {activeTab === 'prop-list' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {properties.map(p => (
                            <div key={p.id} className="bg-white rounded-[2rem] shadow-xl overflow-hidden border border-gray-100 flex flex-col hover:shadow-2xl transition duration-300">
                                {p.image ? (
                                    <div className="flex overflow-x-auto snap-x h-56 bg-gray-100">
                                        {p.image.split(',').map((img, i) => (
                                            <img key={i} src={img.trim()} className="snap-center w-full h-full object-cover flex-shrink-0" alt="foto" />
                                        ))}
                                    </div>
                                ) : <div className="h-56 w-full bg-gray-100 flex items-center justify-center text-gray-300 text-5xl italic font-black">Lopes Prime</div>}
                                <div className="p-6 flex flex-col flex-grow">
                                    <h3 className="font-black text-xl uppercase text-blue-900 mb-1 leading-tight">{p.title}</h3>
                                    <p className="text-green-600 font-black text-2xl mb-4 italic tracking-tighter">{p.price}</p>
                                    <p className="text-[10px] font-bold text-gray-400 uppercase mb-5 leading-tight italic">📍 {p.address}</p>
                                    <div className="flex flex-col gap-3 mt-auto">
                                        {p.link && <a href={p.link} target="_blank" className="bg-blue-600 hover:bg-blue-700 text-white text-center py-3 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-md transition">Abrir Site</a>}
                                        {p.pdf && <a href={p.pdf} target="_blank" className="bg-red-600 hover:bg-red-700 text-white text-center py-3 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-md transition">Tabela PDF</a>}
                                        <button onClick={() => deleteDoc(doc(db, 'properties', p.id)).then(() => loadData(user.uid))} className="mt-4 text-[9px] font-black text-gray-300 hover:text-red-600 uppercase tracking-widest text-center">Excluir</button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* SEÇÃO NOVO IMÓVEL */}
                {activeTab === 'prop-add' && (
                    <div className="max-w-xl mx-auto bg-white p-10 rounded-[3rem] shadow-2xl border-t-8 border-purple-700">
                        <h2 className="text-2xl font-black mb-8 text-center uppercase italic tracking-tighter text-purple-900">Cadastrar Novo Produto</h2>
                        <div className="space-y-4">
                            <input type="text" placeholder="Nome do Empreendimento" value={name} onChange={e => setName(e.target.value)} className="w-full p-4 bg-gray-50 rounded-2xl font-bold border shadow-inner" />
                            <input type="text" placeholder="Preço" value={propPrice} onChange={e => setPropPrice(formatCurrency(e.target.value))} className="w-full p-4 bg-green-50 rounded-2xl font-black text-green-700 border border-green-200 text-xl" />
                            <input type="text" placeholder="Links Fotos (URL, URL...)" value={propImg} onChange={e => setPropImg(e.target.value)} className="w-full p-4 bg-gray-50 rounded-2xl font-bold border text-xs italic" />
                            <input type="text" placeholder="Link do Site" value={propLink} onChange={e => setPropLink(e.target.value)} className="w-full p-4 bg-blue-50 rounded-2xl font-bold border" />
                            <input type="text" placeholder="Link do PDF" value={propPdf} onChange={e => setPropPdf(e.target.value)} className="w-full p-4 bg-red-50 rounded-2xl font-bold border" />
                            <input type="text" placeholder="Endereço" value={propAddress} onChange={e => setPropAddress(e.target.value)} className="w-full p-4 bg-gray-50 rounded-2xl font-bold border" />
                            <div className="flex gap-4 pt-4">
                                <button onClick={addProperty} className="flex-1 bg-purple-700 text-white font-black py-5 rounded-3xl shadow-xl uppercase tracking-widest text-lg transition hover:bg-purple-900 active:scale-95">Salvar</button>
                                <button onClick={() => setActiveTab('prop-list')} className="flex-1 bg-gray-100 text-gray-400 font-black py-5 rounded-3xl uppercase tracking-widest text-lg transition hover:bg-gray-200">Cancelar</button>
                            </div>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}

export default App;
