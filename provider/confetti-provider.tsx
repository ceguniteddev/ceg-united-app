"use client";

import ConfettiExplosion, { ConfettiProps } from "react-confetti-explosion";
import { useConfettiStore } from "@/hooks/use-confetti-store";

export const ConfettiProvider = () => {
  const { isOpen, onClose } = useConfettiStore();

  const confettiProps: ConfettiProps = {
    particleCount: 200,
    duration: 4000,
    force: 0.8,
    width: 1600,
    onComplete: onClose,
    zIndex: 9999,
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 flex items-center justify-center pointer-events-none z-[9999]">
      <ConfettiExplosion {...confettiProps} />
    </div>
  );
};
