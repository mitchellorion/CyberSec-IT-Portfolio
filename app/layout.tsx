import type { Metadata } from "next";
import "./globals.css";
import Nav from "@/components/Nav";
import { AuthProvider } from "@/lib/auth";

export const metadata: Metadata = {
  title: "flipstats — flip.gg Stats Tracker",
  description: "Track your flip.gg stats, profit & loss, leaderboards, and more.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          <Nav />
          <main className="max-w-6xl mx-auto px-4 py-8">{children}</main>
          <footer
            className="text-center py-6 text-xs mt-12"
            style={{ color: "var(--text-muted)", borderTop: "1px solid var(--border)" }}
          >
            flipstats is not affiliated with flip.gg · data is for informational purposes only
          </footer>
        </AuthProvider>
      </body>
    </html>
  );
}
