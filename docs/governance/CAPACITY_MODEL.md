# Comprehensive Capacity Model & Infrastructure Sizing Specification
**Document ID:** GOV-CAP-001  
**Canonical Tracking:** `TASK-140` / `S-059` (`ENG-12` / `P8 Scale & Governance`)  
**Status:** APPROVED & ENFORCED  
**Version:** 1.0.0  

---

## 1. Executive Summary & Mathematical Framework

This capacity model defines the performance boundaries, infrastructure footprints, scaling thresholds, and economic cost structures for the Brand Commerce Platform. It anchors capacity planning in queueing theory and Little's Law rather than heuristic estimations.

### 1.1 Little's Law Formulation
For any stationary queuing system, the average number of concurrent requests in flight ($L$) equals the arrival rate ($\lambda$) multiplied by the average response time ($W$):
$$L = \lambda \cdot W$$

- Under peak catalog browsing ($\lambda = 1,500\text{ req/s}$, $W = 0.050\text{ s}$), concurrency in flight is $L = 75$ concurrent connections.
- Under peak checkout ($\lambda = 150\text{ tx/s}$, $W = 0.200\text{ s}$), concurrency in flight is $L = 30$ concurrent database transactions.

### 1.2 Multi-Server Queue Saturation ($M/M/k$ Model)
With $k$ worker threads/connections and service rate $\mu = 1 / W$, traffic intensity $\rho = \frac{\lambda}{k \cdot \mu}$ must strictly remain $\rho \le 0.70$ (70% utilization) to guarantee bounded queue growth and avoid exponential latency cliffs.

---

## 2. Workload Profiles & Service Level Objectives (SLOs)

| Service Domain | Metric | Baseline (P50) | Peak (P95) | Stress Target (P99) | Saturation Cliff | Cache Ratio |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Catalog & PDP** | Throughput | 500 req/s | 1,500 req/s | 5,000 req/s | > 8,500 req/s | $\ge 92\%$ (Edge) |
| | Latency | $\le 25\text{ ms}$ | $\le 60\text{ ms}$ | $\le 120\text{ ms}$ | $> 350\text{ ms}$ | |
| **Search & Filtering** | Throughput | 100 req/s | 400 req/s | 1,200 req/s | > 2,000 req/s | $\ge 65\%$ (Query) |
| | Latency | $\le 45\text{ ms}$ | $\le 120\text{ ms}$ | $\le 250\text{ ms}$ | $> 600\text{ ms}$ | |
| **Checkout & Locking** | Throughput | 30 tx/s | 150 tx/s | 350 tx/s | > 500 tx/s | $0\%$ (Bypassed) |
| | Latency | $\le 90\text{ ms}$ | $\le 220\text{ ms}$ | $\le 450\text{ ms}$ | $> 1,200\text{ ms}$ | |
| **BullMQ Workers** | Throughput | 100 job/s | 500 job/s | 1,500 job/s | > 2,500 job/s | N/A |
| | Job Duration | $\le 150\text{ ms}$ | $\le 650\text{ ms}$ | $\le 1,200\text{ ms}$ | $> 3,000\text{ ms}$ | |

---

## 3. Infrastructure Topology & Resource Sizing

### 3.1 Node Sizing Matrix
- **NestJS API Service (`apps/api`):**
  - Minimum Replica: 3 pods (high availability across failure domains).
  - Container Allocation: 2 vCPU, 4 GiB RAM (requests: 1 vCPU, 2 GiB; limits: 2 vCPU, 4 GiB).
  - Maximum Pod Capacity: 600 req/s per replica before thread contention.
- **Next.js Storefront SSR (`apps/storefront`):**
  - Minimum Replica: 3 pods.
  - Container Allocation: 2 vCPU, 4 GiB RAM.
  - Static Asset Delivery: Offloaded 100% to Cloudflare / Edge CDN.
- **Primary Database (PostgreSQL 16):**
  - Compute: 8 vCPU, 32 GiB RAM, Dedicated NVMe SSD ($\ge 10,000\text{ IOPS}$).
  - Connection Pool: PgBouncer pooler sizing $N = 150$ active connections; max backend pool $M = 60$.
  - Read Replicas: 2 standby read replicas (4 vCPU, 16 GiB RAM each) routing catalog queries.
- **Redis Cluster / Sentinel:**
  - Compute: 2 vCPU, 4 GiB RAM. Memory policy: `allkeys-lru` with maxmemory 3.2 GiB.

---

## 4. Horizontal Pod Autoscaler (HPA) Policy

```yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: api-service-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: brand-commerce-api
  minReplicas: 3
  maxReplicas: 16
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
  - type: Resource
    resource:
      name: memory
      target:
        type: Utilization
        averageUtilization: 80
  behavior:
    scaleUp:
      stabilizationWindowSeconds: 0
      policies:
      - type: Percent
        value: 100
        periodSeconds: 15
    scaleDown:
      stabilizationWindowSeconds: 300
      policies:
      - type: Percent
        value: 20
        periodSeconds: 60
```

---

## 5. Capacity Cost Projections

| Tier | Traffic Multiplier | Monthly Throughput | Infrastructure Provisioning | Projected Monthly Cost |
| :--- | :--- | :--- | :--- | :--- |
| **Normal Base** | $1.0\times$ (Baseline) | $25\text{M requests}$ | 3 API, 3 SSR, 1 DB Primary, 1 DB Replica, 1 Redis | \$480 / month |
| **Campaign Peak** | $3.0\times$ (Seasonal) | $75\text{M requests}$ | 6 API, 6 SSR, 1 DB Primary, 2 DB Replicas, 2 Redis | \$1,120 / month |
| **Flash / Black Friday**| $10.0\times$ (Peak Spike)| $250\text{M requests}$| 16 API, 14 SSR, 1 DB Primary High-IO, 3 DB Replicas, 3 Redis | \$2,850 / month |
