import { useState } from 'react';
import { CheckCircle2, XCircle, DollarSign, Eye, X } from 'lucide-react';
import { allProperties, users } from '../../data/adminData';
import { formatINR, formatPercent } from '../../lib/format';
import { Card, Button, Select, StatusBadge, Modal, Textarea, Input } from '../../components/ui';
import { DataTable } from '../../components/DataTable';
import { PanelLayout } from '../../components/AdminSidebar';

const STATUSES = ['ALL', 'DRAFT', 'PENDING_APPROVAL', 'LIVE', 'FUNDED', 'HOLDING', 'SOLD', 'REJECTED', 'CANCELLED'];
const brokers = users.filter((u) => u.role === 'BROKER');

export function AdminProperties() {
  const [properties, setProperties] = useState(allProperties);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [brokerFilter, setBrokerFilter] = useState('ALL');
  const [rejectModal, setRejectModal] = useState(null);
  const [saleModal, setSaleModal] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [salePrice, setSalePrice] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const filtered = properties.filter((p) => {
    if (statusFilter !== 'ALL' && p.status !== statusFilter) return false;
    if (brokerFilter !== 'ALL' && p.brokerId !== brokerFilter) return false;
    return true;
  });

  const flash = (msg) => { setSuccessMsg(msg); setTimeout(() => setSuccessMsg(''), 3500); };

  const handleApprove = (id) => {
    setProperties((prev) => prev.map((p) => p.id === id ? { ...p, status: 'LIVE', approvedAt: new Date().toISOString(), listedAt: new Date().toISOString() } : p));
    flash('Property approved and is now LIVE.');
  };

  const handleReject = () => {
    if (rejectReason.length < 10) return;
    setProperties((prev) => prev.map((p) => p.id === rejectModal.id ? { ...p, status: 'REJECTED', rejectionReason: rejectReason } : p));
    setRejectModal(null);
    setRejectReason('');
    flash('Property has been rejected.');
  };

  const handleRecordSale = () => {
    const priceInPaise = Math.round(Number(salePrice) * 100);
    if (!priceInPaise || priceInPaise <= 0) return;
    setProperties((prev) => prev.map((p) => p.id === saleModal.id ? { ...p, status: 'SOLD', salePrice: priceInPaise, soldAt: new Date().toISOString() } : p));
    setSaleModal(null);
    setSalePrice('');
    flash('Sale recorded. Property status set to SOLD.');
  };

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
    {
      key: 'broker', header: 'Broker',
      render: (p) => {
        const broker = brokers.find((b) => b.id === p.brokerId);
        return <span className="text-slate-600">{broker ? broker.name : '—'}</span>;
      }
    },
    { key: 'type', header: 'Type', render: (p) => <span className="text-slate-600">{p.type}</span> },
    { key: 'valuation', header: 'Valuation', render: (p) => <span className="font-semibold text-ink">{formatINR(p.valuation)}</span> },
    {
      key: 'units', header: 'Units',
      render: (p) => <span className="text-slate-600">{p.unitsSold}/{p.totalUnits} <span className="text-xs text-slate-400">({formatPercent((p.unitsSold / p.totalUnits) * 100)})</span></span>
    },
    { key: 'status', header: 'Status', render: (p) => <StatusBadge status={p.status} /> },
    {
      key: 'actions', header: 'Actions',
      render: (p) => (
        <div className="flex items-center gap-2">
          {p.status === 'PENDING_APPROVAL' && (
            <>
              <Button variant="success" className="px-3 py-1.5 text-xs" onClick={() => handleApprove(p.id)}>
                <CheckCircle2 size={14} /> Approve
              </Button>
              <Button variant="danger" className="px-3 py-1.5 text-xs" onClick={() => { setRejectModal(p); setRejectReason(''); }}>
                <XCircle size={14} /> Reject
              </Button>
            </>
          )}
          {p.status === 'HOLDING' && (
            <Button variant="primary" className="px-3 py-1.5 text-xs" onClick={() => { setSaleModal(p); setSalePrice(''); }}>
              <DollarSign size={14} /> Record Sale
            </Button>
          )}
          <a href={`/properties/${p.id}`} className="inline-flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs font-bold text-slate-500 hover:bg-mist hover:text-ink">
            <Eye size={14} /> View
          </a>
        </div>
      )
    }
  ];

  return (
    <PanelLayout role="admin">
      <div className="mb-8">
        <p className="mb-2 text-xs font-bold uppercase tracking-[0.18em] text-forest">Admin</p>
        <h1 className="font-display text-3xl font-bold tracking-tight text-ink sm:text-4xl">Property Management</h1>
        <p className="mt-2 text-sm text-slate-500">Review, approve, and manage all property listings on the platform.</p>
      </div>

      {successMsg && (
        <div className="mb-6 flex items-center gap-2 rounded-xl bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800">
          <CheckCircle2 size={17} />{successMsg}
        </div>
      )}

      {/* Filters */}
      <Card className="mb-6 flex flex-wrap items-center gap-4 p-4">
        <div className="flex items-center gap-2">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Status</label>
          <Select className="w-48" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            {STATUSES.map((s) => <option key={s} value={s}>{s === 'ALL' ? 'All Statuses' : s.replace('_', ' ')}</option>)}
          </Select>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Broker</label>
          <Select className="w-48" value={brokerFilter} onChange={(e) => setBrokerFilter(e.target.value)}>
            <option value="ALL">All Brokers</option>
            {brokers.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
          </Select>
        </div>
        <span className="ml-auto text-xs font-semibold text-slate-400">{filtered.length} properties</span>
      </Card>

      <Card className="overflow-hidden">
        <DataTable columns={columns} data={filtered} emptyMessage="No properties match the selected filters." />
      </Card>

      {/* Reject Modal */}
      {rejectModal && (
        <Modal onClose={() => setRejectModal(null)}>
          <div className="flex items-start justify-between">
            <div>
              <h2 className="font-display text-xl font-bold text-ink">Reject Property</h2>
              <p className="mt-1 text-sm text-slate-500">Provide a reason for rejecting "{rejectModal.title}".</p>
            </div>
            <button onClick={() => setRejectModal(null)} className="rounded-lg p-2 text-slate-400 hover:bg-mist hover:text-ink"><X size={18} /></button>
          </div>
          <div className="mt-5">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Rejection Reason</label>
            <Textarea autoFocus className="mt-2 h-28" placeholder="Minimum 10 characters…" value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} />
            {rejectReason.length > 0 && rejectReason.length < 10 && <p className="mt-1 text-xs text-red-500">Reason must be at least 10 characters.</p>}
          </div>
          <div className="mt-5 flex gap-3">
            <Button variant="outline" className="flex-1" onClick={() => setRejectModal(null)}>Cancel</Button>
            <Button variant="danger" className="flex-1" disabled={rejectReason.length < 10} onClick={handleReject}>
              <XCircle size={16} /> Reject Property
            </Button>
          </div>
        </Modal>
      )}

      {/* Record Sale Modal */}
      {saleModal && (
        <Modal onClose={() => setSaleModal(null)}>
          <div className="flex items-start justify-between">
            <div>
              <h2 className="font-display text-xl font-bold text-ink">Record Sale</h2>
              <p className="mt-1 text-sm text-slate-500">Enter the final sale price for "{saleModal.title}".</p>
            </div>
            <button onClick={() => setSaleModal(null)} className="rounded-lg p-2 text-slate-400 hover:bg-mist hover:text-ink"><X size={18} /></button>
          </div>
          <div className="mt-5">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Sale Price (INR)</label>
            <div className="relative mt-2">
              <span className="absolute left-3.5 top-3 text-slate-500">₹</span>
              <Input autoFocus type="number" min="1" step="1" placeholder="e.g. 15,00,00,000" value={salePrice} onChange={(e) => setSalePrice(e.target.value)} className="pl-8 text-lg font-bold" />
            </div>
            <p className="mt-2 text-xs text-slate-400">Original valuation: {formatINR(saleModal.valuation)}</p>
          </div>
          <div className="mt-5 flex gap-3">
            <Button variant="outline" className="flex-1" onClick={() => setSaleModal(null)}>Cancel</Button>
            <Button className="flex-1" disabled={!salePrice || Number(salePrice) <= 0} onClick={handleRecordSale}>
              <DollarSign size={16} /> Record Sale
            </Button>
          </div>
        </Modal>
      )}
    </PanelLayout>
  );
}
