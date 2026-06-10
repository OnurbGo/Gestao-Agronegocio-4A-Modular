import { AlertCircle, X } from "lucide-react";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/shared/components/ui/alert";

type FormErrorAlertProps = {
  message?: string | null;
  onDismiss?: () => void;
  title?: string;
};

function FormErrorAlert({
  message,
  onDismiss,
  title = "Não foi possível concluir",
}: FormErrorAlertProps) {
  if (!message) {
    return null;
  }

  return (
    <Alert className="relative flex gap-3 pr-12" variant="destructive">
      <AlertCircle aria-hidden="true" className="mt-0.5 h-5 w-5 shrink-0" />

      <div className="min-w-0">
        <AlertTitle>{title}</AlertTitle>

        <AlertDescription className="whitespace-pre-line">
          {message}
        </AlertDescription>
      </div>

      {onDismiss ? (
        <button
          aria-label="Fechar mensagem de erro"
          className="absolute right-3 top-3 inline-flex h-8 w-8 items-center justify-center rounded-md text-red-700 transition hover:bg-red-100 hover:text-red-900 focus:outline-none focus:ring-2 focus:ring-red-300"
          onClick={onDismiss}
          type="button"
        >
          <X aria-hidden="true" className="h-4 w-4" />
        </button>
      ) : null}
    </Alert>
  );
}

export default FormErrorAlert;
