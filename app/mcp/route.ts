import { createMcpHandler } from "mcp-handler";
import { z } from "zod";

const handler = createMcpHandler(
  (server) => {
    server.tool(
      "do-nmap",
      "Run nmap with specified target. Returns the command to run locally since CLI tools cannot execute on serverless. Nmap is a powerful network scanning tool for port discovery, service detection, OS fingerprinting, and security auditing.",
      {
        target: z.string().describe("Target IP address, hostname, or network range to scan (e.g., 192.168.1.1, scanme.nmap.org, 10.0.0.0/24)"),
        nmap_args: z.array(z.string()).describe(`Additional nmap arguments. Common options include:

TARGET SPECIFICATION:
  -iL <inputfilename>: Input from list of hosts/networks
  -iR <num hosts>: Choose random targets
  --exclude <host1[,host2],...>: Exclude hosts/networks

HOST DISCOVERY:
  -sL: List Scan - simply list targets to scan
  -sn: Ping Scan - disable port scan
  -Pn: Treat all hosts as online -- skip host discovery
  -PS/PA/PU/PY[portlist]: TCP SYN, ACK, UDP or SCTP discovery
  -PE/PP/PM: ICMP echo, timestamp, and netmask request probes
  -n/-R: Never do DNS resolution/Always resolve

SCAN TECHNIQUES:
  -sS/sT/sA/sW/sM: TCP SYN/Connect()/ACK/Window/Maimon scans
  -sU: UDP Scan
  -sN/sF/sX: TCP Null, FIN, and Xmas scans

PORT SPECIFICATION:
  -p <port ranges>: Only scan specified ports (e.g., -p22; -p1-65535)
  -F: Fast mode - Scan fewer ports
  --top-ports <number>: Scan <number> most common ports

SERVICE/VERSION DETECTION:
  -sV: Probe open ports to determine service/version info
  --version-intensity <level>: Set from 0 (light) to 9 (try all probes)

SCRIPT SCAN:
  -sC: equivalent to --script=default
  --script=<Lua scripts>: Specify scripts to run

OS DETECTION:
  -O: Enable OS detection
  --osscan-guess: Guess OS more aggressively

TIMING AND PERFORMANCE:
  -T<0-5>: Set timing template (higher is faster)
  --min-rate/--max-rate <number>: Send packets at specified rate

OUTPUT:
  -oN/-oX/-oS/-oG <file>: Output in normal, XML, script kiddie, Grepable format
  -v: Increase verbosity level
  --reason: Display the reason a port is in a particular state
  --open: Only show open (or possibly open) ports

MISC:
  -6: Enable IPv6 scanning
  -A: Enable OS detection, version detection, script scanning, and traceroute`),
      },
      async ({ target, nmap_args }) => {
        // Build the nmap command - spawn() does NOT work on Vercel serverless!
        const args: string[] = [...nmap_args, target];
        const command = `nmap ${args.join(" ")}`;

        return {
          content: [{
            type: "text" as const,
            text: `To run nmap locally, execute:

${command}

Nmap is a powerful network scanning tool for:
- Port discovery and enumeration
- Service and version detection
- OS fingerprinting
- Security auditing
- Network inventory

Install nmap:
- macOS: brew install nmap
- Ubuntu/Debian: sudo apt install nmap
- Windows: Download from https://nmap.org/download.html

Note: CLI tools cannot execute on serverless platforms. Run this command on your local machine where nmap is installed. Some scan types (like SYN scan) require root/admin privileges.`
          }]
        };
      }
    );
  },
  {
    capabilities: {
      tools: {
        "do-nmap": {
          description: "Run nmap network scanning tool with specified target and arguments"
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
