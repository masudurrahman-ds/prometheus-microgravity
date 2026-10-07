import OpenAI from "openai";
import { CONFIG } from "./config.mjs";
import { searchNASAEvidence } from "./evidence.mjs";
import { ANSWER_SCHEMA, SYSTEM_PROMPT } from "./prompts.mjs";

const client = new OpenAI();

export async function answerWithEvidence(question) {
  if (!process.env.OPENAI_API_KEY) throw new Error("Cloud AI is not configured on the server.");

  const evidence = searchNASAEvidence(question, CONFIG.maxEvidence);
  const context = JSON.stringify(evidence);

  const response = await client.responses.create({
    model: CONFIG.model,
    instructions: SYSTEM_PROMPT,
    input: [
      { role: "user", content: [
        { type: "input_text", text: "Question: " + question },
        { type: "input_text", text: "Retrieved NASA evidence JSON. Use only this evidence for factual claims: " + context }
      ] }
    ],
    store: false,
    text: {
      format: {
        type: "json_schema",
        name: "prometheus_answer",
        strict: true,
        schema: ANSWER_SCHEMA
      }
    }
  });

  let answer;
  try { answer = JSON.parse(response.output_text); }
  catch (_) { answer = { answer: response.output_text || "", evidence_summary: "", interpretation: "", limitations: ["Structured answer parsing failed."], claims: [], sources: [] }; }

  return { answer, evidence_count: evidence.count, evidence: evidence.evidence };
}
