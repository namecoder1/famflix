import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import { cn } from "@/lib/utils";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "MyMovies - Streaming Gratuito",
  description: "Guarda film e serie TV gratis",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="it" className="dark">
      <body className={cn(inter.className, "bg-zinc-950 text-white antialiased")}>
        <Navbar />
        {children}
      </body>
    </html>
  );
}
