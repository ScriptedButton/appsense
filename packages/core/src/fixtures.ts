import type { Catalog } from "./schema.js";

const app = (bundleIdentifier: string, displayName: string) => ({
  bundleIdentifier,
  displayIdentifier: bundleIdentifier,
  displayName,
  bundleVersion: "1",
});

/** Raw icon state shaped like `pymobiledevice3 springboard state get` output. */
export const rawIconState = [
  [app("com.apple.mobilesafari", "Safari"), app("com.apple.mobilephone", "Phone"), app("com.apple.MobileSMS", "Messages")],
  [
    {
      bundleIdentifier: "com.apple.weather.widget",
      containerBundleIdentifier: "com.apple.weather",
      displayIdentifier: "W-1",
      elementType: "widget",
      gridSize: "small",
      iconLists: [],
      widgetIdentifier: "com.apple.weather",
    },
    app("com.apple.weather", "Weather"),
    app("com.spotify.client", "Spotify"),
    app("com.netflix.Netflix", "Netflix"),
    {
      displayName: "Utilities",
      listType: "folder",
      iconLists: [[app("com.apple.calculator", "Calculator"), app("com.apple.compass", "Compass")], []],
    },
  ],
  [
    app("com.burbn.instagram", "Instagram"),
    app("com.toyopagroup.picaboo", "Snapchat"),
    { displayIdentifier: "CLIP-1", displayName: "Docs", webClipURL: "https://example.com" },
  ],
];

export const catalog: Catalog = Object.fromEntries(
  [
    ["com.apple.mobilesafari", "Safari", null, true],
    ["com.apple.mobilephone", "Phone", null, true],
    ["com.apple.MobileSMS", "Messages", null, true],
    ["com.apple.weather", "Weather", "Weather", true],
    ["com.spotify.client", "Spotify", "Music", false],
    ["com.netflix.Netflix", "Netflix", "Entertainment", false],
    ["com.apple.calculator", "Calculator", "Utilities", true],
    ["com.apple.compass", "Compass", "Utilities", true],
    ["com.burbn.instagram", "Instagram", "Photo & Video", false],
    ["com.toyopagroup.picaboo", "Snapchat", "Photo & Video", false],
    ["com.duolingo.DuolingoMobile", "Duolingo", "Education", false],
  ].map(([id, name, genre, system]) => [
    id as string,
    { id: id as string, name: name as string, genre: genre as string | null, kind: "app" as const, system: system as boolean },
  ]),
);
catalog["CLIP-1"] = { id: "CLIP-1", name: "Docs", genre: null, kind: "webclip", system: false };
