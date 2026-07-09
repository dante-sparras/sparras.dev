type PageIntroProps = {
  title: string;
  description: string;
};

export function PageIntro({ title, description }: PageIntroProps) {
  return (
    <div className="flex min-h-0 flex-1 flex-col px-6">
      <main className="mx-auto flex w-full max-w-3xl min-h-0 flex-1 flex-col border-x border-border px-4 py-16">
        <h1 className="text-3xl font-semibold tracking-tight">{title}</h1>
        <p className="text-muted-foreground mt-4 text-lg leading-relaxed">
          {description}
        </p>
      </main>
    </div>
  );
}
