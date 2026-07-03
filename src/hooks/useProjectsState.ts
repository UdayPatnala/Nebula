import { useState, useEffect } from 'react';
import type { Project } from '../types/project';
import { useAuth } from '../providers';
import { api } from '../api/client';

export function useProjectsState() {
  const { user } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Load projects from API
  const loadProjects = async () => {
    setIsLoading(true);
    try {
      const res = await api.projects.list();
      if (res.success) {
        setProjects(res.data);
      }
    } catch (err) {
      console.error('Failed to load projects:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      loadProjects();
    } else {
      setProjects([]);
      setIsLoading(false);
    }
  }, [user]);

  const createProject = async (name: string): Promise<Project | null> => {
    if (!user) return null;
    setIsLoading(true);
    try {
      const res = await api.projects.create(name);
      if (res.success) {
        setProjects((prev) => [res.data, ...prev]);
        setActiveProjectId(res.data.id);
        return res.data;
      }
    } catch (err) {
      console.error('Failed to create project:', err);
    } finally {
      setIsLoading(false);
    }
    return null;
  };

  const deleteProject = async (id: string): Promise<boolean> => {
    try {
      const res = await api.projects.delete(id);
      if (res.success) {
        setProjects((prev) => prev.filter((p) => p.id !== id));
        if (activeProjectId === id) {
          setActiveProjectId(null);
        }
        return true;
      }
    } catch (err) {
      console.error('Failed to delete project:', err);
    }
    return false;
  };

  const activeProject = projects.find((p) => p.id === activeProjectId) || null;

  return {
    projects,
    activeProject,
    activeProjectId,
    isLoading,
    setActiveProjectId,
    createProject,
    deleteProject
  };
}
