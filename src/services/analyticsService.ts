import { supabase } from './supabase';

export interface MonthlyStats {
  totalSpent: number;
  totalReceived: number;
  totalSplits: number;
  averageSplitAmount: number;
}

export interface SpendingByMonth {
  month: string;
  amount: number;
}

export interface SplitBreakdown {
  category: string;
  amount: number;
  count: number;
  percentage: number;
}

export interface TopPartner {
  userId: string;
  name: string;
  avatarUrl: string | null;
  totalAmount: number;
  splitCount: number;
}

export interface AnalyticsData {
  monthlyStats: MonthlyStats;
  spendingByMonth: SpendingByMonth[];
  splitBreakdown: SplitBreakdown[];
  topPartners: TopPartner[];
}

/**
 * Get analytics data for the current user
 */
export async function getAnalytics(): Promise<AnalyticsData> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const [monthlyStats, spendingByMonth, splitBreakdown, topPartners] = await Promise.all([
    getMonthlyStats(user.id),
    getSpendingByMonth(user.id),
    getSplitBreakdown(user.id),
    getTopPartners(user.id),
  ]);

  return {
    monthlyStats,
    spendingByMonth,
    splitBreakdown,
    topPartners,
  };
}

/**
 * Get stats for the current month
 */
async function getMonthlyStats(userId: string): Promise<MonthlyStats> {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59).toISOString();

  // Get splits where user is a participant this month
  const { data: participants } = await supabase
    .from('split_participants')
    .select(`
      amount_owed,
      status,
      splits!inner (
        id,
        created_at,
        creator_id
      )
    `)
    .eq('user_id', userId)
    .gte('splits.created_at', startOfMonth)
    .lte('splits.created_at', endOfMonth);

  let totalSpent = 0;
  let totalReceived = 0;
  let totalSplits = 0;

  if (participants) {
    participants.forEach((p: any) => {
      totalSplits++;
      if (p.splits.creator_id === userId) {
        // User created this split, they received money
        totalReceived += p.amount_owed || 0;
      } else {
        // User participated, they spent money
        totalSpent += p.amount_owed || 0;
      }
    });
  }

  return {
    totalSpent,
    totalReceived,
    totalSplits,
    averageSplitAmount: totalSplits > 0 ? (totalSpent + totalReceived) / totalSplits : 0,
  };
}

/**
 * Get spending by month for the last 6 months
 */
async function getSpendingByMonth(userId: string): Promise<SpendingByMonth[]> {
  const months: SpendingByMonth[] = [];
  const now = new Date();

  for (let i = 5; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const startOfMonth = date.toISOString();
    const endOfMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59).toISOString();

    const { data: participants } = await supabase
      .from('split_participants')
      .select(`
        amount_owed,
        splits!inner (
          created_at,
          creator_id
        )
      `)
      .eq('user_id', userId)
      .neq('splits.creator_id', userId)
      .gte('splits.created_at', startOfMonth)
      .lte('splits.created_at', endOfMonth);

    const total = participants?.reduce((sum: number, p: any) => sum + (p.amount_owed || 0), 0) || 0;

    months.push({
      month: date.toLocaleDateString('en-AU', { month: 'short' }),
      amount: total,
    });
  }

  return months;
}

/**
 * Get split breakdown by category/title patterns
 */
async function getSplitBreakdown(userId: string): Promise<SplitBreakdown[]> {
  const { data: participants } = await supabase
    .from('split_participants')
    .select(`
      amount_owed,
      splits!inner (
        title,
        description
      )
    `)
    .eq('user_id', userId);

  if (!participants || participants.length === 0) {
    return [];
  }

  // Categorize based on keywords in title/description
  const categories: Record<string, { amount: number; count: number }> = {
    'Food & Dining': { amount: 0, count: 0 },
    'Entertainment': { amount: 0, count: 0 },
    'Travel': { amount: 0, count: 0 },
    'Shopping': { amount: 0, count: 0 },
    'Bills & Utilities': { amount: 0, count: 0 },
    'Other': { amount: 0, count: 0 },
  };

  const foodKeywords = ['dinner', 'lunch', 'breakfast', 'food', 'restaurant', 'cafe', 'coffee', 'pizza', 'burger', 'sushi', 'meal'];
  const entertainmentKeywords = ['movie', 'concert', 'show', 'game', 'party', 'club', 'bar', 'drinks', 'netflix', 'spotify'];
  const travelKeywords = ['uber', 'taxi', 'flight', 'hotel', 'airbnb', 'trip', 'travel', 'gas', 'petrol', 'fuel'];
  const shoppingKeywords = ['shopping', 'gift', 'clothes', 'amazon', 'store', 'buy'];
  const billsKeywords = ['rent', 'electricity', 'water', 'internet', 'phone', 'bill', 'utility', 'subscription'];

  participants.forEach((p: any) => {
    const text = `${p.splits.title || ''} ${p.splits.description || ''}`.toLowerCase();
    const amount = p.amount_owed || 0;

    if (foodKeywords.some(k => text.includes(k))) {
      categories['Food & Dining'].amount += amount;
      categories['Food & Dining'].count++;
    } else if (entertainmentKeywords.some(k => text.includes(k))) {
      categories['Entertainment'].amount += amount;
      categories['Entertainment'].count++;
    } else if (travelKeywords.some(k => text.includes(k))) {
      categories['Travel'].amount += amount;
      categories['Travel'].count++;
    } else if (shoppingKeywords.some(k => text.includes(k))) {
      categories['Shopping'].amount += amount;
      categories['Shopping'].count++;
    } else if (billsKeywords.some(k => text.includes(k))) {
      categories['Bills & Utilities'].amount += amount;
      categories['Bills & Utilities'].count++;
    } else {
      categories['Other'].amount += amount;
      categories['Other'].count++;
    }
  });

  const totalAmount = Object.values(categories).reduce((sum, c) => sum + c.amount, 0);

  return Object.entries(categories)
    .filter(([_, data]) => data.count > 0)
    .map(([category, data]) => ({
      category,
      amount: data.amount,
      count: data.count,
      percentage: totalAmount > 0 ? (data.amount / totalAmount) * 100 : 0,
    }))
    .sort((a, b) => b.amount - a.amount);
}

