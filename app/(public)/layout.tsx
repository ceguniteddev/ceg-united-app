export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <main className="flex h-screen w-full max-w-screen overflow-x-hidden font-inter">
      <div className="flex size-full flex-col overflow-y-auto">{children}</div>
    </main>
  );
}
