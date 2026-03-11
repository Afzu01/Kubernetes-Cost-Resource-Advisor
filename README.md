# Kubernetes Resource Recommender

A compact Go project that demonstrates how workload-aware resource recommendations can improve Kubernetes cluster efficiency. It is directly inspired by Chaturtham AI Data Science's compute optimization problem: cloud clusters are often overprovisioned because schedulers use static peak estimates instead of observed workload behavior.

This demo acts like a lightweight optimization layer:

- It reads workload CPU and memory traces.
- It computes average and P95 usage.
- It adds a safety buffer.
- It recommends safer Kubernetes resource requests.
- It estimates the infrastructure savings from reducing overprovisioning.

## Why this project fits the role

Chaturtham is building an intelligent compute optimization engine for modern clusters. This demo shows the same underlying thinking:

- runtime observation of workloads
- workload-aware resource prediction
- safe request tuning using statistical envelopes
- cluster efficiency improvement without blindly cutting capacity

Even though this is a simplified offline prototype, the design maps directly to real systems that use:

- Kubernetes
- cgroups
- observability pipelines
- time-series stores like VictoriaMetrics
- backend services written in Go

## Project structure

```text
.
|-- go.mod
|-- main.go
|-- README.md
|-- APPLICATION_TEXT.md
|-- SUBMISSION_PITCH.md
`-- sample
    `-- workloads.json
```

## How it works

For every workload:

1. Read CPU and memory metrics from JSON.
2. Compute average usage and P95 usage.
3. Add a safety buffer:
   - CPU recommendation = P95 * 1.20
   - Memory recommendation = P95 * 1.15
4. Round the result to deployment-friendly units.
5. Estimate CPU and memory savings against the current request.
6. Flag basic risk levels.

This mirrors a safe optimization strategy used in production systems:

- don't optimize to the average
- use higher-percentile usage for protection
- keep headroom to avoid performance regressions

## Run it

```bash
go run .
```

Or provide a custom input file:

```bash
go run . .\sample\workloads.json
```

## Example output

```text
Cluster: demo-cluster
Source: Synthetic workload traces modeled after overprovisioned Kubernetes services.

Optimization Report
===================

[platform/api-gateway]
CPU avg/p95: 313m / 410m
Memory avg/p95: 441Mi / 500Mi
Recommended requests: CPU 500m, Memory 576Mi
Estimated savings: CPU 50.0%, Memory 43.8%
Risk: low
Why: stable usage pattern with safe optimization headroom
```

## Talking points for submission

If you need to explain this project in the application or interview, use this:

> I built a Go-based Kubernetes resource recommender that analyzes workload telemetry and suggests safer CPU and memory requests using P95-based envelopes and safety buffers. The goal is to reduce overprovisioning while preserving reliability, which is closely aligned with compute optimization for modern clusters.

## What I would build next

If I had more time, I would extend this into a fuller system:

- collect live metrics from Prometheus or VictoriaMetrics
- store historical recommendations in MongoDB
- expose an HTTP API in Go
- compare current vs recommended cost over time
- add confidence scoring and anomaly detection
- connect to Kubernetes manifests or a mutating controller

## Key concepts demonstrated

- Go for backend/systems engineering
- workload-aware scheduling intuition
- percentile-based resource planning
- cluster utilization optimization
- production safety thinking

## Submission checklist

- Mention that the project is a prototype inspired by compute optimization.
- Explain that it recommends safer requests based on observed usage instead of peak guesses.
- Highlight Go, Kubernetes, metrics, and systems thinking.
- If asked about future scope, mention live metrics ingestion, MongoDB persistence, and VictoriaMetrics integration.
