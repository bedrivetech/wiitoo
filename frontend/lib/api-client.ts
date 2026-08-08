const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

interface RequestOptions {
  method?: string;
  body?: unknown;
  auth?: boolean;
}

class ApiError extends Error {
  code: string;
  status: number;

  constructor(code: string, message: string, status: number) {
    super(message);
    this.code = code;
    this.status = status;
    this.name = 'ApiError';
  }
}

function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    const stored = localStorage.getItem('wiitoo-auth');
    if (!stored) return null;
    const parsed = JSON.parse(stored);
    return parsed?.state?.accessToken || null;
  } catch {
    return null;
  }
}

async function request<T = unknown>(path: string, opts: RequestOptions = {}): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (opts.auth) {
    const token = getToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
  }

  const res = await fetch(`${API_BASE}/api/v1/auth${path}`, {
    method: opts.method || 'GET',
    headers,
    body: opts.body ? JSON.stringify(opts.body) : undefined,
  });

  const json = await res.json();

  if (!res.ok || !json.success) {
    const err = json.error || { code: 'UNKNOWN', message: 'An error occurred' };
    throw new ApiError(err.code, err.message, res.status);
  }

  return json.data as T;
}

// --- API Functions ---

export interface UsernameCheckResult {
  username: string;
  available: boolean;
  suggestions: string[];
}

export interface AuthUser {
  id: string;
  email: string;
  username: string;
  display_name: string;
  avatar_url: string;
  role: string;
  status: string;
}

export interface AuthTokens {
  access_token: string;
  refresh_token: string;
  user: AuthUser;
}

export interface OTPChallenge {
  message: string;
  expires_in_seconds: number;
}

export const api = {
  // Username check (used during signup, no auth required)
  checkUsername: (q: string) =>
    request<UsernameCheckResult>(`/username/check?q=${encodeURIComponent(q)}`),

  // Register
  register: (email: string, password: string, username: string, interests?: string[]) =>
    request<OTPChallenge>('/register', {
      method: 'POST',
      body: { email, password, username, interests },
    }),

  // Login
  login: (email: string, password: string) =>
    request<AuthTokens>('/login', {
      method: 'POST',
      body: { email, password },
    }),

  // Verify OTP
  verify: (email: string, code: string) =>
    request<AuthTokens>('/verify', {
      method: 'POST',
      body: { email, code },
    }),

  // Resend OTP
  resendOtp: (email: string) =>
    request<OTPChallenge>('/verify/resend', {
      method: 'POST',
      body: { email },
    }),

  // Get current user (requires auth)
  getMe: () =>
    request<AuthUser>('/me', { auth: true }),

  // Refresh token
  refresh: (refreshToken: string) =>
    request<{ access_token: string; refresh_token: string }>('/token/refresh', {
      method: 'POST',
      body: { refresh_token: refreshToken },
    }),

  // Logout
  logout: () =>
    request<void>('/logout', { method: 'POST', auth: true }),

  // Creator conversion
  convertToCreator: (data: {
    creator_username: string;
    category: string;
    bio?: string;
  }) =>
    request<{
      message: string;
      user_id: string;
      creator_channel: string;
      status: string;
    }>('/creator/convert', {
      method: 'POST',
      body: data,
      auth: true,
    }),
};