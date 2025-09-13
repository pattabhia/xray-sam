# X-Ray SAM Demo 🚀

**API Gateway (REST) → Lambda (Node.js) → External API → DynamoDB**  
Fully traced with **AWS X-Ray** + CloudWatch dashboards, plus a CLI to extract **p50/p90/p95/p99** latencies.

---

## 🏗 Architecture

[Client] → [API Gateway (REST, tracing ON)]
↓
[Lambda (Node.js 20, tracing ON)]
↙ ↘
[External API (jsonplaceholder / httpbin)] [DynamoDB Table]

- **API Gateway (REST)** – stage tracing enabled
- **Lambda** – X-Ray SDK wraps AWS SDK + HTTP(s)
- **DynamoDB** – stores external API response
- **X-Ray** – traces every hop
- **CloudWatch Dashboard** – percentile metrics side-by-side

---

## 📂 Project Structure

xray-sam-demo/
├── template.yaml # SAM template (stack definition)
├── src/ # Lambda source
│ ├── index.js
│ └── package.json
└── tools/
├── xray-pct/ # CLI: extract percentiles from GetTraceSummaries
└── xray-timeseries/ # CLI: per-minute percentiles from GetTimeSeriesServiceStatistics

---

## 🚀 Deploy

```bash
sam build
sam deploy --guided
```

Outputs:

ApiUrl → Invoke the Lambda (/hit)

TableName → DynamoDB storage

TargetUrlOut → external API (defaults to jsonplaceholder)
