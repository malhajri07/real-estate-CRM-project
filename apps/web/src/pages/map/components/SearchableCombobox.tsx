/**
 * SearchableCombobox.tsx - Searchable Combobox Component
 * 
 * Location: apps/web/src/ → Pages/ → Feature Pages → map/ → components/ → SearchableCombobox.tsx
 * Tree Map: docs/architecture/FILE_STRUCTURE_TREE_MAP.md
 * 
 * Shared searchable dropdown component. Provides:
 * - Searchable dropdown interface
 * - Command palette integration
 * - Accessible combobox functionality
 * 
 * Related Files:
 * - apps/web/src/pages/map/components/FilterContent.tsx - Uses this component
 */

/**
 * SearchableCombobox Component
 * 
 * Shared searchable dropdown used across filters. It wraps the cmdk based
 * command palette components inside a popover to deliver an accessible combobox.
 */

import { useState } from "react";
import { ChevronsUpDown, Check } from "lucide-react";
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
import { cn } from "@/lib/utils";
import type { SearchableComboboxProps } from "../types";

export function SearchableCombobox({
  value,
  onChange,
  options,
  placeholder,
  searchPlaceholder,
  emptyText = "لم يتم العثور على نتائج",
  disabled,
}: SearchableComboboxProps) {
  const [open, setOpen] = useState(false);
  const selected = options.find((option) => option.id === value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className={cn(
            "h-11 w-full justify-between rounded-2xl border border-border/60 bg-background/90 text-right font-normal",
            disabled && "opacity-70"
          )}
        >
          <span className={cn("truncate", !selected && "text-muted-foreground")}>
            {selected ? selected.label : placeholder}
          </span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="end">
        <Command>
          <CommandInput placeholder={searchPlaceholder} className="text-right" />
          <CommandEmpty className="py-6 text-center text-sm text-muted-foreground">{emptyText}</CommandEmpty>
          <CommandList>
            <CommandGroup>
              {options.map((option) => (
                <CommandItem
                  key={option.id}
                  value={option.label}
                  onSelect={() => {
                    onChange(option.id);
                    setOpen(false);
                  }}
                  className="flex items-center justify-between gap-2"
                >
                  <span className="truncate">{option.label}</span>
                  {value === option.id && <Check className="h-4 w-4 text-brand-600" />}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

