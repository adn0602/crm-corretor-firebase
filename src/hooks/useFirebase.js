import { 
  collection, 
  query, 
  where, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc,
  orderBy
} from 'firebase/firestore';
import { 
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  signInWithPopup 
} from 'firebase/auth';
import { db, auth, googleProvider } from '../firebase/config';

// Operações com Clientes
export const useClients = () => {
  const getClients = async (agentId) => {
    try {
      const q = query(
        collection(db, 'clients'), 
        where('assignedAgent', '==', agentId),
        orderBy('createdAt', 'desc')
      );
      const querySnapshot = await getDocs(q);
      const clients = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      return clients;
    } catch (error) {
      console.error('Erro ao buscar clientes:', error);
      return [];
    }
  };

  const addClient = async (clientData) => {
    try {
      const docRef = await addDoc(collection(db, 'clients'), {
        ...clientData,
        createdAt: new Date(),
        status: 'lead',
        lastContact: new Date()
      });
      console.log('✅ Cliente salvo com ID:', docRef.id);
      return docRef.id;
    } catch (error) {
      console.error('❌ Erro ao salvar cliente:', error);
      throw error;
    }
  };

  const updateClient = async (clientId, updates) => {
    await updateDoc(doc(db, 'clients', clientId), updates);
  };

  const deleteClient = async (clientId) => {
    await deleteDoc(doc(db, 'clients', clientId));
  };

  return { getClients, addClient, updateClient, deleteClient };
};

// Operações com Imóveis
export const useProperties = () => {
  const getProperties = async () => {
    try {
      const q = query(
        collection(db, 'properties'),
        orderBy('createdAt', 'desc')
      );
      const querySnapshot = await getDocs(q);
      const properties = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      return properties;
    } catch (error) {
      console.error('Erro ao buscar imóveis:', error);
      return [];
    }
  };

  const addProperty = async (propertyData) => {
    try {
      const docRef = await addDoc(collection(db, 'properties'), {
        ...propertyData,
        createdAt: new Date(),
        status: 'available'
      });
      return docRef.id;
    } catch (error) {
      console.error('Erro ao salvar imóvel:', error);
      throw error;
    }
  };

  const updateProperty = async (propertyId, updates) => {
    await updateDoc(doc(db, 'properties', propertyId), updates);
  };

  const deleteProperty = async (propertyId) => {
    await deleteDoc(doc(db, 'properties', propertyId));
  };

  return { getProperties, addProperty, updateProperty, deleteProperty };
};

// Autenticação
export const useAuth = () => {
  const login = async (email, password) => {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return userCredential.user;
  };

  const loginWithGoogle = async () => {
    const userCredential = await signInWithPopup(auth, googleProvider);
    return userCredential.user;
  };

  const register = async (email, password, userData) => {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    
    await addDoc(collection(db, 'users'), {
      uid: userCredential.user.uid,
      email: email,
      ...userData,
      createdAt: new Date()
    });
    
    return userCredential.user;
  };

  const logout = async () => {
    await signOut(auth);
  };

  return { login, loginWithGoogle, register, logout };
};
