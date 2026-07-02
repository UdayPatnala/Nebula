import type { Project } from '../types/project';

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
        size: 1024 * 1024 * 2.5, // 2.5 MB
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

class MockDatabase {
  private simulateLatency<T>(data: T, ms = 200): Promise<T> {
    return new Promise((resolve) => setTimeout(() => resolve(data), ms));
  }

  // Getters & Setters with localStorage persistence
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

  // Project Collection APIs
  getProjects(): Promise<Project[]> {
    const projects = this.getData<Project[]>(PROJECTS_KEY, seedProjects);
    return this.simulateLatency(projects.filter(p => !p.archived));
  }

  getArchivedProjects(): Promise<Project[]> {
    const projects = this.getData<Project[]>(PROJECTS_KEY, seedProjects);
    return this.simulateLatency(projects.filter(p => p.archived));
  }

  getProjectById(id: string): Promise<Project | null> {
    const projects = this.getData<Project[]>(PROJECTS_KEY, seedProjects);
    const p = projects.find((proj) => proj.id === id) || null;
    return this.simulateLatency(p);
  }

  createProject(name: string): Promise<Project> {
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

  updateProject(id: string, updates: Partial<Project>): Promise<Project | null> {
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

  deleteProject(id: string): Promise<boolean> {
    const projects = this.getData<Project[]>(PROJECTS_KEY, seedProjects);
    const next = projects.filter((p) => p.id !== id);
    this.setData(PROJECTS_KEY, next);
    this.logAction('User', 'Project Deletion', `Deleted project with ID: ${id}`);
    return this.simulateLatency(true);
  }

  // Credit Transactions APIs
  getTransactions(): Promise<CreditTransaction[]> {
    const txs = this.getData<CreditTransaction[]>(TRANSACTIONS_KEY, seedTransactions);
    return this.simulateLatency(txs);
  }

  addTransaction(amount: number, type: CreditTransaction['type'], description: string): Promise<CreditTransaction> {
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
  getNotifications(): Promise<SystemNotification[]> {
    const notifications = this.getData<SystemNotification[]>(NOTIFICATIONS_KEY, seedNotifications);
    return this.simulateLatency(notifications);
  }

  markNotificationRead(id: string): Promise<boolean> {
    const notifications = this.getData<SystemNotification[]>(NOTIFICATIONS_KEY, seedNotifications);
    const next = notifications.map((n) => n.id === id ? { ...n, read: true } : n);
    this.setData(NOTIFICATIONS_KEY, next);
    return this.simulateLatency(true);
  }

  // Admin Logs collection APIs
  getAuditLogs(): Promise<AuditLog[]> {
    const logs = this.getData<AuditLog[]>(AUDIT_LOGS_KEY, seedAuditLogs);
    return this.simulateLatency(logs);
  }

  logAction(actor: string, action: string, details: string): void {
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

export const mockDb = new MockDatabase();
