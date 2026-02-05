// Bridge between Clerk's async getToken() and the sync localStorage pattern
// used throughout the codebase for API calls.

let currentToken: string | null = null;

export function setClerkToken(token: string | null) {
  currentToken = token;
}

export function getClerkToken(): string | null {
  return currentToken;
}
