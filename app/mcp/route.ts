import { createMcpHandler } from "mcp-handler";
import { z } from "zod";

const handler = createMcpHandler(
  async (server) => {
    // Tool 1: Sherlock Username Search
    server.tool(
      "sherlock_username_search",
      "Search for username across 399+ social media platforms and websites. Returns the command to run locally since CLI tools cannot execute on serverless.",
      {
        username: z.string().describe("Username to search for"),
        timeout: z.number().optional().describe("Timeout in seconds (default: 10000)"),
        sites: z.array(z.string()).optional().describe("Specific sites to search"),
        output_format: z.enum(["txt", "csv", "xlsx"]).optional().describe("Output format"),
      },
      async ({ username, timeout, sites, output_format }) => {
        const args: string[] = [username];
        if (timeout) args.push("--timeout", String(timeout));
        if (sites && sites.length > 0) {
          for (const site of sites) {
            args.push("--site", site);
          }
        }
        if (output_format === "csv") args.push("--csv");
        else if (output_format === "xlsx") args.push("--xlsx");

        const command = `sherlock ${args.join(" ")}`;

        return {
          content: [{
            type: "text" as const,
            text: `To run Sherlock locally, execute:\n\n${command}\n\nSherlock searches for usernames across 399+ social media platforms. Install with: pip install sherlock-project\n\nNote: CLI tools cannot execute on serverless platforms. Run this command on your local machine where sherlock is installed.`
          }]
        };
      }
    );

    // Tool 2: Holehe Email Search
    server.tool(
      "holehe_email_search",
      "Check if email is registered on 120+ platforms. Returns the command to run locally since CLI tools cannot execute on serverless.",
      {
        email: z.string().describe("Email address to investigate"),
        only_used: z.boolean().optional().describe("Show only registered accounts (default: true)"),
        timeout: z.number().optional().describe("Request timeout in seconds (default: 10000)"),
      },
      async ({ email, only_used, timeout }) => {
        const args: string[] = [email];
        if (timeout) args.push("--timeout", String(timeout));
        if (only_used !== false) args.push("--only-used");

        const command = `holehe ${args.join(" ")}`;

        return {
          content: [{
            type: "text" as const,
            text: `To run Holehe locally, execute:\n\n${command}\n\nHolehe checks if an email is registered on 120+ platforms without alerting the account owner. Install with: pip install holehe\n\nNote: CLI tools cannot execute on serverless platforms. Run this command on your local machine where holehe is installed.`
          }]
        };
      }
    );

    // Tool 3: SpiderFoot Scan
    server.tool(
      "spiderfoot_scan",
      "Comprehensive OSINT scan - auto-detects target type (IP, IPv6, domain, email, phone, username, person name, Bitcoin address, network block, BGP AS). Returns the command to run locally.",
      {
        target: z.string().describe("Target to scan - SpiderFoot auto-detects type from: IP address, IPv6 address, domain, email, phone number, username, person name, Bitcoin address, network block, or BGP AS"),
      },
      async ({ target }) => {
        const escapedTarget = target.replace(/(["\\`$])/g, "\\$1").replace(/\r?\n/g, " ");
        const command = `python3 /opt/spiderfoot/sf.py -s "${escapedTarget}" -u all -o json -q`;
        return {
          content: [{
            type: "text" as const,
            text: `To run SpiderFoot locally, execute:\n\n${command}\n\nSpiderFoot performs comprehensive OSINT reconnaissance and auto-detects target types including:\n- IP/IPv6 addresses\n- Domains\n- Email addresses\n- Phone numbers\n- Usernames\n- Person names\n- Bitcoin addresses\n- Network blocks\n- BGP AS numbers\n\nInstall SpiderFoot from: https://github.com/smicallef/spiderfoot\n\nNote: CLI tools cannot execute on serverless platforms. Run this command on your local machine where SpiderFoot is installed.`
          }]
        };
      }
    );

    // Tool 4: GHunt Google Search
    server.tool(
      "ghunt_google_search",
      "Search for Google account information using email address or Google ID. Returns the command to run locally since CLI tools cannot execute on serverless.",
      {
        identifier: z.string().describe("Email address or Google ID to search"),
      },
      async ({ identifier }) => {
        const command = `ghunt email ${identifier}`;

        return {
          content: [{
            type: "text" as const,
            text: `To run GHunt locally, execute:\n\n${command}\n\nGHunt extracts information from Google accounts including:\n- Profile photos\n- Google Maps reviews\n- YouTube channel\n- Google Calendar events\n- And more\n\nInstall with: pip install ghunt\n\nNote: GHunt requires authentication setup. CLI tools cannot execute on serverless platforms. Run this command on your local machine where ghunt is installed and configured.`
          }]
        };
      }
    );

    // Tool 5: Maigret Username Search
    server.tool(
      "maigret_username_search",
      "Search for username across 3000+ sites with detailed analysis and false positive detection. Returns the command to run locally since CLI tools cannot execute on serverless.",
      {
        username: z.string().describe("Username to search for"),
        timeout: z.number().optional().describe("Timeout in seconds (default: 10000)"),
      },
      async ({ username, timeout }) => {
        const args: string[] = [username];
        if (timeout) args.push("--timeout", String(timeout));
        args.push("--json");

        const command = `maigret ${args.join(" ")}`;

        return {
          content: [{
            type: "text" as const,
            text: `To run Maigret locally, execute:\n\n${command}\n\nMaigret searches for usernames across 3000+ sites with:\n- Detailed profile analysis\n- False positive detection\n- Cross-platform correlation\n- JSON output for further processing\n\nInstall with: pip install maigret\n\nNote: CLI tools cannot execute on serverless platforms. Run this command on your local machine where maigret is installed.`
          }]
        };
      }
    );

    // Tool 6: theHarvester Domain Search
    server.tool(
      "theharvester_domain_search",
      "Gather emails, subdomains, hosts, employee names, open ports and banners from public sources. Returns the command to run locally since CLI tools cannot execute on serverless.",
      {
        domain: z.string().describe("Domain/company name to search"),
        sources: z.string().optional().describe("Data sources (default: all). Options: baidu, bing, certspotter, crtsh, dnsdumpster, duckduckgo, google, hackertarget, hunter, linkedin, otx, projectdiscovery, qwant, rapiddns, securityTrails, sublist3r, threatcrowd, threatminer, urlscan, virustotal, yahoo"),
        limit: z.number().optional().describe("Limit results (default: 500)"),
      },
      async ({ domain, sources, limit }) => {
        const args: string[] = ["-d", domain];
        args.push("-b", sources || "all");
        args.push("-l", String(limit || 500));

        const command = `theHarvester ${args.join(" ")}`;

        return {
          content: [{
            type: "text" as const,
            text: `To run theHarvester locally, execute:\n\n${command}\n\ntheHarvester gathers:\n- Email addresses\n- Subdomains\n- Hosts\n- Employee names\n- Open ports\n- Banners\n\nFrom public sources including: Google, Bing, LinkedIn, DNSdumpster, and many more.\n\nInstall with: pip install theHarvester\n\nNote: CLI tools cannot execute on serverless platforms. Run this command on your local machine where theHarvester is installed.`
          }]
        };
      }
    );

    // Tool 7: Blackbird Username Search
    server.tool(
      "blackbird_username_search",
      "Fast OSINT tool to search for accounts by username across 581 sites. Returns the command to run locally since CLI tools cannot execute on serverless.",
      {
        username: z.string().describe("Username to search for"),
        timeout: z.number().optional().describe("Timeout in seconds (default: 10000)"),
      },
      async ({ username, timeout }) => {
        const args: string[] = ["-u", username];
        if (timeout) args.push("--timeout", String(timeout));

        const command = `python3 /opt/blackbird/blackbird.py ${args.join(" ")}`;

        return {
          content: [{
            type: "text" as const,
            text: `To run Blackbird locally, execute:\n\n${command}\n\nBlackbird is a fast OSINT tool that searches for accounts across 581 sites.\n\nInstall from: https://github.com/p1ngul1n0/blackbird\n\nNote: CLI tools cannot execute on serverless platforms. Run this command on your local machine where blackbird is installed.`
          }]
        };
      }
    );
  },
  {},
  {
    basePath: "",
    verboseLogs: true,
    maxDuration: 60,
    disableSse: true,
  }
);

export { handler as GET, handler as POST, handler as DELETE };
