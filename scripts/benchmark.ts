/**
 * DB-layer concurrency benchmark for the Neon pool behind lib/prisma.ts.
 *
 * Runs directly against the database via the app's own Prisma singleton --
 * it deliberately skips HTTP/Vercel entirely. This app has no real
 * session/auth system (NextAuth env vars are placeholders, never wired up),
 * so there is no session cookie to authenticate an HTTP benchmark with; the
 * 401/307 responses from the earlier autocannon run were Vercel's own
 * deployment protection or edge redirects, not app-level auth. Measuring at
 * the Prisma layer instead answers the actual question asked -- how many
 * concurrent DB queries the Neon pool (connection_limit=10) can sustain --
 * without depending on network/auth variables or hammering production.
 *
 * Usage: npx tsx scripts/benchmark.ts
 */
import prisma from "../lib/prisma";

const CONCURRENCY_LEVELS = [1, 5, 10, 25, 50];
const QUERY_TAKE = 50;

type RunResult = {
  concurrency: number;
  succeeded: number;
  failed: number;
  latenciesMs: number[];
  errors: string[];
};

async function timedQuery(): Promise<number> {
  const start = performance.now();
  await prisma.caseFile.findMany({
    take: QUERY_TAKE,
    include: { client: { select: { name: true, type: true } } },
    orderBy: { createdAt: "desc" },
  });
  return performance.now() - start;
}

function percentile(sorted: number[], p: number): number {
  if (sorted.length === 0) return NaN;
  const idx = Math.min(sorted.length - 1, Math.ceil((p / 100) * sorted.length) - 1);
  return sorted[Math.max(0, idx)];
}

async function runLevel(concurrency: number): Promise<RunResult> {
  const tasks = Array.from({ length: concurrency }, () => timedQuery());
  const settled = await Promise.allSettled(tasks);

  const latenciesMs: number[] = [];
  const errors: string[] = [];
  for (const s of settled) {
    if (s.status === "fulfilled") latenciesMs.push(s.value);
    else errors.push(s.reason instanceof Error ? s.reason.message.split("\n")[0] : String(s.reason));
  }

  return { concurrency, succeeded: latenciesMs.length, failed: errors.length, latenciesMs, errors };
}

async function main() {
  console.log(`Benchmarking prisma.caseFile.findMany(take: ${QUERY_TAKE}) at increasing concurrency...\n`);

  let firstBreakAt: number | null = null;

  for (const concurrency of CONCURRENCY_LEVELS) {
    const result = await runLevel(concurrency);
    const sorted = [...result.latenciesMs].sort((a, b) => a - b);
    const p50 = percentile(sorted, 50);
    const p95 = percentile(sorted, 95);
    const p99 = percentile(sorted, 99);
    const errorRate = ((result.failed / concurrency) * 100).toFixed(1);

    console.log(
      `concurrency=${String(concurrency).padStart(3)}  ok=${result.succeeded}/${concurrency}  ` +
      `p50=${p50.toFixed(0)}ms  p95=${p95.toFixed(0)}ms  p99=${p99.toFixed(0)}ms  errRate=${errorRate}%`
    );

    if (result.failed > 0) {
      if (firstBreakAt === null) firstBreakAt = concurrency;
      const uniqueErrors = [...new Set(result.errors)];
      uniqueErrors.slice(0, 3).forEach((e) => console.log(`    error: ${e}`));
    }

    // Small cooldown between levels so one level's pool pressure doesn't
    // bleed into the next level's numbers.
    await new Promise((r) => setTimeout(r, 500));
  }

  console.log("");
  if (firstBreakAt !== null) {
    console.log(`First errors observed at concurrency=${firstBreakAt}.`);
  } else {
    console.log(`No failures observed up to concurrency=${CONCURRENCY_LEVELS[CONCURRENCY_LEVELS.length - 1]}.`);
  }

  await prisma.$disconnect();
}

main().catch((err) => {
  console.error("Benchmark crashed:", err);
  process.exit(1);
});
