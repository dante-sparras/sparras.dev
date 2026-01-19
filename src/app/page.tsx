import Image from "next/image";
import GameOfLifeCanvas from "@/components/game-of-life";
import { H2 } from "@/components/typography/h2";
import { Muted } from "@/components/typography/muted";

export default function Home() {
  return (
    <section className="relative flex flex-col">
      <div className="relative h-52 w-full border-border border-b">
        <GameOfLifeCanvas
          speed={100}
          showGrid
          targetCellSize={15}
          backgroundColorVar="--background"
          cellColorVar="--foreground"
          className="opacity-25"
          fadeIntensity={0.9}
          stagnationThreshold={5}
        />
      </div>
      <div className="-translate-y-2/3 absolute top-52 z-10 ml-6 flex w-fit overflow-hidden rounded-full border border-border bg-background">
        <Image
          src="/portrait.webp"
          alt="Picture of Dante Sparrås"
          width={152}
          height={152}
          className="pointer-events-none"
          priority
        />
      </div>
      <div className="h-16 bg-stripes" />
      <div className="*:py-2 *:pl-6">
        <H2 className="flex items-center border-border border-y">
          Dante Sparrås
        </H2>
        <Muted className="border-border border-b">
          Frontend & .NET Developer
        </Muted>
      </div>
    </section>
  );
}
