import type { DataProvider } from "@refinedev/core";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

function getAuthToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("access_token");
}

async function apiRequest<T>(
  url: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getAuthToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string> | undefined),
  };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  const json = await response.json();

  if (!response.ok || !json.success) {
    const error: any = new Error(
      json.error?.message || `Request failed with status ${response.status}`
    );
    error.statusCode = response.status;
    error.errors = json.error;
    throw error;
  }

  return json.data;
}

function getResourceUrl(resource: string): string {
  // Map resource names to their service API paths
  const resourceMap: Record<string, string> = {
    users: `${API_BASE_URL}/api/v1/admin/users`,
    videos: `${API_BASE_URL}/api/v1/admin/videos`,
    streams: `${API_BASE_URL}/api/v1/admin/streams`,
    messages: `${API_BASE_URL}/api/v1/admin/messages`,
    "chat-messages": `${API_BASE_URL}/api/v1/admin/messages`,
    categories: `${API_BASE_URL}/api/v1/admin/categories`,
    reports: `${API_BASE_URL}/api/v1/admin/reports`,
    clips: `${API_BASE_URL}/api/v1/admin/clips`,
    transactions: `${API_BASE_URL}/api/v1/admin/transactions`,
    payouts: `${API_BASE_URL}/api/v1/admin/payouts`,
    subscriptions: `${API_BASE_URL}/api/v1/admin/subscriptions`,
    templates: `${API_BASE_URL}/api/v1/admin/templates`,
  };

  return resourceMap[resource] || `${API_BASE_URL}/api/v1/admin/${resource}`;
}

function buildQueryString(params: Record<string, any>): string {
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      searchParams.append(key, String(value));
    }
  });
  return searchParams.toString();
}

function mapRefineFilterToApiParam(filter: any): { key: string; value: string } | null {
  if (filter.operator === "eq") {
    return { key: filter.field, value: String(filter.value) };
  }
  if (filter.operator === "contains" || filter.operator === "startswith") {
    return { key: "q", value: String(filter.value) };
  }
  if (filter.operator === "in") {
    return { key: filter.field, value: String(filter.value) };
  }
  return null;
}

