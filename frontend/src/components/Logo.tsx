type LogoProps = {
  size?: number;
};

export default function Logo({ size = 32 }: LogoProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" aria-hidden="true">
      <rect width="40" height="40" rx="10" fill="#0D9488" />
      <path
        d="M13 8.5h10l6.5 6.5v15a2 2 0 0 1-2 2H13a2 2 0 0 1-2-2v-19.5a2 2 0 0 1 2-2z"
        fill="#FFFFFF"
      />
      <path d="M23 8.5V15h6.5" fill="#BFE9E3" />
      <rect x="14.5" y="18" width="9" height="1.8" rx="0.9" fill="#94A3B8" />
      <rect x="14.5" y="22" width="6" height="1.8" rx="0.9" fill="#94A3B8" />
      <circle cx="27.5" cy="28.5" r="6.2" fill="#0F1B33" />
      <path
        d="m24.8 28.6 1.9 1.9 3.6-3.8"
        stroke="#FFFFFF"
        strokeWidth="1.9"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

type BrandProps = {
  size?: number;
  onDark?: boolean;
};

// Logo plus the PolicyPal name, used on the login page and sidebar
export function Brand({ size = 32, onDark = false }: BrandProps) {
  return (
    <span className={`brand ${onDark ? "brand-on-dark" : ""}`}>
      <Logo size={size} />
      <span className="brand-name">
        Policy<span className="brand-accent">Pal</span>
      </span>
    </span>
  );
}
