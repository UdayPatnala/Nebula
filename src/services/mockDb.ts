import type { Project } from '../types/project';
import { auth, db, isFirebaseConfigured } from '../config/firebase';
import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  addDoc, 
  updateDoc, 
  query, 
  where, 
  orderBy, 
  deleteDoc
} from 'firebase/firestore';

// Storage Keys
const PROJECTS_KEY = 'nebula_mock_projects';
const TRANSACTIONS_KEY = 'nebula_mock_transactions';
const NOTIFICATIONS_KEY = 'nebula_mock_notifications';
const AUDIT_LOGS_KEY = 'nebula_mock_audit_logs';

export interface CreditTransaction {
  id: string;
  amount: number;
  type: 'purchase' | 'checkin' | 'deduction' | 'refund';
  description: string;
  createdAt: string;
}

export interface SystemNotification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  read: boolean;
  createdAt: string;
}

export interface AuditLog {
  id: string;
  actor: string;
  action: string;
  details: string;
  createdAt: string;
}

// Initial Data Seeds
const seedProjects: Project[] = [
  {
    id: 'proj_summer_2026',
    name: 'Summer Trip 2026',
    status: 'ready',
    mediaCount: 12,
    media: [
      {
        id: 'img_1',
        name: 'beach_sunset.jpg',
        type: 'image',
        size: 1024 * 1024 * 2.5,
        url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80',
        uploadedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        metadata: { tags: ['beach', 'sunset', 'nature'], facesCount: 0, location: 'California' }
      },
      {
        id: 'img_2',
        name: 'family_dinner.jpg',
        type: 'image',
        size: 1024 * 1024 * 1.8,
        url: 'https://images.unsplash.com/photo-1517457373958-b7bdd4587205?auto=format&fit=crop&w=800&q=80',
        uploadedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        metadata: { tags: ['family', 'dinner', 'people'], facesCount: 4, location: 'San Francisco' }
      }
    ],
    creditsConsumed: 30,
    theme: 'editorial',
    layout: 'grid',
    musicEnabled: true,
    archived: false,
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
  }
];

const seedTransactions: CreditTransaction[] = [
  { id: 'tx_1', amount: 150, type: 'purchase', description: 'Welcome Credits Package', createdAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString() },
  { id: 'tx_2', amount: 10, type: 'checkin', description: 'Daily Reward Checkin', createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString() },
  { id: 'tx_3', amount: -30, type: 'deduction', description: 'AI Processing for Summer Trip 2026', createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString() }
];

const seedNotifications: SystemNotification[] = [
  { id: 'nt_1', title: 'Welcome to Nebula', message: 'Ready to build stunning AI stories? Start by creating a project.', type: 'info', read: false, createdAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString() },
  { id: 'nt_2', title: 'Processing Complete', message: 'Your project Summer Trip 2026 has been analyzed.', type: 'success', read: true, createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString() }
];

const seedAuditLogs: AuditLog[] = [
  { id: 'lg_1', actor: 'System Daemon', action: 'Daily cron cleanup', details: 'Cleaned up 0 orphaned temporary uploads', createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString() }
];

class HybridDatabase {
  private simulateLatency<T>(data: T, ms = 200): Promise<T> {
    return new Promise((resolve) => setTimeout(() => resolve(data), ms));
  }

  private getData<T>(key: string, seed: T): T {
    const raw = localStorage.getItem(key);
    if (!raw) {
      localStorage.setItem(key, JSON.stringify(seed));
      return seed;
    }
    return JSON.parse(raw);
  }

  private setData<T>(key: string, value: T): void {
    localStorage.setItem(key, JSON.stringify(value));
  }

  private get userId() {
    return auth?.currentUser?.uid || 'user_123';
  }

