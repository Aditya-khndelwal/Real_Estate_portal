import { forwardRef } from 'react';

const cn = (...classes) => classes.filter(Boolean).join(' ');

export function Card({ className, children }) {
  return <div className={cn('rounded-2xl border border-line bg-white', className)}>{children}</div>;
}

export function Badge({ children, tone = 'neutral', className }) {
  const tones = {
    live: 'bg-blue-50 text-blue-700 ring-blue-100',
    funded: 'bg-emerald-50 text-emerald-700 ring-emerald-100',
    neutral: 'bg-slate-50 text-slate-600 ring-slate-100'
  };
  return <span className={cn('inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-[0.12em] ring-1', tones[tone] || tones.neutral, className)}>{children}</span>;
}

export const Button = forwardRef(function Button({ variant = 'primary', className, children, ...props }, ref) {
  const variants = {
    primary: 'bg-ink text-white shadow-sm hover:bg-forest',
    outline: 'border border-line bg-white text-ink hover:border-forest hover:text-forest',
    ghost: 'text-slate-600 hover:bg-mist hover:text-ink'
  };
  return <button ref={ref} className={cn('inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold transition-colors disabled:cursor-not-allowed disabled:opacity-50', variants[variant], className)} {...props}>{children}</button>;
});

export const Input = forwardRef(function Input({ className, ...props }, ref) {
  return <input ref={ref} className={cn('h-11 w-full rounded-xl border border-line bg-white px-3.5 text-sm text-ink outline-none transition placeholder:text-slate-400 focus:border-forest focus:ring-4 focus:ring-emerald-50', className)} {...props} />;
});

export function Select({ className, ...props }) {
  return <select className={cn('h-11 w-full appearance-none rounded-xl border border-line bg-white px-3.5 text-sm text-ink outline-none transition focus:border-forest focus:ring-4 focus:ring-emerald-50', className)} {...props} />;
}
