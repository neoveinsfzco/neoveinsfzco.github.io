// src/auth/tokenStorage.ts

export interface TokenPair {
  access: string;
  refresh: string;
}

const ACCESS_KEY = 'neo_qms_access_token';
const REFRESH_KEY = 'neo_qms_refresh_token';
const USERNAME_KEY = 'neo_qms_username';

// MUST match what you used in App.tsx
const SELECTED_BU_ID_KEY = 'neo_qms_selected_bu_id';
const SELECTED_BU_NAME_KEY = 'neo_qms_selected_bu_name';

export function saveTokens(tokens: TokenPair) {
  localStorage.setItem(ACCESS_KEY, tokens.access);
  localStorage.setItem(REFRESH_KEY, tokens.refresh);
}

export function getAccessToken(): string | null {
  return localStorage.getItem(ACCESS_KEY);
}

export function getRefreshToken(): string | null {
  return localStorage.getItem(REFRESH_KEY);
}

export function clearTokens() {
  localStorage.removeItem(ACCESS_KEY);
  localStorage.removeItem(REFRESH_KEY);
  localStorage.removeItem(USERNAME_KEY);

  // also clear BU selection when auth is gone
  localStorage.removeItem(SELECTED_BU_ID_KEY);
  localStorage.removeItem(SELECTED_BU_NAME_KEY);
}

export function saveUsername(username: string) {
  localStorage.setItem(USERNAME_KEY, username);
}

export function getUsername(): string | null {
  return localStorage.getItem(USERNAME_KEY);
}
