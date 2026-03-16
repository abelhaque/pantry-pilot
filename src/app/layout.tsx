import "./globals.css";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { ClientStabilityProvider } from "@/providers/ClientStabilityProvider";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Pantry Pilot",
  description: "Collaborative Kitchen Logistics Engine",
  icons: {
    icon: "/app-logo.png",
    apple: "/app-logo.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className} suppressHydrationWarning>
        <ClientStabilityProvider>
          {children}
        </ClientStabilityProvider>
      </body>
    </html>
  );
}
