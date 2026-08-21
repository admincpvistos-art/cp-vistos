"use client";

import { useEffect, useState } from "react";
import { Loader2, MessageSquare } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Textarea } from "@/components/ui/textarea";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

type Props = {
  comment: string;
  onSave: (comment: string) => void | Promise<void>;
  isPending?: boolean;
  ariaLabel?: string;
  placeholder?: string;
  title?: string;
  className?: string;
};

export function SheetCommentBubble({
  comment,
  onSave,
  isPending = false,
  ariaLabel = "Comentário",
  placeholder = "Escreva um comentário...",
  title = "Comentário",
  className,
}: Props) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(comment);

  useEffect(() => {
    if (!open) {
      setDraft(comment);
    }
  }, [comment, open]);

  const hasComment = Boolean(comment.trim());

  const triggerButton = (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      className={cn("h-7 w-7 shrink-0", className)}
      aria-label={ariaLabel}
      title={hasComment ? undefined : title}
      onClick={(event) => event.stopPropagation()}
    >
      <MessageSquare
        className={cn("h-3.5 w-3.5", hasComment ? "text-primary" : "text-muted-foreground")}
      />
    </Button>
  );

  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (next) {
          setDraft(comment);
        }
      }}
    >
      {hasComment && !open ? (
        <TooltipProvider delayDuration={150}>
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="inline-flex" onClick={(event) => event.stopPropagation()}>
                <PopoverTrigger asChild>{triggerButton}</PopoverTrigger>
              </span>
            </TooltipTrigger>
            <TooltipContent side="top" className="max-w-xs whitespace-pre-wrap text-left">
              {comment}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      ) : (
        <PopoverTrigger asChild>{triggerButton}</PopoverTrigger>
      )}

      <PopoverContent
        className="w-72 p-3"
        align="start"
        onClick={(event) => event.stopPropagation()}
        onOpenAutoFocus={(event) => event.preventDefault()}
      >
        <p className="text-sm font-medium mb-2">{title}</p>
        <Textarea
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          placeholder={placeholder}
          className="min-h-[88px] text-sm"
          maxLength={500}
        />
        <div className="mt-3 flex justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              setDraft(comment);
              setOpen(false);
            }}
          >
            Cancelar
          </Button>
          <Button
            type="button"
            size="sm"
            disabled={isPending}
            onClick={async () => {
              const next = draft.trim();
              if (next === comment.trim()) {
                setOpen(false);
                return;
              }
              await onSave(next);
              setOpen(false);
            }}
          >
            {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Salvar"}
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
