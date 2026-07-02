import { mockDb } from '../services/mockDb';
import type { Project } from '../types/project';
import type { UserProfile, UserRole } from '../types/auth';

// Standard normalized response structure defined in Section 12.5
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  code?: string;
  timestamp: string;
}

// Unified Centralized API Client (Section 8.9 & Section 12)
export const api = {
  auth: {
    async getCurrentUser(): Promise<ApiResponse<UserProfile | null>> {
      const raw = localStorage.getItem('nebula-user');
      const user = raw ? JSON.parse(raw) : null;
      return {
        success: true,
        data: user,
        timestamp: new Date().toISOString()
      };
    },

    async login(email: string, role: UserRole = 'registered_user'): Promise<ApiResponse<UserProfile>> {
      // Simulate API call to register/login
      const loggedInUser: UserProfile = {
        id: `usr_${Math.random().toString(36).substr(2, 9)}`,
        name: email.split('@')[0].toUpperCase(),
        email,
        role,
        emailVerified: true,
        credits: 150,
        storageUsed: 0,
        storageLimit: 10 * 1024 * 1024 * 1024, // 10 GB
        createdAt: new Date().toISOString()
      };
      
      localStorage.setItem('nebula-user', JSON.stringify(loggedInUser));
      mockDb.logAction('System', 'Authentication', `User ${email} signed in successfully`);

      return {
        success: true,
        data: loggedInUser,
        timestamp: new Date().toISOString()
      };
    },

    async logout(): Promise<ApiResponse<boolean>> {
      localStorage.removeItem('nebula-user');
      return {
        success: true,
        data: true,
        timestamp: new Date().toISOString()
      };
    }
  },

  projects: {
    async list(): Promise<ApiResponse<Project[]>> {
      const list = await mockDb.getProjects();
      return {
        success: true,
        data: list,
        timestamp: new Date().toISOString()
      };
    },

    async getById(id: string): Promise<ApiResponse<Project | null>> {
      const proj = await mockDb.getProjectById(id);
      return {
        success: !!proj,
        data: proj,
        timestamp: new Date().toISOString()
      };
    },

    async create(name: string): Promise<ApiResponse<Project>> {
      const newProj = await mockDb.createProject(name);
      return {
        success: true,
        data: newProj,
        timestamp: new Date().toISOString()
      };
    },

    async update(id: string, updates: Partial<Project>): Promise<ApiResponse<Project | null>> {
      const updated = await mockDb.updateProject(id, updates);
      return {
        success: !!updated,
        data: updated,
        timestamp: new Date().toISOString()
      };
    },

    async delete(id: string): Promise<ApiResponse<boolean>> {
      const res = await mockDb.deleteProject(id);
      return {
        success: res,
        data: res,
        timestamp: new Date().toISOString()
      };
    },

    async archive(id: string): Promise<ApiResponse<Project | null>> {
      const updated = await mockDb.updateProject(id, { archived: true });
      return {
        success: !!updated,
        data: updated,
        timestamp: new Date().toISOString()
      };
    },

    async restore(id: string): Promise<ApiResponse<Project | null>> {
      const updated = await mockDb.updateProject(id, { archived: false });
      return {
        success: !!updated,
        data: updated,
        timestamp: new Date().toISOString()
      };
    },

    // Mock upload endpoint
    async uploadMedia(projectId: string, filesCount: number): Promise<ApiResponse<Project | null>> {
      const proj = await mockDb.getProjectById(projectId);
      if (!proj) {
        return { success: false, data: null, message: 'Project not found', timestamp: new Date().toISOString() };
      }
      
      const updated = await mockDb.updateProject(projectId, {
        mediaCount: proj.mediaCount + filesCount,
        updatedAt: new Date().toISOString()
      });

      return {
        success: true,
        data: updated,
        timestamp: new Date().toISOString()
      };
    },

    // Mock AI triggers
    async runAIAnalysis(projectId: string): Promise<ApiResponse<Project | null>> {
      const proj = await mockDb.getProjectById(projectId);
      if (!proj) {
        return { success: false, data: null, message: 'Project not found', timestamp: new Date().toISOString() };
      }

      // Transition project status: analyzing -> ready
      await mockDb.updateProject(projectId, { status: 'analyzing' });
      
      // Simulate pipeline completion background task
      await new Promise((resolve) => setTimeout(resolve, 1500));

      const finalProject = await mockDb.updateProject(projectId, {
        status: 'ready',
        creditsConsumed: proj.creditsConsumed + 30
      });

      return {
        success: true,
        data: finalProject,
        timestamp: new Date().toISOString()
      };
    }
  },

  credits: {
    async getBalance(): Promise<ApiResponse<number>> {
      const raw = localStorage.getItem('nebula-user');
      const user = raw ? JSON.parse(raw) : null;
      return {
        success: true,
        data: user ? user.credits : 0,
        timestamp: new Date().toISOString()
      };
    },

    async getHistory() {
      const list = await mockDb.getTransactions();
      return {
        success: true,
        data: list,
        timestamp: new Date().toISOString()
      };
    },

    async checkIn(): Promise<ApiResponse<{ success: boolean; reward: number; newBalance: number }>> {
      const raw = localStorage.getItem('nebula-user');
      if (!raw) {
        return { success: false, data: { success: false, reward: 0, newBalance: 0 }, message: 'Session expired', timestamp: new Date().toISOString() };
      }

      const user = JSON.parse(raw);
      const lastCheckIn = localStorage.getItem('nebula-last-checkin');
      const today = new Date().toDateString();

      if (lastCheckIn === today) {
        return {
          success: false,
          data: { success: false, reward: 0, newBalance: user.credits },
          message: 'Already checked in today',
          timestamp: new Date().toISOString()
        };
      }

      const newBalance = user.credits + 10;
      localStorage.setItem('nebula-last-checkin', today);
      localStorage.setItem('nebula-user', JSON.stringify({ ...user, credits: newBalance }));
      
      await mockDb.addTransaction(10, 'checkin', 'Daily Reward Checkin');

      return {
        success: true,
        data: { success: true, reward: 10, newBalance },
        timestamp: new Date().toISOString()
      };
    }
  },

  notifications: {
    async list() {
      const list = await mockDb.getNotifications();
      return {
        success: true,
        data: list,
        timestamp: new Date().toISOString()
      };
    },

    async markRead(id: string): Promise<ApiResponse<boolean>> {
      const res = await mockDb.markNotificationRead(id);
      return {
        success: res,
        data: res,
        timestamp: new Date().toISOString()
      };
    }
  },

  admin: {
    async getLogs() {
      const logs = await mockDb.getAuditLogs();
      return {
        success: true,
        data: logs,
        timestamp: new Date().toISOString()
      };
    }
  }
};
