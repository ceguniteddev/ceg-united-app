import Sidebar from "@/components/SidebarAdmin";

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <main className="flex h-screen w-full font-inter">
      <Sidebar />

      <div className="flex size-full flex-col overflow-y-auto">{children}</div>
    </main>
  );
}
