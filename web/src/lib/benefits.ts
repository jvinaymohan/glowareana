/** Shared benefit pillars — use with `BenefitPillars` for consistent tokens site-wide. */
export const BENEFIT_PILLARS = [
  {
    icon: "🛡️",
    accent: "cyan" as const,
    title: "Safe & supervised",
    description:
      "Harness checks on climbs, staff on every session, gear explained in plain language — parents stay relaxed.",
  },
  {
    icon: "✨",
    accent: "magenta" as const,
    title: "Fun at every age",
    description:
      "Clear age labels per game (5+ to 10+). Younger siblings watch or play gentler lanes while teens go full arena mode.",
  },
  {
    icon: "🎉",
    accent: "lime" as const,
    title: "Parties & squads",
    description:
      "Birthdays, school groups, or a Saturday crew — fast ~25–30 min rounds, big cheers, memories that stick.",
  },
] as const;
