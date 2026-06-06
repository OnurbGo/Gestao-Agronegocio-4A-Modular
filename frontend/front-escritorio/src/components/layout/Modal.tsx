import { useEffect } from "react";
import type { ReactNode } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/utils/cn";

const sizeClasses = {
  md: "max-w-2xl",
  lg: "max-w-4xl",
  xl: "max-w-6xl",
};

type ModalWidth = keyof typeof sizeClasses;

type ModalProps = {
  children: ReactNode;
  contentClassName?: string;
  onClose: () => void;
  title: ReactNode;
  width?: ModalWidth;
};

function Modal({
  children,
  contentClassName,
  onClose,
  title,
  width = "md",
}: ModalProps) {
  const sizeClass = sizeClasses[width] || sizeClasses.md;

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, []);

  return (
    <div
      aria-modal="true"
      className="fixed inset-0 z-[60] flex items-center justify-center bg-emerald-950/45 p-3 sm:p-4"
      onMouseDown={onClose}
      role="dialog"
    >
      <section
        className={`flex max-h-[92vh] w-full flex-col overflow-hidden rounded-lg border border-emerald-100 bg-white shadow-2xl ${sizeClass}`}
        onMouseDown={(event) => event.stopPropagation()}
      >
        <header className="flex shrink-0 items-center justify-between gap-3 border-b border-emerald-100 bg-emerald-700 px-4 py-3 text-white">
          <h2 className="m-0 text-lg font-bold leading-tight">{title}</h2>
          <Button
            aria-label="Fechar"
            className="border-white/30 bg-white/10 text-white hover:bg-white/20"
            onClick={onClose}
            size="icon"
            type="button"
            variant="outline"
          >
            <X aria-hidden="true" className="h-4 w-4" />
          </Button>
        </header>
        <div
          className={cn(
            "min-h-0 flex-1 overflow-y-auto p-4 sm:p-5",
            contentClassName,
          )}
        >
          {children}
        </div>
      </section>
    </div>
  );
}

export default Modal;
