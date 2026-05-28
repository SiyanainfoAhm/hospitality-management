import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "react-hot-toast";
import { Providers } from "@/components/providers/auth-provider";

export const metadata: Metadata = {
  title: "Smart Hospitality Management System",
  description: "Cloud-based solution for 82-room institutional guest house operations",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        <Providers>{children}</Providers>
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 3000,
            style: {
              background: "#1E2A44",
              color: "#fff",
              borderRadius: "12px",
            },
          }}
        />
      </body>
    </html>
  );
}
