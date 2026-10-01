import { Building, Users, TrendingUp, Clock, ArrowUpRight } from 'lucide-react';
import { allProperties, users } from '../../data/adminData';
import { formatINR } from '../../lib/format';
import { Card, Button } from '../../components/ui';
import { PanelLayout } from '../../components/AdminSidebar';

export function AdminDashboard() {
  const liveProps = allProperties.filter((p) => p.status === 'LIVE');
  const fundedProps = allProperties.filter((p) => p.status === 'FUNDED');
  const holdingProps = allProperties.filter((p) => p.status === 'HOLDING');
  const pendingProps = allProperties.filter((p) => p.status === 'PENDING_APPROVAL');
  const investorCount = users.filter((u) => u.role === 'INVESTOR').length;

  const aum = [...liveProps, ...fundedProps, ...holdingProps].reduce((sum, p) => sum + p.valuation, 0);

  return (
    <PanelLayout role="admin">
      <div className="mb-8">
        <p className="mb-2 text-xs font-bold uppercase tracking-[0.18em] text-forest">Admin</p>
        <h1 className="font-display text-3xl font-bold tracking-tight text-ink sm:text-4xl">Platform overview</h1>
        <p className="mt-2 text-sm text-slate-500">Real-time snapshot of your real estate platform.</p>
      </div>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard icon={TrendingUp} label="Total AUM" value={formatINR(aum)} detail={`${liveProps.length + fundedProps.length + holdingProps.length} active properties`} accent="green" />
        <KpiCard icon={Building} label="Live Properties" value={liveProps.length} detail="Currently accepting investment" />
        <KpiCard icon={Users} label="Total Investors" value={investorCount} detail="Registered on platform" />
        <KpiCard icon={Clock} label="Pending Approvals" value={pendingProps.length} detail="Awaiting your review" accent={pendingProps.length > 0 ? 'amber' : undefined} />
      </section>

      <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <QuickLink title="Property Management" description="Review, approve, and manage all property listings." href="/admin/properties" icon={Building} />
        <QuickLink title="User Management" description="Manage investors, brokers, and admin accounts." href="/admin/users" icon={Users} />
        <QuickLink title="Marketplace" description="See the public marketplace view." href="/properties" icon={ArrowUpRight} />
      </div>
    </PanelLayout>
  );
}

function KpiCard({ icon: Icon, label, value, detail, accent }) {
  const bg = accent === 'green' ? 'bg-emerald-50 text-forest' : accent === 'amber' ? 'bg-amber-50 text-amber-600' : 'bg-slate-100 text-ink';
  return (
    <Card className="p-5">
      <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${bg}`}><Icon size={19} /></div>
      <p className="mt-5 text-xs font-bold uppercase tracking-wider text-slate-400">{label}</p>
      <p className="mt-1 font-display text-2xl font-bold text-ink">{value}</p>
      <p className="mt-2 text-xs font-semibold text-slate-500">{detail}</p>
    </Card>
  );
}

function QuickLink({ title, description, href, icon: Icon }) {
  return (
    <Card className="flex flex-col justify-between p-6 transition-shadow hover:shadow-soft">
      <div>
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-forest"><Icon size={19} /></div>
        <h3 className="mt-4 font-display text-lg font-bold text-ink">{title}</h3>
        <p className="mt-1 text-sm text-slate-500">{description}</p>
      </div>
      <Button variant="outline" className="mt-5 w-full" onClick={() => { window.location.href = href; }}>
        Open <ArrowUpRight size={15} />
      </Button>
    </Card>
  );
}
