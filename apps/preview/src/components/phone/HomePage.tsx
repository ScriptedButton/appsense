import type { PageItem } from "@appsense/core";
import { AppIcon } from "./AppIcon";
import { FolderTile } from "./FolderTile";
import { WidgetTile } from "./WidgetTile";

interface HomePageProps {
  items: PageItem[];
}

/** A 4x6 home screen grid; widgets span multiple cells like on iOS. */
export function HomePage({ items }: HomePageProps) {
  return (
    <ul className="grid grid-flow-row-dense grid-cols-4 grid-rows-[repeat(6,4.75rem)] gap-x-2 px-4">
      {items.map((item) => {
        if (item.kind === "widget") return <WidgetTile key={item.id} widget={item} />;
        return (
          <li key={item.kind === "folder" ? `folder:${item.name}` : item.id} className="flex items-start justify-center">
            {item.kind === "folder" ? <FolderTile folder={item} /> : <AppIcon id={item.id} name={item.name} />}
          </li>
        );
      })}
    </ul>
  );
}
