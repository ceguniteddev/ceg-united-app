export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <main className="flex min-h-screen w-full max-w-screen overflow-x-hidden font-inter">
      <div className="flex size-full flex-col pb-24 md:pb-0">{children}</div>
    </main>
  );
}
