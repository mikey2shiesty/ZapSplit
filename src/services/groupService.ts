// ═══════════════════════════════════════════════════════════════
// Group Service - Manage groups and group members
// ═══════════════════════════════════════════════════════════════

import { supabase } from './supabase';

export type GroupType = 'household' | 'trip' | 'event' | 'work' | 'custom';

export interface Group {
  id: string;
  name: string;
  description: string | null;
  avatar_url: string | null;
  created_by: string;
  type: GroupType;
  default_split_type: string;
  simplify_debts: boolean;
  total_expenses: number;
  member_count: number;
  created_at: string;
  updated_at: string;
}

export interface GroupMember {
  id: string;
  group_id: string;
  user_id: string;
  role: 'admin' | 'member';
  can_add_expenses: boolean;
  can_edit_expenses: boolean;
  can_remove_members: boolean;
  joined_at: string;
  user?: {
    id: string;
    email: string;
    full_name: string;
    avatar_url: string | null;
  };
}

export interface GroupWithMembers extends Group {
  members: GroupMember[];
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Get Groups
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export async function getUserGroups(userId: string): Promise<Group[]> {
  try {
    // Get groups where user is a member
    const { data: memberships, error: memberError } = await supabase
      .from('group_members')
      .select('group_id')
      .eq('user_id', userId)
      .is('left_at', null);

    if (memberError) throw memberError;
    if (!memberships || memberships.length === 0) return [];

    const groupIds = memberships.map(m => m.group_id);

    const { data: groups, error } = await supabase
      .from('groups')
      .select('*')
      .in('id', groupIds)
      .is('archived_at', null)
      .order('updated_at', { ascending: false });

    if (error) throw error;
    return groups || [];
  } catch (error) {
    console.error('Error getting user groups:', error);
    return [];
  }
}

export async function getGroupWithMembers(groupId: string): Promise<GroupWithMembers | null> {
  try {
    const { data: group, error: groupError } = await supabase
      .from('groups')
      .select('*')
      .eq('id', groupId)
      .single();

    if (groupError) throw groupError;

    const { data: members, error: membersError } = await supabase
      .from('group_members')
      .select('*, user:user_id (id, email, full_name, avatar_url)')
      .eq('group_id', groupId)
      .is('left_at', null);

    if (membersError) throw membersError;

    return { ...group, members: members || [] };
  } catch (error) {
    console.error('Error getting group with members:', error);
    return null;
  }
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Create & Update Groups
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export interface CreateGroupInput {
  name: string;
  description?: string;
  type?: GroupType;
  memberIds: string[];
}

export async function createGroup(
  userId: string,
  input: CreateGroupInput
): Promise<{ success: boolean; group?: Group; error?: string }> {
  try {
    // Create the group
    const { data: group, error: groupError } = await supabase
      .from('groups')
      .insert({
        name: input.name,
        description: input.description || null,
        type: input.type || 'custom',
        created_by: userId,
        member_count: input.memberIds.length + 1,
      })
      .select()
      .single();

    if (groupError) throw groupError;

    // Add creator as admin
    const { error: creatorError } = await supabase
      .from('group_members')
      .insert({
        group_id: group.id,
        user_id: userId,
        role: 'admin',
        can_add_expenses: true,
        can_edit_expenses: true,
        can_remove_members: true,
      });

    if (creatorError) throw creatorError;

    // Add other members
    if (input.memberIds.length > 0) {
      const memberInserts = input.memberIds.map(memberId => ({
        group_id: group.id,
        user_id: memberId,
        role: 'member' as const,
        invited_by: userId,
      }));

      const { error: membersError } = await supabase
        .from('group_members')
        .insert(memberInserts);

      if (membersError) throw membersError;
    }

    return { success: true, group };
  } catch (error: any) {
    console.error('Error creating group:', error);
    return { success: false, error: error.message || 'Failed to create group' };
  }
}

export async function updateGroup(
  groupId: string,
  updates: Partial<Pick<Group, 'name' | 'description' | 'type'>>
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from('groups')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', groupId);

    if (error) throw error;
    return { success: true };
  } catch (error: any) {
    console.error('Error updating group:', error);
    return { success: false, error: error.message || 'Failed to update group' };
  }
}

export async function deleteGroup(groupId: string): Promise<{ success: boolean; error?: string }> {
  try {
    // Soft delete by setting archived_at
    const { error } = await supabase
      .from('groups')
      .update({ archived_at: new Date().toISOString() })
      .eq('id', groupId);

    if (error) throw error;
    return { success: true };
  } catch (error: any) {
    console.error('Error deleting group:', error);
    return { success: false, error: error.message || 'Failed to delete group' };
  }
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Manage Members
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export async function addMemberToGroup(
  groupId: string,
  userId: string,
  invitedBy: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // Check if already a member
    const { data: existing } = await supabase
      .from('group_members')
      .select('id, left_at')
      .eq('group_id', groupId)
      .eq('user_id', userId)
      .maybeSingle();

    if (existing && !existing.left_at) {
      return { success: false, error: 'Already a member' };
    }

    if (existing && existing.left_at) {
      // Rejoin - update left_at to null
      const { error } = await supabase
        .from('group_members')
        .update({ left_at: null, joined_at: new Date().toISOString() })
        .eq('id', existing.id);

      if (error) throw error;
    } else {
      // Add new member
      const { error } = await supabase
        .from('group_members')
        .insert({
          group_id: groupId,
          user_id: userId,
          role: 'member',
          invited_by: invitedBy,
        });

      if (error) throw error;
    }

    // Update member count
    await updateMemberCount(groupId);

    return { success: true };
  } catch (error: any) {
    console.error('Error adding member to group:', error);
    return { success: false, error: error.message || 'Failed to add member' };
  }
}

export async function removeMemberFromGroup(
  groupId: string,
  userId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from('group_members')
      .update({ left_at: new Date().toISOString() })
      .eq('group_id', groupId)
      .eq('user_id', userId);

    if (error) throw error;

    // Update member count
    await updateMemberCount(groupId);

    return { success: true };
  } catch (error: any) {
    console.error('Error removing member from group:', error);
    return { success: false, error: error.message || 'Failed to remove member' };
  }
}

