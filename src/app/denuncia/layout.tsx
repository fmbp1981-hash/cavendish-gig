import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Canal de Denúncias | Sistema GIG",
  description: "Canal seguro e anônimo para registrar denúncias",
};

export default function DenunciaLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
