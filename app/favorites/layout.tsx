import { Metadata } from "next";

export const metadata: Metadata = {
  title: "I tuoi Preferiti | Famflix",
  description: "Tutti i film e le serie TV che ami in un unico posto.",
};

export default function FavoritesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
