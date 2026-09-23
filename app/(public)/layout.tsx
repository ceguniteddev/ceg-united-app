export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen min-h-[100dvh] w-full max-w-screen overflow-x-hidden font-inter">
      <div className="flex size-full flex-col min-h-screen min-h-[100dvh]">
        {children}
      </div>
    </div>
  );
}
