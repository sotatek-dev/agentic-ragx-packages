import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Audit Agent",
  description:
    "Financial document audit workspace powered by Agentic Core.",
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
