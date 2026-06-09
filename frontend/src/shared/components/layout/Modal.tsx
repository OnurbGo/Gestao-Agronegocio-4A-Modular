import type { ReactNode } from "react";
import {
  Dialog,
  DialogCloseButton,
  DialogContent,
  DialogTitle,
} from "@/shared/components/ui/dialog";
import { cn } from "@/shared/utils/cn";

const sizeValues = {
  md: "42rem",
  lg: "56rem",
  xl: "72rem",
};

type ModalWidth = keyof typeof sizeValues;

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
  const modalWidth = sizeValues[width] || sizeValues.md;

  return (
    <Dialog
      open
      onOpenChange={(isOpen) => {
        if (!isOpen) {
          onClose();
        }
      }}
    >
      <DialogContent
        style={{
          width: `min(${modalWidth}, calc(100vw - 2rem))`,
          height: "min(760px, calc(100dvh - 2rem))",
          maxWidth: "calc(100vw - 2rem)",
          maxHeight: "calc(100dvh - 2rem)",
        }}
        className={cn(
          "z-[60] flex flex-col overflow-hidden rounded-xl border border-emerald-100 bg-white p-0 shadow-2xl",
        )}
      >
        <header
          className={cn(
            "relative flex shrink-0 items-center border-b border-emerald-600",
            "bg-emerald-700 px-5 py-4 pr-16 text-white sm:px-6",
          )}
        >
          <DialogTitle
            className={cn(
              "m-0 flex min-w-0 items-center gap-2 text-xl font-bold leading-tight text-white",
              "sm:text-2xl",
            )}
          >
            {title}
          </DialogTitle>

          <DialogCloseButton
            aria-label="Fechar"
            className={cn(
              "absolute right-4 top-1/2 z-30 -translate-y-1/2",
              "border-white/30 bg-white/10 text-white",
              "hover:bg-white/20 focus:ring-white/40",
            )}
          />
        </header>

        <section
          className={cn(
            "min-h-0 min-w-0 flex-1 overflow-hidden p-4 sm:p-5",
            contentClassName,
          )}
        >
          {children}
        </section>
      </DialogContent>
    </Dialog>
  );
}

export default Modal;
