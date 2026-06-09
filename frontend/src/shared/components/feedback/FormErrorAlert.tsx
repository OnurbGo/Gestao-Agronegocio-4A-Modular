import { AlertCircle } from "lucide-react";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/shared/components/ui/alert";

type FormErrorAlertProps = {
  message?: string | null;
  title?: string;
};

function FormErrorAlert({
  message,
  title = "Não foi possível concluir",
}: FormErrorAlertProps) {
  if (!message) {
    return null;
  }

  return (
    <Alert className="flex gap-3" variant="destructive">
      <AlertCircle aria-hidden="true" className="mt-0.5 h-5 w-5 shrink-0" />
      <div>
        <AlertTitle>{title}</AlertTitle>
        <AlertDescription className="whitespace-pre-line">
          {message}
        </AlertDescription>
      </div>
    </Alert>
  );
}

export default FormErrorAlert;
