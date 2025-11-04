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
    const q = query(
      collection(db, 'clients'), 
      where('assignedAgent', '==', agentId),
      orderBy('createdAt', 'desc')
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  };

  const addClient = async (clientData) => {
    const docRef = await addDoc(collection(db, 'clients'), {
      ...clientData,
      createdAt: new Date(),
      status: 'lead'
    });
    return docRef.id;
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
    const q = query(
      collection(db, 'properties'),
      orderBy('createdAt', 'desc')
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  };

  const addProperty = async (propertyData) => {
    const docRef = await addDoc(collection(db, 'properties'), {
      ...propertyData,
      createdAt: new Date(),
      status: 'available'
    });
    return docRef.id;
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
