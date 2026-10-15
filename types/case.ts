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
  /** Optional — which part of the wheel image stays visible when it's cropped,
   *  as a CSS object-position, e.g. "center 30%" (0% = top, 100% = bottom). */
  thumbnailPosition?: string;
  heroImage: string;
  /** Optional — splits the hero title over several lines. Defaults to `title`. */
  heroTitle?: string[];
  /** Optional — video at the end of the case. Defaults to DEFAULT_OUTRO_VIDEO. */
  outroVideo?: string;
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
  tagline: string;
  role: string;
  year: string;
  preview: string;
  thumbnail: string;
  thumbnailPosition?: string;
  accentColor: string;
};

export type PickerProps = {
  items: PickerItem[];
  initialSlug?: string;
  onFocusChange?: (slug: string) => void;
  /** When true, the wheel runs the slot-machine spin on mount. */
  intro?: boolean;
  /** When true, the wheel is horizontally centred (spin + the post-spin hold);
   *  neighbours stay centre-aligned and interaction is disabled until it clears. */
  centered?: boolean;
  /** Bumping this number triggers a "gamble" spin that lands on a random case. */
  gambleNonce?: number;
  /** Fired once the intro spin settles on the initial case. */
  onIntroEnd?: () => void;
  /** Fired with true while the wheel is moving, false once it settles. */
  onScrollingChange?: (scrolling: boolean) => void;
};
