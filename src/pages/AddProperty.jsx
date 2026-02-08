import React, { useState, useEffect } from 'react';
import { db } from '../firebase/config';
import { collection, query, orderBy, onSnapshot, deleteDoc, doc } from 'firebase/firestore';

const ListStyle = () => (
  <style>{`
    .property-card {
      background: rgba(30, 41, 59, 0.7);
      backdrop-filter: blur(10px);
      border: 1px solid rgba(255, 255, 255, 0.05);
      transition: transform 0.2s ease;
    }
    .property-card:hover { transform: translateY(-5px); }
  `}</style>
);

function PropertyList() {
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, "imoveis"), orderBy("dataCriacao", "desc"));
    
    // Escuta em tempo real: se você cadastrar no celular, aparece aqui na hora
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const docs = [];
      querySnapshot.forEach((doc) => {
        docs.push({ id: doc.id, ...doc.data() });
      });
      setProperties(docs);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleDelete = async (id) => {
    if (window.confirm("Deseja remover este imóvel do sistema?")) {
      await deleteDoc(doc(db, "imoveis", id));
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 p-6 text-white">
      <ListStyle />
      <header className="max-w-5xl mx-auto mb-10 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-light tracking-widest uppercase">Portfólio de Ativos</h1>
          <p className="text-blue-400 text-[10px] font-black uppercase tracking-widest">Lopes Prime - Gestão</p>
        </div>
        <div className="text-right">
          <span className="text-slate-500 text-xs font-bold uppercase">Total: {properties.length} unidades</span>
        </div>
      </header>

      {loading ? (
        <div className="text-center py-20 text-blue-400 animate-pulse font-black uppercase tracking-widest">Sincronizando Banco de Dados...</div>
      ) : (
        <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {properties.map((item) => (
            <div key={item.id} className="property-card p-6 rounded-[2rem] flex flex-col justify-between">
              <div>
                <h3 className="text-lg font-bold text-white mb-1">{item.titulo}</h3>
                <p className="text-blue-400 font-black text-sm mb-4">R$ {item.preco}</p>
                <p className="text-slate-400 text-xs leading-relaxed line-clamp-3 mb-6">
                  {item.descricao || "Sem descrição detalhada."}
                </p>
              </div>
              
              <div className="flex justify-between items-center border-t border-white/5 pt-4">
                <span className="text-[10px] text-slate-500 font-bold uppercase">Ref: {item.id.substring(0,6)}</span>
                <button 
                  onClick={() => handleDelete(item.id)}
                  className="text-red-400 hover:text-red-300 text-[10px] font-black uppercase tracking-widest transition"
                >
                  Excluir
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default PropertyList;