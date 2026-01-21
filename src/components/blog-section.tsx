"use client";

import { ChevronDown, ChevronUp } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { H3 } from "@/components/typography/h3";
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
import { Muted } from "./typography/muted";

interface BlogPost {
  title: string;
  description: string;
  href: React.ComponentProps<typeof Link>["href"];
}

interface BlogSectionProps {
  blogPosts: BlogPost[];
}

export function BlogSection({ blogPosts }: BlogSectionProps) {
  const [isOpen, setIsOpen] = useState(false);
  const INITIAL_COUNT = 6;

  const visibleBlogPosts = blogPosts.slice(0, INITIAL_COUNT);
  const hiddenBlogPosts = blogPosts.slice(INITIAL_COUNT);

  return (
    <section aria-labelledby="blog-heading">
      <div className="flex items-center justify-between border-b px-6 py-3">
        <H3 id="blog">Blog</H3>
      </div>

      {blogPosts.length === 0 ? (
        <Muted className="mx-auto px-6 py-6 text-center">
          No blog posts available at the moment.
        </Muted>
      ) : (
        <Collapsible open={isOpen} onOpenChange={setIsOpen}>
          <div className="grid gap-4 px-6 py-6 sm:grid-cols-2 lg:grid-cols-3">
            {visibleBlogPosts.map((blogPost) => (
              <Link key={blogPost.title} href={blogPost.href}>
                <Card className="h-full transition-colors hover:bg-muted/50">
                  <CardHeader>
                    <CardTitle>{blogPost.title}</CardTitle>
                    <CardDescription>{blogPost.description}</CardDescription>
                  </CardHeader>
                </Card>
              </Link>
            ))}
          </div>

          <CollapsibleContent>
            <div className="grid gap-4 px-6 pb-6 sm:grid-cols-2 lg:grid-cols-3">
              {hiddenBlogPosts.map((blogPost) => (
                <Link key={blogPost.title} href={blogPost.href}>
                  <Card className="h-full transition-colors hover:bg-muted/50">
                    <CardHeader>
                      <CardTitle>{blogPost.title}</CardTitle>
                      <CardDescription>{blogPost.description}</CardDescription>
                    </CardHeader>
                  </Card>
                </Link>
              ))}
            </div>
          </CollapsibleContent>

          {hiddenBlogPosts.length > 0 && (
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
                        Show Less <ChevronUp className="h-4 w-4" />
                      </>
                    ) : (
                      <>
                        Show More <ChevronDown className="h-4 w-4" />
                      </>
                    )}
                  </Button>
                }
              />
            </div>
          )}
        </Collapsible>
      )}
    </section>
  );
}
