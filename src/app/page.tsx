import GameOfLifeCanvas from "@/components/game-of-life";

export default function Home() {
  return (
    <>
      <div className="w-full border-border border-b bg-background">
        <GameOfLifeCanvas
          colorVariable="--primary"
          className="opacity-10"
          speed={20}
          fadeAlpha={0.1}
          cellSize={10}
        />
      </div>
    </>
  );
}
