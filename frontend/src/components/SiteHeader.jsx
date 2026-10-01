import { Building2, Menu, UserRound } from 'lucide-react';
import { Button } from './ui';

export function SiteHeader() {
  return <header className="border-b border-line bg-white/90 backdrop-blur"><div className="mx-auto flex h-[72px] max-w-7xl items-center justify-between px-5 lg:px-8"><a href="/properties" className="flex items-center gap-2.5 text-ink"><span className="flex h-9 w-9 items-center justify-center rounded-xl bg-ink text-white"><Building2 size={18} /></span><span className="font-display text-lg font-bold tracking-tight">equity<span className="text-forest">house</span></span></a><nav className="hidden items-center gap-8 text-sm font-semibold text-slate-500 md:flex"><a href="/properties" className="text-ink">Marketplace</a><a href="/dashboard" className="hover:text-ink">Dashboard</a><a href="/wallet" className="hover:text-ink">Wallet</a></nav><div className="flex items-center gap-2"><Button variant="ghost" className="hidden sm:inline-flex">Sign in</Button><Button className="hidden sm:inline-flex"><UserRound size={15} /> Open account</Button><button className="rounded-lg p-2 text-ink md:hidden" aria-label="Open menu"><Menu size={21} /></button></div></div></header>;
}
