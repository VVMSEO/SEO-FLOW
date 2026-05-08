import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, doc, setDoc, deleteDoc, updateDoc } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { v4 as uuidv4 } from 'uuid';

export interface TimeLog {
  id: string;
  userId: string;
  projectId: string;
  projectName: string;
  task: string;
  status: 'Не начата' | 'В работе' | 'Сделана';
  date: string;
  weekStart: string; // ISO date format "YYYY-MM-DD" representing Monday of the week
  month: string; // ISO date "YYYY-MM" format
  minutes: number; // planned
  workedMinutes: number; // actual
  categoryId?: string;
  result?: string; // notes for client reports
}

export function useTimeLogs() {
  const [logs, setLogs] = useState<TimeLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!auth.currentUser) return;

    const q = query(
      collection(db, 'timeLogs'),
      where('userId', '==', auth.currentUser.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as TimeLog));
      setLogs(data);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const addLog = async (logData: Omit<TimeLog, 'id' | 'userId' | 'weekStart' | 'month' | 'result'> & { weekStart?: string, month?: string, result?: string, status?: 'Не начата' | 'В работе' | 'Сделана' }) => {
    if (!auth.currentUser) return;
    const id = uuidv4();
    
    // Auto-calculate weekStart and month from date if not provided
    let weekStart = logData.weekStart;
    let month = logData.month;
    
    if (logData.date) {
      const d = new Date(logData.date);
      const day = d.getDay();
      const diff = d.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday
      const monday = new Date(d.setDate(diff));
      if (!weekStart) weekStart = monday.toISOString().split('T')[0];
      if (!month) month = logData.date.substring(0, 7);
    }

    const newLog = {
      ...logData,
      status: logData.status || 'Не начата',
      weekStart: weekStart || '',
      month: month || '',
      result: logData.result || '',
      id,
      userId: auth.currentUser.uid
    };

    await setDoc(doc(db, 'timeLogs', id), newLog);
    return newLog;
  };

  const updateLog = async (id: string, updates: Partial<TimeLog>) => {
    if (!auth.currentUser) return;
    await updateDoc(doc(db, 'timeLogs', id), updates);
  };

  const deleteLog = async (id: string) => {
    if (!auth.currentUser) return;
    await deleteDoc(doc(db, 'timeLogs', id));
  };

  return { logs, loading, addLog, updateLog, deleteLog };
}

export const updateLog = async (id: string, updates: Partial<TimeLog>) => {
  if (!auth.currentUser) return;
  await updateDoc(doc(db, 'timeLogs', id), updates);
};
