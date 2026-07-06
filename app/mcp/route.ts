import { createMcpHandler } from "mcp-handler";
import { z } from "zod";

const handler = createMcpHandler(
  async (server) => {
    server.registerTool(
      "do-nmap",
      {
        title: "do-nmap",
        description: "Generate nmap command for port scanning and network discovery. Since CLI tools cannot execute on serverless, this returns the command to run locally.",
        inputSchema: z.object({
          target: z.string().describe("Target ip or hostname to detect open ports"),
          nmap_args: z.array(z.string()).optional().describe(`Additional nmap arguments. Examples:
TARGET SPECIFICATION:
  -iL <inputfilename>: Input from list of hosts/networks
  -iR <num hosts>: Choose random targets
  --exclude <host1[,host2],...>: Exclude hosts/networks
HOST DISCOVERY:
  -sL: List Scan - simply list targets to scan
  -sn: Ping Scan - disable port scan
  -Pn: Treat all hosts as online -- skip host discovery
  -PS/PA/PU/PY[portlist]: TCP SYN, TCP ACK, UDP or SCTP discovery
  -PE/PP/PM: ICMP echo, timestamp, and netmask request probes
  -n/-R: Never do DNS resolution/Always resolve
SCAN TECHNIQUES:
  -sS/sT/sA/sW/sM: TCP SYN/Connect()/ACK/Window/Maimon scans
  -sU: UDP Scan
  -sN/sF/sX: TCP Null, FIN, and Xmas scans
PORT SPECIFICATION:
  -p <port ranges>: Only scan specified ports (e.g. -p22; -p1-65535)
  -F: Fast mode - Scan fewer ports than the default scan
  --top-ports <number>: Scan most common ports
SERVICE/VERSION DETECTION:
  -sV: Probe open ports to determine service/version info
  -sC: equivalent to --script=default
OS DETECTION:
  -O: Enable OS detection
  -A: Enable OS detection, version detection, script scanning, and traceroute
TIMING:
  -T<0-5>: Set timing template (higher is faster)
OUTPUT:
  -oN/-oX/-oS/-oG <file>: Output in normal, XML, s|<rIpt kIddi3, Grepable format
  -v: Increase verbosity level
  --open: Only show open (or possibly open) ports`),
        }),
      },
      async ({ target, nmap_args }) => {
        // Build the nmap command - spawn() does NOT work on Vercel serverless!
        const args: string[] = [];

        if (nmap_args && nmap_args.length > 0) {
          args.push(...nmap_args);
        }
        args.push(target);

        const shellEscape = (value: string) => {
          if (/^[A-Za-z0-9_\/\.\-:]+$/.test(value)) return value;
          return `'${value.replace(/'/g, "'\\''")}'`;
        };

        const command = `nmap ${args.map(shellEscape).join(" ")}`;
        
        return {
          content: [{
            type: "text",
            text: `To run nmap locally, execute the following command:\n\n${command}\n\nNote: This MCP server provides the interface for nmap commands. Since CLI tools cannot execute on serverless platforms, please run this command on your local machine where nmap is installed.\n\nExample usage:\n- Basic scan: nmap 192.168.1.1\n- Aggressive scan: nmap -A 192.168.1.1\n- Port range: nmap -p 1-1000 192.168.1.1\n- Service detection: nmap -sV 192.168.1.1`
          }]
        };
      }
    );
  },
  {
    capabilities: {
      tools: {
        "do-nmap": {
          description: "Generate nmap command for port scanning and network discovery"
        }
      }
    }
  },
  {
    basePath: "",
    verboseLogs: true,
    maxDuration: 60,
    disableSse: true,
  }
);

export { handler as GET, handler as POST, handler as DELETE };
