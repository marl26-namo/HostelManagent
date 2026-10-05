import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "MUBAS Smart Hostel — Booking & Management System",
    template: "%s · MUBAS Smart Hostel",
  },
  description:
    "A smart hostel booking and management system for the Malawi University of Business and Applied Sciences: room allocation, QR-code check-in, tracked receipts, maintenance voting, inspections, transfers, anonymous complaints and lost & found.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-scroll-behavior="smooth">
      <body className="min-h-screen">{children}</body>
    </html>
  );
}
