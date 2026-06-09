import type { ReactNode } from "react";
import {
  Dialog,
  DialogCloseButton,
  DialogContent,
  DialogTitle,
} from "@/shared/components/ui/dialog";
import { cn } from "@/shared/utils/cn";

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
        className={cn(
          "z-[60] flex p-0 border-emerald-100",
          sizeClass,
        )}
      >
        <header className="flex shrink-0 items-center justify-between gap-3 border-b border-emerald-100 bg-emerald-700 px-4 py-3 text-white">
          <DialogTitle className="m-0 text-lg font-bold leading-tight text-white">
            {title}
          </DialogTitle>
          <DialogCloseButton aria-label="Fechar" />
        </header>
        <div
          className={cn(
            "min-h-0 flex-1 overflow-y-auto p-4 sm:p-5",
            contentClassName,
          )}
        >
          {children}
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default Modal;
