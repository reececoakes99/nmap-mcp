import os
import subprocess
import re
import xml.etree.ElementTree as ET
from fastmcp import FastMCP

# Create the MCP server
mcp = FastMCP("nmap-mcp")

SAFE_TARGET_PATTERN = re.compile(r"^[A-Za-z0-9.\-:/]+$")
DISALLOWED_ARG_PREFIXES = ("-oA", "-oN", "-oG", "-oS", "-oX", "--stylesheet")


def _parse_nmap_xml(xml_output: str) -> dict:
    hosts: list[dict] = []

    if not xml_output.strip():
        return {"hosts": hosts}

    root = ET.fromstring(xml_output)
    for host in root.findall("host"):
        addresses = [addr.get("addr") for addr in host.findall("address") if addr.get("addr")]
        hostnames = [
            hostname.get("name")
            for hostname in host.findall("hostnames/hostname")
            if hostname.get("name")
        ]

        ports: list[dict] = []
        for port in host.findall("ports/port"):
            state_el = port.find("state")
            service_el = port.find("service")
            ports.append(
                {
                    "protocol": port.get("protocol"),
                    "port": port.get("portid"),
                    "state": state_el.get("state") if state_el is not None else None,
                    "service": service_el.get("name") if service_el is not None else None,
                    "product": service_el.get("product") if service_el is not None else None,
                    "version": service_el.get("version") if service_el is not None else None,
                }
            )

        hosts.append(
            {
                "addresses": addresses,
                "hostnames": hostnames,
                "status": (host.find("status").get("state") if host.find("status") is not None else None),
                "ports": ports,
            }
        )

    return {"hosts": hosts}


def _validate_input(target: str, nmap_args: list[str] | None) -> tuple[bool, str]:
    if not target or not SAFE_TARGET_PATTERN.match(target):
        return False, "Invalid target. Use a valid hostname, IP, or CIDR."

    if not nmap_args:
        return True, ""

    for arg in nmap_args:
        if not isinstance(arg, str) or not arg.strip():
            return False, "Invalid nmap_args item. All args must be non-empty strings."
        if any(prefix == arg or arg.startswith(f"{prefix}=") for prefix in DISALLOWED_ARG_PREFIXES):
            return False, "Output file arguments are not allowed."
        if any(char in arg for char in (";", "&", "|", "`", "$", "\n", "\r")):
            return False, "Unsupported characters in nmap args."

    return True, ""


@mcp.tool()
def do_nmap(target: str, nmap_args: list[str] | None = None) -> dict:
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
    valid, validation_error = _validate_input(target=target, nmap_args=nmap_args)
    if not valid:
        return {"ok": False, "error": validation_error}

    # Build the nmap command (always force XML to stdout for structured parsing)
    cmd = ["nmap"]

    if nmap_args:
        cmd.extend(nmap_args)

    cmd.extend(["-oX", "-"])
    cmd.append(target)

    try:
        # Run nmap with a timeout
        result = subprocess.run(
            cmd,
            capture_output=True,
            text=True,
            timeout=300  # 5 minute timeout
        )
        parsed = _parse_nmap_xml(result.stdout) if result.stdout else {"hosts": []}

        if result.returncode == 0:
            return {
                "ok": True,
                "target": target,
                "command": cmd,
                "return_code": result.returncode,
                "results": parsed,
                "stderr": result.stderr or "",
            }
        else:
            return {
                "ok": False,
                "target": target,
                "command": cmd,
                "return_code": result.returncode,
                "error": result.stderr or "nmap exited with a non-zero code",
                "raw_xml": result.stdout or "",
            }

    except ET.ParseError:
        return {
            "ok": False,
            "target": target,
            "command": cmd,
            "error": "Failed to parse nmap XML output",
        }
    except subprocess.TimeoutExpired:
        return {
            "ok": False,
            "target": target,
            "command": cmd,
            "error": "nmap scan timed out after 5 minutes",
        }
    except FileNotFoundError:
        return {
            "ok": False,
            "target": target,
            "command": cmd,
            "error": "nmap binary not found. Please ensure nmap is installed.",
        }
    except Exception as e:
        return {
            "ok": False,
            "target": target,
            "command": cmd,
            "error": f"Error running nmap: {str(e)}",
        }


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
