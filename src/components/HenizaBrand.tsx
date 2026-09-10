import React from 'react';

interface HenizaLogoProps {
  variant?: 'full' | 'compact' | 'badge' | 'icon';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showSlogan?: boolean;
  className?: string;
}

/**
 * HENIZA Official Visual Identity Component
 * - Geometric "H" emblem
 * - Wordmark legível em mobile e desktop (sem E estilizado em barras)
 * - Slogan oficial
 */
export const HenizaEmblem: React.FC<{ size?: number; className?: string }> = ({ size = 48, className = '' }) => {
  // Unique filter IDs avoid collisions when multiple emblems render
  const uid = React.useId().replace(/:/g, '');
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 160 160"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`shrink-0 ${className}`}
      aria-hidden="true"
    >
      <defs>
        <filter id={`heniza-green-glow-${uid}`} x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="5" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>

        <filter id={`heniza-node-glow-${uid}`} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="4" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>

        <linearGradient id={`titanium-bevel-${uid}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="25%" stopColor="#E2E8F0" />
          <stop offset="50%" stopColor="#94A3B8" />
          <stop offset="75%" stopColor="#CBD5E1" />
          <stop offset="100%" stopColor="#475569" />
        </linearGradient>

        <linearGradient id={`titanium-dark-${uid}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#94A3B8" />
          <stop offset="50%" stopColor="#475569" />
          <stop offset="100%" stopColor="#1E293B" />
        </linearGradient>

        <linearGradient id={`neon-green-${uid}`} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#00FF66" />
          <stop offset="50%" stopColor="#10E575" />
          <stop offset="100%" stopColor="#059669" />
        </linearGradient>

        <radialGradient id={`node-core-${uid}`} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="40%" stopColor="#00FF66" />
          <stop offset="100%" stopColor="#059669" />
        </radialGradient>
      </defs>

      <g opacity="0.6" stroke="#00FF66" strokeWidth="1.2" strokeLinecap="round">
        <path d="M 40 80 L 12 80 M 36 62 L 18 62 L 8 52 M 38 98 L 22 98 L 10 110" />
        <circle cx="8" cy="52" r="2" fill="#00FF66" />
        <circle cx="10" cy="110" r="2" fill="#00FF66" />
        <circle cx="12" cy="80" r="2.5" fill="#00FF66" />
        <path d="M 120 80 L 148 80 M 124 62 L 142 62 L 152 52 M 122 98 L 138 98 L 150 110" />
        <circle cx="152" cy="52" r="2" fill="#00FF66" />
        <circle cx="150" cy="110" r="2" fill="#00FF66" />
        <circle cx="148" cy="80" r="2.5" fill="#00FF66" />
      </g>

      <circle cx="80" cy="80" r="62" stroke="#00FF66" strokeWidth="0.8" opacity="0.25" strokeDasharray="4 6" />
      <circle cx="80" cy="80" r="50" stroke="#00FF66" strokeWidth="0.5" opacity="0.15" />

      <g filter={`url(#heniza-green-glow-${uid})`}>
        <path
          d="M 46 32 L 68 32 L 68 86 L 56 94 L 46 86 Z"
          fill="none"
          stroke="#00FF66"
          strokeWidth="3.5"
          strokeLinejoin="round"
        />
        <path
          d="M 46 74 L 56 66 L 68 74 L 68 128 L 46 128 Z"
          fill="none"
          stroke="#00FF66"
          strokeWidth="3.5"
          strokeLinejoin="round"
        />
        <path
          d="M 48 34 L 66 34 L 66 84 L 56 92 L 48 86 Z M 48 76 L 56 68 L 66 74 L 66 126 L 48 126 Z"
          fill={`url(#neon-green-${uid})`}
          opacity="0.28"
        />
        <path d="M 52 42 L 52 64 M 60 48 L 60 76 M 52 98 L 52 118 M 60 102 L 60 120" stroke="#00FF66" strokeWidth="1" opacity="0.8" />
        <circle cx="52" cy="42" r="1.5" fill="#FFFFFF" />
        <circle cx="60" cy="76" r="1.5" fill="#FFFFFF" />
        <circle cx="52" cy="118" r="1.5" fill="#FFFFFF" />
      </g>

      <g filter={`url(#heniza-green-glow-${uid})`}>
        <path
          d="M 58 84 L 102 76 L 104 84 L 60 92 Z"
          fill={`url(#titanium-bevel-${uid})`}
          stroke="#00FF66"
          strokeWidth="1.5"
        />
        <circle cx="80" cy="84" r="9" fill="#0C130F" stroke="#00FF66" strokeWidth="2.5" filter={`url(#heniza-node-glow-${uid})`} />
        <circle cx="80" cy="84" r="5.5" fill={`url(#node-core-${uid})`} />
        <circle cx="80" cy="84" r="2" fill="#FFFFFF" />
      </g>

      <g>
        <path
          d="M 94 32 L 114 32 L 114 128 L 94 128 L 94 76 L 104 68 L 104 42 L 94 36 Z"
          fill={`url(#titanium-bevel-${uid})`}
          stroke="#CBD5E1"
          strokeWidth="1.5"
        />
        <path
          d="M 104 32 L 114 32 L 114 128 L 108 128 L 108 44 Z"
          fill={`url(#titanium-dark-${uid})`}
          opacity="0.45"
        />
        <path d="M 94 32 L 94 128" stroke="#00FF66" strokeWidth="1" opacity="0.6" />
        <path d="M 102 96 L 102 118 M 98 104 L 98 114" stroke="#64748B" strokeWidth="1" />
        <circle cx="102" cy="96" r="1.2" fill="#00FF66" />
      </g>
    </svg>
  );
};

