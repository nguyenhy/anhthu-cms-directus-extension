import { randomBytes } from "node:crypto";

export const buildRecordId = (prefix: string) => {
  const datePart = new Date().toISOString().slice(2, 10).replace(/-/g, "");
  const randomPart = randomBytes(3).toString("hex").toUpperCase(); // 'F3B2'
  return `${prefix}-${datePart}-${randomPart}`;
};
