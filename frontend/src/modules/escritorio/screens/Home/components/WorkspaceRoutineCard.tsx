import { ArrowRight } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";

function WorkspaceRoutineCard({ card, onOpen }) {
  const Icon = card.icon;

  return (
    <Card className="min-w-0 border-emerald-100 shadow-sm transition hover:-translate-y-0.5 hover:border-emerald-300 hover:shadow-md">
      <button
        className="grid h-full min-h-36 w-full grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-4 p-5 text-left max-sm:grid-cols-[auto_minmax(0,1fr)]"
        onClick={onOpen}
        type="button"
      >
        <span className="grid h-12 w-12 shrink-0 place-items-center rounded-lg bg-emerald-700 text-white">
          <Icon aria-hidden="true" className="h-6 w-6" />
        </span>

        <span className="grid min-w-0 gap-2">
          <CardHeader className="p-0">
            <CardTitle className="text-2xl leading-tight text-slate-950">
              {card.title}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <CardDescription className="text-sm font-semibold leading-6 text-slate-600">
              {card.description}
            </CardDescription>
          </CardContent>
        </span>

        <Button
          asChild
          className="shrink-0 px-0 text-base max-sm:col-span-2 max-sm:justify-self-end"
          variant="ghost"
        >
          <span>
            Abrir
            <ArrowRight aria-hidden="true" className="h-5 w-5" />
          </span>
        </Button>
      </button>
    </Card>
  );
}

export default WorkspaceRoutineCard;
