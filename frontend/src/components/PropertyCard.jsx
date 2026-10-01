import { ArrowUpRight, MapPin } from 'lucide-react';
import { formatINR, formatPercent } from '../lib/format';
import { Badge, Button, Card } from './ui';

export function PropertyCard({ property }) {
  const progress = Math.min((property.unitsSold / property.totalUnits) * 100, 100);
  const tone = property.status === 'FUNDED' ? 'funded' : 'live';

  return (
    <Card className="group overflow-hidden shadow-[0_1px_0_rgba(16,42,42,0.03)] transition duration-300 hover:-translate-y-1 hover:shadow-soft">
      <a href={`/properties/${property.id}`} className="relative block aspect-[4/3] overflow-hidden bg-slate-100">
        <img src={property.images[0]} alt={property.title} className="h-full w-full object-cover transition duration-700 group-hover:scale-105" />
        <div className="absolute inset-x-0 top-0 flex items-center justify-between p-4">
          <Badge tone={tone}>{property.status}</Badge>
          <span className="rounded-full bg-white/90 px-3 py-1.5 text-xs font-bold text-ink backdrop-blur">{property.type}</span>
        </div>
      </a>
      <div className="p-5">
        <div className="mb-5">
          <a href={`/properties/${property.id}`} className="font-display text-lg font-bold text-ink hover:text-forest">{property.title}</a>
          <p className="mt-1.5 flex items-center gap-1.5 text-sm text-slate-500"><MapPin size={14} className="text-forest" />{property.city}, {property.state}</p>
        </div>
        <div className="grid grid-cols-2 gap-3 border-y border-line py-4">
          <div><p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Valuation</p><p className="mt-1 text-sm font-bold text-ink">{formatINR(property.valuation)}</p></div>
          <div><p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Unit price</p><p className="mt-1 text-sm font-bold text-ink">{formatINR(property.unitPrice)}</p></div>
        </div>
        <div className="mt-4">
          <div className="mb-2 flex items-center justify-between text-xs"><span className="font-bold text-ink">{formatPercent(progress)} funded</span><span className="text-slate-500">{property.unitsSold}/{property.totalUnits} units</span></div>
          <div className="h-2 overflow-hidden rounded-full bg-emerald-50"><div className="h-full rounded-full bg-forest transition-all" style={{ width: `${progress}%` }} /></div>
        </div>
        <Button className="mt-5 w-full" onClick={(event) => { event.preventDefault(); window.location.href = `/properties/${property.id}`; }}>Invest <ArrowUpRight size={16} /></Button>
      </div>
    </Card>
  );
}
