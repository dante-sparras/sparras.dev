import Image from "next/image";
import GameOfLifeCanvas from "@/components/game-of-life";

export default function Home() {
  return (
    <div className="relative">
      <div className="h-52 border-border border-b bg-background">
        <GameOfLifeCanvas
          colorVariable="--primary"
          className="opacity-10"
          speed={20}
          fadeAlpha={0.1}
          cellSize={10}
        />
      </div>
      <div className="-translate-y-2/3 z-10 ml-6 flex w-fit overflow-hidden rounded-full border border-border bg-background">
        <Image
          src="/portrait.webp"
          alt="Picture of Dante Sparrås"
          width={152}
          height={152}
          className="pointer-events-none"
          priority
        />
      </div>
    </div>
  );
}
