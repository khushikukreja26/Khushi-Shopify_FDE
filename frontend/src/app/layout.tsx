import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = { title: "Insights Dashboard", description: "Shopify Store Analytics" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen text-gray-900`}>
        <div className="max-w-6xl mx-auto p-4 md:p-6">
          <div className="mb-6 card p-4 md:p-5 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="size-9 rounded-xl bg-brand-100 border border-brand-200 flex items-center justify-center">
                <span className="text-brand-700 font-semibold">X</span>
              </div>
              <div>
                <div className="font-semibold tracking-tight text-gray-900">Insights Dashboard</div>
                <div className="text-xs text-gray-500">Shopify Store Analytics</div>
              </div>
            </div>
          </div>
          {children}
        </div>
      </body>
    </html>
  );
}
