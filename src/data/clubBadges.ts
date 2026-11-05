import clubBadgesJson from "./clubBadges.json";

export const clubBadges: Record<string, string> = clubBadgesJson as Record<string, string>;

export const clubBadge = (name: string): string | undefined => clubBadges[name];
