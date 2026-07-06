import { createMcpHandler } from "mcp-handler";
import { z } from "zod";

/**
 * Rejects any string that contains characters that cannot appear in a safe
 * nmap target or flag value:
 *   - Control characters (includes \n, \r, \0, \t, etc.)
 *   - Backtick, $( ), semicolon, pipe, ampersand — classic shell-injection vectors
 *   - Null bytes
 *
 * This runs AFTER Zod trims whitespace, so a purely-whitespace input is caught
 * by the .min(1) guard first.
 */
const DISALLOWED_CHARS = /[\x00-\x1F\x7F`$;|&(){}\\<>]/;

const safeString = z
  .string()
  .trim()
  .min(1, "Value must not be empty")
  .refine(
    (s) => !DISALLOWED_CHARS.test(s),
    "Value contains disallowed characters (control chars, shell metacharacters)"
  );

/**
 * Shell-escapes a single argument for POSIX shells (bash/sh/zsh).
 *
 * Strategy:
 *   1. If the value is already safe (alphanumeric + a small allow-list of
 *      nmap-specific chars), pass it through unquoted.
 *   2. Otherwise single-quote it.  Inside single quotes the only character
 *      that needs special handling is a literal single-quote itself, which is
 *      closed, escaped, and re-opened: foo'bar -> 'foo'\''bar'
 *
 * After safeString validation, control characters and shell metacharacters are
 * already rejected, so this is a defence-in-depth measure for any values that
 * slip through (e.g. spaces, colons, commas in port ranges like "1-65535").
 */
function shellEscape(value: string): string {
  // Fast-path: characters that never need quoting in nmap usage
  if (/^[A-Za-z0-9_/.\-:,+=@%^~[\]]+$/.test(value)) {
    return value;
  }
  // Single-quote wrap with internal single-quote escaping
  return `'${value.replace(/'/g, "'\\''")}'`;
}

const handler = createMcpHandler(
  async (server) => {
    server.registerTool(
      "do-nmap",
      {
        title: "do-nmap",
        description:
          "Generate an nmap command string for port scanning and network discovery. " +
          "Because CLI tools cannot execute on Vercel serverless, the command is returned " +
          "for the user to run on their local machine where nmap is installed.",
        inputSchema: z.object({
          target: safeString.describe(
            "IP address, hostname, or CIDR range to scan (e.g. 192.168.1.1, example.com, 10.0.0.0/24)."
          ),
          nmap_args: z
            .array(safeString)
            .max(50, "Too many arguments")
            .optional()
            .describe(
              "Additional nmap flags as separate array elements, e.g. [\"-sV\", \"-p\", \"1-1000\", \"-T4\"]. " +
              "See https://nmap.org/book/man.html for the full reference."
            ),
        }),
      },
      async ({ target, nmap_args }) => {
        // Validation has already ensured target and every nmap_arg is free of
        // shell metacharacters; shellEscape adds a final quoting layer for
        // values that contain spaces or other benign-but-special characters.
        const args: string[] = [
          ...(nmap_args ?? []).map(shellEscape),
          shellEscape(target),
        ];

        const command = `nmap ${args.join(" ")}`;

        return {
          content: [
            {
              type: "text",
              text: [
                "Run the following command on your local machine where nmap is installed:",
                "",
                "```",
                command,
                "```",
                "",
                "Common usage examples:",
                "  Basic scan:          nmap 192.168.1.1",
                "  Service detection:   nmap -sV 192.168.1.1",
                "  Aggressive scan:     nmap -A 192.168.1.1",
                "  Port range:          nmap -p 1-1000 192.168.1.1",
                "  Top 100 ports fast:  nmap -F --top-ports 100 192.168.1.1",
                "  OS + version:        nmap -O -sV 192.168.1.1",
                "",
                "Full nmap reference: https://nmap.org/book/man.html",
              ].join("\n"),
            },
          ],
        };
      }
    );
  },
  {
    capabilities: {
      tools: {
        "do-nmap": {
          description:
            "Generate an nmap command string for port scanning and network discovery",
        },
      },
    },
  },
  {
    basePath: "",
    verboseLogs: true,
    maxDuration: 60,
    disableSse: true,
  }
);

export { handler as GET, handler as POST, handler as DELETE };
