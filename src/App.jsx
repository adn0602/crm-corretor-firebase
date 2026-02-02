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
    const [activeTab, setActiveTab] = useState('clients'); // clients, add-client, properties, add-property
    
    // ESTADOS DE LISTAGEM
    const [clients, setClients] = useState([]);
    const [properties, setProperties] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [editingId, setEditingId] = useState(null);

    // CAMPOS GERAIS (USADOS PARA CLIENTE E IMÓVEL)
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [propertyInterest, setPropertyInterest] = useState('');
    const [birthDate, setBirthDate] = useState('');
    const [observations, setObservations] = useState('');
    
    // CAMPOS ESPECÍFICOS DE IMÓVEIS
    const [propPrice, setPropPrice] = useState('');
    const [propAddress, setPropAddress] = useState('');

    const loadData = async (userId) => {
        try {
            // Carregar Clientes
            const qC = query(collection(db, 'clients'), where("assignedAgent", "==", userId));
            const snapC = await getDocs(qC);
            const listC = snapC.docs.map(d => ({ id: d.id, ...d.data() }));
            listC.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
            setClients(listC);

            // Carregar Imóveis
            const qP = query(collection(db, 'properties'), where("userId", "==", userId));
            const snapP = await getDocs(qP);
            const listP = snapP.docs.map(d => ({ id: d.id, ...d.data() }));
            listP.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
            setProperties(listP);
        } catch (error) { console.error(error); }
    };

    // FUNÇÕES DE CLIENTE
    const addClient = async () => {
        if (!name.trim() || !phone.trim()) return alert('Nome e Telefone obrigatórios!');
        await addDoc(collection(db, 'clients'), {
            fullName: name, email, phones: [phone], propertyInterest, birthDate, observations,
            status: "LEAD", assignedAgent: user.uid, createdAt: new Date()
        });
        alert("✅ Cliente salvo!");
        resetForm(); setActiveTab('clients'); loadData(user.uid);
    };

    // FUNÇÕES DE IMÓVEL
    const addProperty = async () => {
        if (!name.trim() || !propPrice.trim()) return alert('Nome do Imóvel e Valor são obrigatórios!');
        await addDoc(collection(db, 'properties'), {
            title: name, price: propPrice, address: propAddress, description: observations,
            userId: user.uid, createdAt: new Date()
        });
        alert("🏠 Imóvel cadastrado!");
        resetForm(); setActiveTab('properties'); loadData(user.uid);
    };

    const deleteItem = async (col, id, label) => {
        if (window.confirm(`⚠️ Excluir ${label}?`)) {
            await deleteDoc(doc(db, col, id));
            loadData(user.uid);
        }
    };

    const resetForm = () => {
        setName(''); setEmail(''); setPhone(''); setPropertyInterest(''); setBirthDate(''); 
        setObservations(''); setPropPrice(''); setPropAddress(''); setEditingId(null);
    };

    useEffect(() => {
        const unsub = onAuthStateChanged(auth, (u) => {
            if (u) { setUser(u); loadData(u.uid); }
            else setUser(null);
            setLoading(false);
        });
        return () => unsub();
    }, []);

    if (loading) return <div className="h-screen flex items-center justify-center font-black text-blue-900 animate-pulse">CARREGANDO...</div>;
    if (!user) return <Login onLogin={setUser} />;

    return (
        <div className="min-h-screen bg-gray-100 font-sans pb-20">
            <TailwindStyle />
            <header className="bg-blue-900 text-white p-5 shadow-2xl sticky top-0 z-30 flex justify-between items-center">
                <h1 className="text-xl font-black italic tracking-tighter uppercase">🏠 CRM Lopes Prime</h1>
                <button onClick={() => signOut(auth)} className="bg-red-600 px-4 py-2 rounded-lg font-bold text-[10px]">SAIR</button>
            </header>

            {/* MENU PRINCIPAL */}
            <nav className="bg-white border-b sticky top-16 z-20 flex flex-wrap justify-center gap-2 p-3 shadow-md">
                <button onClick={() => { setActiveTab('clients'); resetForm(); }} className={`py-2 px-4 rounded-xl font-black text-[10px] ${activeTab === 'clients' ? 'bg-blue-900 text-white' : 'bg-gray-100 text-gray-500'}`}>👥 CLIENTES</button>
                <button onClick={() => { setActiveTab('properties'); resetForm(); }} className={`py-2 px-4 rounded-xl font-black text-[10px] ${activeTab === 'properties' ? 'bg-blue-900 text-white' : 'bg-gray-100 text-gray-500'}`}>🏠 IMÓVEIS</button>
                <button onClick={() => { setActiveTab('add-client'); resetForm(); }} className="py-2 px-4 rounded-xl font-black text-[10px] bg-green-100 text-green-700 font-bold border-2 border-green-200">➕ NOVO CLIENTE</button>
                <button onClick={() => { setActiveTab('add-property'); resetForm(); }} className="py-2 px-4 rounded-xl font-black text-[10px] bg-purple-100 text-purple-700 font-bold border-2 border-purple-200">➕ NOVO IMÓVEL</button>
            </nav>

            <main className="max-w-7xl mx-auto p-4 mt-4">
                {/* ABA DE LISTAGEM DE CLIENTES */}
                {activeTab === 'clients' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {clients.map(c => (
                            <div key={c.id} className="bg-white rounded-3xl shadow p-6 border-t-8 border-blue-900">
                                <h3 className="font-black text-blue-900 uppercase text-lg mb-2">{c.fullName}</h3>
                                <div className="bg-yellow-50 p-2 rounded mb-3 text-xs font-bold italic">"{c.propertyInterest}"</div>
                                <div className="text-xs space-y-1 mb-4">
                                    <p>📞 {c.phones?.[0]}</p>
                                    <p className="text-gray-500">📍 Status: <span className="text-blue-600 font-black">{c.status}</span></p>
                                </div>
                                <button onClick={() => deleteItem('clients', c.id, c.fullName)} className="text-[9px] font-bold text-red-400 uppercase">Excluir Cliente</button>
                            </div>
                        ))}
                    </div>
                )}

                {/* ABA DE LISTAGEM DE IMÓVEIS */}
                {activeTab === 'properties' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {properties.map(p => (
                            <div key={p.id} className="bg-white rounded-3xl shadow p-6 border-t-8 border-purple-700">
                                <h3 className="font-black text-purple-900 uppercase text-lg mb-1">{p.title}</h3>
                                <p className="text-green-600 font-black mb-3">R$ {p.price}</p>
                                <div className="text-xs text-gray-600 bg-gray-50 p-3 rounded-xl mb-4 italic">
                                    {p.description || "Sem descrição."}
                                </div>
                                <p className="text-[10px] font-bold text-gray-400 uppercase mb-4">📍 {p.address || "Endereço não informado"}</p>
                                <button onClick={() => deleteItem('properties', p.id, p.title)} className="text-[9px] font-bold text-red-400 uppercase">Excluir Imóvel</button>
                            </div>
                        ))}
                    </div>
                )}

                {/* FORMULÁRIO NOVO CLIENTE */}
                {activeTab === 'add-client' && (
                    <div className="max-w-xl mx-auto bg-white p-8 rounded-[40px] shadow-2xl">
                        <h2 className="text-2xl font-black mb-6 text-center text-blue-900">NOVO CLIENTE</h2>
                        <div className="space-y-4">
                            <input type="text" placeholder="Nome Completo" value={name} onChange={e => setName(e.target.value)} className="w-full p-4 bg-gray-50 rounded-2xl font-bold border" />
                            <input type="text" placeholder="WhatsApp" value={phone} onChange={e => setPhone(e.target.value)} className="w-full p-4 bg-gray-50 rounded-2xl font-bold border" />
                            <input type="text" placeholder="O que ele busca?" value={propertyInterest} onChange={e => setPropertyInterest(e.target.value)} className="w-full p-4 bg-yellow-50 rounded-2xl font-bold border border-yellow-200" />
                            <textarea placeholder="Observações" value={observations} onChange={e => setObservations(e.target.value)} className="w-full p-4 bg-gray-50 rounded-2xl font-bold border h-24" />
                            <button onClick={addClient} className="w-full bg-blue-900 text-white font-black py-4 rounded-2xl shadow-xl uppercase">Salvar Cliente</button>
                        </div>
                    </div>
                )}

                {/* FORMULÁRIO NOVO IMÓVEL */}
                {activeTab === 'add-property' && (
                    <div className="max-w-xl mx-auto bg-white p-8 rounded-[40px] shadow-2xl border-t-8 border-purple-700">
                        <h2 className="text-2xl font-black mb-6 text-center text-purple-900 uppercase italic">Novo Imóvel / Produto</h2>
                        <div className="space-y-4">
                            <input type="text" placeholder="Nome do Empreendimento" value={name} onChange={e => setName(e.target.value)} className="w-full p-4 bg-gray-50 rounded-2xl font-bold border" />
                            <input type="text" placeholder="Valor (Ex: 450.000,00)" value={propPrice} onChange={e => setPropPrice(e.target.value)} className="w-full p-4 bg-green-50 rounded-2xl font-bold border border-green-200" />
                            <input type="text" placeholder="Endereço / Localização" value={propAddress} onChange={e => setPropAddress(e.target.value)} className="w-full p-4 bg-gray-50 rounded-2xl font-bold border" />
                            <textarea placeholder="Descrição (Diferenciais, m², quartos...)" value={observations} onChange={e => setObservations(e.target.value)} className="w-full p-4 bg-gray-50 rounded-2xl font-bold border h-32" />
                            <button onClick={addProperty} className="w-full bg-purple-700 text-white font-black py-4 rounded-2xl shadow-xl uppercase tracking-widest">Cadastrar Imóvel</button>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}

export default App;