  // Project Collection APIs
  async getProjects(): Promise<Project[]> {
    if (isFirebaseConfigured && db) {
      try {
        const q = query(
          collection(db, 'projects'), 
          where('ownerId', '==', this.userId),
          where('archived', '==', false)
        );
        const snap = await getDocs(q);
        return snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Project));
      } catch (err) {
        console.error('Firestore getProjects failed:', err);
      }
    }

    const projects = this.getData<Project[]>(PROJECTS_KEY, seedProjects);
    return this.simulateLatency(projects.filter(p => !p.archived));
  }

  async getArchivedProjects(): Promise<Project[]> {
    if (isFirebaseConfigured && db) {
      try {
        const q = query(
          collection(db, 'projects'), 
          where('ownerId', '==', this.userId),
          where('archived', '==', true)
        );
        const snap = await getDocs(q);
        return snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Project));
      } catch (err) {
        console.error('Firestore getArchivedProjects failed:', err);
      }
    }

    const projects = this.getData<Project[]>(PROJECTS_KEY, seedProjects);
    return this.simulateLatency(projects.filter(p => p.archived));
  }

  async getProjectById(id: string): Promise<Project | null> {
    if (isFirebaseConfigured && db) {
      try {
        const docRef = doc(db, 'projects', id);
        const snap = await getDoc(docRef);
        if (snap.exists()) {
          const data = snap.data();
          if (data.ownerId === this.userId) {
            return { id: snap.id, ...data } as Project;
          }
        }
        return null;
      } catch (err) {
        console.error('Firestore getProjectById failed:', err);
      }
    }

    const projects = this.getData<Project[]>(PROJECTS_KEY, seedProjects);
    const p = projects.find((proj) => proj.id === id) || null;
    return this.simulateLatency(p);
  }

  async createProject(name: string): Promise<Project> {
    if (isFirebaseConfigured && db) {
      try {
        const newProj = {
          name,
          ownerId: this.userId,
          status: 'draft',
          media: [],
          mediaCount: 0,
          creditsConsumed: 0,
          archived: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        const docRef = await addDoc(collection(db, 'projects'), newProj);
        await this.logAction('User', 'Project Creation', `Created project ${name}`);
        return { id: docRef.id, ...newProj } as Project;
      } catch (err) {
        console.error('Firestore createProject failed:', err);
      }
    }

    const projects = this.getData<Project[]>(PROJECTS_KEY, seedProjects);
    const newProj: Project = {
      id: `proj_${Math.random().toString(36).substr(2, 9)}`,
      name,
      status: 'draft',
      media: [],
      mediaCount: 0,
      creditsConsumed: 0,
      archived: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    projects.unshift(newProj);
    this.setData(PROJECTS_KEY, projects);
    this.logAction('User', 'Project Creation', `Created project ${name}`);
    return this.simulateLatency(newProj);
  }

  async updateProject(id: string, updates: Partial<Project>): Promise<Project | null> {
    if (isFirebaseConfigured && db) {
      try {
        const docRef = doc(db, 'projects', id);
        const updatedFields = { ...updates, updatedAt: new Date().toISOString() };
        await updateDoc(docRef, updatedFields);
        const snap = await getDoc(docRef);
        return { id: snap.id, ...snap.data() } as Project;
      } catch (err) {
        console.error('Firestore updateProject failed:', err);
      }
    }

    const projects = this.getData<Project[]>(PROJECTS_KEY, seedProjects);
    let updatedProj: Project | null = null;
    const next = projects.map((p) => {
      if (p.id === id) {
        updatedProj = { ...p, ...updates, updatedAt: new Date().toISOString() };
        return updatedProj;
      }
      return p;
    });
    this.setData(PROJECTS_KEY, next);
    return this.simulateLatency(updatedProj);
  }

  async deleteProject(id: string): Promise<boolean> {
    if (isFirebaseConfigured && db) {
      try {
        const docRef = doc(db, 'projects', id);
        await deleteDoc(docRef);
        await this.logAction('User', 'Project Deletion', `Deleted project with ID: ${id}`);
        return true;
      } catch (err) {
        console.error('Firestore deleteProject failed:', err);
      }
    }

    const projects = this.getData<Project[]>(PROJECTS_KEY, seedProjects);
    const next = projects.filter((p) => p.id !== id);
    this.setData(PROJECTS_KEY, next);
    this.logAction('User', 'Project Deletion', `Deleted project with ID: ${id}`);
    return this.simulateLatency(true);
  }

  // Credit Transactions APIs
  async getTransactions(): Promise<CreditTransaction[]> {
    if (isFirebaseConfigured && db) {
      try {
        const q = query(
          collection(db, 'transactions'), 
          where('userId', '==', this.userId)
        );
        const snap = await getDocs(q);
        return snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as CreditTransaction));
      } catch (err) {
        console.error('Firestore getTransactions failed:', err);
      }
    }

    const txs = this.getData<CreditTransaction[]>(TRANSACTIONS_KEY, seedTransactions);
    return this.simulateLatency(txs);
  }

  async addTransaction(amount: number, type: CreditTransaction['type'], description: string): Promise<CreditTransaction> {
    if (isFirebaseConfigured && db) {
      try {
        const tx = {
          userId: this.userId,
          amount,
          type,
          description,
          createdAt: new Date().toISOString()
        };
        const docRef = await addDoc(collection(db, 'transactions'), tx);
        return { id: docRef.id, ...tx } as CreditTransaction;
      } catch (err) {
        console.error('Firestore addTransaction failed:', err);
      }
    }

    const txs = this.getData<CreditTransaction[]>(TRANSACTIONS_KEY, seedTransactions);
    const tx: CreditTransaction = {
      id: `tx_${Math.random().toString(36).substr(2, 9)}`,
      amount,
      type,
      description,
      createdAt: new Date().toISOString()
    };
    txs.unshift(tx);
    this.setData(TRANSACTIONS_KEY, txs);
    return this.simulateLatency(tx);
  }

  // Notification collection APIs
  async getNotifications(): Promise<SystemNotification[]> {
    if (isFirebaseConfigured && db) {
      try {
        const q = query(
          collection(db, 'notifications'), 
          where('userId', '==', this.userId)
        );
        const snap = await getDocs(q);
        return snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as SystemNotification));
      } catch (err) {
        console.error('Firestore getNotifications failed:', err);
      }
    }

    const notifications = this.getData<SystemNotification[]>(NOTIFICATIONS_KEY, seedNotifications);
    return this.simulateLatency(notifications);
  }

  async markNotificationRead(id: string): Promise<boolean> {
    if (isFirebaseConfigured && db) {
      try {
        const docRef = doc(db, 'notifications', id);
        await updateDoc(docRef, { read: true });
        return true;
      } catch (err) {
        console.error('Firestore markNotificationRead failed:', err);
      }
    }

    const notifications = this.getData<SystemNotification[]>(NOTIFICATIONS_KEY, seedNotifications);
    const next = notifications.map((n) => n.id === id ? { ...n, read: true } : n);
    this.setData(NOTIFICATIONS_KEY, next);
    return this.simulateLatency(true);
  }

  // Admin Logs collection APIs
  async getAuditLogs(): Promise<AuditLog[]> {
    if (isFirebaseConfigured && db) {
      try {
        const q = query(collection(db, 'audit_logs'), orderBy('createdAt', 'desc'));
        const snap = await getDocs(q);
        return snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as AuditLog));
      } catch (err) {
        console.error('Firestore getAuditLogs failed:', err);
      }
    }

    const logs = this.getData<AuditLog[]>(AUDIT_LOGS_KEY, seedAuditLogs);
    return this.simulateLatency(logs);
  }

  async logAction(actor: string, action: string, details: string): Promise<void> {
    if (isFirebaseConfigured && db) {
      try {
        await addDoc(collection(db, 'audit_logs'), {
          actor,
          action,
          details,
          createdAt: new Date().toISOString()
        });
        return;
      } catch (err) {
        console.error('Firestore logAction failed:', err);
      }
    }

    const logs = this.getData<AuditLog[]>(AUDIT_LOGS_KEY, seedAuditLogs);
    const newLog: AuditLog = {
      id: `lg_${Math.random().toString(36).substr(2, 9)}`,
      actor,
      action,
      details,
      createdAt: new Date().toISOString()
    };
    logs.unshift(newLog);
    this.setData(AUDIT_LOGS_KEY, logs);
  }
}

export const mockDb = new HybridDatabase();
