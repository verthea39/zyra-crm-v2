import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Inter, Geist } from "next/font/google";
import { Providers } from "@/components/providers";
import { cn } from "@/lib/utils";

const geist = Geist({subsets:['latin'],variable:'--font-sans'});

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "Zyra Documents Clearance CRM",
  description: "Internal CRM for Zyra Documents Clearance Services",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={cn("font-sans", geist.variable, inter.variable)}>
      <body className="antialiased min-h-screen bg-background text-foreground font-sans selection:bg-primary/20">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
