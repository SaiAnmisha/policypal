export type Session = {
  token: string;
  email: string;
  expiresAt: string;
};

const STORAGE_KEY = "policypal.session";
const DEMO_DOMAIN = "@demo.policypal";

export function loadSession(): Session | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;

    const session = JSON.parse(raw) as Session;
    if (new Date(session.expiresAt).getTime() <= Date.now()) {
      localStorage.removeItem(STORAGE_KEY);
      return null;
    }
    return session;
  } catch {
    return null;
  }
}

export function saveSession(session: Session) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
}

export function clearSession() {
  localStorage.removeItem(STORAGE_KEY);
}

export function isDemo(email: string) {
  return email.endsWith(DEMO_DOMAIN);
}

// "anmisha@example.com" becomes "Anmisha"
export function displayName(email: string) {
  if (isDemo(email)) return "Demo user";
  const name = email.split("@")[0];
  return name.charAt(0).toUpperCase() + name.slice(1);
}
