const SESSION_KEY = "wayam.session";
const GMAIL_PATTERN = /^[a-z0-9._%+-]+@gmail\.com$/i;

export function isValidLoginEmail(email: string): boolean {
  return GMAIL_PATTERN.test(email.trim());
}

export function isValidLoginPassword(password: string): boolean {
  return password.trim().length > 0;
}

export function login(email: string, password: string): { ok: true } | { ok: false; error: string } {
  if (!isValidLoginEmail(email)) {
    return { ok: false, error: "Enter a valid Gmail address." };
  }
  if (!isValidLoginPassword(password)) {
    return { ok: false, error: "Password is required." };
  }

  if (typeof window !== "undefined") {
    try {
      window.localStorage.setItem(SESSION_KEY, JSON.stringify({ email, loggedInAt: Date.now() }));
    } catch {
      return { ok: false, error: "Could not start a session. Storage may be disabled." };
    }
  }

  return { ok: true };
}

export function logout(): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(SESSION_KEY);
}

export function isLoggedIn(): boolean {
  if (typeof window === "undefined") return false;
  return window.localStorage.getItem(SESSION_KEY) !== null;
}
