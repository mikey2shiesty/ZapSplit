import { supabase } from './supabase';
import { ReceiptItem } from '../types/receipt';
import { UserItemSelections, calculateYourItemShare } from '../utils/splitCalculations';

/**
 * Item Service
 *
 * Database operations for receipt items and item assignments.
 * Used when splitting bills by receipt scanning.
 */

// ============================================================================
// TYPES
// ============================================================================

export interface SplitItem {
  id: string;
  split_id: string;
  name: string;
  price: number;
  quantity: number;
  created_at: string;
}

export interface ItemAssignment {
  id: string;
  item_id: string;
  user_id: string;
  share: number; // Database column is 'share', not 'share_percentage'
  amount: number;
  created_at: string;
}

export interface CreateSplitItemData {
  split_id: string;
  name: string;
  price: number;
  quantity: number;
}

export interface CreateItemAssignmentData {
  item_id: string;
  user_id: string;
  share: number; // Database column is 'share', not 'share_percentage'
  amount: number;
}

// ============================================================================
// SPLIT ITEMS
// ============================================================================

/**
 * Create multiple split items in the database
 *
 * @param splitId - ID of the split these items belong to
 * @param items - Array of receipt items to save
 * @returns Array of created split items with database IDs
 */
export async function createSplitItems(
  splitId: string,
  items: ReceiptItem[]
): Promise<SplitItem[]> {
  // Prepare items for insertion
  const itemsData: CreateSplitItemData[] = items.map((item) => ({
    split_id: splitId,
    name: item.name,
    price: item.price,
    quantity: item.quantity,
  }));

  // Insert all items
  const { data, error } = await supabase
    .from('split_items')
    .insert(itemsData)
    .select();

  if (error) throw error;
  if (!data) throw new Error('Failed to create split items');

  return data;
}

/**
 * Get all items for a split
 *
 * @param splitId - ID of the split
 * @returns Array of split items
 */
export async function getSplitItems(splitId: string): Promise<SplitItem[]> {
  const { data, error } = await supabase
    .from('split_items')
    .select('*')
    .eq('split_id', splitId)
    .order('created_at', { ascending: true });

  if (error) throw error;
  return data || [];
}

/**
 * Delete all items for a split
 *
 * @param splitId - ID of the split
 */
export async function deleteSplitItems(splitId: string): Promise<void> {
  const { error } = await supabase
    .from('split_items')
    .delete()
    .eq('split_id', splitId);

  if (error) throw error;
}

// ============================================================================
// ITEM ASSIGNMENTS
// ============================================================================

/**
 * Create a single item assignment (user ordered this item)
 *
 * @param itemId - Database ID of the split item
 * @param userId - User ID who ordered this item
 * @param sharePercentage - What % of the item they ordered (e.g., 50% if split with 1 other)
 * @param amount - Dollar amount they owe for this item
 * @returns Created assignment
 */
export async function assignItemToUser(
  itemId: string,
  userId: string,
  sharePercentage: number,
  amount: number
): Promise<ItemAssignment> {
  const assignmentData: CreateItemAssignmentData = {
    item_id: itemId,
    user_id: userId,
    share: sharePercentage,
    amount,
  };

  const { data, error } = await supabase
    .from('item_assignments')
    .insert(assignmentData)
    .select()
    .single();

  if (error) throw error;
  if (!data) throw new Error('Failed to create item assignment');

  return data;
}

/**
 * Create multiple item assignments for a user
 *
 * This is used when a user marks their items from a receipt.
 * We create one assignment per item they selected.
 *
 * @param userId - User ID
 * @param splitItems - Array of split items (with database IDs)
 * @param receiptItems - Original receipt items (for calculations)
 * @param selections - User's item selections
 * @returns Array of created assignments
 */
export async function createUserItemAssignments(
  userId: string,
  splitItems: SplitItem[],
  receiptItems: ReceiptItem[],
  selections: UserItemSelections
): Promise<ItemAssignment[]> {
  const assignments: CreateItemAssignmentData[] = [];

  // Build assignments array
  splitItems.forEach((splitItem) => {
    // Find matching receipt item by name and price
    const receiptItem = receiptItems.find(
      (ri) => ri.name === splitItem.name && ri.price === splitItem.price
    );

    if (!receiptItem) return;

    const selection = selections[receiptItem.id];
    if (!selection || !selection.selected) return;

    // Calculate share percentage and amount
    const itemTotal = splitItem.price * splitItem.quantity;
    const yourShare = calculateYourItemShare(receiptItem, selection);
    const sharePercentage = (yourShare / itemTotal) * 100;

    assignments.push({
      item_id: splitItem.id,
      user_id: userId,
      share: sharePercentage,
      amount: yourShare,
    });
  });

  if (assignments.length === 0) {
    return []; // No items selected
  }

  // Insert all assignments
  const { data, error } = await supabase
    .from('item_assignments')
    .insert(assignments)
    .select();

  if (error) throw error;
  if (!data) throw new Error('Failed to create item assignments');

  return data;
}

/**
 * Get all assignments for a split
 *
 * @param splitId - ID of the split
 * @returns Array of assignments with item details
 */
export async function getItemAssignments(splitId: string): Promise<any[]> {
  const { data, error } = await supabase
    .from('item_assignments')
    .select(`
      *,
      item:split_items (
        id,
        name,
        price,
        quantity
      )
    `)
    .eq('item.split_id', splitId);

  if (error) throw error;
  return data || [];
}

