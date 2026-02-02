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
    const [activeTab, setActiveTab] = useState('clients');
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('TODOS');
    
    const [clients, setClients] = useState([]);
    const [properties, setProperties] = useState([]);
    const [editingId, setEditingId] = useState(null);

    // CAMPOS
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
    const [propImg, setPropImg] = useState(''); // Aceita links separados por vírgula

    const loadData = async (userId) => {
        try {
            const qC = query(collection(db, 'clients'), where("assignedAgent", "==", userId));
            const snapC = await getDocs(qC);
            const listC = snapC.docs.map(d => ({ id: d.id, ...d.data() }));
            listC.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
            setClients(listC);

            const qP = query(collection(db, 'properties'), where("userId", "==", userId));
            const snapP = await getDocs(qP);
            setProperties(snapP.docs.map(d => ({ id: d.id, ...d.data() })));
        } catch (error) { console.error(error); }
    };

    const formatCurrency = (value) => {
        const clean = value.replace(/\D/g, "");
        return clean ? "R$ " + new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2 }).format(parseFloat(clean) / 100) : "";
    };

    const resetForm = () => {
        setName(''); setEmail(''); setPhone(''); setPropertyInterest(''); setBirthDate(''); 
        setObservations(''); setPropPrice(''); setPropAddress(''); setPropLink(''); setPropPdf(''); setPropImg('');
        setEditingId(null);
    };

    const addClient = async () => {
        await addDoc(collection(db, 'clients'), {
            fullName: name, email, phones: [phone], propertyInterest, birthDate, observations,
            status: "LEAD", assignedAgent: user.uid, createdAt: new Date()
        });
        resetForm(); setActiveTab('clients'); loadData(user.uid);
    };

    const addProperty = async () => {
        await addDoc(collection(db, 'properties'), {
          title: name, price: propPrice, address: propAddress, description: observations,
          link: propLink, pdf: propPdf, image: propImg, userId: user.uid, createdAt: new Date()
        });
        resetForm(); setActiveTab('properties'); loadData(user.uid);
    };

    const sendMaterial = (client) => {
        const property = properties.find(p => p.title === client.propertyInterest);
        const msg = `Olá ${client.fullName}! Aqui é o Alexandre da Lopes Prime. Segue o material do imóvel ${client.propertyInterest} que conversamos: ${property?.pdf || 'Link em breve'}`;
        window.open(`https://wa.me/55${client.phones?.[0]?.replace(/\D/g,'')}?text=${encodeURIComponent(msg)}`, '_blank');
    };

    useEffect(() => {
        const unsub = onAuthStateChanged(auth, (u) => {
            if (u) { setUser(u); loadData(u.uid); }
            else setUser(null);
            setLoading(false);
        });
        return () => unsub();
    }, []);

    const birthdaysToday = clients.filter(c => {
        if (!c.birthDate) return false;
        const today = new Date().toISOString().slice(5, 10);
        return c.birthDate.slice(5, 10) === today;
    });

    const filteredClients = clients.filter(c => {
        const match = (c.fullName || "").toLowerCase().includes(searchTerm.toLowerCase()) || (c.propertyInterest || "").toLowerCase().includes(searchTerm.toLowerCase());
        return match && (statusFilter === 'TODOS' || c.status === statusFilter);
    });

    if (loading) return <div className="h-screen flex items-center justify-center font-black text-blue-900">CARREGANDO...</div>;
    if (!user) return <Login onLogin={setUser} />;

    return (
        <div className="min-h-screen bg-gray-50 pb-20 font-sans text-gray-900 leading-tight">
            <TailwindStyle />
            <header className="bg-blue-900 text-white p-5 shadow-xl flex justify-between items-center sticky top-0 z-50">
                <h1 className="text-xl font-black italic tracking-tighter uppercase leading-none">🏠 CRM LOPES PRIME</h1>
                <button onClick={() => signOut(auth)} className="bg-red-600 px-3 py-1 rounded-lg text-[10px] font-bold">SAIR</button>
            </header>

            {birthdaysToday.length > 0 && (
                <div className="bg-yellow-400 p-2 text-center font-black text-[10px] uppercase shadow-inner">
                    🎂 Hoje é aniversário de: {birthdaysToday.map(c => c.fullName).join(', ')}! 🎁
                </div>
            )}

            <nav className="bg-white border-b sticky top-16 z-40 flex flex-wrap justify-center gap-1 p-2 shadow-md">
                <button onClick={() => setActiveTab('clients')} className={`py-2 px-3 rounded-xl font-black text-[9px] uppercase ${activeTab === 'clients' ? 'bg-blue-900 text-white' : 'bg-gray-100'}`}>👥 Clientes</button>
                <button onClick={() => setActiveTab('properties')} className={`py-2 px-3 rounded-xl font-black text-[9px] uppercase ${activeTab === 'properties' ? 'bg-blue-900 text-white' : 'bg-gray-100'}`}>🏠 Imóveis</button>
                <button onClick={() => setActiveTab('add-client')} className="py-2 px-3 rounded-xl font-black text-[9px] uppercase bg-green-100 text-green-700 font-bold border border-green-200">➕ Cliente</button>
                <button onClick={() => setActiveTab('add-property')} className="py-2 px-3 rounded-xl font-black text-[9px] uppercase bg-purple-100 text-purple-700 font-bold border border-purple-200">➕ Imóvel</button>
            </nav>

            <main className="max-w-7xl mx-auto p-4 mt-4">
                {activeTab === 'clients' && (
                    <>
                        <div className="max-w-2xl mx-auto mb-6 space-y-3 text-center">
                            <input type="text" placeholder="🔍 Buscar..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full p-4 bg-white border-2 rounded-2xl font-bold shadow-md outline-none focus:border-blue-500" />
                            <div className="flex flex-wrap justify-center gap-1">
                                {['TODOS', 'LEAD', 'AGENDADO', 'PROPOSTA', 'FECHADO'].map(f => (
                                    <button key={f} onClick={() => setStatusFilter(f)} className={`px-2 py-1.5 rounded-full text-[8px] font-black border ${statusFilter === f ? 'bg-blue-900 text-white' : 'bg-white text-gray-400'}`}>{f}</button>
                                ))}
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {filteredClients.map(c => (
                                <div key={c.id} className="bg-white rounded-[2rem] shadow-lg p-6 border-t-8 border-blue-900 relative">
                                    <div className="flex justify-between items-start mb-2">
                                        <h3 className="font-black text-blue-900 uppercase text-md truncate">{c.fullName}</h3>
                                        <span className={`text-[8px] font-black px-2 py-1 rounded uppercase ${c.status === 'FECHADO' ? 'bg-green-600' : 'bg-blue-600'} text-white shadow-sm`}>{c.status}</span>
                                    </div>
                                    <div className="bg-yellow-50 border-l-4 border-yellow-400 p-2 mb-3 rounded-r-lg text-[9px] font-black italic uppercase text-gray-800">
                                        Interesse: {c.propertyInterest}
                                    </div>
                                    <div className="text-[10px] font-bold mb-4 space-y-1">
                                        <p>🎂 Nasc: {c.birthDate ? new Date(c.birthDate).toLocaleDateString('pt-BR') : '-'}</p>
                                        <div className="bg-gray-50 p-2 rounded italic text-gray-500 truncate h-8">{c.observations}</div>
                                    </div>
                                    <div className="flex flex-col gap-2">
                                        <a href={`https://wa.me/55${c.phones?.[0]?.replace(/\D/g,'')}`} target="_blank" className="bg-green-500 text-white text-center font-black py-3 rounded-xl text-[9px] uppercase tracking-widest shadow-md">Zap Direto</a>
                                        <button onClick={() => sendMaterial(c)} className="bg-blue-100 text-blue-700 font-black py-3 rounded-xl text-[9px] uppercase tracking-widest border border-blue-200">Enviar E-book</button>
                                        <button onClick={() => deleteDoc(doc(db, 'clients', c.id)).then(() => loadData(user.uid))} className="text-[8px] text-gray-300 font-bold uppercase mt-2">Remover</button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </>
                )}

                {activeTab === 'properties' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {properties.map(p => {
                            const images = p.image?.split(',') || [];
                            return (
                                <div key={p.id} className="bg-white rounded-[2rem] shadow-xl overflow-hidden border border-gray-100 flex flex-col">
                                    <div className="flex overflow-x-auto snap-x h-40">
                                        {images.length > 0 ? images.map((img, i) => (
                                            <img key={i} src={img.trim()} className="snap-center w-full h-full object-cover flex-shrink-0" alt="foto" />
                                        )) : <div className="w-full bg-gray-100 flex items-center justify-center text-gray-300">🏠</div>}
                                    </div>
                                    <div className="p-5 flex flex-col flex-grow">
                                        <h3 className="font-black text-md uppercase text-blue-900">{p.title}</h3>
                                        <p className="text-green-600 font-black text-xl mb-4 italic leading-none">{p.price}</p>
                                        <div className="flex flex-col gap-2 mt-auto">
                                            {p.link && <a href={p.link} target="_blank" className="bg-blue-600 text-white text-center py-2 rounded-lg font-black text-[9px] uppercase tracking-widest">Site</a>}
                                            {p.pdf && <a href={p.pdf} target="_blank" className="bg-red-600 text-white text-center py-2 rounded-lg font-black text-[9px] uppercase tracking-widest">PDF</a>}
                                            <button onClick={() => deleteDoc(doc(db, 'properties', p.id)).then(() => loadData(user.uid))} className="text-[8px] text-gray-300 font-bold uppercase mt-3">Remover</button>
                                        </div>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                )}

                {activeTab === 'add-client' && (
                    <div className="max-w-xl mx-auto bg-white p-8 rounded-[3rem] shadow-2xl border border-gray-100">
                        <h2 className="text-xl font-black mb-6 text-blue-900 text-center uppercase italic">Novo Lead</h2>
                        <div className="space-y-4">
                            <input type="text" placeholder="Nome Completo" value={name} onChange={e => setName(e.target.value)} className="w-full p-4 bg-gray-50 rounded-2xl font-bold text-sm border-2 border-transparent focus:border-blue-500" />
                            <input type="text" placeholder="WhatsApp (DDD + Número)" value={phone} onChange={e => setPhone(e.target.value)} className="w-full p-4 bg-gray-50 rounded-2xl font-bold text-sm border-2 border-transparent focus:border-blue-500" />
                            <input type="date" value={birthDate} onChange={e => setBirthDate(e.target.value)} className="w-full p-4 bg-gray-50 rounded-2xl font-bold text-sm uppercase" />
                            <select value={propertyInterest} onChange={e => setPropertyInterest(e.target.value)} className="w-full p-4 bg-yellow-50 rounded-2xl font-black text-sm border-2 border-yellow-100 outline-none">
                                <option value="">Interesse em...</option>
                                {properties.map(p => <option key={p.id} value={p.title}>{p.title}</option>)}
                            </select>
                            <textarea placeholder="Observações" value={observations} onChange={e => setObservations(e.target.value)} className="w-full p-4 bg-gray-50 rounded-2xl font-bold border-2 border-transparent h-20 text-sm" />
                            <button onClick={addClient} className="w-full bg-blue-900 text-white font-black py-4 rounded-3xl shadow-xl uppercase tracking-widest transition hover:bg-black">Salvar Cliente</button>
                        </div>
                    </div>
                )}

                {activeTab === 'add-property' && (
                    <div className="max-w-xl mx-auto bg-white p-8 rounded-[3rem] shadow-2xl border-t-8 border-purple-700">
                        <h2 className="text-xl font-black mb-6 text-purple-900 text-center uppercase italic">Novo Produto</h2>
                        <div className="space-y-4">
                            <input type="text" placeholder="Nome" value={name} onChange={e => setName(e.target.value)} className="w-full p-4 bg-gray-50 rounded-2xl font-bold text-sm" />
                            <input type="text" placeholder="Valor" value={propPrice} onChange={e => setPropPrice(formatCurrency(e.target.value))} className="w-full p-4 bg-green-50 rounded-2xl font-black text-green-700 text-lg" />
                            <input type="text" placeholder="Links Fotos (Separe por vírgula)" value={propImg} onChange={e => setPropImg(e.target.value)} className="w-full p-4 bg-gray-50 rounded-2xl font-bold text-xs italic" />
                            <input type="text" placeholder="Site Oficial" value={propLink} onChange={e => setPropLink(e.target.value)} className="w-full p-4 bg-blue-50 rounded-2xl font-bold text-xs" />
                            <input type="text" placeholder="Link do PDF" value={propPdf} onChange={e => setPropPdf(e.target.value)} className="w-full p-4 bg-red-50 rounded-2xl font-bold text-xs" />
                            <button onClick={addProperty} className="w-full bg-purple-700 text-white font-black py-4 rounded-3xl shadow-xl uppercase tracking-widest transition hover:bg-purple-900">Salvar Imóvel</button>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}

export default App;
