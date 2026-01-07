
// TokenManager.ts
// Handles JWT access/refresh token lifecycle, expiration, rotation, and secure storage
import { API_BASE_URL } from './apiConfig';

export interface TokenPayload {
  exp: number;
  iat: number;
  [key: string]: any;
}

function decodeJwt(token: string): TokenPayload | null {
  try {
    const payload = token.split('.')[1];
    return JSON.parse(atob(payload));
  } catch {
    return null;
  }
}

class TokenManager {
  private accessToken: string | null = null;
  private accessTokenExpiry: number | null = null;
  private refreshToken: string | null = null;
  private refreshTokenExpiry: number | null = null;
  private idleTimeout: any = null;
  private idleMaxMs = 14 * 24 * 60 * 60 * 1000; // 14 days
  private absoluteMaxMs = 90 * 24 * 60 * 60 * 1000; // 90 days

  constructor() {
    this.loadTokens();
  }

  loadTokens() {
    this.refreshToken = localStorage.getItem('refreshToken');
    if (this.refreshToken) {
      const payload = decodeJwt(this.refreshToken);
      this.refreshTokenExpiry = payload?.exp ? payload.exp * 1000 : null;
    }
  }

  setTokens(access: string, refresh: string) {
    this.accessToken = access;
    const accessPayload = decodeJwt(access);
    this.accessTokenExpiry = accessPayload?.exp ? accessPayload.exp * 1000 : null;
    this.refreshToken = refresh;
    localStorage.setItem('refreshToken', refresh);
    const refreshPayload = decodeJwt(refresh);
    this.refreshTokenExpiry = refreshPayload?.exp ? refreshPayload.exp * 1000 : null;
  }

  getAccessToken() {
    return this.accessToken;
  }

  getRefreshToken() {
    return this.refreshToken;
  }

  isAccessTokenExpired() {
    return !this.accessTokenExpiry || Date.now() > this.accessTokenExpiry - 30000; // 30s buffer
  }

  isRefreshTokenExpired() {
    return !this.refreshTokenExpiry || Date.now() > this.refreshTokenExpiry;
  }

  async refreshAccessToken(): Promise<boolean> {
    if (!this.refreshToken || this.isRefreshTokenExpired()) return false;
    try {
      const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh_token: this.refreshToken })
      });
      if (!response.ok) throw new Error('Refresh failed');
      const data = await response.json();
      if (data.access_token && data.refresh_token) {
        this.setTokens(data.access_token, data.refresh_token);
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }

  clearTokens() {
    this.accessToken = null;
    this.accessTokenExpiry = null;
    this.refreshToken = null;
    this.refreshTokenExpiry = null;
    localStorage.removeItem('refreshToken');
  }

  // Idle expiration logic
  startIdleTimer(onExpire: () => void) {
    if (this.idleTimeout) clearTimeout(this.idleTimeout);
    this.idleTimeout = setTimeout(() => {
      this.clearTokens();
      onExpire();
    }, this.idleMaxMs);
  }

  stopIdleTimer() {
    if (this.idleTimeout) clearTimeout(this.idleTimeout);
    this.idleTimeout = null;
  }

  // Absolute expiration check
  isAbsoluteExpired() {
    if (!this.refreshTokenExpiry) return false;
    return Date.now() > this.refreshTokenExpiry + this.absoluteMaxMs;
  }
}

const tokenManager = new TokenManager();
export default tokenManager;
