import { useEffect, useMemo, useState } from 'react';
import { ChevronDown, Filter, Search, ShieldCheck, SlidersHorizontal } from 'lucide-react';
import { properties } from '../data/properties';
import { PropertyCard } from '../components/PropertyCard';
import { PropertyCardSkeleton } from '../components/Skeleton';
import { Button, Input, Select } from '../components/ui';

export function Marketplace() {
  const [loading, setLoading] = useState(true);
  const [city, setCity] = useState('All cities');
  const [type, setType] = useState('All types');
  const [status, setStatus] = useState('All status');
  const [query, setQuery] = useState('');

  useEffect(() => { const timer = setTimeout(() => setLoading(false), 500); return () => clearTimeout(timer); }, []);

  const filtered = useMemo(() => properties.filter((property) => {
    const matchesCity = city === 'All cities' || property.city === city;
    const matchesType = type === 'All types' || property.type === type;
    const matchesStatus = status === 'All status' || property.status === status;
    const matchesQuery = !query || `${property.title} ${property.city}`.toLowerCase().includes(query.toLowerCase());
    return matchesCity && matchesType && matchesStatus && matchesQuery;
  }), [city, type, status, query]);

  return <><SiteIntro /><main className="mx-auto max-w-7xl px-5 pb-20 lg:px-8"><div className="mb-7 flex flex-col gap-4 rounded-2xl border border-line bg-white p-4 shadow-sm lg:flex-row lg:items-center"><div className="relative flex-1"><Search size={17} className="absolute left-3.5 top-3.5 text-slate-400" /><Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search by property or city" className="pl-10" /></div><div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:flex"><Select value={city} onChange={(event) => setCity(event.target.value)}><option>All cities</option><option>Mumbai</option><option>Bengaluru</option><option>Alibaug</option><option>Gurugram</option></Select><Select value={type} onChange={(event) => setType(event.target.value)}><option>All types</option><option>APARTMENT</option><option>VILLA</option><option>COMMERCIAL</option></Select><Select value={status} onChange={(event) => setStatus(event.target.value)}><option>All status</option><option>LIVE</option><option>FUNDED</option></Select></div><Button variant="outline" className="hidden lg:inline-flex"><SlidersHorizontal size={16} /> Filters</Button></div><div className="mb-5 flex items-center justify-between"><p className="text-sm text-slate-500"><span className="font-bold text-ink">{filtered.length} opportunities</span> available to invest</p><button className="flex items-center gap-1 text-sm font-bold text-ink">Recommended <ChevronDown size={16} /></button></div>{loading ? <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">{[1, 2, 3].map((item) => <PropertyCardSkeleton key={item} />)}</div> : filtered.length ? <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">{filtered.map((property) => <PropertyCard key={property.id} property={property} />)}</div> : <div className="rounded-2xl border border-dashed border-line bg-white py-20 text-center"><Filter className="mx-auto text-slate-300" /><p className="mt-3 font-bold text-ink">No properties match these filters</p><p className="mt-1 text-sm text-slate-500">Try widening your search.</p></div>}</main></>;
}

function SiteIntro() { return <section className="bg-mist pb-8 pt-10 lg:pb-11 lg:pt-16"><div className="mx-auto max-w-7xl px-5 lg:px-8"><div className="max-w-2xl"><div className="mb-5 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.18em] text-forest"><ShieldCheck size={16} /> Curated real estate opportunities</div><h1 className="font-display text-4xl font-bold tracking-tight text-ink sm:text-5xl">Own a piece of what comes next.</h1><p className="mt-4 max-w-xl text-base leading-7 text-slate-600">Invest in professionally vetted properties from ₹10,000. Transparent terms, real assets, and a portfolio built for the long view.</p></div></div></section>; }
