import { Household, uniqueInviteCode } from "../models/Household.js";
import { Settings } from "../models/Settings.js";
import { Item } from "../models/Item.js";
import { ShoppingListItem } from "../models/ShoppingListItem.js";

export type ResolvedHousehold = {
  household: InstanceType<typeof Household>;
  homeHouseholdId: string;
  isHome: boolean;
  role: "owner" | "member";
};

/**
 * Resolves the household a request should act on: the user's active space,
 * falling back to their personal "home" space. Creates the home space lazily
 * on first access and backfills that user's existing pantry/list into it, so
 * there's no risky one-shot migration of everyone at once.
 */
export async function resolveHousehold(userId: string): Promise<ResolvedHousehold> {
  // Upsert atomically so concurrent first-requests can't collide on the unique
  // userId (which a findOne-then-create would).
  let settings = await Settings.findOneAndUpdate(
    { userId },
    { $setOnInsert: { userId } },
    { upsert: true, new: true },
  );

  if (!settings.homeHouseholdId) {
    const home = await Household.create({
      name: "Meu estoque",
      inviteCode: await uniqueInviteCode(),
      members: [{ userId, role: "owner" }],
    });
    const homeId = String(home._id);
    // Claim the home slot atomically. Several first-requests fire at once (the
    // dashboard alone loads many endpoints), and each would otherwise create a
    // household — leaving duplicates with the pantry in one and the pointer in
    // another. Only the winning update keeps its household and backfills; the
    // rest delete theirs and re-read the winner.
    const claim = await Settings.updateOne(
      { userId, $or: [{ homeHouseholdId: { $exists: false } }, { homeHouseholdId: null }] },
      { $set: { homeHouseholdId: homeId, activeHouseholdId: homeId } },
    );
    if (claim.modifiedCount === 1) {
      await Item.updateMany(
        { userId, householdId: { $exists: false } },
        { $set: { householdId: homeId } },
      );
      await ShoppingListItem.updateMany(
        { userId, householdId: { $exists: false } },
        { $set: { householdId: homeId } },
      );
    } else {
      await Household.deleteOne({ _id: home._id });
    }
    settings = (await Settings.findOne({ userId }))!;
  }

  const homeHouseholdId = settings.homeHouseholdId as string;
  let activeId = settings.activeHouseholdId || homeHouseholdId;
  let household = await Household.findById(activeId);

  // The active space may have been deleted, or the user removed from it — fall
  // back to home so a request always resolves to a space the user belongs to.
  if (!household || !household.members.some((m) => m.userId === userId)) {
    activeId = homeHouseholdId;
    household = await Household.findById(activeId);
    settings.activeHouseholdId = activeId;
    await settings.save();
  }

  const member = household!.members.find((m) => m.userId === userId);
  return {
    household: household!,
    homeHouseholdId,
    isHome: String(household!._id) === homeHouseholdId,
    role: (member?.role as "owner" | "member") ?? "member",
  };
}