/**
 * Get top split partners
 */
async function getTopPartners(userId: string): Promise<TopPartner[]> {
  // Get all splits where user is creator (with participant profiles)
  const { data: createdSplits } = await supabase
    .from('splits')
    .select(`
      id,
      split_participants (
        user_id,
        amount_owed,
        profiles (
          id,
          full_name,
          avatar_url
        )
      )
    `)
    .eq('creator_id', userId);

  // Get all splits where user is participant (simpler query without nested profiles)
  const { data: participatedSplits } = await supabase
    .from('split_participants')
    .select(`
      amount_owed,
      splits!inner (
        id,
        creator_id
      )
    `)
    .eq('user_id', userId)
    .neq('splits.creator_id', userId);

  // Collect unique creator IDs to fetch their profiles separately
  const creatorIds = new Set<string>();
  participatedSplits?.forEach((p: any) => {
    if (p.splits?.creator_id) {
      creatorIds.add(p.splits.creator_id);
    }
  });

  // Fetch creator profiles separately
  const creatorProfiles: Record<string, { full_name: string; avatar_url: string | null }> = {};
  if (creatorIds.size > 0) {
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, full_name, avatar_url')
      .in('id', Array.from(creatorIds));

    profiles?.forEach((p: any) => {
      creatorProfiles[p.id] = { full_name: p.full_name, avatar_url: p.avatar_url };
    });
  }

  const partnerMap: Record<string, { name: string; avatarUrl: string | null; totalAmount: number; splitCount: number }> = {};

  // Process splits user created
  createdSplits?.forEach((split: any) => {
    split.split_participants?.forEach((p: any) => {
      if (p.user_id !== userId && p.profiles) {
        const partnerId = p.user_id;
        if (!partnerMap[partnerId]) {
          partnerMap[partnerId] = {
            name: p.profiles.full_name || 'Unknown',
            avatarUrl: p.profiles.avatar_url,
            totalAmount: 0,
            splitCount: 0,
          };
        }
        partnerMap[partnerId].totalAmount += p.amount_owed || 0;
        partnerMap[partnerId].splitCount++;
      }
    });
  });

  // Process splits user participated in (using separately fetched profiles)
  participatedSplits?.forEach((p: any) => {
    const partnerId = p.splits?.creator_id;
    if (partnerId) {
      const creatorProfile = creatorProfiles[partnerId];
      if (!partnerMap[partnerId]) {
        partnerMap[partnerId] = {
          name: creatorProfile?.full_name || 'Unknown',
          avatarUrl: creatorProfile?.avatar_url || null,
          totalAmount: 0,
          splitCount: 0,
        };
      }
      partnerMap[partnerId].totalAmount += p.amount_owed || 0;
      partnerMap[partnerId].splitCount++;
    }
  });

  return Object.entries(partnerMap)
    .map(([odUserId, data]) => ({
      userId: odUserId,
      ...data,
    }))
    .sort((a, b) => b.totalAmount - a.totalAmount)
    .slice(0, 5);
}

/**
 * Export analytics data to CSV format
 */
export async function exportToCSV(): Promise<string> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  // Get all user's split participation (without nested profiles - not supported)
  const { data: participants } = await supabase
    .from('split_participants')
    .select(`
      amount_owed,
      status,
      splits!inner (
        id,
        title,
        description,
        total_amount,
        created_at,
        creator_id
      )
    `)
    .eq('user_id', user.id);

  if (!participants || participants.length === 0) {
    return 'No data to export';
  }

  // Collect unique creator IDs to fetch their profiles separately
  const creatorIds = new Set<string>();
  participants.forEach((p: any) => {
    if (p.splits?.creator_id) {
      creatorIds.add(p.splits.creator_id);
    }
  });

  // Fetch creator profiles separately
  const creatorProfiles: Record<string, string> = {};
  if (creatorIds.size > 0) {
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, full_name')
      .in('id', Array.from(creatorIds));

    profiles?.forEach((p: any) => {
      creatorProfiles[p.id] = p.full_name || 'Unknown';
    });
  }

  // Sort by split date (newest first) - can't use .order() on joined tables
  participants.sort((a: any, b: any) => {
    const dateA = new Date(a.splits.created_at).getTime();
    const dateB = new Date(b.splits.created_at).getTime();
    return dateB - dateA;
  });

  // CSV Header
  const headers = ['Date', 'Title', 'Description', 'Total Amount', 'Your Share', 'Status', 'Created By', 'Type'];

  // CSV Rows
  const rows = participants.map((p: any) => {
    const split = p.splits;
    const isCreator = split.creator_id === user.id;
    const date = new Date(split.created_at).toLocaleDateString('en-AU');
    const creatorName = creatorProfiles[split.creator_id] || 'Unknown';

    return [
      date,
      `"${(split.title || '').replace(/"/g, '""')}"`,
      `"${(split.description || '').replace(/"/g, '""')}"`,
      split.total_amount?.toFixed(2) || '0.00',
      p.amount_owed?.toFixed(2) || '0.00',
      p.status || 'pending',
      `"${creatorName.replace(/"/g, '""')}"`,
      isCreator ? 'Received' : 'Paid',
    ].join(',');
  });

  return [headers.join(','), ...rows].join('\n');
}
