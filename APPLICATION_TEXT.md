# Application Text

## Short project description
I built a Kubernetes Cost & Resource Advisor that analyzes workload telemetry, recommends safer CPU and memory requests using P95-based envelopes and safety buffers, and estimates monthly cost savings from right-sizing overprovisioned workloads.

## Why I built it
Chaturtham's problem statement stood out to me because cloud clusters are often underutilized due to static peak-based allocation. I wanted to build a small but useful prototype that shows how observed workload behavior can be translated into safer resource recommendations and clearer cost visibility for teams running Kubernetes workloads.

## What makes it useful
- Users can paste their own workload JSON into the dashboard
- Users can upload a `.json` file and generate a fresh report
- The tool shows before-vs-after allocation and estimated savings
- It turns raw usage telemetry into actionable Kubernetes request recommendations

## Tech used
- Go
- HTML, CSS, JavaScript
- Kubernetes concepts
- workload telemetry analysis
- percentile-based recommendation logic

## What I would build next
If extended further, I would connect it to live metrics sources such as Prometheus or VictoriaMetrics, store historical traces and recommendations in MongoDB, and expose the engine through a Go API that could integrate with Kubernetes controllers or admission workflows.
