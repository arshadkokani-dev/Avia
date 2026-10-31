import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import DashboardShell from "../src/components/dashboard/DashboardShell";
import { AuthProvider } from "../src/components/auth/AuthProvider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "AVIA — Personal Life OS",
  description:
    "Build better habits, achieve your goals, and create a more balanced life with AVIA.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full">
        <AuthProvider>
          <DashboardShell>{children}</DashboardShell>
        </AuthProvider>
      </body>
    </html>
  );
}