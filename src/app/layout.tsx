import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Script from "next/script";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Rush Wash - Unlimited Car Wash Subscriptions",
  description: "Saudi Arabia's Premier Subscription Car Wash Platform",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        <link
          rel="stylesheet"
          href="https://cdn.moyasar.com/mpf/1.14.0/moyasar.css"
        />
        <script
          type="module"
          src="https://applepay.cdn-apple.com/apple-pay-ui/1.0/assets/index.js"
          async
        />
      </head>
      <body className="min-h-full flex flex-col">
        {children}
        <Script
          src="https://cdn.moyasar.com/mpf/1.14.0/moyasar.js"
          strategy="lazyOnload"
        />
      </body>
    </html>
  );
}
