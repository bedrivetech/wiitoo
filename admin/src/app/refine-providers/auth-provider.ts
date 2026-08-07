import type { AuthProvider } from "@refinedev/core";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_AUTH_API_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:8080";

export const authProvider: AuthProvider = {
  login: async ({ email, password }) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      const json = await response.json();

      if (!response.ok || !json.success) {
        return {
          success: false,
          error: {
            message: json.error?.message || "Login failed",
            statusCode: response.status,
          },
        };
      }

      const { access_token, refresh_token, user } = json.data;

      localStorage.setItem("access_token", access_token);
      if (refresh_token) {
        localStorage.setItem("refresh_token", refresh_token);
      }
      localStorage.setItem("user", JSON.stringify(user));

      return {
        success: true,
        redirectTo: "/resources/users",
      };
    } catch (error: any) {
      return {
        success: false,
        error: {
          message: error.message || "Network error",
          statusCode: 0,
        },
      };
    }
  },

  logout: async () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    localStorage.removeItem("user");
    return {
      success: true,
      redirectTo: "/login",
    };
  },

  check: async () => {
    const token = localStorage.getItem("access_token");
    if (token) {
      return {
        authenticated: true,
      };
    }
    return {
      authenticated: false,
      redirectTo: "/login",
      logout: true,
    };
  },

  getPermissions: async () => {
    const userStr = localStorage.getItem("user");
    if (!userStr) return null;
    try {
      const user = JSON.parse(userStr);
      return user.role;
    } catch {
      return null;
    }
  },

  getIdentity: async () => {
    const userStr = localStorage.getItem("user");
    if (!userStr) return null;
    try {
      return JSON.parse(userStr);
    } catch {
      return null;
    }
  },

  onError: async (error) => {
    if (error?.statusCode === 401) {
      localStorage.removeItem("access_token");
      localStorage.removeItem("refresh_token");
      localStorage.removeItem("user");
      return {
        logout: true,
        redirectTo: "/login",
      };
    }
    return {};
  },
};