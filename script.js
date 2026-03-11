const input = {
  cluster: "demo-cluster",
  sourceNote: "Synthetic workload traces modeled after overprovisioned Kubernetes services.",
  workloads: [
    {
      name: "api-gateway",
      namespace: "platform",
      currentCPUReqMil: 1000,
      currentMemReqMiB: 1024,
      snapshots: [210, 260, 290, 340, 370, 410].map((cpu, index) => ({
        timestamp: `2026-03-10T0${index + 9}:00:00Z`,
        cpuUsageMil: cpu,
        memUsageMiB: [380, 410, 430, 455, 470, 500][index]
      }))
    },
    {
      name: "batch-worker",
      namespace: "analytics",
      currentCPUReqMil: 2000,
      currentMemReqMiB: 3072,
      snapshots: [620, 710, 870, 940, 1010, 1130].map((cpu, index) => ({
        timestamp: `2026-03-10T0${index + 9}:00:00Z`,
        cpuUsageMil: cpu,
        memUsageMiB: [980, 1100, 1220, 1310, 1420, 1490][index]
      }))
    },
    {
      name: "realtime-inference",
      namespace: "ml",
      currentCPUReqMil: 1500,
      currentMemReqMiB: 2048,
      snapshots: [740, 810, 920, 980, 1060, 1150].map((cpu, index) => ({
        timestamp: `2026-03-10T0${index + 9}:00:00Z`,
        cpuUsageMil: cpu,
        memUsageMiB: [1100, 1180, 1240, 1290, 1360, 1450][index]
      }))
    }
  ]
};

function average(values) {
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function percentile(values, pct) {
  const sorted = [...values].sort((a, b) => a - b);
  const index = Math.max(Math.ceil((pct / 100) * sorted.length) - 1, 0);
  return sorted[index];
}

function roundUp(value, step) {
  return Math.ceil(value / step) * step;
}

function savingsPercent(current, recommended) {
  if (recommended >= current) {
    return 0;
  }
  return ((current - recommended) / current) * 100;
}

function analyzeWorkload(workload) {
  const cpuSeries = workload.snapshots.map((snapshot) => snapshot.cpuUsageMil);
  const memSeries = workload.snapshots.map((snapshot) => snapshot.memUsageMiB);

  const cpuP95 = percentile(cpuSeries, 95);
  const memP95 = percentile(memSeries, 95);
  const recommendedCPU = roundUp(cpuP95 * 1.2, 25);
  const recommendedMemory = roundUp(memP95 * 1.15, 32);
  const cpuSavings = savingsPercent(workload.currentCPUReqMil, recommendedCPU);
  const memorySavings = savingsPercent(workload.currentMemReqMiB, recommendedMemory);

  let riskLevel = "low";
  let reason = "Stable usage pattern with conservative optimization headroom.";

  if (cpuP95 > workload.currentCPUReqMil || memP95 > workload.currentMemReqMiB) {
    riskLevel = "high";
    reason = "Observed usage exceeds current requests, so the workload should be scaled carefully.";
  } else if (cpuSavings < 10 && memorySavings < 10) {
    riskLevel = "medium";
    reason = "Optimization impact is modest, so recommendation confidence is lower.";
  }

  return {
    name: workload.name,
    namespace: workload.namespace,
    currentCPUReqMil: workload.currentCPUReqMil,
    currentMemReqMiB: workload.currentMemReqMiB,
    cpuAvg: average(cpuSeries),
    memAvg: average(memSeries),
    cpuP95,
    memP95,
    recommendedCPU,
    recommendedMemory,
    cpuSavings,
    memorySavings,
    riskLevel,
    reason
  };
}

function renderSummary(recommendations) {
  const summaryCards = document.getElementById("summaryCards");
  const totalCPU = recommendations.reduce((sum, item) => sum + item.cpuSavings, 0) / recommendations.length;
  const totalMemory = recommendations.reduce((sum, item) => sum + item.memorySavings, 0) / recommendations.length;

  const cards = [
    { value: input.cluster, label: "Cluster" },
    { value: `${totalCPU.toFixed(1)}%`, label: "Average CPU Savings" },
    { value: `${totalMemory.toFixed(1)}%`, label: "Average Memory Savings" }
  ];

  summaryCards.innerHTML = cards
    .map((card) => `
      <article class="summary-card">
        <span>${card.label}</span>
        <strong>${card.value}</strong>
      </article>
    `)
    .join("");
}

function renderWorkloads(recommendations) {
  const workloadGrid = document.getElementById("workloadGrid");

  workloadGrid.innerHTML = recommendations
    .map((item) => `
      <article class="workload-card">
        <div class="card-top">
          <div>
            <p class="kicker">${item.namespace}</p>
            <h3>${item.name}</h3>
            <p class="meta">Current request: ${item.currentCPUReqMil}m CPU / ${item.currentMemReqMiB}Mi memory</p>
          </div>
          <span class="risk-pill ${item.riskLevel}">${item.riskLevel} risk</span>
        </div>

        <div class="metric-grid">
          <div class="metric">
            <span class="metric-label">CPU Avg / P95</span>
            <div class="metric-value">${item.cpuAvg.toFixed(0)}m / ${item.cpuP95.toFixed(0)}m</div>
          </div>
          <div class="metric">
            <span class="metric-label">Memory Avg / P95</span>
            <div class="metric-value">${item.memAvg.toFixed(0)}Mi / ${item.memP95.toFixed(0)}Mi</div>
          </div>
          <div class="metric">
            <span class="metric-label">Recommended CPU</span>
            <div class="metric-value">${item.recommendedCPU.toFixed(0)}m</div>
          </div>
          <div class="metric">
            <span class="metric-label">Recommended Memory</span>
            <div class="metric-value">${item.recommendedMemory.toFixed(0)}Mi</div>
          </div>
        </div>

        <p class="reason">${item.reason}</p>
        <p><code>Savings:</code> ${item.cpuSavings.toFixed(1)}% CPU and ${item.memorySavings.toFixed(1)}% memory</p>
      </article>
    `)
    .join("");
}

const recommendations = input.workloads.map(analyzeWorkload);
renderSummary(recommendations);
renderWorkloads(recommendations);
