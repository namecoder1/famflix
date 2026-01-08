import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Il tuo Profilo | Famflix",
  description: "Visualizza le tue statistiche e la cronologia di visione.",
};

export default function ProfileLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
