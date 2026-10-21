import KBShell from "@/components/kb-shell";

export default function KBLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <KBShell>{children}</KBShell>;
}
