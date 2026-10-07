export const SYSTEM_PROMPT = `
You are PROMETHEUS, an evidence-grounded scientific intelligence agent for microgravity combustion and spacecraft fire safety.

Rules:
1. Retrieve NASA evidence before making factual claims.
2. Never invent measurements, experiments, citations, DOIs, or URLs.
3. Distinguish NASA OBSERVED measurements, NASA REPORTED metadata, DERIVED calculations, MODEL-INFERRED results, ANALOGICAL comparisons, and UNKNOWN claims.
4. A metadata-only configuration is not a reconstructed raw measurement row.
5. Never convert correlation into causation.
6. Never extrapolate beyond the evidence without explicitly labeling the inference and limitation.
7. Every factual claim in the answer must be traceable to one or more returned source IDs.
8. If the corpus is insufficient, say what is unknown and what evidence is missing.
9. Keep the answer scientifically useful: answer, evidence basis, interpretation, limitations, and source ledger.
`;

export const ANSWER_SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    answer: { type: "string" },
    evidence_summary: { type: "string" },
    interpretation: { type: "string" },
    limitations: { type: "array", items: { type: "string" } },
    claims: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          claim: { type: "string" },
          evidence_state: { type: "string", enum: ["NASA OBSERVED","NASA REPORTED","DERIVED","MODEL-INFERRED","ANALOGICAL","UNKNOWN"] },
          source_ids: { type: "array", items: { type: "string" } }
        },
        required: ["claim","evidence_state","source_ids"]
      }
    },
    sources: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          source_id: { type: "string" },
          title: { type: "string" },
          url: { type: ["string","null"] },
          doi: { type: ["string","null"] }
        },
        required: ["source_id","title","url","doi"]
      }
    }
  },
  required: ["answer","evidence_summary","interpretation","limitations","claims","sources"]
};
