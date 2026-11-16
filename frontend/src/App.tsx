import { useState } from "react";
import LoginPage from "./components/LoginPage";
import {
  clearSession,
  displayName,
  loadSession,
  saveSession,
  type Session,
} from "./auth";

// Temporary: step 8.4d replaces the logged-in screen with the full app
export default function App() {
  const [session, setSession] = useState<Session | null>(() => loadSession());

  function handleLoggedIn(newSession: Session) {
    saveSession(newSession);
    setSession(newSession);
  }

  function handleLogout() {
    clearSession();
    setSession(null);
  }

  if (!session) {
    return <LoginPage onLoggedIn={handleLoggedIn} />;
  }

  return (
    <main style={{ padding: 40 }}>
      <p>Logged in as {displayName(session.email)}</p>
      <button onClick={handleLogout}>Log out</button>
    </main>
  );
}
