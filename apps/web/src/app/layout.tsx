import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";
import { Toaster } from "@/components/ui/toaster";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "JSONTools — JSON Compare, Beautify & Validate",
  description:
    "Enterprise-grade JSON comparison, validation, and transformation platform. Compare two JSONs side-by-side, export reports, and automate via API.",
  keywords: ["JSON compare", "JSON diff", "JSON beautify", "JSON validate", "API"],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning className="dark">
      <body className={`${inter.variable} font-sans`}>
        <Providers>{children}</Providers>
        <Toaster />
      </body>
    </html>
  );
}
