import "./globals.css";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { HouseholdProvider } from "@/providers/HouseholdProvider";
import { Navbar } from "@/components/Navbar";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Pantry Pilot",
  description: "Collaborative Kitchen Logistics Engine",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <HouseholdProvider>
          <Navbar />
          <div className="min-h-screen pb-24">
            {children}
          </div>
        </HouseholdProvider>
      </body>
    </html>
  );
}

