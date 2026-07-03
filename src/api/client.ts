import { mockDb } from '../services/mockDb';
import type { Project } from '../types/project';
import type { UserProfile, UserRole } from '../types/auth';
import { auth, db, isFirebaseConfigured } from '../config/firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';

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
      if (isFirebaseConfigured && auth?.currentUser && db) {
        try {
          const docRef = doc(db!, 'users', auth.currentUser.uid);
          const snap = await getDoc(docRef);
          return {
            success: snap.exists(),
            data: snap.exists() ? (snap.data() as UserProfile) : null,
            timestamp: new Date().toISOString()
          };
        } catch (err) {
          console.error('Failed to get current user:', err);
        }
      }

      const raw = localStorage.getItem('nebula-user');
      const user = raw ? JSON.parse(raw) : null;
      return {
        success: true,
        data: user,
        timestamp: new Date().toISOString()
      };
    },

    async login(email: string, role: UserRole = 'registered_user'): Promise<ApiResponse<UserProfile>> {
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

    async uploadMedia(projectId: string, filesCount: number): Promise<ApiResponse<Project | null>> {
      const proj = await mockDb.getProjectById(projectId);
      if (!proj) {
        return { success: false, data: null, message: 'Project not found', timestamp: new Date().toISOString() };
      }

      // High quality landscape photos matching the design system
      const samplePhotos = [
        'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1517457373958-b7bdd4587205?auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1447752875215-b2761acb3c5d?auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1472214222541-d510753a8707?auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&w=800&q=80'
      ];

      const currentMedia = proj.media || [];
      const newMedia = Array.from({ length: filesCount }).map((_, index) => {
        const id = `img_${Math.random().toString(36).substr(2, 9)}`;
        const url = samplePhotos[(currentMedia.length + index) % samplePhotos.length];
        return {
          id,
          name: `upload_${currentMedia.length + index + 1}.jpg`,
          type: 'image' as const,
          size: 1.5 * 1024 * 1024,
          url,
          uploadedAt: new Date().toISOString(),
          metadata: {
            tags: ['beach', 'nature', 'travel', 'people', 'scenic'],
            facesCount: Math.floor(Math.random() * 3),
            objects: ['sky', 'water', 'person', 'trees'],
            location: 'California Coast',
            caption: 'A beautiful memory from the journey.'
          }
        };
      });

      const updated = await mockDb.updateProject(projectId, {
        mediaCount: (proj.mediaCount || 0) + filesCount,
        media: [...currentMedia, ...newMedia]
      });

      return {
        success: !!updated,
        data: updated,
        timestamp: new Date().toISOString()
      };
    },

    async startAnalysis(projectId: string): Promise<ApiResponse<Project | null>> {
      const proj = await mockDb.getProjectById(projectId);
      if (!proj) {
        return { success: false, data: null, message: 'Project not found', timestamp: new Date().toISOString() };
      }
      await mockDb.updateProject(projectId, { status: 'analyzing' });
      // Simulate pipeline delay
      await new Promise((resolve) => setTimeout(resolve, 1000));
      const finalProject = await mockDb.updateProject(projectId, {
        status: 'ready',
        creditsConsumed: (proj.creditsConsumed || 0) + 10
      });

      return {
        success: !!finalProject,
        data: finalProject,
        timestamp: new Date().toISOString()
      };
    }
  },

  credits: {
    async getBalance(): Promise<ApiResponse<number>> {
      if (isFirebaseConfigured && auth?.currentUser && db) {
        try {
          const docRef = doc(db!, 'users', auth.currentUser.uid);
          const snap = await getDoc(docRef);
          if (snap.exists()) {
            return {
              success: true,
              data: snap.data().credits ?? 0,
              timestamp: new Date().toISOString()
            };
          }
        } catch (err) {
          console.error('Failed to get credit balance:', err);
        }
      }

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
      if (isFirebaseConfigured && auth?.currentUser && db) {
        try {
          const userRef = doc(db!, 'users', auth.currentUser.uid);
          const userSnap = await getDoc(userRef);
          if (!userSnap.exists()) {
            return { success: false, data: { success: false, reward: 0, newBalance: 0 }, message: 'User profile not found', timestamp: new Date().toISOString() };
          }
          const userData = userSnap.data();
          const today = new Date().toDateString();
          if (userData.lastCheckIn === today) {
            return {
              success: false,
              data: { success: false, reward: 0, newBalance: userData.credits },
              message: 'Already checked in today',
              timestamp: new Date().toISOString()
            };
          }
          const newBalance = (userData.credits || 0) + 10;
          await updateDoc(userRef, {
            lastCheckIn: today,
            credits: newBalance
          });
          await mockDb.addTransaction(10, 'checkin', 'Daily Reward Checkin');
          return {
            success: true,
            data: { success: true, reward: 10, newBalance },
            timestamp: new Date().toISOString()
          };
        } catch (err) {
          console.error('Failed to check in:', err);
        }
      }

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
