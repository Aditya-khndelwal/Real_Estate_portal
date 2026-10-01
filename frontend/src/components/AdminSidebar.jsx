import { Building2, LayoutDashboard, Building, Users, PlusCircle, BarChart3, ChevronLeft } from 'lucide-react';

const cn = (...classes) => classes.filter(Boolean).join(' ');

const adminLinks = [
  { href: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/properties', label: 'Properties', icon: Building },
  { href: '/admin/users', label: 'Users', icon: Users }
];

const brokerLinks = [
  { href: '/broker/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/broker/properties', label: 'My Properties', icon: Building },
  { href: '/broker/properties/new', label: 'New Listing', icon: PlusCircle }
];

export function AdminSidebar({ role = 'admin' }) {
  const path = window.location.pathname;
  const links = role === 'admin' ? adminLinks : brokerLinks;
  const panelLabel = role === 'admin' ? 'Admin Panel' : 'Broker Panel';

  return (
    <aside className="fixed inset-y-0 left-0 z-30 flex w-64 flex-col border-r border-line bg-white">
      {/* Logo */}
      <div className="flex h-[72px] items-center gap-2.5 border-b border-line px-6">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-ink text-white">
          <Building2 size={18} />
        </span>
        <span className="font-display text-lg font-bold tracking-tight text-ink">
          zameen<span className="text-forest">Daar</span><span className="text-slate-400">.com</span>
        </span>
      </div>

      {/* Role label */}
      <div className="px-6 pt-6 pb-2">
        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">{panelLabel}</p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 px-3">
        {links.map(({ href, label, icon: Icon }) => {
          const active = path === href || (href !== '/broker/properties/new' && href !== '/admin/dashboard' && href !== '/broker/dashboard' && path.startsWith(href));
          return (
            <a
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors',
                active ? 'bg-emerald-50 text-forest' : 'text-slate-500 hover:bg-mist hover:text-ink'
              )}
            >
              <Icon size={18} />
              {label}
            </a>
          );
        })}
      </nav>

      {/* Back to site */}
      <div className="border-t border-line p-4">
        <a href="/properties" className="flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-semibold text-slate-500 hover:bg-mist hover:text-ink">
          <ChevronLeft size={16} />
          Back to Marketplace
        </a>
      </div>
    </aside>
  );
}

export function PanelLayout({ role = 'admin', children }) {
  return (
    <div className="min-h-screen bg-mist">
      <AdminSidebar role={role} />
      <main className="ml-64 px-8 pb-20 pt-10">{children}</main>
    </div>
  );
}
