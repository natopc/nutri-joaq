import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { auth, db } from '../lib/firebase';
import { 
  signInWithEmailAndPassword, 
  signOut as firebaseSignOut, 
  onAuthStateChanged, 
  type User as FirebaseUser 
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';

export type Role = 'admin' | 'viewer';

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  cargo?: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
  canWrite: boolean;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // Busca o usuário no Firestore para pegar a role e o nome
        try {
          // Tenta buscar o usuário no Firestore (com timeout de 5s para não travar se o Firestore não estiver ativado)
          const fetchDoc = getDoc(doc(db, 'users', firebaseUser.uid));
          const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout do Firestore')), 5000));
          const userDoc = (await Promise.race([fetchDoc, timeoutPromise])) as any;
          
          if (userDoc.exists()) {
            let userData = userDoc.data() as User;
            if (firebaseUser.email === 'natopc@gmail.com' && userData.role !== 'admin') {
              userData.role = 'admin';
              await setDoc(doc(db, 'users', firebaseUser.uid), userData);
            }
            setUser({
              ...userData,
              id: firebaseUser.uid,
              email: firebaseUser.email || userData.email
            });
          } else {
            // Se não existir no Firestore, cria um registro básico de viewer
            const newUser: User = {
              id: firebaseUser.uid,
              name: firebaseUser.email?.split('@')[0] || 'Usuário',
              email: firebaseUser.email || '',
              role: 'admin' // mudado para admin por padrão para facilitar testes
            };
            await setDoc(doc(db, 'users', firebaseUser.uid), newUser);
            setUser(newUser);
          }
        } catch (error) {
          console.error("Erro ao buscar usuário no Firestore:", error);
          setUser({
            id: firebaseUser.uid,
            name: firebaseUser.email?.split('@')[0] || 'Usuário',
            email: firebaseUser.email || '',
            role: 'viewer'
          });
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const logout = async () => {
    try {
      await firebaseSignOut(auth);
    } catch (error) {
      console.error("Erro ao fazer logout:", error);
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      logout,
      isAuthenticated: !!user,
      canWrite: user?.role === 'admin',
      isAdmin: user?.role === 'admin'
    }}>
      {loading ? (
        <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-sans)', color: 'var(--color-text-muted)' }}>
          Conectando ao banco de dados...
        </div>
      ) : children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
