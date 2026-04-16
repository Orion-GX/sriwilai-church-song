import { HomepageFooter } from "@/components/homepage/homepage-footer";
import { FavoritesBootstrap } from "@/components/providers/favorites-bootstrap";
import { QueryProvider } from "@/components/providers/query-provider";
import { SetlistsBootstrap } from "@/components/providers/setlists-bootstrap";
import { ThemeProvider } from "@/components/providers/theme-provider";
import type { Metadata } from "next";
import { Bai_Jamjuree } from "next/font/google";
import "./globals.css";

const baiJamjuree = Bai_Jamjuree({
  subsets: ["latin", "thai"],
  weight: ["200", "300", "400", "500", "600", "700"],
  style: ["normal", "italic"],
  display: "swap",
  variable: "--font-sans",
});

export const metadata: Metadata = {
  title: "Worship Chord",
  description: "Worship Chord and song app",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="th" suppressHydrationWarning>
      <body className={`${baiJamjuree.variable} min-h-screen font-sans`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <QueryProvider>
            <FavoritesBootstrap />
            <SetlistsBootstrap />
            {children}
            <HomepageFooter />
          </QueryProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
