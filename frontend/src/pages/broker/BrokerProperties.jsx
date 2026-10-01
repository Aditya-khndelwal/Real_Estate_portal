import { PlusCircle, Eye, Users } from 'lucide-react';
import { allProperties } from '../../data/adminData';
import { formatINR, formatPercent } from '../../lib/format';
import { Card, Button, StatusBadge } from '../../components/ui';
import { DataTable } from '../../components/DataTable';
import { PanelLayout } from '../../components/AdminSidebar';

const BROKER_ID = 'broker-1';

export function BrokerProperties() {
  const myProperties = allProperties.filter((p) => p.brokerId === BROKER_ID);

  const columns = [
    {
      key: 'title', header: 'Property',
      render: (p) => (
        <div>
          <p className="font-bold text-ink">{p.title}</p>
          <p className="mt-0.5 text-xs text-slate-400">{p.city}, {p.state}</p>
        </div>
      )
    },
    { key: 'type', header: 'Type', render: (p) => <span className="text-slate-600">{p.type}</span> },
    { key: 'valuation', header: 'Valuation', render: (p) => <span className="font-semibold text-ink">{formatINR(p.valuation)}</span> },
    { key: 'status', header: 'Status', render: (p) => <StatusBadge status={p.status} /> },
    {
      key: 'funding', header: 'Funding Progress',
      render: (p) => {
        const pct = p.totalUnits > 0 ? (p.unitsSold / p.totalUnits) * 100 : 0;
        return (
          <div className="w-32">
            <div className="flex items-center justify-between text-xs font-semibold">
              <span className="text-ink">{formatPercent(pct)}</span>
              <span className="text-slate-400">{p.unitsSold}/{p.totalUnits}</span>
            </div>
            <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-slate-100">
              <div className="h-full rounded-full bg-forest transition-all" style={{ width: `${Math.min(pct, 100)}%` }} />
            </div>
          </div>
        );
      }
    },
    {
      key: 'investors', header: 'Investors',
      render: (p) => {
        const count = p.unitsSold > 0 ? Math.max(1, Math.ceil(p.unitsSold / 3)) : 0;
        return (
          <span className="inline-flex items-center gap-1.5 text-slate-600">
            <Users size={14} className="text-slate-400" /> {count}
          </span>
        );
      }
    },
    {
      key: 'actions', header: 'Actions',
      render: (p) => (
        <a href={`/properties/${p.id}`} className="inline-flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs font-bold text-slate-500 hover:bg-mist hover:text-ink">
          <Eye size={14} /> View
        </a>
      )
    }
  ];

  return (
    <PanelLayout role="broker">
      <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="mb-2 text-xs font-bold uppercase tracking-[0.18em] text-forest">Broker</p>
          <h1 className="font-display text-3xl font-bold tracking-tight text-ink sm:text-4xl">My Properties</h1>
          <p className="mt-2 text-sm text-slate-500">Manage your property listings and track their status.</p>
        </div>
        <Button onClick={() => { window.location.href = '/broker/properties/new'; }}>
          <PlusCircle size={16} /> New Property
        </Button>
      </div>

      <Card className="overflow-hidden">
        <DataTable columns={columns} data={myProperties} emptyMessage="You haven't listed any properties yet." />
      </Card>
    </PanelLayout>
  );
}
