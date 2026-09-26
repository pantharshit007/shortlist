import { and, eq } from "drizzle-orm";
import { db } from "../../db/index.js";
import { usernameRedirects, users } from "../../db/schema/index.js";
import { ConflictError, NotFoundError } from "../../lib/errors.js";
import { isReservedUsername, isUsernameTaken } from "./usernames.js";

const meColumns = {
  id: users.id,
  name: users.name,
  email: users.email,
  emailVerified: users.emailVerified,
  image: users.image,
  username: users.username,
  plan: users.plan,
  createdAt: users.createdAt,
};

export async function getMe(userId: string) {
  const [user] = await db.select(meColumns).from(users).where(eq(users.id, userId)).limit(1);
  if (!user) throw new NotFoundError("User");
  return user;
}

export async function updateMe(userId: string, changes: { name?: string | undefined; username?: string | undefined }) {
  return db.transaction(async (tx) => {
    const [current] = await tx.select(meColumns).from(users).where(eq(users.id, userId)).limit(1);
    if (!current) throw new NotFoundError("User");

    const update: Partial<typeof users.$inferInsert> = {};
    if (changes.name) update.name = changes.name;

    if (changes.username && changes.username !== current.username) {
      const next = changes.username;
      if (isReservedUsername(next)) throw new ConflictError("This username is reserved");

      // A user may take back one of their own old usernames.
      const [ownRedirect] = await tx
        .select()
        .from(usernameRedirects)
        .where(and(eq(usernameRedirects.oldUsername, next), eq(usernameRedirects.userId, userId)));
      if (ownRedirect) {
        await tx.delete(usernameRedirects).where(eq(usernameRedirects.oldUsername, next));
      } else if (await isUsernameTaken(next)) {
        throw new ConflictError("This username is taken");
      }

      await tx.insert(usernameRedirects).values({ oldUsername: current.username, userId });
      update.username = next;
      update.usernameChangedAt = new Date();
    }

    if (Object.keys(update).length === 0) return current;
    const [updated] = await tx.update(users).set(update).where(eq(users.id, userId)).returning(meColumns);
    return updated!;
  });
}

// Deletes the account and, through foreign key cascades, everything the user owns.
export async function deleteMe(userId: string) {
  await db.delete(users).where(eq(users.id, userId));
}
