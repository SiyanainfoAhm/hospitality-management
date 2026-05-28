"use client";

import * as React from "react";
import { Check, ChevronsUpDown } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";

export type SearchableSelectOption = {
  label: string;
  value: string;
  description?: string;
};

export function SearchableSelect({
  options,
  value,
  onChange,
  placeholder = "Select option",
  searchPlaceholder = "Search...",
  emptyText = "No results found",
  disabled,
  className,
}: {
  options: SearchableSelectOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyText?: string;
  disabled?: boolean;
  className?: string;
}) {
  const [open, setOpen] = React.useState(false);

  const selected = React.useMemo(
    () => options.find((o) => o.value === value) ?? null,
    [options, value]
  );

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          disabled={disabled}
          aria-expanded={open}
          className={cn(
            "h-11 w-full justify-between rounded-xl border-gray-300 bg-white px-3 text-sm font-normal text-gray-900 shadow-sm",
            "hover:bg-white",
            "focus-visible:ring-2 focus-visible:ring-[#1E2A44]/20 focus-visible:ring-offset-2",
            !selected && "text-gray-500",
            disabled && "opacity-50",
            className
          )}
        >
          <span className="truncate">
            {selected ? selected.label : placeholder}
          </span>
          <ChevronsUpDown className="h-4 w-4 shrink-0 text-gray-400" />
        </Button>
      </PopoverTrigger>

      <PopoverContent
        align="start"
        sideOffset={8}
        className={cn(
          "p-0",
          "w-[var(--radix-popover-trigger-width)]",
          "rounded-xl shadow-lg"
        )}
      >
        <Command>
          <CommandInput placeholder={searchPlaceholder} />
          <CommandList className="max-h-[260px]">
            <CommandEmpty>{emptyText}</CommandEmpty>
            <CommandGroup>
              {options.map((opt) => {
                const isSelected = opt.value === value;
                return (
                  <CommandItem
                    key={opt.value}
                    value={`${opt.label} ${opt.description ?? ""}`}
                    onSelect={() => {
                      onChange(opt.value);
                      setOpen(false);
                    }}
                    className="gap-2"
                  >
                    <Check
                      className={cn(
                        "h-4 w-4 shrink-0 text-[#1E2A44]",
                        isSelected ? "opacity-100" : "opacity-0"
                      )}
                    />
                    <div className="min-w-0">
                      <div className="truncate">{opt.label}</div>
                      {opt.description ? (
                        <div className="truncate text-xs text-gray-500">
                          {opt.description}
                        </div>
                      ) : null}
                    </div>
                  </CommandItem>
                );
              })}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

