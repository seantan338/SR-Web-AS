import React, { createContext, useContext, useEffect, useState } from 'react';
import { auth, db, onAuthStateChanged, User, doc, getDoc, setDoc, OperationType, handleFirestoreError } from '../firebase';

interface FirebaseContextType {
  user: User | null;
  userProfile: any | null;
  loading: boolean;
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
  acceptTerms: () => Promise<void>;
}

const FirebaseContext = createContext<FirebaseContextType | undefined>(undefined);

export const FirebaseProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user);
      if (user) {
        try {
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          if (userDoc.exists()) {
            const data = userDoc.data();
            const isAdminEmail = user.email === 'sean@sunriserecruit.com';
            
            // Auto-promote primary admin if they exist but don't have the role
            if (isAdminEmail && data.role !== 'admin') {
              const updatedProfile = { ...data, role: 'admin' };
              await setDoc(doc(db, 'users', user.uid), updatedProfile, { merge: true });
              setUserProfile(updatedProfile);
            } else {
              setUserProfile(data);
            }
          } else {
            // Create a default profile for new users
            const isAdminEmail = user.email === 'sean@sunriserecruit.com';
            const newProfile = {
              uid: user.uid,
              displayName: user.displayName || 'New User',
              email: user.email || '',
              photoURL: user.photoURL || '',
              role: isAdminEmail ? 'admin' : 'candidate', // Default role or admin for primary email
              createdAt: new Date().toISOString(),
              termsAccepted: false, // New users must accept terms
            };
            await setDoc(doc(db, 'users', user.uid), newProfile);
            setUserProfile(newProfile);
          }
        } catch (error) {
          handleFirestoreError(error, OperationType.GET, `users/${user.uid}`);
        }
      } else {
        setUserProfile(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signIn = async () => {
    const { signInWithPopup, googleProvider } = await import('../firebase');
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error('Sign in error:', error);
    }
  };

  const signOutUser = async () => {
    const { signOut } = await import('../firebase');
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  const acceptTerms = async () => {
    if (!user) return;
    try {
      const updatedProfile = { ...userProfile, termsAccepted: true, termsAcceptedAt: new Date().toISOString() };
      await setDoc(doc(db, 'users', user.uid), updatedProfile, { merge: true });
      setUserProfile(updatedProfile);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${user.uid}`);
    }
  };

  return (
    <FirebaseContext.Provider value={{ user, userProfile, loading, signIn, signOut: signOutUser, acceptTerms }}>
      {children}
    </FirebaseContext.Provider>
  );
};

export const useFirebase = () => {
  const context = useContext(FirebaseContext);
  if (context === undefined) {
    throw new Error('useFirebase must be used within a FirebaseProvider');
  }
  return context;
};
