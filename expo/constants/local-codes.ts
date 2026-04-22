export interface LocalCode {
  code: string;
  plan: "base" | "premium" | "admin";
  grantsAdmin: boolean;
}

export const LOCAL_CODES: LocalCode[] = [
  { code: "1111", plan: "admin", grantsAdmin: true },
  { code: "DRIVEADMIN", plan: "admin", grantsAdmin: true },
  { code: "DRIVEFREE", plan: "premium", grantsAdmin: false },
  { code: "FOUNDER2026", plan: "premium", grantsAdmin: true },
];

export function findLocalCode(raw: string): LocalCode | null {
  const code = raw.trim().toUpperCase();
  return LOCAL_CODES.find((c) => c.code === code) ?? null;
}
