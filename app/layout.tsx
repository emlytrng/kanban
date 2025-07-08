import type React from "react";

import "./globals.css";
import { Inter } from "next/font/google";

import { Auth0Provider } from "@auth0/nextjs-auth0";

import { ThemeProvider } from "@/components/theme-provider";

import type { Metadata } from "next";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "kanban",
  description: "A Trello-like board with AI assistance",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <Auth0Provider>
          <ThemeProvider
            attribute="class"
            defaultTheme="light"
            enableSystem
            disableTransitionOnChange
          >
            {children}
          </ThemeProvider>
        </Auth0Provider>
      </body>
    </html>
  );
}