export async function leaveGroup(
  groupId: string,
  userId: string
): Promise<{ success: boolean; error?: string }> {
  return removeMemberFromGroup(groupId, userId);
}

async function updateMemberCount(groupId: string): Promise<void> {
  try {
    const { count, error } = await supabase
      .from('group_members')
      .select('*', { count: 'exact', head: true })
      .eq('group_id', groupId)
      .is('left_at', null);

    if (!error && count !== null) {
      await supabase
        .from('groups')
        .update({ member_count: count })
        .eq('id', groupId);
    }
  } catch (error) {
    console.error('Error updating member count:', error);
  }
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Group Activity
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

export interface GroupSplit {
  id: string;
  title: string;
  total_amount: number;
  status: string;
  created_at: string;
  created_by: string;
  creator?: {
    full_name: string;
    avatar_url: string | null;
  };
}

export async function getGroupSplits(groupId: string): Promise<GroupSplit[]> {
  try {
    const { data, error } = await supabase
      .from('splits')
      .select('id, title, total_amount, status, created_at, created_by, creator:created_by (full_name, avatar_url)')
      .eq('group_id', groupId)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error getting group splits:', error);
    return [];
  }
}

export async function isUserGroupAdmin(groupId: string, userId: string): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('group_members')
      .select('role')
      .eq('group_id', groupId)
      .eq('user_id', userId)
      .is('left_at', null)
      .single();

    if (error) return false;
    return data?.role === 'admin';
  } catch (error) {
    return false;
  }
}
