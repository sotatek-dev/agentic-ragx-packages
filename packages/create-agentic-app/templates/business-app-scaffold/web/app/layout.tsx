import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Business App Scaffold",
  description: "Minimal business app using @sotatek-dev/agentic-core-react and @sotatek-dev/agentic-core-sdk",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
