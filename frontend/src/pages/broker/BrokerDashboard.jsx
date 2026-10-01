import { Building, TrendingUp, Coins, ArrowUpRight, PlusCircle } from 'lucide-react';
import { allProperties } from '../../data/adminData';
import { formatINR } from '../../lib/format';
import { Card, Button } from '../../components/ui';
import { PanelLayout } from '../../components/AdminSidebar';

const BROKER_ID = 'broker-1';

export function BrokerDashboard() {
  const myProperties = allProperties.filter((p) => p.brokerId === BROKER_ID);
  const activeProps = myProperties.filter((p) => ['LIVE', 'FUNDED', 'HOLDING', 'SOLD'].includes(p.status));
  const totalRaised = activeProps.reduce((sum, p) => sum + (p.unitsSold * p.unitPrice), 0);
  const commission = Math.round(totalRaised * 0.02);

  return (
    <PanelLayout role="broker">
      <div className="mb-8">
        <p className="mb-2 text-xs font-bold uppercase tracking-[0.18em] text-forest">Broker</p>
        <h1 className="font-display text-3xl font-bold tracking-tight text-ink sm:text-4xl">Welcome back, Rajesh.</h1>
        <p className="mt-2 text-sm text-slate-500">Here's how your listings are performing.</p>
      </div>

      <section className="grid gap-4 sm:grid-cols-3">
        <KpiCard icon={Building} label="Properties Listed" value={myProperties.length} detail={`${activeProps.length} active`} />
        <KpiCard icon={TrendingUp} label="Total Raised" value={formatINR(totalRaised)} detail="From investor contributions" accent="green" />
        <KpiCard icon={Coins} label="Commission Earned" value={formatINR(commission)} detail="2% of total raised" accent="green" />
      </section>

      <div className="mt-8 grid gap-6 sm:grid-cols-2">
        <Card className="flex flex-col justify-between p-6 transition-shadow hover:shadow-soft">
          <div>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-forest"><Building size={19} /></div>
            <h3 className="mt-4 font-display text-lg font-bold text-ink">My Properties</h3>
            <p className="mt-1 text-sm text-slate-500">View and manage your property listings.</p>
          </div>
          <Button variant="outline" className="mt-5 w-full" onClick={() => { window.location.href = '/broker/properties'; }}>
            View listings <ArrowUpRight size={15} />
          </Button>
        </Card>
        <Card className="flex flex-col justify-between p-6 transition-shadow hover:shadow-soft">
          <div>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-forest"><PlusCircle size={19} /></div>
            <h3 className="mt-4 font-display text-lg font-bold text-ink">Create New Listing</h3>
            <p className="mt-1 text-sm text-slate-500">Start a new property listing with our step-by-step wizard.</p>
          </div>
          <Button className="mt-5 w-full" onClick={() => { window.location.href = '/broker/properties/new'; }}>
            <PlusCircle size={16} /> New property
          </Button>
        </Card>
      </div>
    </PanelLayout>
  );
}

function KpiCard({ icon: Icon, label, value, detail, accent }) {
  const bg = accent === 'green' ? 'bg-emerald-50 text-forest' : 'bg-slate-100 text-ink';
  return (
    <Card className="p-5">
      <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${bg}`}><Icon size={19} /></div>
      <p className="mt-5 text-xs font-bold uppercase tracking-wider text-slate-400">{label}</p>
      <p className="mt-1 font-display text-2xl font-bold text-ink">{value}</p>
      <p className="mt-2 text-xs font-semibold text-slate-500">{detail}</p>
    </Card>
  );
}
