export default function AppLayout({ children }: { children: React.ReactNode }) {
  return <main className="px-4 sm:px-6 pt-8 mobile-content-offset">{children}</main>;
}
