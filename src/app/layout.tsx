import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "RESPAK ERP",
    template: "%s | RESPAK ERP",
  },
  description: "RESPAK Construction ERP — Procurement, Inventory, Finance, HR & Payroll, Vehicle Tracking, Vendor & Client Management, Site Management",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen bg-background font-sans antialiased">{children}</body>
    </html>
  );
}
