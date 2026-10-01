export function Skeleton({ className = '' }) {
  return <div className={`animate-pulse rounded-xl bg-slate-100 ${className}`} />;
}

export function PropertyCardSkeleton() {
  return <div className="overflow-hidden rounded-2xl border border-line bg-white"><Skeleton className="aspect-[4/3] rounded-none" /><div className="space-y-4 p-5"><Skeleton className="h-5 w-3/4" /><Skeleton className="h-4 w-1/2" /><div className="grid grid-cols-2 gap-3"><Skeleton className="h-12" /><Skeleton className="h-12" /></div><Skeleton className="h-10" /></div></div>;
}
