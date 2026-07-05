import type { Metadata } from "next";
import { Nav } from "@/components/Nav";
import "./globals.css";

export const metadata: Metadata = {
  title: "Ode",
  description: "Visual discovery, woven from what you've already saved.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-white text-ink antialiased">
        <Nav />
        {children}
      </body>
    </html>
  );
}
