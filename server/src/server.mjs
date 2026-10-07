import http from "node:http";
import { CONFIG } from "./config.mjs";
import { answerWithEvidence } from "./agent.mjs";
import { corpusSummary } from "./evidence.mjs";

function send(res, status, body) {
  res.writeHead(status, {
    "content-type": "application/json; charset=utf-8",
    "access-control-allow-origin": "*",
    "access-control-allow-headers": "content-type, authorization",
    "access-control-allow-methods": "POST, GET, OPTIONS"
  });
  res.end(JSON.stringify(body));
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", chunk => {
      body += chunk;
      if (body.length > 200000) reject(new Error("request too large"));
    });
    req.on("end", () => resolve(body));
    req.on("error", reject);
  });
}

const server = http.createServer(async (req, res) => {
  if (req.method === "OPTIONS") return send(res, 204, {});
  if (req.method === "GET" && req.url === "/api/health") return send(res, 200, { ok: true, service: "PROMETHEUS", corpus: corpusSummary() });
  if (req.method !== "POST" || req.url !== "/api/ask") return send(res, 404, { error: "Not found" });

  try {
    const body = JSON.parse(await readBody(req));
    const question = String(body.question || "").trim();
    if (!question || question.length > 4000) return send(res, 400, { error: "Question must be 1-4000 characters." });

    if (CONFIG.accessToken && req.headers.authorization !== "Bearer " + CONFIG.accessToken) {
      return send(res, 401, { error: "Unauthorized" });
    }

    const result = await answerWithEvidence(question);
    return send(res, 200, {
      ok: true,
      mode: "NASA-EVIDENCE-CLOUD-AI",
      model: CONFIG.model,
      answer: result.answer,
      evidence_count: result.evidence_count
    });
  } catch (error) {
    return send(res, 500, { error: error.message || "PROMETHEUS AI failed safely." });
  }
});

server.listen(CONFIG.port, () => console.log("PROMETHEUS scientific agent listening on " + CONFIG.port));
