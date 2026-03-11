const pricing = {
  cpuCorePerMonth: 18,
  memoryGiBPerMonth: 4
};

const sampleInput = {
  cluster: "demo-cluster",
  source_note: "Synthetic workload traces modeled after overprovisioned Kubernetes services.",
  workloads: [
    {
      name: "api-gateway",
      namespace: "platform",
      current_cpu_request_millicores: 1000,
      current_memory_request_mib: 1024,
      snapshots: [
        { timestamp: "2026-03-10T09:00:00Z", cpu_usage_millicores: 210, memory_usage_mib: 380 },
        { timestamp: "2026-03-10T10:00:00Z", cpu_usage_millicores: 260, memory_usage_mib: 410 },
        { timestamp: "2026-03-10T11:00:00Z", cpu_usage_millicores: 290, memory_usage_mib: 430 },
        { timestamp: "2026-03-10T12:00:00Z", cpu_usage_millicores: 340, memory_usage_mib: 455 },
        { timestamp: "2026-03-10T13:00:00Z", cpu_usage_millicores: 370, memory_usage_mib: 470 },
        { timestamp: "2026-03-10T14:00:00Z", cpu_usage_millicores: 410, memory_usage_mib: 500 }
      ]
    },
    {
      name: "batch-worker",
      namespace: "analytics",
      current_cpu_request_millicores: 2000,
      current_memory_request_mib: 3072,
      snapshots: [
        { timestamp: "2026-03-10T09:00:00Z", cpu_usage_millicores: 620, memory_usage_mib: 980 },
        { timestamp: "2026-03-10T10:00:00Z", cpu_usage_millicores: 710, memory_usage_mib: 1100 },
        { timestamp: "2026-03-10T11:00:00Z", cpu_usage_millicores: 870, memory_usage_mib: 1220 },
        { timestamp: "2026-03-10T12:00:00Z", cpu_usage_millicores: 940, memory_usage_mib: 1310 },
        { timestamp: "2026-03-10T13:00:00Z", cpu_usage_millicores: 1010, memory_usage_mib: 1420 },
        { timestamp: "2026-03-10T14:00:00Z", cpu_usage_millicores: 1130, memory_usage_mib: 1490 }
      ]
    },
    {
      name: "realtime-inference",
      namespace: "ml",
      current_cpu_request_millicores: 1500,
      current_memory_request_mib: 2048,
      snapshots: [
        { timestamp: "2026-03-10T09:00:00Z", cpu_usage_millicores: 740, memory_usage_mib: 1100 },
        { timestamp: "2026-03-10T10:00:00Z", cpu_usage_millicores: 810, memory_usage_mib: 1180 },
        { timestamp: "2026-03-10T11:00:00Z", cpu_usage_millicores: 920, memory_usage_mib: 1240 },
        { timestamp: "2026-03-10T12:00:00Z", cpu_usage_millicores: 980, memory_usage_mib: 1290 },
        { timestamp: "2026-03-10T13:00:00Z", cpu_usage_millicores: 1060, memory_usage_mib: 1360 },
        { timestamp: "2026-03-10T14:00:00Z", cpu_usage_millicores: 1150, memory_usage_mib: 1450 }
      ]
    }
  ]
};

const jsonInput = document.getElementById("jsonInput");
const statusMessage = document.getElementById("statusMessage");
const analyzeBtn = document.getElementById("analyzeBtn");
const loadSampleBtn = document.getElementById("loadSampleBtn");
const fileInput = document.getElementById("fileInput");

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

function costForRequest(cpuMillicores, memoryMiB) {
  const cpuCost = (cpuMillicores / 1000) * pricing.cpuCorePerMonth;
  const memoryCost = (memoryMiB / 1024) * pricing.memoryGiBPerMonth;
  return cpuCost + memoryCost;
}

function formatMoney(value) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0
  }).format(value);
}

function setStatus(message, type = "") {
  statusMessage.textContent = message;
  statusMessage.className = `status-message${type ? ` ${type}` : ""}`;
}

function pick(obj, keys) {
  for (const key of keys) {
    if (obj && Object.prototype.hasOwnProperty.call(obj, key) && obj[key] !== undefined && obj[key] !== null) {
      return obj[key];
    }
  }
  return undefined;
}

