# Kubernetes Cost & Resource Advisor

I built this prototype to explore how workload usage data can help identify oversized Kubernetes CPU and memory requests. It takes workload metrics, calculates usage statistics, and suggests request values with a safety margin.

The repository contains two parts: a Go command-line analysis tool and a browser dashboard built with HTML, CSS, and JavaScript. The sample data is synthetic; the project does not connect to a live Kubernetes cluster or metrics server.

## What is included

- Go program that reads workload data from JSON.
- CPU and memory average and P95 calculations.
- Suggested CPU and memory requests using configurable safety multipliers in the analysis logic.
- A browser dashboard that accepts the sample data or user-provided JSON.
- Current-versus-recommended allocation comparisons.
- Estimated cost impact using the pricing assumptions defined in the dashboard code.

## How the analysis works

For each workload, the program reads the supplied usage snapshots and calculates average and P95 CPU and memory usage. It then applies safety headroom to the P95 values, rounds the recommendations to usable units, and compares them with the current requests.

These are estimates based on the supplied sample or custom data. They are not live cluster recommendations and should be reviewed before changing production resource requests.

## Project structure

```text
.
├── go.mod
├── main.go
├── index.html
├── styles.css
├── script.js
├── README.md
├── APPLICATION_TEXT.md
├── SUBMISSION_PITCH.md
└── sample/
    └── workloads.json
```

## Run locally

### Browser dashboard

Open `index.html` in a browser. You can load the bundled sample, paste JSON, or upload a JSON file.

### Go analysis

Run the sample input:

```bash
go run .
```

Pass a different JSON file:

```bash
go run . ./sample/workloads.json
```

The program reads the input file and prints a workload analysis report in the terminal.

## Input data

The JSON input contains a cluster name and a `workloads` array. Each workload includes its name, namespace, current CPU and memory requests, and a list of usage snapshots.

The bundled sample is synthetic and is intended for demonstration and experimentation.

## Current limitations

- No live Kubernetes API integration.
- No Prometheus or VictoriaMetrics ingestion.
- Cost estimates use the assumptions in `script.js`, not a cloud provider billing API.
- Recommendations are based on the supplied snapshots and should not be applied automatically.
- Automated tests and deployment have not been verified.

## Possible next steps

- Add tests for percentile calculations and input validation.
- Import metrics from Prometheus or VictoriaMetrics.
- Compare recommendations against longer time windows.
- Add workload-specific constraints and confidence indicators.
- Export recommendations for review before any cluster changes.

## Author

**Afzal Hussain** · [@Afzu01](https://github.com/Afzu01)
