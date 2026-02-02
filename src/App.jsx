import React, { useState, useEffect } from 'react';
import { db, auth } from './firebase/config';
import { collection, addDoc, getDocs, query, where, orderBy } from 'firebase/firestore';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import Login from './components/Login';

// FORÇAR ESTILO TAILWIND
const TailwindStyle = () => (
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" />
);

function App() {
    const [user, setUser] = useState(null);
    const [clients, setClients] = useState([]);
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [propertyInterest, setPropertyInterest] = useState(''); // NOVO CAMPO
    const [activeTab, setActiveTab] = useState('clients');
    const [loading, setLoading] = useState(true);

    const loadClients = async (userId) => {
        try {
            // Buscamos os clientes e ordenamos pelos mais recentes
            const q = query(
                collection(db, 'clients'), 
                where("assignedAgent", "==", userId)
            );
            const querySnapshot = await getDocs(q);
            const clientList = querySnapshot.docs.map(doc => ({ 
                id: doc.id, 
                ...doc.data() 
            }));
            
            // Ordenação manual simples (mais recentes primeiro)
            clientList.sort((a, b) => b.createdAt?.seconds - a.createdAt?.seconds);
            
            setClients(clientList);
        } catch (error) {
            console.error("Erro ao carregar clientes:", error);
        }
    };

    const addClient = async () => {
        if (!name.trim() || !phone.trim() || !propertyInterest.trim()) {
            alert('❌ Preencha pelo menos Nome, Telefone e Imóvel de Interesse!');
            return;
        }
        try {
            await addDoc(collection(db, 'clients'), {
                fullName: name,
                email: email,
                phones: [phone],
                propertyInterest: propertyInterest, // SALVANDO O IMÓVEL
                status: "lead",
                assignedAgent: user.uid,
                createdAt: new Date()
            });
            alert("✅ Cliente cadastrado com sucesso!");
            setName(''); setEmail(''); setPhone(''); setPropertyInterest('');
            loadClients(user.uid);
            setActiveTab('clients');
        } catch (error) {
            alert("❌ Erro ao salvar: " + error.message);
        }
    };

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            if (user) {
                setUser(user);
                loadClients(user.uid);
            } else {
                setUser(null);
            }
            setLoading(false);
        });
        return () => unsubscribe();
    }, []);

    if (loading) return <div className="flex justify-center items-center h-screen font-bold text-blue-800">Carregando CRM...</div>;
    if (!user) return <Login onLogin={setUser} />;

    return (
        <div className="min-h-screen bg-gray-100 font-sans text-gray-900 pb-10">
            <TailwindStyle />
            
            {/* Cabeçalho */}
            <header className="bg-blue-900 text-white shadow-xl p-5">
                <div className="max-w-6xl mx-auto flex justify-between items-center">
                    <h1 className="text-2xl font-black tracking-tighter flex items-center">
                        🏠 CRM LOPES PRIME
                    </h1>
                    <div className="flex items-center gap-4">
                        <div className="text-right hidden sm:block">
                            <p className="text-xs opacity-70 uppercase font-bold text-blue-200">Corretor Conectado</p>
                            <p className="text-sm font-semibold">{user.email}</p>
                        </div>
                        <button onClick={() => signOut(auth)} className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded-lg text-xs font-bold transition-all shadow-md">SAIR</button>
                    </div>
                </div>
            </header>

            {/* Menu de Navegação */}
            <nav className="bg-white border-b sticky top-0 z-10 flex justify-center gap-4 sm:gap-10 text-xs sm:text-sm font-bold shadow-sm">
                <button onClick={() => setActiveTab('clients')} className={`py-5 px-4 border-b-4 transition-all ${activeTab === 'clients' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-400 hover:text-gray-600'}`}>
                    👥 MEUS CLIENTES ({clients.length})
                </button>
                <button onClick={() => setActiveTab('add')} className={`py-5 px-4 border-b-4 transition-all ${activeTab === 'add' ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-400 hover:text-gray-600'}`}>
                    ➕ NOVO CADASTRO
                </button>
            </nav>

            <main className="max-w-6xl mx-auto p-4 mt-6">
                {activeTab === 'clients' ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {clients.length === 0 ? (
                            <div className="col-span-full text-center py-20 bg-white rounded-3xl border-2 border-dashed border-gray-300">
                                <p className="text-gray-400 font-medium">Nenhum cliente na sua base ainda.</p>
                                <button onClick={() => setActiveTab('add')} className="mt-4 text-blue-600 font-bold underline">Cadastrar meu primeiro cliente</button>
                            </div>
                        ) : (
                            clients.map(client => (
                                <div key={client.id} className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-xl transition-shadow duration-300">
                                    <div className="p-5">
                                        <div className="flex justify-between items-start mb-4">
                                            <h3 className="font-black text-blue-900 text-lg leading-tight uppercase">{client.fullName}</h3>
                                            <span className="bg-blue-100 text-blue-700 text-[10px] font-black px-2 py-1 rounded-md uppercase tracking-wider">{client.status || 'LEAD'}</span>
                                        </div>
                                        
                                        {/* DESTAQUE DO IMÓVEL */}
                                        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-3 mb-4 rounded-r-lg">
                                            <p className="text-[10px] uppercase font-bold text-yellow-700">Imóvel de Interesse</p>
                                            <p className="text-sm font-bold text-gray-800 italic">"{client.propertyInterest || 'Não informado'}"</p>
                                        </div>

                                        <div className="space-y-2 mb-5">
                                            <p className="text-gray-600 text-sm flex items-center">
                                                <span className="mr-2">📧</span> {client.email || 'Sem e-mail'}
                                            </p>
                                            <p className="text-gray-600 text-sm flex items-center font-semibold">
                                                <span className="mr-2">📞</span> {client.phones?.[0]}
                                            </p>
                                        </div>
                                        
                                        <a href={`https://wa.me/55${client.phones?.[0]?.replace(/\D/g,'')}`} target="_blank" rel="noreferrer" 
                                           className="flex items-center justify-center gap-2 w-full bg-green-500 hover:bg-green-600 text-white font-black py-3 rounded-xl transition-colors shadow-lg active:transform active:scale-95">
                                            <span>FALAR NO WHATSAPP</span>
                                        </a>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                ) : (
                    <div className="max-w-xl mx-auto bg-white p-8 rounded-3xl shadow-2xl border border-gray-100">
                        <h2 className="text-3xl font-black mb-2 text-gray-800">Novo Cliente</h2>
                        <p className="text-gray-500 mb-8 font-medium font-sm">Preencha os dados para salvar no seu banco de dados Firebase.</p>
                        
                        <div className="space-y-5">
                            <div>
                                <label className="text-xs font-bold uppercase text-gray-500 ml-1">Nome Completo</label>
                                <input type="text" placeholder="Ex: João Silva" value={name} onChange={e => setName(e.target.value)} 
                                       className="w-full p-4 bg-gray-50 border-2 border-gray-100 rounded-xl outline-none focus:border-blue-500 transition-all font-medium" />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs font-bold uppercase text-gray-500 ml-1">WhatsApp (com DDD)</label>
                                    <input type="text" placeholder="21999999999" value={phone} onChange={e => setPhone(e.target.value)} 
                                           className="w-full p-4 bg-gray-50 border-2 border-gray-100 rounded-xl outline-none focus:border-blue-500 transition-all font-medium" />
                                </div>
                                <div>
                                    <label className="text-xs font-bold uppercase text-gray-500 ml-1">E-mail (opcional)</label>
                                    <input type="email" placeholder="cliente@email.com" value={email} onChange={e => setEmail(e.target.value)} 
                                           className="w-full p-4 bg-gray-50 border-2 border-gray-100 rounded-xl outline-none focus:border-blue-500 transition-all font-medium" />
                                </div>
                            </div>

                            <div>
                                <label className="text-xs font-bold uppercase text-gray-500 ml-1">O que ele procura? (Imóvel/Perfil)</label>
                                <input type="text" placeholder="Ex: Ilha Pura, 3 qts Barra, Minha Casa Minha Vida..." value={propertyInterest} onChange={e => setPropertyInterest(e.target.value)} 
                                       className="w-full p-4 bg-yellow-50 border-2 border-yellow-100 rounded-xl outline-none focus:border-yellow-400 transition-all font-bold text-gray-800" />
                            </div>

                            <button onClick={addClient} className="w-full bg-blue-800 hover:bg-blue-900 text-white font-black py-4 rounded-2xl shadow-xl transition-all transform hover:-translate-y-1 active:scale-95 mt-4 tracking-widest">
                                SALVAR NO CRM
                            </button>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}

export default App;
