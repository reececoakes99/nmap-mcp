# nmap-mcp

This repository includes:
- a Next.js MCP server using `mcp-handler`
- a Python FastMCP server (`/home/runner/work/nmap-mcp/nmap-mcp/server.py`) with nmap integration

## Python FastMCP server (with nmap)

### Prerequisites
- Python 3.10+
- `nmap` installed and available on PATH
  - macOS: `brew install nmap`
  - Ubuntu/Debian: `sudo apt-get install -y nmap`

### Setup
```bash
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

### Run locally
```bash
python server.py
```

By default the server binds to `0.0.0.0:${PORT:-8000}` and serves MCP on `/mcp`.

### Available Python MCP tool
- `do_nmap(target, nmap_args=[])`
  - Executes `nmap` via `subprocess.run` (no shell)
  - Performs basic input validation on target and args
  - Returns structured JSON-like output including host/port scan details parsed from nmap XML output

Example tool input:
```json
{
  "target": "scanme.nmap.org",
  "nmap_args": ["-sV", "-T3"]
}
```

## Next.js MCP server

## Notes for running on Vercel

- To use the SSE transport, requires a Redis attached to the project under `process.env.REDIS_URL` and toggling the `disableSse` flag to `false` in `app/mcp/route.ts`
- Make sure you have [Fluid compute](https://vercel.com/docs/functions/fluid-compute) enabled for efficient execution
- After enabling Fluid compute, open `app/route.ts` and adjust `maxDuration` to 800 if you using a Vercel Pro or Enterprise account
- [Deploy the Next.js MCP template](https://vercel.com/templates/next.js/model-context-protocol-mcp-with-next-js)

## Sample client

`script/test-client.mjs` contains a sample client to try invocations.

```sh
node scripts/test-client.mjs https://mcp-for-next-js.vercel.app
```
