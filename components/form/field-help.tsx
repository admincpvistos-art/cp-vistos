"use client";

import { CircleHelp } from "lucide-react";

import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

interface FieldHelpProps {
  text: string;
  className?: string;
}

/** Ícone ? com orientação no hover (desktop) e no foco/toque do botão. */
export function FieldHelp({ text, className }: FieldHelpProps) {
  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            tabIndex={-1}
            className={cn(
              "inline-flex shrink-0 rounded-full text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              className,
            )}
            aria-label="Orientação de preenchimento"
          >
            <CircleHelp className="size-3.5" aria-hidden />
          </button>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-xs text-left leading-snug">
          <p>{text}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

interface FormSectionHelpProps {
  title?: string;
  items: string[];
  className?: string;
}

/** Bloco fixo no topo de seções com orientações longas (trabalho, escolaridade etc.). */
export function FormSectionHelp({ title = "Orientações", items, className }: FormSectionHelpProps) {
  return (
    <div
      className={cn(
        "w-full rounded-md border border-border bg-muted/50 px-4 py-3 text-sm text-muted-foreground",
        className,
      )}
    >
      <p className="mb-2 font-medium text-foreground">{title}</p>
      <ul className="list-disc space-y-1.5 pl-4">
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </div>
  );
}
