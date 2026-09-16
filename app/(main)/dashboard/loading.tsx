export default function DashboardLoading() {
  return (
    <div className="min-h-screen bg-[#F8FAFC] p-4 pb-24 md:p-8 md:pb-8 animate-pulse">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-24 rounded-xl bg-slate-200/70" />
          ))}
        </div>
        <div className="h-12 rounded-xl bg-slate-200/70" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 h-72 rounded-xl bg-slate-200/70" />
          <div className="flex flex-col gap-6">
            <div className="h-40 rounded-xl bg-slate-200/70" />
            <div className="h-40 rounded-xl bg-slate-200/70" />
          </div>
        </div>
      </div>
    </div>
  );
}
