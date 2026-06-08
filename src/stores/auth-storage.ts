const ACCESS_TOKEN_KEY = 'quickframework.accessToken';
const REFRESH_TOKEN_KEY = 'quickframework.refreshToken';

export function readAccessToken() {
  return window.localStorage.getItem(ACCESS_TOKEN_KEY);
}

export function readRefreshToken() {
  return window.localStorage.getItem(REFRESH_TOKEN_KEY);
}

export function writeAccessToken(token: string) {
  window.localStorage.setItem(ACCESS_TOKEN_KEY, token);
}

export function writeRefreshToken(token: string) {
  window.localStorage.setItem(REFRESH_TOKEN_KEY, token);
}

export function clearAccessToken() {
  window.localStorage.removeItem(ACCESS_TOKEN_KEY);
}

export function clearRefreshToken() {
  window.localStorage.removeItem(REFRESH_TOKEN_KEY);
}
