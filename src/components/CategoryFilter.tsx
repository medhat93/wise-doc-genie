import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ChevronDown, Search } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

interface CategoryFilterProps {
  categories: string[];
  quickCategories: string[];
  value: string;
  onChange: (value: string) => void;
  categoryCounts?: Record<string, number>;
}

const CategoryFilter = ({ categories, quickCategories, value, onChange, categoryCounts }: CategoryFilterProps) => {
  const [popoverOpen, setPopoverOpen] = useState(false);
  const [filterQuery, setFilterQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const visiblePills = [...quickCategories];
  const selectedInQuick = quickCategories.includes(value);
  if (!selectedInQuick && value !== "All") {
    visiblePills[visiblePills.length - 1] = value;
  }

  const remainingCount = categories.length - quickCategories.length - 1;
  const filteredPopoverCategories = categories.filter(
    (c) => c !== "All" && c.toLowerCase().includes(filterQuery.toLowerCase())
  );

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {visiblePills.map((cat) => (
        <Button
          key={cat}
          variant={value === cat ? "default" : "outline"}
          size="sm"
          className="rounded-full px-3 py-1 text-xs h-7 whitespace-nowrap"
          onClick={() => onChange(cat)}
        >
          {cat}
        </Button>
      ))}

      <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className="rounded-full px-3 py-1 text-xs h-7 whitespace-nowrap gap-1"
          >
            + More ({remainingCount})
            <ChevronDown className="h-3 w-3" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[360px] p-0" align="start">
          <div className="p-3 border-b">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                ref={inputRef}
                placeholder="Filter categories..."
                className="pl-8 h-8 text-xs"
                value={filterQuery}
                onChange={(e) => setFilterQuery(e.target.value)}
              />
            </div>
          </div>
          <ScrollArea className="max-h-[300px]">
            <div className="grid grid-cols-2 gap-1 p-2">
              {filteredPopoverCategories.map((cat) => {
                const count = categoryCounts?.[cat];
                return (
                  <button
                    key={cat}
                    className={cn(
                      "text-left text-xs px-3 py-2 rounded-md transition-colors",
                      value === cat
                        ? "bg-primary text-primary-foreground"
                        : "hover:bg-accent"
                    )}
                    onClick={() => {
                      onChange(cat);
                      setPopoverOpen(false);
                      setFilterQuery("");
                    }}
                  >
                    {cat}
                    {count !== undefined && (
                      <span className="ml-1 text-[10px] opacity-60">({count})</span>
                    )}
                  </button>
                );
              })}
              {filteredPopoverCategories.length === 0 && (
                <p className="col-span-2 text-xs text-muted-foreground text-center py-4">No categories found</p>
              )}
            </div>
          </ScrollArea>
        </PopoverContent>
      </Popover>
    </div>
  );
};

export default CategoryFilter;
