const TOKEN_KEY = "prelegal_token"
const EMAIL_KEY = "prelegal_email"

export function getToken(): string | null {
  if (typeof window === "undefined") return null
  return localStorage.getItem(TOKEN_KEY)
}

export function setToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token)
}

export function clearToken(): void {
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(EMAIL_KEY)
}

export function getEmail(): string | null {
  if (typeof window === "undefined") return null
  return localStorage.getItem(EMAIL_KEY)
}

export function setEmail(email: string): void {
  localStorage.setItem(EMAIL_KEY, email)
}

export function authHeader(): Record<string, string> {
  const token = getToken()
  return token ? { Authorization: `Bearer ${token}` } : {}
}
