import { index, integer, pgEnum, pgTable, text, uuid } from "drizzle-orm/pg-core";
import { users } from "./auth.js";
import { createdAt } from "./columns.js";

export const uploadKind = pgEnum("upload_kind", ["pdf", "tex", "text"]);

// Files uploaded for import. The file itself is stored in R2.
export const uploads = pgTable(
  "uploads",
  {
    id: uuid().primaryKey().defaultRandom(),
    userId: text()
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    kind: uploadKind().notNull(),
    storageKey: text().notNull(),
    fileName: text().notNull(),
    mimeType: text().notNull(),
    sizeBytes: integer().notNull(),
    createdAt: createdAt(),
  },
  (t) => [index().on(t.userId)],
);
