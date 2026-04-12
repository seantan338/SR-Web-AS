import React, { createContext, useContext, useEffect, useState } from 'react';
import { auth, db } from './firebase';
import { onAuthStateChanged, signInWithPopup, GoogleAuthProvider, signOut as firebaseSignOut, User } from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';

export interface UserProfile {
  uid: string;
  displayName: string;
  email: string;
  role: 'candidate' | 'recruiter' | 'partner' | 'admin';
  termsAccepted: boolean; // ✅ 确保这里有 termsAccepted
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
  acceptTerms: () => Promise<void>; // ✅ 暴露给 Modal 使用的函数
}

const FirebaseContext = createContext<FirebaseContextType | null>(null);

export const FirebaseProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);
        const userRef = doc(db, 'users', firebaseUser.uid);
        const userSnap = await getDoc(userRef);

        if (userSnap.exists()) {
          // 老用户登录
          setUserProfile(userSnap.data() as UserProfile);
        } else {
          // 🚀 核心架构升级：拦截邀请链接分配角色
          const urlParams = new URLSearchParams(window.location.search);
          const inviteRole = urlParams.get('role');
          const inviteToken = urlParams.get('token');

          let assignedRole: 'candidate' | 'recruiter' | 'partner' | 'admin' = 'candidate';

          // ⚠️ POC 阶段的秘钥校验 (只要链接带有 token=SR_INVITE_888 即可成为内部人员)
          if (inviteToken === 'SR_INVITE_888') {
            if (inviteRole === 'admin' || inviteRole === 'recruiter' || inviteRole === 'partner') {
              assignedRole = inviteRole;
            }
          }

          const newUserProfile: UserProfile = {
            uid: firebaseUser.uid,
            displayName: firebaseUser.displayName || 'New User',
            email: firebaseUser.email || '',
            role: assignedRole,
            termsAccepted: false, // 新用户强制为 false
            createdAt: new Date().toISOString(),
          };

          await setDoc(userRef, newUserProfile);
          setUserProfile(newUserProfile);
          
          // 清除网址里的邀请码，保持整洁
          window.history.replaceState({}, document.title, "/");
        }
      } else {
        setUser(null);
        setUserProfile(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signIn = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error("Sign-in failed:", error);
    }
  };

  const logout = async () => {
    await firebaseSignOut(auth);
  };

  // ✅ 核心：处理同意条款并更新状态
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