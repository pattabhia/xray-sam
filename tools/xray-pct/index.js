const { XRayClient, GetTraceSummariesCommand } = require("@aws-sdk/client-xray");
const yargs = require("yargs");
const { hideBin } = require("yargs/helpers");

function percentile(arr, p) {
  if (!arr.length) return 0;
  const s = [...arr].sort((a, b) => a - b);
  const idx = Math.ceil((p / 100) * s.length) - 1;
  return s[Math.max(0, Math.min(idx, s.length - 1))];
}

(async () => {
  const argv = yargs(hideBin(process.argv))
    .option("region", { type: "string", demandOption: true })
    .option("minutes", { type: "number", default: 30 })
    .option("filter", { type: "string", default: 'annotation.route = "/hit"' })
    .help().argv;

  const client = new XRayClient({ region: argv.region });
  const endTime = new Date();
  const startTime = new Date(endTime.getTime() - argv.minutes * 60 * 1000);

  let nextToken;
  const durationsMs = [];

  do {
    const res = await client.send(new GetTraceSummariesCommand({
      StartTime: startTime,
      EndTime: endTime,
      FilterExpression: argv.filter,
      NextToken: nextToken,
      Sampling: false
    }));
    (res.TraceSummaries || []).forEach(t => {
      if (typeof t.Duration === "number") durationsMs.push(t.Duration * 1000);
    });
    nextToken = res.NextToken;
  } while (nextToken);

  const n = durationsMs.length;
  const avg = n ? durationsMs.reduce((a,b)=>a+b,0)/n : 0;

  console.log(JSON.stringify({
    window: { startTime, endTime },
    filter: argv.filter,
    count: n,
    minMs: n ? Math.min(...durationsMs) : 0,
    maxMs: n ? Math.max(...durationsMs) : 0,
    avgMs: +avg.toFixed(2),
    p50Ms: percentile(durationsMs, 50),
    p90Ms: percentile(durationsMs, 90),
    p95Ms: percentile(durationsMs, 95),
    p99Ms: percentile(durationsMs, 99)
  }, null, 2));
})();
