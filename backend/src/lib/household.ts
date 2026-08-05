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
  let settings = await Settings.findOne({ userId });
  if (!settings) settings = await Settings.create({ userId });

  if (!settings.homeHouseholdId) {
    const home = await Household.create({
      name: "Meu estoque",
      inviteCode: await uniqueInviteCode(),
      members: [{ userId, role: "owner" }],
    });
    const homeId = String(home._id);
    settings.homeHouseholdId = homeId;
    settings.activeHouseholdId = homeId;
    await settings.save();
    await Item.updateMany(
      { userId, householdId: { $exists: false } },
      { $set: { householdId: homeId } },
    );
    await ShoppingListItem.updateMany(
      { userId, householdId: { $exists: false } },
      { $set: { householdId: homeId } },
    );
  }

  const homeHouseholdId = settings.homeHouseholdId;
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
