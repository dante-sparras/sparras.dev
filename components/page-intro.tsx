type PageIntroProps = {
  title: string;
  description: string;
};

export function PageIntro({ title, description }: PageIntroProps) {
  return (
    <div className="flex flex-1 flex-col px-6 py-16">
      <main className="mx-auto w-full max-w-3xl border-x border-border px-4">
        <h1 className="text-3xl font-semibold tracking-tight">{title}</h1>
        <p className="text-muted-foreground mt-4 text-lg leading-relaxed">
          {description}
        </p>
      </main>
    </div>
  );
}
