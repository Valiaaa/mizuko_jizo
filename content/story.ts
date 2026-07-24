export type Chapter = {
  id: string;
  number: string;
  title: string;
  titleEn: string;
  interaction: "click" | "drag" | "scroll";
  status: "ready" | "planned";
  assetDirectory?: string;
};

export const chapters: Chapter[] = [
  {
    id: "room",
    number: "02",
    title: "房间",
    titleEn: "The Room",
    interaction: "click",
    status: "ready",
    assetDirectory: "Page2_房间_asset",
  },
  {
    id: "falling",
    number: "03",
    title: "坠落",
    titleEn: "Falling",
    interaction: "drag",
    status: "ready",
    assetDirectory: "Page3_Falling_asset",
  },
  {
    id: "hell",
    number: "04",
    title: "地狱",
    titleEn: "Hell",
    interaction: "click",
    status: "ready",
    assetDirectory: "Page4_地狱_asset",
  },
  {
    id: "offering",
    number: "05.2",
    title: "供奉",
    titleEn: "Offering",
    interaction: "drag",
    status: "ready",
    assetDirectory: "Page5.2_供奉_asset",
  },
];
