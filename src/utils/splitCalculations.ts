/**
 * Split Calculations Utility
 *
 * All math functions for calculating fair splits, shared items,
 * and tax/tip distribution with penny-perfect accuracy.
 */

import { ReceiptItem } from '../types/receipt';

/**
 * Item assignment mapping: { itemId: [userId1, userId2, ...] }
 */
export type ItemAssignments = {
  [itemId: string]: string[];
};

/**
 * Person totals: { userId: amount }
 */
export type PersonTotals = {
  [userId: string]: number;
};

/**
 * Tax/Tip distribution methods
 */
export type TaxTipMethod = 'equal' | 'proportional';

/**
 * Calculate share percentage for an item
 *
 * @param numberOfPeople - How many people selected this item
 * @returns Share percentage (e.g., 2 people = 50%, 3 people = 33.33%)
 */
export function calculateSharePercentage(numberOfPeople: number): number {
  if (numberOfPeople === 0) return 0;
  return 100 / numberOfPeople;
}

/**
 * Calculate individual amount for a shared item
 *
 * @param itemPrice - Price of the item
 * @param quantity - Quantity of the item
 * @param numberOfPeople - How many people selected this item
 * @returns Amount each person owes
 */
export function calculateIndividualAmount(
  itemPrice: number,
  quantity: number,
  numberOfPeople: number
): number {
  if (numberOfPeople === 0) return 0;
  const totalItemCost = itemPrice * quantity;
  return totalItemCost / numberOfPeople;
}

/**
 * Calculate subtotals for each person based on item assignments
 *
 * @param items - Array of receipt items
 * @param assignments - Item assignments mapping
 * @returns PersonTotals object with subtotals
 */
export function calculatePersonSubtotals(
  items: ReceiptItem[],
  assignments: ItemAssignments
): PersonTotals {
  const subtotals: PersonTotals = {};

  items.forEach((item) => {
    const assignedPeople = assignments[item.id] || [];
    const numberOfPeople = assignedPeople.length;

    if (numberOfPeople === 0) return; // Skip unassigned items

    const amountPerPerson = calculateIndividualAmount(
      item.price,
      item.quantity,
      numberOfPeople
    );

    assignedPeople.forEach((userId) => {
      subtotals[userId] = (subtotals[userId] || 0) + amountPerPerson;
    });
  });

  return subtotals;
}

/**
 * Distribute tax equally among all participants
 *
 * @param tax - Total tax amount
 * @param userIds - Array of all participant user IDs
 * @returns PersonTotals object with tax amounts
 */
export function distributeTaxEqually(
  tax: number,
  userIds: string[]
): PersonTotals {
  const taxPerPerson = tax / userIds.length;
  const taxTotals: PersonTotals = {};

  userIds.forEach((userId) => {
    taxTotals[userId] = taxPerPerson;
  });

  return taxTotals;
}

/**
 * Distribute tip equally among all participants
 *
 * @param tip - Total tip amount
 * @param userIds - Array of all participant user IDs
 * @returns PersonTotals object with tip amounts
 */
export function distributeTipEqually(
  tip: number,
  userIds: string[]
): PersonTotals {
  const tipPerPerson = tip / userIds.length;
  const tipTotals: PersonTotals = {};

  userIds.forEach((userId) => {
    tipTotals[userId] = tipPerPerson;
  });

  return tipTotals;
}

/**
 * Distribute tax proportionally based on subtotals
 *
 * @param tax - Total tax amount
 * @param subtotals - Person subtotals from items
 * @returns PersonTotals object with tax amounts
 */
export function distributeTaxProportionally(
  tax: number,
  subtotals: PersonTotals
): PersonTotals {
  const totalSubtotal = Object.values(subtotals).reduce(
    (sum, amount) => sum + amount,
    0
  );

  if (totalSubtotal === 0) {
    // Fallback to equal distribution if no items assigned
    const userIds = Object.keys(subtotals);
    return distributeTaxEqually(tax, userIds);
  }

  const taxTotals: PersonTotals = {};

  Object.keys(subtotals).forEach((userId) => {
    const personSubtotal = subtotals[userId] || 0;
    const proportion = personSubtotal / totalSubtotal;
    taxTotals[userId] = tax * proportion;
  });

  return taxTotals;
}

/**
 * Distribute tip proportionally based on subtotals
 *
 * @param tip - Total tip amount
 * @param subtotals - Person subtotals from items
 * @returns PersonTotals object with tip amounts
 */
