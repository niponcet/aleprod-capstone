export default function DashboardLoading() {
  return (
    <div className="flex-1 min-w-0 flex flex-col w-full animate-pulse">
      {/* Top Header Skeleton */}
      <header className="px-4 py-3 sm:px-8 flex flex-wrap items-center gap-3 border-b border-[var(--bd)] bg-[var(--sf)] sticky top-0 z-30">
        <div className="h-11 w-full max-w-[520px] rounded-xl bg-[var(--sf2)]" />
        <div className="flex-1" />
        <div className="w-11 h-11 rounded-xl bg-[var(--sf2)]" />
        <div className="w-11 h-11 rounded-xl bg-[var(--sf2)]" />
        <div className="w-36 h-11 rounded-xl bg-[var(--sf2)]" />
      </header>

      {/* Main Content Area Skeleton */}
      <main className="p-4 sm:p-6 lg:p-8 flex flex-col gap-6 w-full box-border flex-1">
        {/* Greeting Skeleton */}
        <div className="flex flex-col gap-2">
          <div className="h-8 w-64 rounded-lg bg-[var(--sf2)]" />
          <div className="h-4 w-44 rounded bg-[var(--sf2)]" />
        </div>

        {/* Hero: Montaje Activo Skeleton */}
        <section className="bg-[var(--sf)] border border-[var(--bd)] rounded-[20px] p-4 sm:p-6 flex flex-col lg:flex-row gap-6 items-stretch card-shadow">
          <div className="flex-1 flex flex-col justify-between gap-4 min-w-[280px]">
            <div className="flex gap-2">
              <div className="h-7 w-36 rounded-full bg-[var(--sf2)]" />
              <div className="h-7 w-32 rounded-full bg-[var(--sf2)]" />
            </div>
            <div className="flex flex-col gap-2">
              <div className="h-8 w-3/4 rounded-lg bg-[var(--sf2)]" />
              <div className="h-5 w-40 rounded bg-[var(--sf2)]" />
            </div>
            <div className="h-11 w-48 rounded-xl bg-[var(--sf2)]" />
          </div>

          <div className="w-full lg:flex-[1.4] grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="h-28 rounded-xl bg-[var(--sf2)] border border-[var(--bd)]" />
            <div className="h-28 rounded-xl bg-[var(--sf2)] border border-[var(--bd)]" />
            <div className="h-28 rounded-xl bg-[var(--sf2)] border border-[var(--bd)]" />
            <div className="h-28 rounded-xl bg-[var(--sf2)] border border-[var(--bd)]" />
          </div>
        </section>

        {/* 4 KPIs Row Skeleton */}
        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="h-32 rounded-[18px] bg-[var(--sf)] border border-[var(--bd)] card-shadow" />
          <div className="h-32 rounded-[18px] bg-[var(--sf)] border border-[var(--bd)] card-shadow" />
          <div className="h-32 rounded-[18px] bg-[var(--sf)] border border-[var(--bd)] card-shadow" />
          <div className="h-32 rounded-[18px] bg-[var(--sf)] border border-[var(--bd)] card-shadow" />
        </section>

        {/* Events + Side Column Skeleton */}
        <div className="flex flex-col lg:flex-row gap-6 items-start w-full">
          <div className="w-full lg:flex-1 h-96 rounded-[20px] bg-[var(--sf)] border border-[var(--bd)] card-shadow" />
          <div className="w-full lg:w-[380px] flex flex-col gap-6">
            <div className="h-44 rounded-[20px] bg-[var(--sf)] border border-[var(--bd)] card-shadow" />
            <div className="h-44 rounded-[20px] bg-[var(--sf)] border border-[var(--bd)] card-shadow" />
          </div>
        </div>
      </main>
    </div>
  );
}
