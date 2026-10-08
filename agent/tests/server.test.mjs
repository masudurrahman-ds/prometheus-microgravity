import test from "node:test";
import assert from "node:assert/strict";
import { spawn } from "node:child_process";

const port = 19000 + (process.pid % 1000);
const child = spawn(process.execPath, ["server.mjs"], {
  cwd: process.cwd(),
  env: {...process.env, PORT:String(port), OPENAI_API_KEY:"", PROMETHEUS_MODEL:""},
  stdio:["ignore","pipe","pipe"]
});

async function waitForHealth() {
  const deadline=Date.now()+5000;
  while(Date.now()<deadline){
    try {
      const r=await fetch("http://127.0.0.1:"+port+"/health");
      if(r.ok) return r.json();
    } catch {}
    await new Promise(resolve=>setTimeout(resolve,100));
  }
  throw new Error("Agent health endpoint did not start");
}

test("agent health exposes safe configuration status", async()=>{
  const health=await waitForHealth();
  assert.equal(health.ok,true);
  assert.equal(health.service,"prometheus-scientific-agent");
  assert.equal(health.configured,false);
  assert.equal(health.evidence_policy,"NASA indexed corpus only");
});

test("agent rejects missing cloud consent before inference", async()=>{
  const r=await fetch("http://127.0.0.1:"+port+"/v1/agent",{
    method:"POST",headers:{"content-type":"application/json"},
    body:JSON.stringify({message:"Compare PSI98-S1 and PSI98-S2.",consent:{cloud_ai:false}})
  });
  const body=await r.json();
  assert.equal(r.status,503);
  assert.equal(body.code,"AI_NOT_CONFIGURED");
});

test("agent validates request JSON and message", async()=>{
  const bad=await fetch("http://127.0.0.1:"+port+"/v1/agent",{
    method:"POST",headers:{"content-type":"application/json"},body:"{"
  });
  assert.equal(bad.status,400);
  const missing=await fetch("http://127.0.0.1:"+port+"/v1/agent",{
    method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({})
  });
  assert.equal(missing.status,400);
});

test.after(()=>child.kill("SIGTERM"));