export const dataProvider: DataProvider = {
  getList: async ({ resource, pagination, sorters, filters, meta }) => {
    const baseUrl = meta?.apiUrl || getResourceUrl(resource);
    const current = pagination?.currentPage || 1;
    const pageSize = pagination?.pageSize || 20;

    const params: Record<string, any> = {
      page: current,
      perPage: pageSize,
    };

    // Sorting
    if (sorters && sorters.length > 0) {
      params.sort = sorters
        .map((s) => `${s.field}:${s.order === "asc" ? "asc" : "desc"}`)
        .join(",");
    }

    // Filters
    if (filters) {
      for (const filter of filters) {
        const mapped = mapRefineFilterToApiParam(filter);
        if (mapped) {
          params[mapped.key] = mapped.value;
        }
      }
    }

    // Search
    if (meta?.q) {
      params.q = meta.q;
    }

    const queryString = buildQueryString(params);
    const url = queryString ? `${baseUrl}?${queryString}` : baseUrl;

    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${getAuthToken()}`,
      },
    });

    const json = await response.json();

    if (!response.ok || !json.success) {
      const error: any = new Error(
        json.error?.message || `Request failed with status ${response.status}`
      );
      error.statusCode = response.status;
      throw error;
    }

    return {
      data: json.data || [],
      total: json.meta?.total || 0,
    };
  },

  getMany: async ({ resource, ids }) => {
    // Our API doesn't support bulk get, so fetch individually
    const baseUrl = getResourceUrl(resource);
    const results = await Promise.all(
      ids.map(async (id) => {
        const response = await fetch(`${baseUrl}/${id}`, {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${getAuthToken()}`,
          },
        });
        const json = await response.json();
        return json.data;
      })
    );

    return { data: results };
  },

  getOne: async ({ resource, id, meta }) => {
    const baseUrl = meta?.apiUrl || getResourceUrl(resource);
    const response = await fetch(`${baseUrl}/${id}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${getAuthToken()}`,
      },
    });

    const json = await response.json();

    if (!response.ok || !json.success) {
      const error: any = new Error(
        json.error?.message || `Request failed with status ${response.status}`
      );
      error.statusCode = response.status;
      throw error;
    }

    return { data: json.data };
  },

  create: async ({ resource, variables, meta }) => {
    const baseUrl = meta?.apiUrl || getResourceUrl(resource);
    const response = await fetch(baseUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${getAuthToken()}`,
      },
      body: JSON.stringify(variables),
    });

    const json = await response.json();

    if (!response.ok || !json.success) {
      const error: any = new Error(
        json.error?.message || `Request failed with status ${response.status}`
      );
      error.statusCode = response.status;
      throw error;
    }

    return { data: json.data };
  },

  createMany: async ({ resource, variables }) => {
    const baseUrl = getResourceUrl(resource);
    const results = await Promise.all(
      variables.map(async (vars) => {
        const response = await fetch(baseUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${getAuthToken()}`,
          },
          body: JSON.stringify(vars),
        });
        const json = await response.json();
        return json.data;
      })
    );

    return { data: results };
  },

  update: async ({ resource, id, variables, meta }) => {
    const baseUrl = meta?.apiUrl || getResourceUrl(resource);
    const response = await fetch(`${baseUrl}/${id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${getAuthToken()}`,
      },
      body: JSON.stringify(variables),
    });

    const json = await response.json();

    if (!response.ok || !json.success) {
      const error: any = new Error(
        json.error?.message || `Request failed with status ${response.status}`
      );
      error.statusCode = response.status;
      throw error;
    }

    return { data: json.data };
  },

  updateMany: async ({ resource, ids, variables }) => {
    const baseUrl = getResourceUrl(resource);
    const results = await Promise.all(
      ids.map(async (id) => {
        const response = await fetch(`${baseUrl}/${id}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${getAuthToken()}`,
          },
          body: JSON.stringify(variables),
        });
        const json = await response.json();
        return json.data;
      })
    );

    return { data: results };
  },

  deleteOne: async ({ resource, id, variables, meta }) => {
    const baseUrl = meta?.apiUrl || getResourceUrl(resource);
    const response = await fetch(`${baseUrl}/${id}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${getAuthToken()}`,
      },
      body: variables ? JSON.stringify(variables) : undefined,
    });

    const json = await response.json();

    if (!response.ok || !json.success) {
      const error: any = new Error(
        json.error?.message || `Request failed with status ${response.status}`
      );
      error.statusCode = response.status;
      throw error;
    }

    return { data: json.data };
  },

  deleteMany: async ({ resource, ids }) => {
    const baseUrl = getResourceUrl(resource);
    const results = await Promise.all(
      ids.map(async (id) => {
        const response = await fetch(`${baseUrl}/${id}`, {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${getAuthToken()}`,
          },
        });
        const json = await response.json();
        return json.data;
      })
    );

    return { data: results };
  },

  getApiUrl: () => {
    return `${API_BASE_URL}/api/v1/admin`;
  },

  custom: async ({ url, method, payload, query, headers }) => {
    const token = getAuthToken();
    const queryString = query ? buildQueryString(query as Record<string, any>) : "";
    const fullUrl = queryString ? `${url}?${queryString}` : url;

    const response = await fetch(fullUrl, {
      method: method.toUpperCase(),
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        ...headers,
      },
      body: payload ? JSON.stringify(payload) : undefined,
    });

    const json = await response.json();

    if (!json.success) {
      const error: any = new Error(
        json.error?.message || `Request failed`
      );
      error.statusCode = response.status;
      throw error;
    }

    return { data: json.data };
  },
};