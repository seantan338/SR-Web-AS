import React, { createContext, useContext, useEffect, useState } from 'react';
import { auth, db } from './firebase';
import { onAuthStateChanged, signInWithPopup, GoogleAuthProvider, signOut as firebaseSignOut, User } from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc, onSnapshot } from 'firebase/firestore';

export interface UserProfile {
  uid: string;
  displayName: string;
  email: string;
  role: 'candidate' | 'recruiter' | 'partner' | 'admin';
  termsAccepted: boolean;
  createdAt: string;
  bio?: string;
  phone?: string;
  location?: string;
  website?: string;
}

interface FirebaseContextType {
  user: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
  signIn: () => Promise<void>;
  logout: () => Promise<void>;
  acceptTerms: () => Promise<void>;
}

const FirebaseContext = createContext<FirebaseContextType | null>(null);

export const FirebaseProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let profileUnsub: (() => void) | null = null;

    const authUnsub = onAuthStateChanged(auth, async (firebaseUser) => {
      if (profileUnsub) {
        profileUnsub();
        profileUnsub = null;
      }

      try {
        if (firebaseUser) {
          setUser(firebaseUser);
          const userRef = doc(db, 'users', firebaseUser.uid);
          const userSnap = await getDoc(userRef);

          if (!userSnap.exists()) {
            const urlParams = new URLSearchParams(window.location.search);
            const inviteRole = urlParams.get('role');
            const inviteToken = urlParams.get('token');

            let assignedRole: 'candidate' | 'recruiter' | 'partner' | 'admin' = 'candidate';

            if (inviteToken === 'SR_INVITE_888') {
              if (inviteRole === 'admin' || inviteRole === 'recruiter' || inviteRole === 'partner') {
                assignedRole = inviteRole;
              }
            }

            await setDoc(userRef, {
              uid: firebaseUser.uid,
              displayName: firebaseUser.displayName || 'New User',
              email: firebaseUser.email || '',
              role: assignedRole,
              termsAccepted: false,
              createdAt: new Date().toISOString(),
            } as UserProfile);

            window.history.replaceState({}, document.title, '/');
          }

          profileUnsub = onSnapshot(userRef, (snap) => {
            if (snap.exists()) {
              setUserProfile(snap.data() as UserProfile);
            }
            setLoading(false);
          });
        } else {
          setUser(null);
          setUserProfile(null);
          setLoading(false);
        }
      } catch (error) {
        console.error('FirebaseContext: Firestore error during auth state change:', error);
        setUser(null);
        setUserProfile(null);
        setLoading(false);
      }
    });

    return () => {
      authUnsub();
      if (profileUnsub) profileUnsub();
    };
  }, []);

  const signIn = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error('Sign-in failed:', error);
    }
  };

  const logout = async () => {
    await firebaseSignOut(auth);
  };

  const acceptTerms = async () => {
    if (!user || !userProfile) return;
    const userRef = doc(db, 'users', user.uid);
    await updateDoc(userRef, { termsAccepted: true });
    setUserProfile({ ...userProfile, termsAccepted: true });
  };

  return (
    <FirebaseContext.Provider value={{ user, userProfile, loading, signIn, logout, acceptTerms }}>
      {!loading && children}
    </FirebaseContext.Provider>
  );
};

export const useFirebase = () => {
  const context = useContext(FirebaseContext);
  if (!context) throw new Error('useFirebase must be used within FirebaseProvider');
  return context;
};
