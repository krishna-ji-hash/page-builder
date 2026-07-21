import { NextResponse } from 'next/server';
import { AUTH_NO_STORE_HEADERS } from './authNoStoreHeaders.js';

export { AUTH_NO_STORE_HEADERS };

export function authOk(data, status = 200) {
  return NextResponse.json(data, { status, headers: AUTH_NO_STORE_HEADERS });
}

export function authFail(message, status = 400, details) {
  return NextResponse.json(
    {
      error: message,
      ...(details ? { details } : {}),
    },
    { status, headers: AUTH_NO_STORE_HEADERS }
  );
}

export function applyAuthNoStoreHeaders(response) {
  if (!response?.headers) return response;
  for (const [key, value] of Object.entries(AUTH_NO_STORE_HEADERS)) {
    response.headers.set(key, value);
  }
  return response;
}
