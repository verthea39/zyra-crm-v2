export default function ClientHubLoading() {
  return (
    <div className="p-4 sm:p-6 animate-pulse space-y-6">
      <div className="h-8 w-64 rounded bg-slate-200/70" />
      <div className="h-32 rounded-xl bg-slate-200/70" />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-40 rounded-xl bg-slate-200/70" />
        ))}
      </div>
    </div>
  );
}
