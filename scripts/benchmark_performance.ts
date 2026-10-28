import net from "net";
import { performance } from "perf_hooks";
import { prisma } from "../lib/db/prisma";

interface BenchmarkMetric {
  name: string;
  runs: number[];
  avgMs: number;
  minMs: number;
  maxMs: number;
  p95Ms: number;
}

function calculateMetrics(name: string, runs: number[]): BenchmarkMetric {
  const sorted = [...runs].sort((a, b) => a - b);
  const sum = sorted.reduce((acc, v) => acc + v, 0);
  const avgMs = Math.round((sum / sorted.length) * 10) / 10;
  const minMs = Math.round(sorted[0] * 10) / 10;
  const maxMs = Math.round(sorted[sorted.length - 1] * 10) / 10;
  const p95Idx = Math.floor(sorted.length * 0.95);
  const p95Ms = Math.round(sorted[p95Idx] * 10) / 10;

  return { name, runs, avgMs, minMs, maxMs, p95Ms };
}

async function measureTcpPing(host: string, port: number, iterations = 5): Promise<number[]> {
  const times: number[] = [];
  for (let i = 0; i < iterations; i++) {
    const t0 = performance.now();
    await new Promise<void>((resolve, reject) => {
      const socket = net.createConnection({ host, port }, () => {
        times.push(performance.now() - t0);
        socket.end();
        resolve();
      });
      socket.on("error", reject);
      socket.setTimeout(5000, () => {
        socket.destroy();
        reject(new Error("TCP Timeout"));
      });
    });
  }
  return times;
}

async function runBenchmark() {
  console.log("=========================================================");
  console.log("   AyuTrace Comprehensive Latency & Performance Audit    ");
  console.log("=========================================================\n");

  const ITERATIONS = 10;

  // 1. Raw TCP Roundtrip to Supabase Pooler (Tokyo aws-0-ap-northeast-1)
  console.log("1. Measuring Raw Network TCP Latency to Supabase Pooler...");
  const tcpTimes = await measureTcpPing("aws-0-ap-northeast-1.pooler.supabase.com", 6543, 5);
  const tcpMetric = calculateMetrics("Raw TCP Ping (aws-0-ap-northeast-1)", tcpTimes);
  console.log(`   Avg: ${tcpMetric.avgMs}ms | Min: ${tcpMetric.minMs}ms | Max: ${tcpMetric.maxMs}ms\n`);

  // Warm-up query to initialize connection pool
  console.log("2. Warming up Prisma connection pool...");
  const warmT0 = performance.now();
  await prisma.$queryRaw`SELECT 1 as ping`;
  const warmupMs = Math.round(performance.now() - warmT0);
  console.log(`   Cold start handshake: ${warmupMs}ms\n`);

  // 3. Simple Raw Ping Query (SELECT 1)
  console.log(`3. Benchmarking Database Heartbeat Query (${ITERATIONS} runs)...`);
  const pingTimes: number[] = [];
  for (let i = 0; i < ITERATIONS; i++) {
    const t0 = performance.now();
    await prisma.$queryRaw`SELECT 1 as ping`;
    pingTimes.push(performance.now() - t0);
  }
  const pingMetric = calculateMetrics("Database Ping (SELECT 1)", pingTimes);

  // 4. Single Record Settings Query (prisma.appSettings.findUnique)
  console.log(`4. Benchmarking Settings Key Lookup (${ITERATIONS} runs)...`);
  const settingsTimes: number[] = [];
  for (let i = 0; i < ITERATIONS; i++) {
    const t0 = performance.now();
    await prisma.appSettings.findUnique({ where: { id: "default" } });
    settingsTimes.push(performance.now() - t0);
  }
  const settingsMetric = calculateMetrics("Settings Lookup", settingsTimes);

  // 5. Facilities & Locations Query (/api/facilities)
  console.log(`5. Benchmarking Facilities & Locations Query (${ITERATIONS} runs)...`);
  const facilitiesTimes: number[] = [];
  for (let i = 0; i < ITERATIONS; i++) {
    const t0 = performance.now();
    await prisma.facility.findMany({
      include: { locations: true },
      orderBy: { name: "asc" },
    });
    facilitiesTimes.push(performance.now() - t0);
  }
  const facilitiesMetric = calculateMetrics("Facilities Query (/api/facilities)", facilitiesTimes);

  // 6. Deep Medicine Inventory Query (/api/inventory)
  console.log(`6. Benchmarking Complex Inventory Query with Nested Relations (${ITERATIONS} runs)...`);
  const inventoryTimes: number[] = [];
  for (let i = 0; i < ITERATIONS; i++) {
    const t0 = performance.now();
    await prisma.medicineBatch.findMany({
      where: {
        status: { notIn: ["depleted"] },
      },
      include: {
        medicine: true,
        balances: {
          include: {
            location: {
              include: { facility: true },
            },
          },
        },
      },
      orderBy: { normalizedExpiryDate: "asc" },
    });
    inventoryTimes.push(performance.now() - t0);
  }
  const inventoryMetric = calculateMetrics("Complex Inventory Query (/api/inventory)", inventoryTimes);

  // 7. Full Multi-Query Dashboard KPI Aggregation (/api/stats)
  console.log(`7. Benchmarking Full Dashboard Multi-Query Aggregation (${ITERATIONS} runs)...`);
  const statsTimes: number[] = [];
  for (let i = 0; i < ITERATIONS; i++) {
    const t0 = performance.now();
    await Promise.all([
      prisma.medicine.findMany({ select: { id: true, category: true, dosageForm: true } }),
      prisma.medicineBatch.findMany({
        where: { status: { notIn: ["depleted"] } },
        include: {
          medicine: true,
          balances: {
            include: {
              location: {
                include: { facility: true },
              },
            },
          },
        },
        orderBy: { normalizedExpiryDate: "asc" },
      }),
      prisma.facility.findMany({
        include: {
          locations: {
            include: { balances: true },
          },
        },
      }),
      prisma.stockMovement.findMany({
        take: 12,
        orderBy: { createdAt: "desc" },
        include: {
          batch: { include: { medicine: true } },
          sourceLocation: { include: { facility: true } },
          destinationLocation: { include: { facility: true } },
        },
      }),
      prisma.appSettings.findUnique({ where: { id: "default" } }),
    ]);
    statsTimes.push(performance.now() - t0);
  }
  const statsMetric = calculateMetrics("Dashboard KPI Aggregate (/api/stats)", statsTimes);

  console.log("\n=========================================================");
  console.log("                     BENCHMARK RESULTS                   ");
  console.log("=========================================================");
  const allMetrics = [tcpMetric, pingMetric, settingsMetric, facilitiesMetric, inventoryMetric, statsMetric];
  console.table(
    allMetrics.map((m) => ({
      "Operation / Data Flow": m.name,
      "Average Latency": `${m.avgMs} ms`,
      "Min Latency": `${m.minMs} ms`,
      "P95 Latency": `${m.p95Ms} ms`,
      "Max Latency": `${m.maxMs} ms`,
    }))
  );

  await prisma.$disconnect();
}

runBenchmark().catch((err) => {
  console.error("Benchmark error:", err);
  process.exit(1);
});