export const HenizaCircularBadge: React.FC<{ size?: number; className?: string }> = ({ size = 80, className = '' }) => {
  return (
    <div
      className={`relative rounded-full flex items-center justify-center p-1 shrink-0 ${className}`}
      style={{
        width: size,
        height: size,
        background: 'radial-gradient(circle, #0F1A13 40%, #060A08 100%)',
        boxShadow: '0 0 20px -2px rgba(0, 255, 102, 0.35), inset 0 0 15px rgba(0, 255, 102, 0.2)',
        border: '2px solid rgba(203, 213, 225, 0.4)',
      }}
    >
      <div
        className="absolute inset-0 rounded-full pointer-events-none"
        style={{
          border: '1.5px solid rgba(0, 255, 102, 0.5)',
          boxShadow: 'inset 0 0 8px rgba(0, 255, 102, 0.3)',
        }}
      />
      <HenizaEmblem size={size * 0.72} />
    </div>
  );
};

/**
 * Wordmark legível: letras reais "HENIZA".
 * - Mobile: texto sólido (sem bg-clip-text, que quebra em vários Android)
 * - Desktop: leve gradiente, com E em verde neon
 */
export const HenizaWordmark: React.FC<{ size?: 'sm' | 'md' | 'lg' | 'xl'; className?: string }> = ({
  size = 'md',
  className = '',
}) => {
  const sizeClasses = {
    sm: 'text-sm tracking-[0.18em]',
    md: 'text-lg tracking-[0.22em]',
    lg: 'text-2xl tracking-[0.24em]',
    xl: 'text-4xl tracking-[0.28em]',
  }[size];

  return (
    <span
      className={`font-black font-mono select-none inline-flex items-baseline ${sizeClasses} ${className}`}
      aria-label="HENIZA"
      title="HENIZA"
    >
      {/* Mobile: solid readable letters */}
      <span className="sm:hidden text-white">
        HEN<span className="text-tech-destaque">I</span>ZA
      </span>

      {/* Desktop+: H N I Z A em titânio + E verde legível */}
      <span className="hidden sm:inline-flex items-baseline">
        <span className="text-slate-100">H</span>
        <span className="text-tech-destaque drop-shadow-[0_0_8px_rgba(0,255,102,0.55)]">E</span>
        <span className="text-slate-100">N</span>
        <span className="text-slate-100">I</span>
        <span className="text-slate-100">Z</span>
        <span className="text-slate-100">A</span>
      </span>
    </span>
  );
};

