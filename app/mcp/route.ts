import { createMcpHandler } from "mcp-handler";
import { z } from "zod";

const shellQuote = (value: string) => `'${value.replace(/'/g, `'"'"'`)}'`;

const toolDescription =
  "Run WPScan to analyze WordPress websites. On Vercel this generates a command to run locally because CLI processes cannot execute on serverless infrastructure.";

const handler = createMcpHandler(
  async (server) => {
    server.tool(
      "do-wpscan",
      toolDescription,
      {
        url: z.string().url().describe(
          "The target WordPress website URL to scan. Must be a valid URL starting with http:// or https://",
        ),
        detection_mode: z.enum(["mixed", "passive", "aggressive"]).optional().describe(
          "Scan detection mode: 'mixed' (default), 'passive' (non-intrusive), or 'aggressive' (thorough but detectable)",
        ),
        random_user_agent: z.boolean().optional().describe(
          "Enable random user agent rotation for each request to avoid detection",
        ),
        max_threads: z.number().optional().describe(
          "Maximum concurrent scanning threads. Default is 5; higher values may trigger rate limiting",
        ),
        disable_tls_checks: z.boolean().optional().describe(
          "Disable SSL/TLS certificate verification and allow TLS 1.0+ connections",
        ),
        proxy: z.string().optional().describe(
          "Proxy server in protocol://IP:port format, for example http://127.0.0.1:8080",
        ),
        cookies: z.string().optional().describe(
          "Custom cookies formatted as name1=value1; name2=value2",
        ),
        force: z.boolean().optional().describe(
          "Skip WordPress detection and 403 checks when the target is known to run WordPress",
        ),
        enumerate: z.array(z.enum(["vp", "ap", "p", "vt", "at", "t", "tt", "cb", "dbe"])).describe(
          "Enumeration options: vp vulnerable plugins, ap all plugins, p popular plugins, vt vulnerable themes, at all themes, t popular themes, tt Timthumb, cb configuration backups, dbe database exports. Only one of vp/ap/p and one of vt/at/t may be used.",
        ),
      },
      async ({ url, detection_mode, random_user_agent, max_threads, disable_tls_checks, proxy, cookies, force, enumerate }) => {
        const args: string[] = ["-u", url];
        if (detection_mode) args.push("--detection-mode", detection_mode);
        if (random_user_agent) args.push("--random-user-agent");
        if (max_threads !== undefined) args.push("-t", String(max_threads));
        if (disable_tls_checks) args.push("--disable-tls-checks");
        if (proxy) args.push("--proxy", proxy);
        if (cookies) args.push("--cookie-string", cookies);
        if (force) args.push("--force");
        if (enumerate.length > 0) args.push("-e", enumerate.join(","));

        const command = `wpscan ${args.map(shellQuote).join(" ")}`;
        return {
          content: [{
            type: "text" as const,
            text: `WPScan cannot run inside Vercel's serverless runtime. Run this command locally where WPScan is installed:\n\n${command}\n\nOnly scan websites you own or have explicit authorization to test.`,
          }],
        };
      },
    );
  },
  {
    capabilities: {
      tools: {
        "do-wpscan": { description: toolDescription },
      },
    },
  },
  {
    basePath: "",
    verboseLogs: true,
    maxDuration: 60,
    disableSse: true,
  },
);

export { handler as GET, handler as POST, handler as DELETE };
