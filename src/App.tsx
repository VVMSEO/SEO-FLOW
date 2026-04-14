/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { AppLayout } from './components/AppLayout';
import { auth } from './firebase';
import { onAuthStateChanged, signInWithPopup, GoogleAuthProvider, User } from 'firebase/auth';
import { Button } from './components/ui/Button';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleLogin = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error("Login failed", error);
    }
  };

  if (loading) {
    return <div className="flex h-screen items-center justify-center bg-slate-100 text-slate-500">Загрузка...</div>;
  }

  if (!user) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-100">
        <div className="bg-white p-8 rounded-xl shadow-sm border border-slate-200 text-center max-w-sm w-full">
          <div className="font-extrabold text-2xl text-blue-600 flex items-center justify-center gap-2 mb-6">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="m16 12-4-4-4 4"/><path d="M12 16V8"/></svg>
            SEO FLOW
          </div>
          <h1 className="text-xl font-semibold text-slate-800 mb-2">Вход в систему</h1>
          <p className="text-sm text-slate-500 mb-6">Авторизуйтесь для управления вашими SEO-проектами</p>
          <Button onClick={handleLogin} className="w-full bg-blue-600 hover:bg-blue-700 text-white">
            Войти через Google
          </Button>
        </div>
      </div>
    );
  }

  return <AppLayout user={user} />;
}
