export default function DocumentsLoading() {
  return (
    <div className="px-4 py-3 sm:px-6 sm:py-6 animate-pulse">
      <div className="flex flex-col gap-4">
        <div className="flex flex-col items-start gap-3 md:flex-row md:items-center md:justify-between">
          <div className="h-8 w-40 rounded bg-slate-200/70" />
          <div className="h-11 w-full md:w-40 rounded-xl bg-slate-200/70" />
        </div>
        <div className="flex gap-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-10 w-24 rounded-full bg-slate-200/70" />
          ))}
        </div>
        <div className="flex flex-col gap-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-16 rounded-xl bg-slate-200/70" />
          ))}
        </div>
      </div>
    </div>
  );
}
