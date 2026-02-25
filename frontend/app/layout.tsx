import type { ReactNode } from "react";
import { Cairo } from "next/font/google";
import "../theme/globals.css";

const cairo = Cairo({
  subsets: ["arabic", "latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
  display: "swap",
  variable: "--font-cairo",
});

export const metadata = {
  title: "Cyber IDS Platform",
  description: "Advanced AI-Powered Intrusion Detection System",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ar" dir="rtl" className={`dark ${cairo.variable}`}>
      <body
        style={{
          minHeight: "100vh",
          background: "#070A18",
          color: "#e0eaff",
          fontFamily: "var(--font-cairo), Inter, sans-serif",
          WebkitFontSmoothing: "antialiased",
          overflowX: "hidden",
          margin: 0,
          padding: 0,
        }}
      >
        {children}
      </body>
    </html>
  );
}
