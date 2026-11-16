import { useEffect, useRef, useState } from "react";
import { displayName, isDemo } from "../auth";

type UserMenuProps = {
  email: string;
  onLogout: () => void;
};

export default function UserMenu({ email, onLogout }: UserMenuProps) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const name = displayName(email);

  // Close when clicking outside the menu or pressing Escape
  useEffect(() => {
    if (!open) return;

    function handleClick(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node))
        setOpen(false);
    }
    function handleKey(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }

    document.addEventListener("mousedown", handleClick);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("keydown", handleKey);
    };
  }, [open]);

  return (
    <div className="user-menu" ref={menuRef}>
      {open && (
        <div className="user-popover">
          <p className="user-popover-label">
            Signed in as
            <strong>{isDemo(email) ? "a private demo account" : email}</strong>
          </p>
          <button type="button" className="logout" onClick={onLogout}>
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M15 4h3a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-3" />
              <path d="M10 17l-5-5 5-5" />
              <path d="M5 12h11" />
            </svg>
            Log out
          </button>
        </div>
      )}

      <button
        type="button"
        className="user-button"
        aria-expanded={open}
        onClick={() => setOpen(!open)}
      >
        <span className="avatar" aria-hidden="true">
          {name.charAt(0)}
        </span>
        <span className="user-text">
          <span className="user-name">{name}</span>
          <span className="user-email">
            {isDemo(email) ? "Demo account" : email}
          </span>
        </span>
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="m6 15 6-6 6 6" />
        </svg>
      </button>
    </div>
  );
}
