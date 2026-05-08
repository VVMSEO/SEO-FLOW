import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, doc, setDoc, deleteDoc, updateDoc } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { v4 as uuidv4 } from 'uuid';

export interface Category {
  id: string;
  userId: string;
  name: string;
  color: string;
}

export function useCategories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!auth.currentUser) return;

    const q = query(
      collection(db, 'categories'),
      where('userId', '==', auth.currentUser.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Category));
      setCategories(data);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const addCategory = async (data: Omit<Category, 'id' | 'userId'>) => {
    if (!auth.currentUser) return;
    const id = uuidv4();
    await setDoc(doc(db, 'categories', id), {
      ...data,
      id,
      userId: auth.currentUser.uid
    });
  };

  const updateCategory = async (id: string, updates: Partial<Category>) => {
    if (!auth.currentUser) return;
    await updateDoc(doc(db, 'categories', id), updates);
  };

  const deleteCategory = async (id: string) => {
    if (!auth.currentUser) return;
    await deleteDoc(doc(db, 'categories', id));
  };

  return { categories, loading, addCategory, updateCategory, deleteCategory };
}
