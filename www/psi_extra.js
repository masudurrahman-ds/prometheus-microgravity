(() => {
  "use strict";
  const files = [
    "PSI-69.json", "PSI-99.json", "PSI-100.json",
    "PSI-101.json", "PSI-102.json", "PSI-107.json"
  ];
  const root = "./data/psi_records/";
  const load = path => fetch(root + path, {cache:"no-store"}).then(response => {
    if (!response.ok) throw new Error("Could not load local NASA PSI asset: " + path);
    return response.json();
  });
  window.__prometheusDatasetExtrasReady = Promise.all([
    load("sources.json"),
    ...files.map(load)
  ]).then(([sources, ...recordSets]) => ({
    sources: Array.isArray(sources) ? sources : [],
    experiments: recordSets.flatMap(records => Array.isArray(records) ? records : [])
  })).catch(error => {
    console.warn("PROMETHEUS extended NASA PSI corpus unavailable; seed corpus remains active.", error);
    return {sources:[], experiments:[]};
  });
})();