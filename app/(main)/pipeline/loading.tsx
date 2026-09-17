export default function PipelineLoading() {
  return (
    <div className="p-4 md:p-8 animate-pulse">
      <div className="h-8 w-56 rounded bg-slate-200/70 mb-6" />
      <div className="flex gap-4 overflow-x-hidden">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="min-w-[280px] h-96 rounded-xl bg-slate-200/50" />
        ))}
      </div>
    </div>
  );
}
