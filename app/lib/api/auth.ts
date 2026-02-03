import { apiFetch, API_BASE } from "./client";
import { setToken, clearToken } from "../auth/token";

export const OAUTH_GOOGLE_URL = `${API_BASE}/api/v2/oauth/google/login`;

export interface SignupInput {
  name: string;
  email: string;
  password: string;
}

export interface SignupResponse {
  id?: string;
  email?: string;
  name?: string;
  message?: string;
}

export interface SigninInput {
  email: string;
  password: string;
  remember?: boolean;
}

export interface UserProfile {
  id: number;
  email: string;
  name: string;
  picture_path: string;
}

export interface SigninResponse {
  user?: {
    id?: string | number;
    email?: string;
    name?: string;
    picture_path?: string | null;
  };
  token?: string;
  message?: string;
}

export async function signup(data: SignupInput): Promise<SignupResponse> {
  // Backend expects: { email, password, name }
  return apiFetch<SignupResponse>("/api/v2/auth/sign-up", {
    method: "POST",
    body: JSON.stringify({
      email: data.email,
      password: data.password,
      name: data.name,
    }),
  });
}

/**  Sign in (email/password) */
export async function signin(data: SigninInput): Promise<SigninResponse> {

  // 1. Call Login API to get token
  const loginRes = await apiFetch<{ token: string; error?: string }>("/api/v2/auth/login", {
    method: "POST",
    body: JSON.stringify({
      email: data.email,
      password: data.password,
    }),
  });

  if (!loginRes || !loginRes.token) {
    throw new Error(loginRes?.error || "Login failed");
  }

  const token = loginRes.token;

  // 2. Save token using helper (and optionally localStorage if desired)
  setToken(token);
  if (data.remember) {
    localStorage.setItem("authToken", token);
  }

  // 3. Fetch User Profile using the new token
  // Use apiFetch, which should pick up the token from where setToken saved it (cookie) 
  // or we might need to verify if apiFetch reads from cookie.
  // Assuming apiFetch reads cookie set by setToken.

  let userProfile: UserProfile | null = null;
  try {
    userProfile = await apiFetch<UserProfile>("/api/v2/profile", {
      method: "GET",
    });
  } catch (err) {
    console.error("Failed to fetch profile after login:", err);
  }

  const response: SigninResponse = {
    token: token,
    user: userProfile ? {
      id: userProfile.id,
      email: userProfile.email,
      name: userProfile.name,
      picture_path: userProfile.picture_path,
      // Backend doesn't return role/tel yet, use defaults or omit
    } : undefined
  };

  // 4. Save user info to localStorage for easy access if needed (optional)
  if (response.user) {
    localStorage.setItem("me", JSON.stringify(response.user));
  }

  return response;
}

export async function signout(): Promise<void> {
  try {
    localStorage.removeItem("authToken");
    localStorage.removeItem("me");
    window.location.href = "/signin";
  } catch {
    // Ignore errors
  } finally {
    clearToken();
  }
}


export async function changePassword(new_password: string) {
  return apiFetch<{ message?: string }>("/api/v2/profile/change-password", {
    method: "PUT",
    body: JSON.stringify({ new_password }),
  });
}

export async function oauthLogin(provider: string, code: string) {
  // This might need similar chaining update later if OAuth endpoint doesn't return user profile
  return apiFetch<SigninResponse>(`/api/v2/auth/oauth/${provider}/login?code=${encodeURIComponent(code)}`, {
    method: "GET",
  });
}