export function distributeTipProportionally(
  tip: number,
  subtotals: PersonTotals
): PersonTotals {
  const totalSubtotal = Object.values(subtotals).reduce(
    (sum, amount) => sum + amount,
    0
  );

  if (totalSubtotal === 0) {
    // Fallback to equal distribution if no items assigned
    const userIds = Object.keys(subtotals);
    return distributeTipEqually(tip, userIds);
  }

  const tipTotals: PersonTotals = {};

  Object.keys(subtotals).forEach((userId) => {
    const personSubtotal = subtotals[userId] || 0;
    const proportion = personSubtotal / totalSubtotal;
    tipTotals[userId] = tip * proportion;
  });

  return tipTotals;
}

/**
 * Calculate final totals for each person
 *
 * @param items - Array of receipt items
 * @param assignments - Item assignments mapping
 * @param tax - Total tax amount
 * @param tip - Total tip amount
 * @param userIds - Array of all participant user IDs
 * @param taxTipMethod - Distribution method ('equal' or 'proportional')
 * @returns PersonTotals object with final amounts
 */
export function calculateFinalTotals(
  items: ReceiptItem[],
  assignments: ItemAssignments,
  tax: number,
  tip: number,
  userIds: string[],
  taxTipMethod: TaxTipMethod = 'proportional'
): PersonTotals {
  // Calculate subtotals from items
  const subtotals = calculatePersonSubtotals(items, assignments);

  // Ensure all users have an entry (even if $0)
  userIds.forEach((userId) => {
    if (!(userId in subtotals)) {
      subtotals[userId] = 0;
    }
  });

  // Calculate tax distribution
  const taxTotals =
    taxTipMethod === 'equal'
      ? distributeTaxEqually(tax, userIds)
      : distributeTaxProportionally(tax, subtotals);

  // Calculate tip distribution
  const tipTotals =
    taxTipMethod === 'equal'
      ? distributeTipEqually(tip, userIds)
      : distributeTipProportionally(tip, subtotals);

  // Combine all amounts
  const finalTotals: PersonTotals = {};

  userIds.forEach((userId) => {
    finalTotals[userId] =
      (subtotals[userId] || 0) +
      (taxTotals[userId] || 0) +
      (tipTotals[userId] || 0);
  });

  return finalTotals;
}

/**
 * Validate that all items are assigned to at least one person
 *
 * @param items - Array of receipt items
 * @param assignments - Item assignments mapping
 * @returns Array of unassigned item IDs (empty if all assigned)
 */
export function getUnassignedItems(
  items: ReceiptItem[],
  assignments: ItemAssignments
): string[] {
  return items
    .filter((item) => {
      const assignedPeople = assignments[item.id] || [];
      return assignedPeople.length === 0;
    })
    .map((item) => item.id);
}

/**
 * Check if all items are assigned
 *
 * @param items - Array of receipt items
 * @param assignments - Item assignments mapping
 * @returns True if all items assigned, false otherwise
 */
export function areAllItemsAssigned(
  items: ReceiptItem[],
  assignments: ItemAssignments
): boolean {
  return getUnassignedItems(items, assignments).length === 0;
}

/**
 * Round amount to 2 decimal places (avoid floating point errors)
 *
 * @param amount - Amount to round
 * @returns Rounded amount
 */
export function roundToTwoDecimals(amount: number): number {
  return Math.round(amount * 100) / 100;
}

/**
 * Format amount as currency string
 *
 * @param amount - Amount to format
 * @returns Formatted string (e.g., "$12.50")
 */
export function formatCurrency(amount: number): string {
  return `$${roundToTwoDecimals(amount).toFixed(2)}`;
}

/**
 * Get breakdown for a specific person
 *
 * @param userId - User ID
 * @param items - Array of receipt items
 * @param assignments - Item assignments mapping
 * @param tax - Total tax amount
 * @param tip - Total tip amount
 * @param userIds - Array of all participant user IDs
 * @param taxTipMethod - Distribution method
 * @returns Breakdown object with subtotal, tax, tip, total
 */
export function getPersonBreakdown(
  userId: string,
  items: ReceiptItem[],
  assignments: ItemAssignments,
  tax: number,
  tip: number,
  userIds: string[],
  taxTipMethod: TaxTipMethod = 'proportional'
) {
  const subtotals = calculatePersonSubtotals(items, assignments);
  const taxTotals =
    taxTipMethod === 'equal'
      ? distributeTaxEqually(tax, userIds)
      : distributeTaxProportionally(tax, subtotals);
  const tipTotals =
    taxTipMethod === 'equal'
      ? distributeTipEqually(tip, userIds)
      : distributeTipProportionally(tip, subtotals);

  return {
    subtotal: roundToTwoDecimals(subtotals[userId] || 0),
    tax: roundToTwoDecimals(taxTotals[userId] || 0),
    tip: roundToTwoDecimals(tipTotals[userId] || 0),
    total: roundToTwoDecimals(
      (subtotals[userId] || 0) +
        (taxTotals[userId] || 0) +
        (tipTotals[userId] || 0)
    ),
  };
}

