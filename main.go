package main

import (
	"encoding/json"
	"fmt"
	"math"
	"os"
	"sort"
)

type MetricsSnapshot struct {
	Timestamp   string  `json:"timestamp"`
	CPUUsageMil float64 `json:"cpu_usage_millicores"`
	MemUsageMiB float64 `json:"memory_usage_mib"`
}

type Workload struct {
	Name             string            `json:"name"`
	Namespace        string            `json:"namespace"`
	CurrentCPUReqMil float64           `json:"current_cpu_request_millicores"`
	CurrentMemReqMiB float64           `json:"current_memory_request_mib"`
	Snapshots        []MetricsSnapshot `json:"snapshots"`
}

type Input struct {
	Cluster    string     `json:"cluster"`
	Workloads  []Workload `json:"workloads"`
	SourceNote string     `json:"source_note"`
}

type Recommendation struct {
	Name                 string
	Namespace            string
	CPUAvgMil            float64
	CPUP95Mil            float64
	MemAvgMiB            float64
	MemP95MiB            float64
	RecommendedCPUReqMil float64
	RecommendedMemReqMiB float64
	CPUSavingsPercent    float64
	MemorySavingsPercent float64
	RiskLevel            string
	Reason               string
}

func main() {
	path := "sample/workloads.json"
	if len(os.Args) > 1 {
		path = os.Args[1]
	}

	input, err := loadInput(path)
	if err != nil {
		fmt.Fprintf(os.Stderr, "failed to load input: %v\n", err)
		os.Exit(1)
	}

	fmt.Printf("Cluster: %s\n", input.Cluster)
	fmt.Printf("Source: %s\n\n", input.SourceNote)

	recommendations := make([]Recommendation, 0, len(input.Workloads))
	for _, workload := range input.Workloads {
		recommendations = append(recommendations, analyzeWorkload(workload))
	}

	printRecommendations(recommendations)
}

func loadInput(path string) (Input, error) {
	raw, err := os.ReadFile(path)
	if err != nil {
		return Input{}, err
	}

	var input Input
	if err := json.Unmarshal(raw, &input); err != nil {
		return Input{}, err
	}
	return input, nil
}

func analyzeWorkload(workload Workload) Recommendation {
	cpuSeries := make([]float64, 0, len(workload.Snapshots))
	memSeries := make([]float64, 0, len(workload.Snapshots))
	for _, snapshot := range workload.Snapshots {
		cpuSeries = append(cpuSeries, snapshot.CPUUsageMil)
		memSeries = append(memSeries, snapshot.MemUsageMiB)
	}

	cpuAvg := average(cpuSeries)
	memAvg := average(memSeries)
	cpuP95 := percentile(cpuSeries, 95)
	memP95 := percentile(memSeries, 95)

	cpuRecommendation := roundUp(cpuP95*1.20, 25)
	memRecommendation := roundUp(memP95*1.15, 32)

	cpuSavings := savingsPercent(workload.CurrentCPUReqMil, cpuRecommendation)
	memSavings := savingsPercent(workload.CurrentMemReqMiB, memRecommendation)

	risk := "low"
	reason := "stable usage pattern with safe optimization headroom"
	if cpuP95 > workload.CurrentCPUReqMil || memP95 > workload.CurrentMemReqMiB {
		risk = "high"
		reason = "observed usage already exceeds current request; scale carefully"
	} else if cpuSavings < 10 && memSavings < 10 {
		risk = "medium"
		reason = "little waste detected; optimization impact is limited"
	}

	return Recommendation{
		Name:                 workload.Name,
		Namespace:            workload.Namespace,
		CPUAvgMil:            cpuAvg,
		CPUP95Mil:            cpuP95,
		MemAvgMiB:            memAvg,
		MemP95MiB:            memP95,
		RecommendedCPUReqMil: cpuRecommendation,
		RecommendedMemReqMiB: memRecommendation,
		CPUSavingsPercent:    cpuSavings,
		MemorySavingsPercent: memSavings,
		RiskLevel:            risk,
		Reason:               reason,
	}
}

func printRecommendations(recommendations []Recommendation) {
	fmt.Println("Optimization Report")
	fmt.Println("===================")
	for _, r := range recommendations {
		fmt.Printf(
			"\n[%s/%s]\nCPU avg/p95: %.0fm / %.0fm\nMemory avg/p95: %.0fMi / %.0fMi\nRecommended requests: CPU %.0fm, Memory %.0fMi\nEstimated savings: CPU %.1f%%, Memory %.1f%%\nRisk: %s\nWhy: %s\n",
			r.Namespace,
			r.Name,
			r.CPUAvgMil,
			r.CPUP95Mil,
			r.MemAvgMiB,
			r.MemP95MiB,
			r.RecommendedCPUReqMil,
			r.RecommendedMemReqMiB,
			r.CPUSavingsPercent,
			r.MemorySavingsPercent,
			r.RiskLevel,
			r.Reason,
		)
	}
}

func average(values []float64) float64 {
	if len(values) == 0 {
		return 0
	}

	total := 0.0
	for _, value := range values {
		total += value
	}
	return total / float64(len(values))
}

func percentile(values []float64, pct float64) float64 {
	if len(values) == 0 {
		return 0
	}

	sorted := append([]float64(nil), values...)
	sort.Float64s(sorted)

	index := int(math.Ceil((pct/100)*float64(len(sorted)))) - 1
	if index < 0 {
		index = 0
	}
	if index >= len(sorted) {
		index = len(sorted) - 1
	}
	return sorted[index]
}

func roundUp(value float64, step float64) float64 {
	if step == 0 {
		return value
	}
	return math.Ceil(value/step) * step
}

func savingsPercent(current float64, recommended float64) float64 {
	if current <= 0 || recommended >= current {
		return 0
	}
	return ((current - recommended) / current) * 100
}
