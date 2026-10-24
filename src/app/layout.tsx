import type { Metadata } from "next";
import { Suspense } from "react";
import "./globals.css";
import { MaterialProvider } from "@/context/MaterialContext";
import { FeaturesProvider } from "@/features/components/FeaturesProvider";
import { ThemeProvider } from "@/context/ThemeContext";
import { Sidebar } from "@/components/Sidebar";
import { QuickActionsMenu } from "@/components/ui/QuickActionsMenu";
import { CollaborationDialog } from "@/features/components/CollaborationDialog";
import { MySpaceDialog } from "@/features/personal"; // [PERSONAL]
import { ToastProvider } from "@/components/ui/Toast";

export const metadata: Metadata = {
  title: "Thinklet — Smart, Cute & Modern Educational Companion",
  description:
    "Delightful AI study app with source-grounded learning, diagnostic quizzes, 3D flashcards, and personalized revision plans.",
  manifest: "/manifest.json",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className="h-full antialiased"
      style={{ backgroundColor: "var(--bg)", color: "var(--text-primary)" }}
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var s=localStorage.getItem('theme');var d=window.matchMedia('(prefers-color-scheme: dark)').matches;if(s==='dark'||((!s||s==='system')&&d)){document.documentElement.classList.add('dark');document.documentElement.setAttribute('data-theme','dark');document.documentElement.style.colorScheme='dark';}else{document.documentElement.classList.remove('dark');document.documentElement.setAttribute('data-theme','light');document.documentElement.style.colorScheme='light';}}catch(e){}})();`,
          }}
        />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Quicksand:wght@500;600;700&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Lexend:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body
        className="h-full flex flex-col md:flex-row overflow-hidden select-text"
        style={{
          backgroundColor: "var(--bg)",
          color: "var(--text-primary)",
          fontFamily: "var(--font-family)",
        }}
      >
        <ThemeProvider>
          <FeaturesProvider>
            <MaterialProvider>
              <ToastProvider>
                <Suspense fallback={<div style={{ width: "64px", backgroundColor: "var(--panel)" }} />}>
                  <Sidebar />
                </Suspense>
              <main
                className="flex-1 flex flex-col h-[calc(100vh-3.5rem)] md:h-screen overflow-y-auto min-w-0"
                style={{
                  backgroundColor: "var(--bg)",
                  color: "var(--text-primary)",
                }}
              >
                <Suspense
                  fallback={
                    <div style={{ padding: "32px", textAlign: "center", color: "var(--text-secondary)" }}>
                      Loading Thinklet...
                    </div>
                  }
                >
                  {children}
                </Suspense>
              </main>
              {/* Global Quick Actions Arc Menu */}
              <QuickActionsMenu />
              {/* Student Collaboration Dialog */}
              <CollaborationDialog />
              {/* Personal Study Sanctuary & Relax Dialog */}
              <MySpaceDialog /> {/* [PERSONAL] */}
            </ToastProvider>
          </MaterialProvider>
        </FeaturesProvider>
      </ThemeProvider>
      </body>
    </html>
  );
}
