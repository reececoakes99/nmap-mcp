export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <title>OSINT Tools MCP Server</title>
      </head>
      <body>
        {children}
      </body>
    </html>
  );
}
