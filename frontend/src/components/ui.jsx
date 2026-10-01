import { forwardRef, useState } from 'react';

const cn = (...classes) => classes.filter(Boolean).join(' ');

export function Card({ className, children }) {
  return <div className={cn('rounded-2xl border border-line bg-white', className)}>{children}</div>;
}

export function Badge({ children, tone = 'neutral', className }) {
  const tones = {
    live: 'bg-blue-50 text-blue-700 ring-blue-100',
    funded: 'bg-emerald-50 text-emerald-700 ring-emerald-100',
    neutral: 'bg-slate-50 text-slate-600 ring-slate-100',
    warning: 'bg-amber-50 text-amber-700 ring-amber-100',
    danger: 'bg-red-50 text-red-700 ring-red-100',
    info: 'bg-indigo-50 text-indigo-700 ring-indigo-100'
  };
  return <span className={cn('inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.12em] ring-1', tones[tone] || tones.neutral, className)}>{children}</span>;
}

export const Button = forwardRef(function Button({ variant = 'primary', className, children, ...props }, ref) {
  const variants = {
    primary: 'bg-ink text-white shadow-sm hover:bg-forest',
    outline: 'border border-line bg-white text-ink hover:border-forest hover:text-forest',
    ghost: 'text-slate-600 hover:bg-mist hover:text-ink',
    danger: 'bg-red-600 text-white shadow-sm hover:bg-red-700',
    success: 'bg-emerald-600 text-white shadow-sm hover:bg-emerald-700'
  };
  return <button ref={ref} className={cn('inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold transition-colors disabled:cursor-not-allowed disabled:opacity-50', variants[variant], className)} {...props}>{children}</button>;
});

export const Input = forwardRef(function Input({ className, ...props }, ref) {
  return <input ref={ref} className={cn('h-11 w-full rounded-xl border border-line bg-white px-3.5 text-sm text-ink outline-none transition placeholder:text-slate-400 focus:border-forest focus:ring-4 focus:ring-emerald-50', className)} {...props} />;
});

export function Select({ className, ...props }) {
  return <select className={cn('h-11 w-full appearance-none rounded-xl border border-line bg-white px-3.5 text-sm text-ink outline-none transition focus:border-forest focus:ring-4 focus:ring-emerald-50', className)} {...props} />;
}

export const Textarea = forwardRef(function Textarea({ className, ...props }, ref) {
  return <textarea ref={ref} className={cn('w-full rounded-xl border border-line bg-white px-3.5 py-3 text-sm text-ink outline-none transition placeholder:text-slate-400 focus:border-forest focus:ring-4 focus:ring-emerald-50 resize-none', className)} {...props} />;
});

export function Modal({ children, onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-5 backdrop-blur-sm" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <Card className="w-full max-w-md p-6 shadow-2xl">{children}</Card>
    </div>
  );
}

export function Toggle({ checked, onChange, disabled }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={cn(
        'relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none focus:ring-4 focus:ring-emerald-50 disabled:cursor-not-allowed disabled:opacity-50',
        checked ? 'bg-forest' : 'bg-slate-200'
      )}
    >
      <span className={cn('pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200', checked ? 'translate-x-5' : 'translate-x-0')} />
    </button>
  );
}

export function Tabs({ tabs, active, onChange }) {
  return (
    <div className="flex gap-1 rounded-xl bg-mist p-1">
      {tabs.map((tab) => (
        <button
          key={tab.value}
          onClick={() => onChange(tab.value)}
          className={cn(
            'rounded-lg px-4 py-2 text-sm font-bold transition-colors',
            active === tab.value ? 'bg-white text-ink shadow-sm' : 'text-slate-500 hover:text-ink'
          )}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}

/** Map property status to Badge tone */
export function StatusBadge({ status }) {
  const map = {
    DRAFT: 'info', PENDING_APPROVAL: 'warning', LIVE: 'live', FUNDED: 'funded',
    HOLDING: 'info', SOLD: 'neutral', REJECTED: 'danger', CANCELLED: 'danger',
    ACTIVE: 'live', EXITED: 'neutral', REFUNDED: 'danger'
  };
  return <Badge tone={map[status] || 'neutral'}>{status.replace('_', ' ')}</Badge>;
}
