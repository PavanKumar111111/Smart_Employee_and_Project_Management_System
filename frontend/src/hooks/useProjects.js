import { useState, useEffect, useCallback } from "react";
import * as projectApi from "../api/project.api";
import { parseError, isBackendDown } from "../utils/errorParser";
import toast from "react-hot-toast";

export function useProjects() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [backendDown, setBackendDown] = useState(false);

  const fetchProjects = useCallback(async () => {
    setLoading(true);
    setError(null);
    setBackendDown(false);
    try {
      const data = await projectApi.getProjects();

      setProjects(data);
    } catch (err) {
      if (isBackendDown(err)) {
        setBackendDown(true);
      } else {
        setError(parseError(err));
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  const createProject = async (data) => {
    try {
      const newProject = await projectApi.createProject(data);
      setProjects((prev) => [...prev, newProject]);
      toast.success("Project created!");
      return newProject;
    } catch (err) {
      throw err;
    }
  };

  const updateProject = async (id, data) => {
    try {
      const updated = await projectApi.updateProject(id, data);
      setProjects((prev) => prev.map((p) => (p.id === id ? updated : p)));
      toast.success("Project updated!");
      return updated;
    } catch (err) {
      throw err;
    }
  };

  const deleteProject = async (id) => {
    try {
      await projectApi.deleteProject(id);
      setProjects((prev) => prev.filter((p) => p.id !== id));
      toast.success("Project deleted");
      return true;
    } catch (err) {
      toast.error(parseError(err));
      return false;
    }
  };

  return {
    projects,
    loading,
    error,
    backendDown,
    createProject,
    updateProject,
    deleteProject,
    refetch: fetchProjects,
  };
}
