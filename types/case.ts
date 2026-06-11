export type CaseType = "client" | "own-product" | "process";
export type CaseStatus = "live" | "shipped" | "wip" | "archived";

export type CaseFrontmatter = {
  slug: string;
  order: number;
  title: string;
  subtitle?: string;
  role: string;
  company: string;
  year: number;
  timeline: string;
  type: CaseType;
  status: CaseStatus;
  nda: boolean;
  tools: string[];
  accentColor: string;
  thumbnail: string;
  heroImage: string;
  preview: {
    short: string;
    description: string;
  };
  links?: { label: string; href: string }[];
};

export type PickerItem = {
  slug: string;
  index: number;
  title: string;
  subtitle?: string;
  role: string;
  year: string;
  preview: string;
  thumbnail: string;
  accentColor: string;
};

export type PickerProps = {
  items: PickerItem[];
  initialSlug?: string;
  onFocusChange?: (slug: string) => void;
};
