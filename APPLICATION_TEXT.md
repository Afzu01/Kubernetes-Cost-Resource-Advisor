# Application Text

## Short project description
I built a Go-based Kubernetes resource recommender that analyzes workload telemetry and suggests safer CPU and memory requests using P95-based envelopes and safety buffers. The goal is to reduce overprovisioning while preserving workload reliability.

## Why I built it
Chaturtham's problem statement stood out to me because cloud clusters are often underutilized due to static peak-based allocation. I wanted to build a small prototype that demonstrates how observed workload behavior can be translated into better resource recommendations.

## Tech used
- Go
- Kubernetes concepts
- workload telemetry analysis
- percentile-based recommendation logic

## What I would build next
If extended further, I would connect it to live metrics sources such as Prometheus or VictoriaMetrics, store historical traces and recommendations in MongoDB, and expose the engine through a Go API that could integrate with Kubernetes controllers or admission workflows.
