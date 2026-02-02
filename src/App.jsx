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
    
    const [clients, setClients] = useState([]);
    const [properties, setProperties] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');

    // CAMPOS CLIENTE
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [propertyInterest, setPropertyInterest] = useState('');
    const [birthDate, setBirthDate] = useState('');
    const [observations, setObservations] = useState('');
    
    // CAMPOS IMÓVEL
    const [propPrice, setPropPrice] = useState('');
    const [propAddress, setPropAddress] = useState('');
    const [propLink, setPropLink] = useState('');
    const [propPdf, setPropPdf] = useState('');
    const [propImg, setPropImg] = useState('');

    const loadData = async (userId) => {
        try {
            const qC = query(collection(db, 'clients'), where("assignedAgent", "==", userId));
            const snapC = await getDocs(qC);
            setClients(snapC.docs.map(d => ({ id: d.id, ...d.data() })));

            const qP = query(collection(db, 'properties'), where("userId", "==", userId));
            const snapP = await getDocs(qP);
            setProperties(snapP.docs.map(d => ({ id: d.id, ...d.data() })));
        } catch (error) { console.error(error); }
    };

    // FORMATAÇÃO DE MOEDA AUTOMÁTICA
    const formatCurrency = (value) => {
        const cleanValue = value.replace(/\D/g, "");
        const options = { minimumFractionDigits: 2 };
        const result = new Intl.NumberFormat('pt-BR', options).format(parseFloat(cleanValue) / 100);
        return cleanValue ? "R$ " + result : "";
    };

    const addClient = async () => {
        if (!name.trim() || !phone.trim()) return alert('Nome e Telefone obrigatórios!');
        await addDoc(collection(db, 'clients'), {
            fullName: name, email, phones: [phone], propertyInterest, birthDate, observations,
            status: "LEAD", assignedAgent: user.uid, createdAt: new Date()
        });
        alert("✅ Cliente salvo!");
        resetForm(); setActiveTab('clients'); loadData(user.uid);
    };

    const addProperty = async () => {
        if (!name.trim()) return alert('Nome do Imóvel é obrigatório!');
        await addDoc(collection(db, 'properties'), {
            title: name, price: propPrice, address: propAddress, description: observations,
            link: propLink, pdf: propPdf, image: propImg,
            userId: user.uid, createdAt: new Date()
        });
        alert("🏠 Imóvel cadastrado!");
        resetForm(); setActiveTab('properties'); loadData(user.uid);
    };

    const deleteItem = async (col, id) => {
        if (window.confirm(`⚠️ Excluir permanentemente?`)) {
            await deleteDoc(doc(db, col, id));
            loadData(user.uid);
        }
    };

    const resetForm = () => {
        setName(''); setEmail(''); setPhone(''); setPropertyInterest(''); setBirthDate(''); 
        setObservations(''); setPropPrice(''); setPropAddress(''); setPropLink(''); setPropPdf(''); setPropImg('');
    };

    useEffect(() => {
        const unsub = onAuthStateChanged(auth, (u) => {
            if (u) { setUser(u); loadData(u.uid); }
            else setUser(null);
            setLoading(false);
        });
        return () => unsub();
    }, []);

    if (loading) return <div className="h-screen flex items-center justify-center font-black text-blue-900">CARREGANDO...</div>;
    if (!user) return <Login onLogin={setUser} />;

    return (
        <div className="min-h-screen bg-gray-50 pb-20 font-sans">
            <TailwindStyle />
            <header className="bg-blue-900 text-white p-5 shadow-lg flex justify-between items-center sticky top-0 z-50">
                <h1 className="text-xl font-black italic tracking-tighter">🏠 CRM LOPES PRIME</h1>
                <button onClick={() => signOut(auth)} className="bg-red-600 px-3 py-1 rounded-lg text-[10px] font-bold">SAIR</button>
            </header>

            <nav className="bg-white border-b sticky top-16 z-40 flex flex-wrap justify-center gap-2 p-3 shadow-md">
                <button onClick={() => setActiveTab('clients')} className={`py-2 px-4 rounded-xl font-black text-[10px] ${activeTab === 'clients' ? 'bg-blue-900 text-white' : 'bg-gray-100'}`}>👥 CLIENTES</button>
                <button onClick={() => setActiveTab('properties')} className={`py-2 px-4 rounded-xl font-black text-[10px] ${activeTab === 'properties' ? 'bg-blue-900 text-white' : 'bg-gray-100'}`}>🏠 IMÓVEIS</button>
                <button onClick={() => setActiveTab('add-client')} className="py-2 px-4 rounded-xl font-black text-[10px] bg-green-100 text-green-700">➕ NOVO CLIENTE</button>
                <button onClick={() => setActiveTab('add-property')} className="py-2 px-4 rounded-xl font-black text-[10px] bg-purple-100 text-purple-700">➕ NOVO IMÓVEL</button>
            </nav>

            <main className="max-w-7xl mx-auto p-4 mt-4">
                {activeTab === 'clients' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {clients.map(c => (
                            <div key={c.id} className="bg-white rounded-3xl shadow-lg p-6 border-t-8 border-blue-900">
                                <h3 className="font-black text-blue-900 uppercase text-lg mb-2">{c.fullName}</h3>
                                <div className="bg-yellow-50 p-2 rounded-lg text-xs font-bold border border-yellow-200 mb-4 tracking-tight uppercase">
                                    📍 Interesse: {c.propertyInterest || 'Geral'}
                                </div>
                                <div className="text-sm font-bold mb-4">📞 {c.phones?.[0]}</div>
                                <button onClick={() => deleteItem('clients', c.id)} className="text-[10px] text-red-400 font-bold uppercase">Excluir</button>
                            </div>
                        ))}
                    </div>
                )}

                {activeTab === 'properties' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {properties.map(p => (
                            <div key={p.id} className="bg-white rounded-3xl shadow-xl overflow-hidden border border-gray-100">
                                {p.image && <img src={p.image} className="h-48 w-full object-cover" alt="imóvel" />}
                                <div className="p-5">
                                    <h3 className="font-black text-lg uppercase text-blue-900">{p.title}</h3>
                                    <p className="text-green-600 font-black text-xl mb-3 tracking-tighter">{p.price}</p>
                                    <p className="text-[10px] font-bold text-gray-400 mb-4">{p.address}</p>
                                    <div className="flex flex-col gap-2">
                                        {p.link && <a href={p.link} target="_blank" className="bg-blue-100 text-blue-700 text-center py-2 rounded-lg font-black text-[10px] uppercase tracking-widest">Ver Site / Linktree</a>}
                                        {p.pdf && <a href={p.pdf} target="_blank" className="bg-red-100 text-red-700 text-center py-2 rounded-lg font-black text-[10px] uppercase tracking-widest">E-book / Tabela PDF</a>}
                                    </div>
                                    <button onClick={() => deleteItem('properties', p.id)} className="mt-4 text-[9px] font-bold text-gray-300 uppercase">Remover Imóvel</button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {activeTab === 'add-client' && (
                    <div className="max-w-xl mx-auto bg-white p-8 rounded-[40px] shadow-2xl">
                        <h2 className="text-2xl font-black mb-6 text-blue-900 uppercase italic tracking-tighter">Novo Cliente</h2>
                        <div className="space-y-4">
                            <input type="text" placeholder="Nome Completo" value={name} onChange={e => setName(e.target.value)} className="w-full p-4 bg-gray-50 rounded-2xl font-bold border" />
                            <input type="text" placeholder="WhatsApp" value={phone} onChange={e => setPhone(e.target.value)} className="w-full p-4 bg-gray-50 rounded-2xl font-bold border" />
                            
                            <label className="text-[10px] font-black uppercase text-gray-400 ml-2">Vincular Imóvel de Interesse</label>
                            <select value={propertyInterest} onChange={e => setPropertyInterest(e.target.value)} className="w-full p-4 bg-yellow-50 rounded-2xl font-black border border-yellow-200">
                                <option value="">Selecione um imóvel da sua lista...</option>
                                {properties.map(p => <option key={p.id} value={p.title}>{p.title}</option>)}
                            </select>

                            <button onClick={addClient} className="w-full bg-blue-900 text-white font-black py-4 rounded-2xl shadow-xl uppercase tracking-widest">Salvar Cliente</button>
                        </div>
                    </div>
                )}

                {activeTab === 'add-property' && (
                    <div className="max-w-xl mx-auto bg-white p-8 rounded-[40px] shadow-2xl border-t-8 border-purple-700">
                        <h2 className="text-2xl font-black mb-6 text-purple-900 uppercase">Cadastrar Imóvel</h2>
                        <div className="space-y-4">
                            <input type="text" placeholder="Nome do Empreendimento" value={name} onChange={e => setName(e.target.value)} className="w-full p-4 bg-gray-50 rounded-2xl font-bold border" />
                            <input type="text" placeholder="Preço (Apenas números)" value={propPrice} onChange={e => setPropPrice(formatCurrency(e.target.value))} className="w-full p-4 bg-green-50 rounded-2xl font-black border border-green-200 text-green-700" />
                            <input type="text" placeholder="Endereço" value={propAddress} onChange={e => setPropAddress(e.target.value)} className="w-full p-4 bg-gray-50 rounded-2xl font-bold border" />
                            <input type="text" placeholder="Link do Site / Linktree" value={propLink} onChange={e => setPropLink(e.target.value)} className="w-full p-4 bg-blue-50 rounded-2xl font-bold border" />
                            <input type="text" placeholder="Link do PDF (Dropbox/Drive/iCloud)" value={propPdf} onChange={e => setPropPdf(e.target.value)} className="w-full p-4 bg-red-50 rounded-2xl font-bold border" />
                            <input type="text" placeholder="Link da Imagem (URL da foto)" value={propImg} onChange={e => setPropImg(e.target.value)} className="w-full p-4 bg-gray-50 rounded-2xl font-bold border" />
                            <textarea placeholder="Descrição rápida" value={observations} onChange={e => setObservations(e.target.value)} className="w-full p-4 bg-gray-50 rounded-2xl font-bold border h-24" />
                            <button onClick={addProperty} className="w-full bg-purple-700 text-white font-black py-4 rounded-2xl shadow-xl uppercase tracking-widest font-italic">Cadastrar Produto</button>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}

export default App;
