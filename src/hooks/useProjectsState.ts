import { useState, useEffect } from 'react';
import type { Project, ProjectStatus } from '../types/project';
import { useAuth } from '../providers';

export function useProjectsState() {
  const { user } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Restore projects from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('nebula-projects');
    if (saved) {
      setProjects(JSON.parse(saved));
    } else {
      // Seed with a default demo project
      const demoProject: Project = {
        id: 'project_demo',
        name: 'Summer Trip 2026',
        status: 'ready',
        media: [],
        mediaCount: 12,
        creditsConsumed: 30,
        theme: 'editorial',
        layout: 'grid',
        musicEnabled: true,
        archived: false,
        createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
      };
      setProjects([demoProject]);
      localStorage.setItem('nebula-projects', JSON.stringify([demoProject]));
    }
    setIsLoading(false);
  }, []);

  const saveProjects = (updated: Project[]) => {
    setProjects(updated);
    localStorage.setItem('nebula-projects', JSON.stringify(updated));
  };

  const createProject = (name: string): Project | null => {
    if (!user) return null;
    
    // Check if user has credits (creation requires 0 initially, but we can validate state)
    const newProject: Project = {
      id: `project_${Math.random().toString(36).substr(2, 9)}`,
      name,
      status: 'draft',
      media: [],
      mediaCount: 0,
      creditsConsumed: 0,
      archived: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    saveProjects([newProject, ...projects]);
    setActiveProjectId(newProject.id);
    return newProject;
  };

  const renameProject = (id: string, name: string) => {
    const updated = projects.map((p) => 
      p.id === id ? { ...p, name, updatedAt: new Date().toISOString() } : p
    );
    saveProjects(updated);
  };

  const deleteProject = (id: string) => {
    const updated = projects.filter((p) => p.id !== id);
    saveProjects(updated);
    if (activeProjectId === id) {
      setActiveProjectId(null);
    }
  };

  const archiveProject = (id: string) => {
    const updated = projects.map((p) => 
      p.id === id ? { ...p, archived: true, updatedAt: new Date().toISOString() } : p
    );
    saveProjects(updated);
  };

  const restoreProject = (id: string) => {
    const updated = projects.map((p) => 
      p.id === id ? { ...p, archived: false, updatedAt: new Date().toISOString() } : p
    );
    saveProjects(updated);
  };

  const updateProjectStatus = (id: string, status: ProjectStatus) => {
    const updated = projects.map((p) => 
      p.id === id ? { ...p, status, updatedAt: new Date().toISOString() } : p
    );
    saveProjects(updated);
  };

  const addMediaToProject = (projectId: string, filesCount: number) => {
    const updated = projects.map((p) => {
      if (p.id === projectId) {
        return {
          ...p,
          mediaCount: p.mediaCount + filesCount,
          updatedAt: new Date().toISOString()
        };
      }
      return p;
    });
    saveProjects(updated);
  };

  const activeProject = projects.find((p) => p.id === activeProjectId) || null;

  return {
    projects,
    activeProject,
    activeProjectId,
    isLoading,
    setActiveProjectId,
    createProject,
    renameProject,
    deleteProject,
    archiveProject,
    restoreProject,
    updateProjectStatus,
    addMediaToProject
  };
}