function normalizeInput(raw) {
  if (!raw || typeof raw !== "object") {
    throw new Error("Input must be a JSON object.");
  }

  const workloads = pick(raw, ["workloads"]);
  if (!Array.isArray(workloads) || workloads.length === 0) {
    throw new Error("Input must include a non-empty workloads array.");
  }

  return {
    cluster: pick(raw, ["cluster"]) || "custom-cluster",
    sourceNote: pick(raw, ["source_note", "sourceNote"]) || "User-provided workload telemetry.",
    workloads: workloads.map((workload, workloadIndex) => {
      const snapshots = pick(workload, ["snapshots"]);
      if (!Array.isArray(snapshots) || snapshots.length === 0) {
        throw new Error(`Workload at index ${workloadIndex} must include snapshots.`);
      }

      const normalized = {
        name: pick(workload, ["name"]) || `workload-${workloadIndex + 1}`,
        namespace: pick(workload, ["namespace"]) || "default",
        currentCPUReqMil: Number(pick(workload, ["current_cpu_request_millicores", "currentCPUReqMil", "currentCpuRequestMillicores"])),
        currentMemReqMiB: Number(pick(workload, ["current_memory_request_mib", "currentMemReqMiB", "currentMemoryRequestMiB"])),
        snapshots: snapshots.map((snapshot, snapshotIndex) => ({
          timestamp: pick(snapshot, ["timestamp"]) || `sample-${snapshotIndex + 1}`,
          cpuUsageMil: Number(pick(snapshot, ["cpu_usage_millicores", "cpuUsageMil", "cpu_usage_millicore"])),
          memUsageMiB: Number(pick(snapshot, ["memory_usage_mib", "memUsageMiB", "memoryUsageMiB"]))
        }))
      };

      if (!Number.isFinite(normalized.currentCPUReqMil) || !Number.isFinite(normalized.currentMemReqMiB)) {
        throw new Error(`Workload ${normalized.name} is missing current CPU or memory request values.`);
      }

      normalized.snapshots.forEach((snapshot, snapshotIndex) => {
        if (!Number.isFinite(snapshot.cpuUsageMil) || !Number.isFinite(snapshot.memUsageMiB)) {
          throw new Error(`Snapshot ${snapshotIndex + 1} in workload ${normalized.name} is missing CPU or memory usage values.`);
        }
      });

      return normalized;
    })
  };
}

function analyzeWorkload(workload) {
  const cpuSeries = workload.snapshots.map((snapshot) => snapshot.cpuUsageMil);
  const memSeries = workload.snapshots.map((snapshot) => snapshot.memUsageMiB);

  const cpuAvg = average(cpuSeries);
  const memAvg = average(memSeries);
  const cpuP95 = percentile(cpuSeries, 95);
  const memP95 = percentile(memSeries, 95);
  const recommendedCPU = roundUp(cpuP95 * 1.2, 25);
  const recommendedMemory = roundUp(memP95 * 1.15, 32);
  const cpuSavings = savingsPercent(workload.currentCPUReqMil, recommendedCPU);
  const memorySavings = savingsPercent(workload.currentMemReqMiB, recommendedMemory);
  const currentMonthlyCost = costForRequest(workload.currentCPUReqMil, workload.currentMemReqMiB);
  const recommendedMonthlyCost = costForRequest(recommendedCPU, recommendedMemory);
  const monthlySavings = currentMonthlyCost - recommendedMonthlyCost;

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
    cpuAvg,
    memAvg,
    cpuP95,
    memP95,
    recommendedCPU,
    recommendedMemory,
    cpuSavings,
    memorySavings,
    currentMonthlyCost,
    recommendedMonthlyCost,
    monthlySavings,
    riskLevel,
    reason
  };
}

function summarize(recommendations) {
  const totals = recommendations.reduce((acc, item) => {
    acc.currentCPU += item.currentCPUReqMil;
    acc.currentMemory += item.currentMemReqMiB;
    acc.recommendedCPU += item.recommendedCPU;
    acc.recommendedMemory += item.recommendedMemory;
    acc.currentCost += item.currentMonthlyCost;
    acc.recommendedCost += item.recommendedMonthlyCost;
    acc.monthlySavings += item.monthlySavings;
    return acc;
  }, {
    currentCPU: 0,
    currentMemory: 0,
    recommendedCPU: 0,
    recommendedMemory: 0,
    currentCost: 0,
    recommendedCost: 0,
    monthlySavings: 0
  });

  totals.cpuReductionPercent = savingsPercent(totals.currentCPU, totals.recommendedCPU);
  totals.memoryReductionPercent = savingsPercent(totals.currentMemory, totals.recommendedMemory);
  totals.yearlySavings = totals.monthlySavings * 12;
  return totals;
}

