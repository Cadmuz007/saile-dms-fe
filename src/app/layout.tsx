import type { Metadata } from "next";
import { AppRouterCacheProvider } from "@mui/material-nextjs/v15-appRouter";
import "./globals.css";

export const metadata: Metadata = {
  title: "Saile DMS Admin Console | Bureau of the Treasury",
  description: "Saile DMS administration console for the Bureau of the Treasury.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className="h-full antialiased font-sans">
      <body className="min-h-full flex flex-col"><AppRouterCacheProvider>{children}</AppRouterCacheProvider></body>
    </html>
  );
}
