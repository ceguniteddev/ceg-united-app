// app/(public)/layout.tsx
import RecaptchaGate from "@/components/RecaptchaGate";

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <RecaptchaGate />
    </>
  );
}
