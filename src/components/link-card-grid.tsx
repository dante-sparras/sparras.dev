"use client";

import { ChevronDown, ChevronUp } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import type { Href } from "@/content/types";
import { cn } from "@/lib/utils";

type LinkCardItem = {
  title: string;
  description: string;
  href: Href;
};

const INITIAL_COUNT = 6;

const gridClassName = "grid gap-4 px-6 sm:grid-cols-2 lg:grid-cols-3";

function LinkCard({ item }: { item: LinkCardItem }) {
  return (
    <Link href={item.href}>
      <Card className="h-full transition-colors hover:bg-muted/50">
        <CardHeader>
          <CardTitle>{item.title}</CardTitle>
          <CardDescription>{item.description}</CardDescription>
        </CardHeader>
      </Card>
    </Link>
  );
}

export function LinkCardGrid({
  items,
  showLessLabel,
  showMoreLabel,
}: {
  items: readonly LinkCardItem[];
  showLessLabel: string;
  showMoreLabel: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const visibleItems = items.slice(0, INITIAL_COUNT);
  const hiddenItems = items.slice(INITIAL_COUNT);

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <div className={cn(gridClassName, "py-6")}>
        {visibleItems.map((item) => (
          <LinkCard key={item.title} item={item} />
        ))}
      </div>

      <CollapsibleContent>
        <div className={cn(gridClassName, "pb-6")}>
          {hiddenItems.map((item) => (
            <LinkCard key={item.title} item={item} />
          ))}
        </div>
      </CollapsibleContent>

      {hiddenItems.length > 0 && (
        <div className="flex justify-center pb-6">
          <CollapsibleTrigger
            render={
              <Button
                variant="outline"
                size="lg"
                className="cursor-pointer gap-2"
              >
                {isOpen ? (
                  <>
                    {showLessLabel} <ChevronUp className="h-4 w-4" />
                  </>
                ) : (
                  <>
                    {showMoreLabel} <ChevronDown className="h-4 w-4" />
                  </>
                )}
              </Button>
            }
          />
        </div>
      )}
    </Collapsible>
  );
}
