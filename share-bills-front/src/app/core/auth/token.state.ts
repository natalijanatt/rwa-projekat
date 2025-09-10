import { Injectable, signal } from '@angular/core';

const ACCESS_KEY = 'sb.access';

function decodeExp(jwt: string): number | null {
  try { return (JSON.parse(atob(jwt.split('.')[1])) as { exp?: number }).exp ?? null; } catch { return null; }
}

@Injectable({ providedIn: 'root' })
export class TokenState {
  accessToken = signal<string | null>(localStorage.getItem(ACCESS_KEY));
  private logoutTimer?: any;

  setToken(token: string) {
    this.accessToken.set(token);
    localStorage.setItem(ACCESS_KEY, token);
    this.scheduleAutoLogout(token);
  }

  clear() {
    this.accessToken.set(null);
    localStorage.removeItem(ACCESS_KEY);
    clearTimeout(this.logoutTimer);
  }

  get isAuthenticated() {
    const t = this.accessToken();
    if (!t) return false;
    const exp = decodeExp(t);
    return exp ? Date.now() < exp * 1000 : true;
  }

  scheduleAutoLogout(token: string, skewMs = 15_000) {
    clearTimeout(this.logoutTimer);
    const exp = decodeExp(token);
    if (!exp) return;
    const ms = exp * 1000 - Date.now() - skewMs;
    if (ms > 0) this.logoutTimer = setTimeout(() => this.forceLogout(), ms);
    else this.forceLogout();
  }


  forceLogout() {
    this.clear();
    location.assign('/login?expired=1');
  }
}
