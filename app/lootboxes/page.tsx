import { getAllLootboxes, type LootboxSummary } from "@/lib/flipApi";
import LootboxGrid from "./LootboxGrid";

export const revalidate = 3600;

export default async function LootboxesPage() {
  let boxes: LootboxSummary[] = [];
  try {
    boxes = await getAllLootboxes();
  } catch {
    return (
      <div className="text-center py-20" style={{ color: "var(--text-muted)" }}>
        Could not load lootbox data. Try again later.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>
          Lootbox Directory
        </h1>
        <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>
          {boxes.length} lootboxes · live odds from flip.gg
        </p>
      </div>
      <LootboxGrid boxes={boxes} />
    </div>
  );
}
