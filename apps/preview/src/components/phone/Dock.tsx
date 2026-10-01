import type { DockItem } from "@appsense/core";
import { AppIcon } from "./AppIcon";
import { FolderTile } from "./FolderTile";

interface DockProps {
  items: DockItem[];
}

export function Dock({ items }: DockProps) {
  return (
    <div className="mx-3 rounded-[1.75rem] bg-white/20 px-3 py-3 backdrop-blur-xl">
      <ul aria-label="Dock" className="flex min-h-[3.25rem] justify-around">
        {items.map((item) => (
          <li key={item.kind === "folder" ? `folder:${item.name}` : item.id}>
            {item.kind === "folder" ? (
              <FolderTile folder={item} showLabel={false} />
            ) : (
              <AppIcon id={item.id} name={item.name} showLabel={false} />
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
