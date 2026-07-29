import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import RegisterServiceWorker from "./RegisterServiceWorker";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Sched",
  description: "Personal dashboard: calendar, reminders, notes, people, tasks, projects, goals, and log.",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Sched",
  },
  icons: {
    icon: [
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/icons/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
};

export const viewport: Viewport = {
  themeColor: "#ffffff",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
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
      <head>
        {/* Runs before first paint. iOS standalone PWAs can report an incorrect
            window/visualViewport height on cold launch (a known WebKit quirk with
            dvh units), which shows up as the app rendering shrunk until a relayout
            corrects it. Setting --app-height from JS and keeping it live via resize/
            orientationchange/visualViewport is a more reliable cross-version fallback
            than relying on CSS dvh alone. */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){function s(){var h=(window.visualViewport&&window.visualViewport.height)||window.innerHeight;document.documentElement.style.setProperty('--app-height',h+'px');}s();window.addEventListener('resize',s);window.addEventListener('orientationchange',s);if(window.visualViewport){window.visualViewport.addEventListener('resize',s);}})();`,
          }}
        />
      </head>
      <body className="min-h-full flex flex-col">
        <RegisterServiceWorker />
        {children}
      </body>
    </html>
  );
}