function renderSummary(dataset, recommendations, totals) {
  const summaryCards = document.getElementById("summaryCards");
  const cards = [
    { value: dataset.cluster, label: "Cluster" },
    { value: recommendations.length, label: "Workloads Reviewed" },
    { value: formatMoney(totals.monthlySavings), label: "Monthly Savings" },
    { value: `${totals.cpuReductionPercent.toFixed(1)}%`, label: "CPU Reclaimed" }
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

function renderImpact(totals) {
  const impactGrid = document.getElementById("impactGrid");
  const maxCpu = Math.max(totals.currentCPU, totals.recommendedCPU, 1);
  const maxMemory = Math.max(totals.currentMemory, totals.recommendedMemory, 1);

  impactGrid.innerHTML = `
    <article class="impact-card featured">
      <p class="mini-label">Projected Savings</p>
      <div class="big-money">${formatMoney(totals.monthlySavings)}/mo</div>
      <p>About ${formatMoney(totals.yearlySavings)} in annual savings if these recommendations are adopted across the reviewed workloads.</p>
      <div class="impact-row">
        <span class="allocation-label">Current reserved cost</span>
        <strong>${formatMoney(totals.currentCost)}/mo</strong>
      </div>
      <div class="impact-row">
        <span class="allocation-label">Recommended reserved cost</span>
        <strong>${formatMoney(totals.recommendedCost)}/mo</strong>
      </div>
    </article>
    <article class="impact-card">
      <p class="mini-label">Current Allocation</p>
      <strong class="big-number">${(totals.currentCPU / 1000).toFixed(1)} cores</strong>
      <p class="subtle">${(totals.currentMemory / 1024).toFixed(1)} GiB memory reserved across the reviewed workloads.</p>
      <div class="allocation-bars">
        <div class="allocation-bar">
          <div class="bar-header">
            <span class="allocation-label">CPU</span>
            <strong>${totals.currentCPU.toFixed(0)}m</strong>
          </div>
          <div class="track"><div class="fill" style="width:${(totals.currentCPU / maxCpu) * 100}%"></div></div>
        </div>
        <div class="allocation-bar">
          <div class="bar-header">
            <span class="allocation-label">Memory</span>
            <strong>${totals.currentMemory.toFixed(0)}Mi</strong>
          </div>
          <div class="track"><div class="fill" style="width:${(totals.currentMemory / maxMemory) * 100}%"></div></div>
        </div>
      </div>
    </article>
    <article class="impact-card">
      <p class="mini-label">Recommended Allocation</p>
      <strong class="big-number">${(totals.recommendedCPU / 1000).toFixed(1)} cores</strong>
      <p class="subtle">${(totals.recommendedMemory / 1024).toFixed(1)} GiB memory after P95-based right-sizing and safety buffering.</p>
      <div class="allocation-bars">
        <div class="allocation-bar">
          <div class="bar-header">
            <span class="allocation-label">CPU</span>
            <strong>${totals.recommendedCPU.toFixed(0)}m</strong>
          </div>
          <div class="track"><div class="fill recommended" style="width:${(totals.recommendedCPU / maxCpu) * 100}%"></div></div>
        </div>
        <div class="allocation-bar">
          <div class="bar-header">
            <span class="allocation-label">Memory</span>
            <strong>${totals.recommendedMemory.toFixed(0)}Mi</strong>
          </div>
          <div class="track"><div class="fill recommended" style="width:${(totals.recommendedMemory / maxMemory) * 100}%"></div></div>
        </div>
      </div>
    </article>
  `;
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
            <p class="meta">Observed usage translated into a safer right-sized request.</p>
          </div>
          <span class="risk-pill ${item.riskLevel}">${item.riskLevel} risk</span>
        </div>

        <div class="workload-current-next">
          <div>
            <span class="allocation-label">Current</span>
            <strong>${item.currentCPUReqMil}m / ${item.currentMemReqMiB}Mi</strong>
          </div>
          <div>
            <span class="allocation-label">Recommended</span>
            <strong>${item.recommendedCPU.toFixed(0)}m / ${item.recommendedMemory.toFixed(0)}Mi</strong>
          </div>
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
            <span class="metric-label">CPU / Memory Savings</span>
            <div class="metric-value">${item.cpuSavings.toFixed(1)}% / ${item.memorySavings.toFixed(1)}%</div>
          </div>
          <div class="metric">
            <span class="metric-label">Monthly Cost Impact</span>
            <div class="metric-value">${formatMoney(item.monthlySavings)}</div>
          </div>
        </div>

        <div class="workload-savings">
          <p class="reason">${item.reason}</p>
          <strong>${formatMoney(item.currentMonthlyCost)} -> ${formatMoney(item.recommendedMonthlyCost)}</strong>
        </div>
      </article>
    `)
    .join("");
}

function renderDashboard(dataset) {
  const recommendations = dataset.workloads.map(analyzeWorkload);
  const totals = summarize(recommendations);

  renderSummary(dataset, recommendations, totals);
  renderImpact(totals);
  renderWorkloads(recommendations);
}

function loadIntoTextarea(data) {
  jsonInput.value = JSON.stringify(data, null, 2);
}

function analyzeFromTextarea() {
  try {
    const raw = JSON.parse(jsonInput.value);
    const dataset = normalizeInput(raw);
    renderDashboard(dataset);
    setStatus(`Loaded ${dataset.workloads.length} workload(s) from ${dataset.cluster}.`, "success");
  } catch (error) {
    setStatus(error.message, "error");
  }
}

analyzeBtn.addEventListener("click", analyzeFromTextarea);

loadSampleBtn.addEventListener("click", () => {
  loadIntoTextarea(sampleInput);
  analyzeFromTextarea();
});

fileInput.addEventListener("change", async (event) => {
  const [file] = event.target.files || [];
  if (!file) {
    return;
  }

  try {
    const text = await file.text();
    jsonInput.value = text;
    analyzeFromTextarea();
  } catch (error) {
    setStatus(`Could not read file: ${error.message}`, "error");
  }
});

loadIntoTextarea(sampleInput);
analyzeFromTextarea();
