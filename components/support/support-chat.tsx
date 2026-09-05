"use client";

import { useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { SupportMessageDTO } from "@/lib/support/types";

type Pending = { localId: string; body: string; createdAt: string };

export function SupportMessageList({
  messages,
  pending = [],
  emptyLabel,
  perspective = "customer",
}: {
  messages: SupportMessageDTO[];
  pending?: Pending[];
  emptyLabel: string;
  perspective?: "customer" | "admin";
}) {
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length, pending.length]);

  if (messages.length === 0 && pending.length === 0) {
    return (
      <p className="text-sm text-muted-foreground px-1 py-8 text-center">
        {emptyLabel}
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {messages.map((message) => {
        const mine =
          perspective === "admin"
            ? message.author === "admin"
            : message.author === "customer";
        return (
          <Bubble
            key={message.id}
            mine={mine}
            body={message.body}
            at={message.createdAt}
            label={
              mine ? "Você" : perspective === "admin" ? "Cliente" : "Suporte"
            }
          />
        );
      })}
      {pending.map((item) => (
        <Bubble
          key={item.localId}
          mine
          body={item.body}
          at={item.createdAt}
          pending
          label="Você"
        />
      ))}
      <div ref={endRef} />
    </div>
  );
}

function Bubble({
  mine,
  body,
  at,
  pending,
  label,
}: {
  mine?: boolean;
  body: string;
  at: string;
  pending?: boolean;
  label: string;
}) {
  const when = new Date(at).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div className={cn("flex", mine ? "justify-end" : "justify-start")}>
      <div
        className={cn(
          "max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed",
          mine
            ? "bg-primary/20 text-foreground border border-primary/30"
            : "bg-white/5 border border-white/10",
          pending && "opacity-70"
        )}
      >
        <p className="text-[10px] uppercase tracking-wide text-muted-foreground mb-1">
          {label}
          {pending ? " · enviando" : ` · ${when}`}
        </p>
        <p className="whitespace-pre-wrap break-words">{body}</p>
      </div>
    </div>
  );
}

export function SupportComposer({
  value,
  onChange,
  onSend,
  disabled,
  placeholder,
}: {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  disabled?: boolean;
  placeholder: string;
}) {
  return (
    <form
      className="flex gap-2 items-end"
      onSubmit={(event) => {
        event.preventDefault();
        onSend();
      }}
    >
      <textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Enter" && !event.shiftKey) {
            event.preventDefault();
            onSend();
          }
        }}
        rows={2}
        maxLength={2000}
        placeholder={placeholder}
        className="flex-1 resize-none rounded-xl border-0 bg-[#0F131A] px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground outline-none focus-visible:ring-2 focus-visible:ring-primary"
      />
      <Button type="submit" disabled={disabled || !value.trim()} className="h-10">
        Enviar
      </Button>
    </form>
  );
}
