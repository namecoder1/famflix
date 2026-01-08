import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Accedi | Famflix",
  description: "Accedi al tuo account Famflix.",
};

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
