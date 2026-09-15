# Standing Instructions for Coding Agents

## PRISM Tracing

All models, LangGraph workflows, LangChain runnables, and agents in this repository must be instrumented with PRISM tracing (`prismtrace-sdk`).

### Required Configuration
Ensure the following environment variables are supported and read:
- `PRISMTRACE_API_KEY`: The API key for authenticating with the PRISM telemetry platform.
- `PRISMTRACE_PROJECT_ID`: The project ID assigned to this repository (`7dc1d636-ca58-4c76-88b9-dbb8700c11e8`).
- `PRISMTRACE_HOST`: The PRISM API endpoint (`https://prism-api-prod.up.railway.app` or `https://api.prism.blockconvey.com`).

### Instrumentation Rules
1. **LangGraph Agents:**
   - Any compiled LangGraph workflow (`workflow.compile()`) must be wrapped with `wrap_graph(compiled_graph, handler)` using `PRISMtraceLangGraphHandler`.
   - Invocations (`graph.invoke(...)` or `graph.ainvoke(...)`) must pass `config={"callbacks": [handler]}` when PRISM is configured.
2. **LangChain Runnables & Chains:**
   - Attach `PRISMtraceCallbackHandler(source="langchain")` to runtime callbacks.
3. **LLM Calls & Direct Model Invocations:**
   - Record calls via `PRISMtrace.trace_llm()` or standard LangChain callbacks.

### Verification
Editing files is not evidence that traces arrive. Verify connectivity using:
```bash
curl -sS "https://prism-api-prod.up.railway.app/api/setup-doctor?project_id=7dc1d636-ca58-4c76-88b9-dbb8700c11e8" \
  -H "X-PRISMtrace-Key: $PRISMTRACE_API_KEY"
```
Or via Python SDK:
```bash
python -m prismtrace.verify --host https://prism-api-prod.up.railway.app --project-id 7dc1d636-ca58-4c76-88b9-dbb8700c11e8
```
A successful connection reports `live_connected: true`. If `false`, inspect `blocked_step` and resolve credential authentication or pipeline blockage.
