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

    // CAMPOS GERAIS
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

    const startEditProperty = (p) => {
        setEditingId(p.id);
        setName(p.title);
        setPropPrice(p.price);
        setPropAddress(p.address || '');
        setPropLink(p.link || '');
        setPropPdf(p.pdf || '');
        setPropImg(p.image || '');
        setObservations(p.description || '');
    };

    const saveEditProperty = async (id) => {
        await updateDoc(doc(db, 'properties', id), {
            title: name, price: propPrice, address: propAddress, link: propLink, pdf: propPdf, image: propImg, description: observations
        });
        alert("✅ Imóvel Atualizado!");
        resetForm(); loadData(user.uid);
    };

    const addProperty = async () => {
        await addDoc(collection(db, 'properties'), {
          title: name, price: propPrice, address: propAddress, description: observations,
          link: propLink, pdf: propPdf, image: propImg, userId: user.uid, createdAt: new Date()
        });
        resetForm(); setActiveTab('properties'); loadData(user.uid);
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

    if (loading) return <div className="h-screen flex items-center justify-center font-black text-blue-900 animate-pulse">CARREGANDO CRM...</div>;
    if (!user) return <Login onLogin={setUser} />;

    return (
        <div className="min-h-screen bg-gray-50 pb-20 font-sans text-gray-900">
            <TailwindStyle />
            <header className="bg-blue-900 text-white p-5 shadow-xl flex justify-between items-center sticky top-0 z-50">
                <h1 className="text-xl font-black italic tracking-tighter uppercase">🏠 CRM LOPES PRIME</h1>
                <button onClick={() => signOut(auth)} className="bg-red-600 px-3 py-1 rounded-lg text-[10px] font-bold">SAIR</button>
            </header>

            <nav className="bg-white border-b sticky top-16 z-40 flex flex-wrap justify-center gap-1 p-2 shadow-md">
                <button onClick={() => {setActiveTab('clients'); resetForm();}} className={`py-2 px-3 rounded-xl font-black text-[9px] uppercase ${activeTab === 'clients' ? 'bg-blue-900 text-white' : 'bg-gray-100'}`}>👥 Clientes</button>
                <button onClick={() => {setActiveTab('properties'); resetForm();}} className={`py-2 px-3 rounded-xl font-black text-[9px] uppercase ${activeTab === 'properties' ? 'bg-blue-900 text-white' : 'bg-gray-100'}`}>🏠 Imóveis</button>
                <button onClick={() => {setActiveTab('add-client'); resetForm();}} className="py-2 px-3 rounded-xl font-black text-[9px] uppercase bg-green-100 text-green-700">➕ Novo Cliente</button>
                <button onClick={() => {setActiveTab('add-property'); resetForm();}} className="py-2 px-3 rounded-xl font-black text-[9px] uppercase bg-purple-100 text-purple-700">➕ Novo Imóvel</button>
            </nav>

            <main className="max-w-7xl mx-auto p-4 mt-4">
                {activeTab === 'clients' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredClients.map(c => (
                            <div key={c.id} className="bg-white rounded-3xl shadow p-6 border-t-8 border-blue-900 relative">
                                <h3 className="font-black text-blue-900 uppercase text-lg mb-2">{c.fullName}</h3>
                                <div className="bg-yellow-50 p-2 rounded mb-3 text-xs font-bold italic">"{c.propertyInterest}"</div>
                                <div className="text-sm font-bold mb-4">📞 {c.phones?.[0]}</div>
                                <a href={`https://wa.me/55${c.phones?.[0]?.replace(/\D/g,'')}`} target="_blank" className="block w-full bg-green-500 text-white text-center font-black py-3 rounded-xl text-[10px] uppercase mb-2">WhatsApp</a>
                                <button onClick={() => deleteDoc(doc(db, 'clients', c.id)).then(() => loadData(user.uid))} className="w-full text-[9px] font-bold text-red-400 uppercase">Excluir</button>
                            </div>
                        ))}
                    </div>
                )}

                {activeTab === 'properties' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {properties.map(p => (
                            <div key={p.id} className="bg-white rounded-[2rem] shadow-xl overflow-hidden border border-gray-100 relative">
                                {editingId !== p.id && (
                                    <button onClick={() => startEditProperty(p)} className="absolute top-3 left-3 z-10 text-gray-400 hover:text-blue-600 p-2 bg-white rounded-full shadow-sm">✏️</button>
                                )}

                                {editingId === p.id ? (
                                    <div className="p-6 space-y-3">
                                        <p className="text-[10px] font-black text-purple-600 uppercase">Editando Imóvel</p>
                                        <input type="text" value={name} onChange={e => setName(e.target.value)} className="w-full p-2 border-2 rounded-lg text-sm font-bold" placeholder="Nome" />
                                        <input type="text" value={propPrice} onChange={e => setPropPrice(formatCurrency(e.target.value))} className="w-full p-2 border-2 rounded-lg text-sm font-bold text-green-700" placeholder="Preço" />
                                        <input type="text" value={propImg} onChange={e => setPropImg(e.target.value)} className="w-full p-2 border-2 rounded-lg text-xs" placeholder="URL da Imagem" />
                                        <input type="text" value={propLink} onChange={e => setPropLink(e.target.value)} className="w-full p-2 border-2 rounded-lg text-xs" placeholder="URL do Site" />
                                        <input type="text" value={propPdf} onChange={e => setPropPdf(e.target.value)} className="w-full p-2 border-2 rounded-lg text-xs" placeholder="URL do PDF" />
                                        <div className="flex gap-2 pt-2">
                                            <button onClick={() => saveEditProperty(p.id)} className="flex-1 bg-green-500 text-white font-black py-2 rounded-xl text-xs uppercase">Salvar</button>
                                            <button onClick={() => setEditingId(null)} className="flex-1 bg-gray-200 text-gray-600 font-black py-2 rounded-xl text-xs uppercase">Cancelar</button>
                                        </div>
                                    </div>
                                ) : (
                                    <>
                                        {p.image ? (
                                            <div className="flex overflow-x-auto snap-x h-48 bg-gray-100">
                                                {p.image.split(',').map((img, i) => (
                                                    <img key={i} src={img.trim()} className="snap-center w-full h-full object-cover flex-shrink-0" alt="foto" />
                                                ))}
                                            </div>
                                        ) : <div className="h-48 w-full bg-gray-100 flex items-center justify-center text-gray-300">🏠 Sem Foto</div>}
                                        
                                        <div className="p-6">
                                            <h3 className="font-black text-blue-900 uppercase text-lg mb-1">{p.title}</h3>
                                            <p className="text-green-600 font-black text-xl mb-4 italic tracking-tighter">{p.price}</p>
                                            <div className="flex flex-col gap-2">
                                                {p.link && <a href={p.link} target="_blank" className="bg-blue-600 text-white text-center py-2 rounded-lg font-black text-[9px] uppercase tracking-widest">Abrir Site</a>}
                                                {p.pdf && <a href={p.pdf} target="_blank" className="bg-red-600 text-white text-center py-2 rounded-lg font-black text-[9px] uppercase tracking-widest">Tabela PDF</a>}
                                                <button onClick={() => deleteDoc(doc(db, 'properties', p.id)).then(() => loadData(user.uid))} className="text-[8px] text-gray-300 font-bold uppercase mt-3">Excluir</button>
                                            </div>
                                        </div>
                                    </>
                                )}
                            </div>
                        ))}
                    </div>
                )}

                {(activeTab === 'add-client' || activeTab === 'add-property') && (
                    <div className="max-w-xl mx-auto bg-white p-10 rounded-[3rem] shadow-2xl border-2">
                        <h2 className={`text-2xl font-black mb-6 text-center uppercase ${activeTab === 'add-client' ? 'text-blue-900' : 'text-purple-900'}`}>
                            {activeTab === 'add-client' ? 'Novo Cadastro de Cliente' : 'Novo Cadastro de Imóvel'}
                        </h2>
                        
                        <div className="space-y-4">
                            <input type="text" placeholder="Nome / Título" value={name} onChange={e => setName(e.target.value)} className="w-full p-4 bg-gray-50 rounded-2xl font-bold border outline-none focus:border-blue-500" />
                            
                            {activeTab === 'add-client' ? (
                                <>
                                    <input type="text" placeholder="WhatsApp" value={phone} onChange={e => setPhone(e.target.value)} className="w-full p-4 bg-gray-50 rounded-2xl font-bold border" />
                                    <select value={propertyInterest} onChange={e => setPropertyInterest(e.target.value)} className="w-full p-4 bg-yellow-50 rounded-2xl font-black border border-yellow-200">
                                        <option value="">Imóvel de Interesse...</option>
                                        {properties.map(p => <option key={p.id} value={p.title}>{p.title}</option>)}
                                    </select>
                                    <textarea placeholder="Observações" value={observations} onChange={e => setObservations(e.target.value)} className="w-full p-4 bg-gray-50 rounded-2xl font-bold border h-24" />
                                </>
                            ) : (
                                <>
                                    <input type="text" placeholder="Valor" value={propPrice} onChange={e => setPropPrice(formatCurrency(e.target.value))} className="w-full p-4 bg-green-50 rounded-2xl font-black text-green-700 border border-green-200" />
                                    <input type="text" placeholder="Links das Fotos (URL, URL...)" value={propImg} onChange={e => setPropImg(e.target.value)} className="w-full p-4 bg-gray-50 rounded-2xl font-bold border text-xs italic" />
                                    <input type="text" placeholder="Link do Site" value={propLink} onChange={e => setPropLink(e.target.value)} className="w-full p-4 bg-blue-50 rounded-2xl font-bold border" />
                                    <input type="text" placeholder="Link do PDF" value={propPdf} onChange={e => setPropPdf(e.target.value)} className="w-full p-4 bg-red-50 rounded-2xl font-bold border" />
                                </>
                            )}

                            <div className="flex gap-3 mt-4">
                                <button onClick={activeTab === 'add-client' ? addClient : addProperty} className="flex-1 bg-blue-900 text-white font-black py-5 rounded-3xl shadow-xl uppercase tracking-widest text-lg">Salvar</button>
                                <button onClick={() => {setActiveTab(activeTab === 'add-client' ? 'clients' : 'properties'); resetForm();}} className="flex-1 bg-gray-200 text-gray-600 font-black py-5 rounded-3xl shadow-sm uppercase tracking-widest text-lg">Cancelar</button>
                            </div>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}

export default App;
