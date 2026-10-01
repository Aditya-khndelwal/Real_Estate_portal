import { useState } from 'react';
import { CheckCircle2, ShieldCheck } from 'lucide-react';
import { users as initialUsers } from '../../data/adminData';
import { Card, Button, Select, StatusBadge, Badge, Toggle } from '../../components/ui';
import { DataTable } from '../../components/DataTable';
import { PanelLayout } from '../../components/AdminSidebar';

const ROLES = ['ALL', 'ADMIN', 'BROKER', 'INVESTOR'];

const kycTone = { APPROVED: 'funded', PENDING: 'warning', REJECTED: 'danger', NOT_SUBMITTED: 'neutral' };

export function AdminUsers() {
  const [userList, setUserList] = useState(initialUsers);
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [successMsg, setSuccessMsg] = useState('');

  const filtered = roleFilter === 'ALL' ? userList : userList.filter((u) => u.role === roleFilter);

  const flash = (msg) => { setSuccessMsg(msg); setTimeout(() => setSuccessMsg(''), 3500); };

  const toggleActive = (id) => {
    setUserList((prev) => prev.map((u) => {
      if (u.id !== id) return u;
      const next = { ...u, isActive: !u.isActive };
      flash(`${next.name} has been ${next.isActive ? 'activated' : 'deactivated'}.`);
      return next;
    }));
  };

  const approveBroker = (id) => {
    setUserList((prev) => prev.map((u) => u.id === id ? { ...u, brokerApproved: true } : u));
    const user = userList.find((u) => u.id === id);
    flash(`${user.name} has been approved as a broker.`);
  };

  const columns = [
    {
      key: 'name', header: 'Name',
      render: (u) => (
        <div>
          <p className="font-bold text-ink">{u.name}</p>
          <p className="mt-0.5 text-xs text-slate-400">{u.email}</p>
        </div>
      )
    },
    { key: 'phone', header: 'Phone', render: (u) => <span className="text-slate-600">{u.phone}</span> },
    {
      key: 'role', header: 'Role',
      render: (u) => <Badge tone={u.role === 'ADMIN' ? 'info' : u.role === 'BROKER' ? 'live' : 'neutral'}>{u.role}</Badge>
    },
    {
      key: 'kyc', header: 'KYC Status',
      render: (u) => <Badge tone={kycTone[u.kyc.status] || 'neutral'}>{u.kyc.status.replace('_', ' ')}</Badge>
    },
    {
      key: 'createdAt', header: 'Joined',
      render: (u) => <span className="text-slate-500">{new Date(u.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
    },
    {
      key: 'isActive', header: 'Active',
      render: (u) => <Toggle checked={u.isActive} onChange={() => toggleActive(u.id)} disabled={u.role === 'ADMIN'} />
    },
    {
      key: 'actions', header: 'Actions',
      render: (u) => (
        <div>
          {u.role === 'BROKER' && !u.brokerApproved && (
            <Button variant="success" className="px-3 py-1.5 text-xs" onClick={() => approveBroker(u.id)}>
              <ShieldCheck size={14} /> Approve Broker
            </Button>
          )}
          {u.role === 'BROKER' && u.brokerApproved && (
            <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600"><CheckCircle2 size={14} /> Approved</span>
          )}
        </div>
      )
    }
  ];

  return (
    <PanelLayout role="admin">
      <div className="mb-8">
        <p className="mb-2 text-xs font-bold uppercase tracking-[0.18em] text-forest">Admin</p>
        <h1 className="font-display text-3xl font-bold tracking-tight text-ink sm:text-4xl">User Management</h1>
        <p className="mt-2 text-sm text-slate-500">Manage all users, toggle account access, and approve brokers.</p>
      </div>

      {successMsg && (
        <div className="mb-6 flex items-center gap-2 rounded-xl bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800">
          <CheckCircle2 size={17} />{successMsg}
        </div>
      )}

      <Card className="mb-6 flex flex-wrap items-center gap-4 p-4">
        <div className="flex items-center gap-2">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-400">Role</label>
          <Select className="w-48" value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}>
            {ROLES.map((r) => <option key={r} value={r}>{r === 'ALL' ? 'All Roles' : r}</option>)}
          </Select>
        </div>
        <span className="ml-auto text-xs font-semibold text-slate-400">{filtered.length} users</span>
      </Card>

      <Card className="overflow-hidden">
        <DataTable columns={columns} data={filtered} emptyMessage="No users match the selected filter." />
      </Card>
    </PanelLayout>
  );
}
