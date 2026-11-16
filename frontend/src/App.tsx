import { useState } from "react";
import LoginPage from "./components/LoginPage";
import Workspace from "./components/Workspace";
import { clearSession, loadSession, saveSession, type Session } from "./auth";
import "./App.css";

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

  // key: a new login gets a fresh workspace, so nothing leaks between users
  return (
    <Workspace key={session.token} session={session} onLogout={handleLogout} />
  );
}
