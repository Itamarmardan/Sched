import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import RegisterServiceWorker from "./RegisterServiceWorker";
import ViewportFix from "./ViewportFix";

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
      suppressHydrationWarning
    >
      <head>
        {/* Runs before first paint. iOS standalone PWAs can report an incorrect
            window/visualViewport size on cold launch (a known WebKit quirk affecting
            both dvh height and the layout viewport width), which shows up as the app
            rendering shrunk/zoomed-out or wider-than-screen and pannable until some
            later relayout (e.g. a tap) corrects it. Setting --app-height from JS and
            keeping it live via resize/orientationchange/visualViewport covers height;
            nudging the viewport meta tag forces WebKit to redo the width calculation
            immediately instead of waiting for the user to trigger it by accident. */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){function s(){var h=(window.visualViewport&&window.visualViewport.height)||window.innerHeight;document.documentElement.style.setProperty('--app-height',h+'px');}s();window.addEventListener('resize',s);window.addEventListener('orientationchange',s);if(window.visualViewport){window.visualViewport.addEventListener('resize',s);}function v(){var m=document.querySelector('meta[name="viewport"]');if(!m)return;var o=m.getAttribute('content');m.setAttribute('content',o+', maximum-scale=1');requestAnimationFrame(function(){m.setAttribute('content',o);window.scrollTo(0,0);});}v();})();`,
          }}
        />
      </head>
      <body className="min-h-full flex flex-col">
        <RegisterServiceWorker />
        <ViewportFix />
        {children}
      </body>
    </html>
  );
}