export default function HenizaBrand({
  variant = 'full',
  size = 'md',
  showSlogan = true,
  className = '',
}: HenizaLogoProps) {
  if (variant === 'icon') {
    return <HenizaEmblem size={size === 'sm' ? 28 : size === 'md' ? 36 : 48} className={className} />;
  }

  if (variant === 'badge') {
    return (
      <div className={`flex flex-col items-center text-center ${className}`}>
        <HenizaCircularBadge size={size === 'sm' ? 56 : size === 'md' ? 76 : 96} />
        <div className="mt-2">
          <HenizaWordmark size={size === 'sm' ? 'sm' : 'md'} />
        </div>
        {showSlogan && (
          <p className="text-[8px] sm:text-[9px] tracking-[0.18em] text-tech-destaque uppercase font-bold mt-1 max-w-xs drop-shadow-[0_0_6px_rgba(0,255,102,0.4)]">
            TECNOLOGIA QUE CONECTA. SOLUÇÕES QUE TRANSFORMAM.
          </p>
        )}
      </div>
    );
  }

  if (variant === 'compact') {
    return (
      <div className={`flex items-center gap-2.5 ${className}`}>
        <HenizaEmblem size={size === 'sm' ? 28 : size === 'md' ? 36 : 44} />
        <div>
          <div className="flex items-center gap-1.5">
            <HenizaWordmark size={size === 'sm' ? 'sm' : 'md'} />
            <span className="text-[10px] font-black tracking-wider text-tech-destaque bg-tech-destaque/15 px-1.5 py-0.5 rounded border border-tech-destaque/30">
              TECH
            </span>
          </div>
          {showSlogan && (
            <p className="text-[7.5px] tracking-[0.16em] text-slate-400 uppercase font-semibold mt-0.5 font-mono hidden sm:block">
              TECNOLOGIA QUE CONECTA • SOLUÇÕES QUE TRANSFORMAM
            </p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={`flex flex-col sm:flex-row items-center gap-3 ${className}`}>
      <div className="relative">
        <HenizaEmblem size={size === 'sm' ? 36 : size === 'md' ? 48 : 64} />
        <div className="absolute inset-0 bg-tech-destaque/20 blur-xl rounded-full -z-10" />
      </div>

      <div className="text-center sm:text-left">
        <div className="flex items-center justify-center sm:justify-start gap-2">
          <HenizaWordmark size={size} />
          <span className="text-[11px] font-black tracking-widest text-tech-destaque bg-tech-destaque/15 px-2 py-0.5 rounded border border-tech-destaque/40 shadow-[0_0_10px_rgba(0,255,102,0.25)]">
            TECH
          </span>
          <span className="text-[9px] font-bold text-slate-400 border border-slate-700/60 px-1.5 py-0.5 rounded bg-slate-900/60 font-mono hidden md:inline">
            HOLDING HENIZA
          </span>
        </div>

        {showSlogan && (
          <div className="mt-1 flex items-center justify-center sm:justify-start gap-2">
            <span className="h-[1px] w-3 bg-tech-destaque/40 hidden sm:inline-block" />
            <p className="text-[8px] sm:text-[9.5px] tracking-[0.2em] text-slate-300 uppercase font-bold drop-shadow-[0_0_8px_rgba(0,255,102,0.3)] hidden sm:block">
              TECNOLOGIA QUE CONECTA. SOLUÇÕES QUE TRANSFORMAM.
            </p>
            <span className="h-[1px] w-3 bg-tech-destaque/40 hidden sm:inline-block" />
          </div>
        )}
      </div>
    </div>
  );
}
