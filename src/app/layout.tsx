import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { HouseholdProvider } from "@/providers/HouseholdProvider";

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
          {children}
        </HouseholdProvider>
      </body>
    </html>
  );
}
