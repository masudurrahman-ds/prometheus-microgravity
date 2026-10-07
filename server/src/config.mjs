import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));

export const CONFIG = {
  port: Number(process.env.PORT || 8787),
  model: process.env.PROMETHEUS_MODEL || "gpt-5.6-luna",
  apiKey: process.env.OPENAI_API_KEY || "",
  accessToken: process.env.PROMETHEUS_API_TOKEN || "",
  corpusPath: path.resolve(here, "../../data/prometheus_nasa_psi.json"),
  maxEvidence: Number(process.env.PROMETHEUS_MAX_EVIDENCE || 8)
};
