export type Certificate = {
  title: string;
  issuer: string;
  /** `MM.YYYY`, like the dates in Experience. */
  issued: string;
};

/** Newest first. Titles stay as issued, so they read the same in Swedish. */
export const certificates: Certificate[] = [
  {
    title: "Foundational C# with Microsoft",
    issuer: "freeCodeCamp",
    issued: "01.2026",
  },
  {
    title: "MTA: Introduction to Programming Using Python",
    issuer: "Microsoft",
    issued: "01.2020",
  },
];
