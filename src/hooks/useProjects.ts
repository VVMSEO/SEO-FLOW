import { useState, useEffect } from 'react';
import { Project } from '../types';
import { v4 as uuidv4 } from 'uuid';
import { db, auth } from '../firebase';
import { collection, doc, setDoc, updateDoc, deleteDoc, onSnapshot, query, where } from 'firebase/firestore';

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId: string | undefined;
    email: string | null | undefined;
    emailVerified: boolean | undefined;
    isAnonymous: boolean | undefined;
    tenantId: string | null | undefined;
    providerInfo: {
      providerId: string;
      displayName: string | null;
      email: string | null;
      photoUrl: string | null;
    }[];
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData.map(provider => ({
        providerId: provider.providerId,
        displayName: provider.displayName,
        email: provider.email,
        photoUrl: provider.photoURL
      })) || []
    },
    operationType,
    path
  }
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export function useProjects(userId: string) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [activeProjectId, setActiveProjectId] = useState<string | null>(() => {
    return localStorage.getItem(`seo_active_project_${userId}`) || null;
  });

  useEffect(() => {
    if (!userId) return;

    const q = query(collection(db, 'projects'), where('userId', '==', userId));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const projectsData: Project[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        projectsData.push({
          ...data,
          tasks: data.tasks ? JSON.parse(data.tasks) : [],
          queue: data.queue ? JSON.parse(data.queue) : [],
          log: data.log ? JSON.parse(data.log) : [],
          completed: data.completed ? JSON.parse(data.completed) : []
        } as Project);
      });
      setProjects(projectsData);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'projects');
    });

    return () => unsubscribe();
  }, [userId]);

  useEffect(() => {
    if (activeProjectId) {
      localStorage.setItem(`seo_active_project_${userId}`, activeProjectId);
    } else {
      localStorage.removeItem(`seo_active_project_${userId}`);
    }
  }, [activeProjectId, userId]);

  const addProject = async (name: string) => {
    const newProject: Project = {
      id: uuidv4(),
      name,
      domain: '',
      niche: '',
      region: '',
      budget: '',
      kpi: '',
      status: 'Зелёный',
      stage: 'Диагностика',
      focus: '',
      bottleneck: '',
      nextStep: '',
      lastUpdated: new Date().toISOString().split('T')[0],
      tasks: [],
      queue: [],
      log: [],
      completed: []
    };

    const projectData = {
      ...newProject,
      userId,
      tasks: JSON.stringify(newProject.tasks),
      queue: JSON.stringify(newProject.queue),
      log: JSON.stringify(newProject.log),
      completed: JSON.stringify(newProject.completed)
    };

    try {
      await setDoc(doc(db, 'projects', newProject.id), projectData);
      setActiveProjectId(newProject.id);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, `projects/${newProject.id}`);
    }
  };

  const updateProject = async (id: string, updates: Partial<Project>) => {
    const projectRef = doc(db, 'projects', id);
    const updateData: any = { ...updates, lastUpdated: new Date().toISOString().split('T')[0] };
    
    if (updates.tasks) updateData.tasks = JSON.stringify(updates.tasks);
    if (updates.queue) updateData.queue = JSON.stringify(updates.queue);
    if (updates.log) updateData.log = JSON.stringify(updates.log);
    if (updates.completed) updateData.completed = JSON.stringify(updates.completed);

    try {
      await updateDoc(projectRef, updateData);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `projects/${id}`);
    }
  };

  const deleteProject = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'projects', id));
      if (activeProjectId === id) {
        setActiveProjectId(null);
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `projects/${id}`);
    }
  };

  const activeProject = projects.find(p => p.id === activeProjectId) || null;

  return {
    projects,
    activeProject,
    activeProjectId,
    setActiveProjectId,
    addProject,
    updateProject,
    deleteProject
  };
}