/**
 * ============================================================================
 * SINGLE USER CALCULATIONS (for when each person marks their own items)
 * ============================================================================
 */

/**
 * Item selection for single user with quantity or split
 */
export type ItemSelection = {
  selected: boolean;      // Did I order this item?
  yourQuantity?: number;  // How many items you got (for quantity > 1)
  splitWith?: number;     // How many people split it (for quantity = 1)
};

/**
 * Map of item selections: { [itemId]: { selected, yourQuantity?, splitWith? } }
 */
export type UserItemSelections = {
  [itemId: string]: ItemSelection;
};

/**
 * Calculate your share for a single item
 *
 * @param item - Receipt item
 * @param selection - Your selection for this item
 * @returns Your share of this item
 */
export function calculateYourItemShare(
  item: ReceiptItem,
  selection: ItemSelection
): number {
  const itemTotal = item.price * item.quantity;

  // If multiple items (quantity > 1) and you specified how many you got
  if (item.quantity > 1 && selection.yourQuantity) {
    // You got X out of Y items
    // Your share = (price per item) × (your quantity)
    const pricePerItem = item.price;
    return pricePerItem * selection.yourQuantity;
  }

  // If single item or you specified split
  if (selection.splitWith) {
    // Item split between X people
    return itemTotal / selection.splitWith;
  }

  // Default: you get the whole item
  return itemTotal;
}

/**
 * Calculate your subtotal from selected items
 *
 * @param items - Array of receipt items
 * @param selections - Your item selections
 * @returns Your subtotal
 */
export function calculateYourSubtotal(
  items: ReceiptItem[],
  selections: UserItemSelections
): number {
  let subtotal = 0;

  items.forEach((item) => {
    const selection = selections[item.id];
    if (selection && selection.selected) {
      subtotal += calculateYourItemShare(item, selection);
    }
  });

  return subtotal;
}

/**
 * Calculate your share of tax based on your items subtotal
 *
 * @param yourSubtotal - Your items subtotal
 * @param receiptSubtotal - Total receipt subtotal
 * @param totalTax - Total tax amount
 * @returns Your share of tax
 */
export function calculateYourTax(
  yourSubtotal: number,
  receiptSubtotal: number,
  totalTax: number
): number {
  if (receiptSubtotal === 0) return 0;
  const proportion = yourSubtotal / receiptSubtotal;
  return totalTax * proportion;
}

/**
 * Calculate your share of tip based on your items subtotal
 *
 * @param yourSubtotal - Your items subtotal
 * @param receiptSubtotal - Total receipt subtotal
 * @param totalTip - Total tip amount
 * @returns Your share of tip
 */
export function calculateYourTip(
  yourSubtotal: number,
  receiptSubtotal: number,
  totalTip: number
): number {
  if (receiptSubtotal === 0) return 0;
  const proportion = yourSubtotal / receiptSubtotal;
  return totalTip * proportion;
}

/**
 * Calculate your complete total with breakdown
 *
 * @param items - Array of receipt items
 * @param selections - Your item selections
 * @param receiptSubtotal - Total receipt subtotal
 * @param totalTax - Total tax amount
 * @param totalTip - Total tip amount
 * @returns Breakdown with subtotal, tax, tip, total
 */
export function calculateYourTotal(
  items: ReceiptItem[],
  selections: UserItemSelections,
  receiptSubtotal: number,
  totalTax: number,
  totalTip: number
): {
  subtotal: number;
  tax: number;
  tip: number;
  total: number;
} {
  const yourSubtotal = calculateYourSubtotal(items, selections);
  const yourTax = calculateYourTax(yourSubtotal, receiptSubtotal, totalTax);
  const yourTip = calculateYourTip(yourSubtotal, receiptSubtotal, totalTip);

  return {
    subtotal: roundToTwoDecimals(yourSubtotal),
    tax: roundToTwoDecimals(yourTax),
    tip: roundToTwoDecimals(yourTip),
    total: roundToTwoDecimals(yourSubtotal + yourTax + yourTip),
  };
}

/**
 * Check if all selected items have valid split quantities
 *
 * @param items - Array of receipt items
 * @param selections - Your item selections
 * @returns True if valid, false otherwise
 */
export function areSelectionsValid(
  items: ReceiptItem[],
  selections: UserItemSelections
): boolean {
  for (const item of items) {
    const selection = selections[item.id];
    if (selection && selection.selected) {
      if (!selection.splitWith || selection.splitWith < 1) {
        return false;
      }
    }
  }
  return true;
}
