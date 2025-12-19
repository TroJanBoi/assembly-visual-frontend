import { jwtDecode } from "jwt-decode";

export const TOKEN_KEY = "authToken";

export interface DecodedToken {
  user_id: number;
  exp: number;
  sub?: string;
  id?: number | string;
}

export function decodeToken(token: string): DecodedToken | null {
  try {
    // Handle mock JWT tokens (development only)
    if (token.startsWith('mock_jwt_')) {
      const payload = token.replace('mock_jwt_', '');
      const decoded = JSON.parse(Buffer.from(payload, 'base64').toString());
      return decoded;
    }

    // Handle real JWT tokens
    return jwtDecode<DecodedToken>(token);
  } catch {
    return null;
  }
}

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setToken(token: string) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(TOKEN_KEY, token);
  } catch { }
}

export function clearToken() {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(TOKEN_KEY);
  } catch { }
}
