import os
import subprocess
import shlex
from fastmcp import FastMCP

# Create the MCP server
mcp = FastMCP("nmap-mcp")

@mcp.tool()
def do_nmap(target: str, nmap_args: list[str] = None) -> str:
    """
    Run nmap with specified target for port scanning and network discovery.

    Args:
        target: Target IP address or hostname to scan for open ports
        nmap_args: Additional nmap arguments. Examples:
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
              -v: Increase verbosity level
              --open: Only show open (or possibly open) ports
    """
    # Build the nmap command
    cmd = ["nmap"]
    
    if nmap_args:
        cmd.extend(nmap_args)
    
    cmd.append(target)
    
    try:
        # Run nmap with a timeout
        result = subprocess.run(
            cmd,
            capture_output=True,
            text=True,
            timeout=300  # 5 minute timeout
        )
        
        output = ""
        if result.stdout:
            output += result.stdout
        if result.stderr:
            output += "\n" + result.stderr
        
        if result.returncode == 0:
            return f"nmap completed successfully:\n\n{output}"
        else:
            return f"nmap exited with code {result.returncode}:\n\n{output}"
            
    except subprocess.TimeoutExpired:
        return "Error: nmap scan timed out after 5 minutes"
    except FileNotFoundError:
        return "Error: nmap binary not found. Please ensure nmap is installed."
    except Exception as e:
        return f"Error running nmap: {str(e)}"


# CRITICAL: Use SSE transport with correct host/port binding!
if __name__ == "__main__":
    # Get port from environment (Render sets this automatically)
    port = int(os.getenv("PORT", 8000))
    
    mcp.run(
        transport="sse",              # SSE transport for remote connections
        host="0.0.0.0",               # MUST bind to 0.0.0.0 for containers
        port=port,                    # Use PORT from environment
        path="/mcp"                   # MCP endpoint path (SSE at /mcp/sse, HTTP at /mcp)
    )
