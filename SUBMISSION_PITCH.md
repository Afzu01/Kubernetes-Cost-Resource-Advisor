# Submission Pitch

## One-line summary
I built a Kubernetes Cost & Resource Advisor that analyzes workload telemetry, recommends safer CPU and memory requests using P95-based envelopes and safety buffers, and estimates cost savings from right-sizing.

## Problem statement
Cloud workloads are often allocated using static peak estimates, which leaves clusters underutilized and increases cost. My project shows how runtime observations can be turned into safer resource recommendations and a simple cost impact report.

## What the project does
- Reads workload CPU and memory traces from JSON
- Computes average and P95 usage
- Adds a safety margin to avoid aggressive downsizing
- Recommends improved Kubernetes resource requests
- Estimates monthly and yearly infrastructure savings
- Lets users paste or upload their own workload data in the dashboard

## Why it matches Chaturtham
- Go-based systems/backend project
- Focused on cluster efficiency and cost optimization
- Uses workload behavior instead of static guesses
- Inspired by Kubernetes resource optimization
- Extendable toward VictoriaMetrics, MongoDB, and live scheduling decisions

## If they ask what you would build next
I would connect the advisor to live cluster metrics from Prometheus or VictoriaMetrics, store recommendations and historical traces in MongoDB, expose an HTTP API in Go, and integrate it with Kubernetes workloads through a controller or admission layer.

## If they ask why P95 instead of average
Average hides spikes. P95 captures high-usage behavior while still avoiding sizing for the absolute maximum, which makes optimization safer.

## If they ask about risk
Blind downsizing can cause throttling or OOM events, so I keep a safety buffer on top of P95 and classify recommendations conservatively.
