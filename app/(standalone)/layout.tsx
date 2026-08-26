export default function StandaloneLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <main className="h-full w-full overflow-y-auto font-inter bg-gray-50/50">
      {children}
    </main>
  );
}
