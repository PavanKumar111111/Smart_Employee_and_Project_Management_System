import { create } from "zustand";
import { isTokenExpired, getUserFromToken } from "../utils/tokenUtils";
import api from "../api/axios";

export const useAuthStore = create((set) => ({
  employee: null,
  token: null,
  isAuthenticated: false,

  login: (authResponse) => {
    localStorage.setItem("token", authResponse.token);
    localStorage.setItem("employeeId", authResponse.employeeId);
    set({
      employee: {
        id: authResponse.employeeId,
        name: authResponse.name,
        email: authResponse.email,
        role: authResponse.role || "EMPLOYEE",
        createdAt: new Date().toISOString(),
      },
      token: authResponse.token,
      isAuthenticated: true,
    });
    useAuthStore.getState().fetchUserProfile();
  },

  logout: () => {
    localStorage.removeItem("token");
    localStorage.removeItem("employeeId");
    set({
      employee: null,
      token: null,
      isAuthenticated: false,
    });
  },

  fetchUserProfile: async () => {
    try {
      const response = await api.get("/employees/me");
      if (response.data) {
        set({ employee: response.data });
      }
    } catch (err) {
      console.error("Failed to fetch user profile", err);
    }
  },

  initFromStorage: () => {
    const token = localStorage.getItem("token");
    if (!token || isTokenExpired(token)) {
      localStorage.removeItem("token");
      localStorage.removeItem("employeeId");
      set({ employee: null, token: null, isAuthenticated: false });
      return;
    }

    const userData = getUserFromToken(token);
    if (userData) {
      set({
        employee: {
          id: userData.employeeId,
          name: userData.name,
          email: userData.email,
          role: userData.role,
          createdAt: "",
        },
        token,
        isAuthenticated: true,
      });
      useAuthStore.getState().fetchUserProfile();
    }
  },
}));