/**
 * Get all assignments for a specific user in a split
 *
 * @param splitId - ID of the split
 * @param userId - User ID
 * @returns Array of assignments for this user
 */
export async function getUserItemAssignments(
  splitId: string,
  userId: string
): Promise<any[]> {
  const { data, error } = await supabase
    .from('item_assignments')
    .select(`
      *,
      item:split_items!inner (
        id,
        split_id,
        name,
        price,
        quantity
      )
    `)
    .eq('item.split_id', splitId)
    .eq('user_id', userId);

  if (error) throw error;
  return data || [];
}

/**
 * Delete all assignments for a split
 *
 * @param splitId - ID of the split
 */
export async function deleteItemAssignments(splitId: string): Promise<void> {
  // First get all items for this split
  const items = await getSplitItems(splitId);
  const itemIds = items.map((item) => item.id);

  if (itemIds.length === 0) return;

  // Delete assignments for these items
  const { error } = await supabase
    .from('item_assignments')
    .delete()
    .in('item_id', itemIds);

  if (error) throw error;
}

// ============================================================================
// CALCULATIONS
// ============================================================================

/**
 * Calculate total amount a user owes for a receipt-based split
 *
 * This sums:
 * - All their item shares (from assignments)
 * - Their proportional share of tax
 * - Their proportional share of tip
 *
 * @param splitId - ID of the split
 * @param userId - User ID
 * @param tax - Total tax amount
 * @param tip - Total tip amount
 * @returns Total amount user owes
 */
export async function calculateUserTotal(
  splitId: string,
  userId: string,
  tax: number,
  tip: number
): Promise<{
  subtotal: number;
  tax: number;
  tip: number;
  total: number;
}> {
  // Get user's assignments
  const assignments = await getUserItemAssignments(splitId, userId);

  // Calculate subtotal from items
  const subtotal = assignments.reduce((sum, assignment) => {
    return sum + assignment.amount;
  }, 0);

  // Get all items to calculate receipt subtotal
  const allItems = await getSplitItems(splitId);
  const receiptSubtotal = allItems.reduce((sum, item) => {
    return sum + item.price * item.quantity;
  }, 0);

  // Calculate proportional tax and tip
  const proportion = receiptSubtotal > 0 ? subtotal / receiptSubtotal : 0;
  const userTax = tax * proportion;
  const userTip = tip * proportion;

  return {
    subtotal: Math.round(subtotal * 100) / 100,
    tax: Math.round(userTax * 100) / 100,
    tip: Math.round(userTip * 100) / 100,
    total: Math.round((subtotal + userTax + userTip) * 100) / 100,
  };
}

/**
 * Get summary of all participants and their totals for a receipt split
 *
 * @param splitId - ID of the split
 * @param tax - Total tax amount
 * @param tip - Total tip amount
 * @returns Array of { userId, subtotal, tax, tip, total }
 */
export async function getSplitParticipantTotals(
  splitId: string,
  tax: number,
  tip: number
): Promise<Array<{
  user_id: string;
  subtotal: number;
  tax: number;
  tip: number;
  total: number;
}>> {
  // Get all assignments for this split
  const assignments = await getItemAssignments(splitId);

  // Group by user
  const userTotals = new Map<string, number>();

  assignments.forEach((assignment) => {
    const current = userTotals.get(assignment.user_id) || 0;
    userTotals.set(assignment.user_id, current + assignment.amount);
  });

  // Get receipt subtotal
  const allItems = await getSplitItems(splitId);
  const receiptSubtotal = allItems.reduce((sum, item) => {
    return sum + item.price * item.quantity;
  }, 0);

  // Calculate totals for each user
  const results = Array.from(userTotals.entries()).map(([userId, subtotal]) => {
    const proportion = receiptSubtotal > 0 ? subtotal / receiptSubtotal : 0;
    const userTax = tax * proportion;
    const userTip = tip * proportion;

    return {
      user_id: userId,
      subtotal: Math.round(subtotal * 100) / 100,
      tax: Math.round(userTax * 100) / 100,
      tip: Math.round(userTip * 100) / 100,
      total: Math.round((subtotal + userTax + userTip) * 100) / 100,
    };
  });

  return results;
}

// ============================================================================
// VALIDATION
// ============================================================================

/**
 * Check if all items in a split have been assigned
 *
 * @param splitId - ID of the split
 * @returns True if all items assigned, false otherwise
 */
export async function areAllItemsAssigned(splitId: string): Promise<boolean> {
  const items = await getSplitItems(splitId);
  const assignments = await getItemAssignments(splitId);

  // Each item must have at least one assignment
  for (const item of items) {
    const hasAssignment = assignments.some((a) => a.item_id === item.id);
    if (!hasAssignment) return false;
  }

  return true;
}

/**
 * Get list of unassigned items
 *
 * @param splitId - ID of the split
 * @returns Array of unassigned items
 */
export async function getUnassignedItems(splitId: string): Promise<SplitItem[]> {
  const items = await getSplitItems(splitId);
  const assignments = await getItemAssignments(splitId);

  return items.filter((item) => {
    return !assignments.some((a) => a.item_id === item.id);
  });
}
