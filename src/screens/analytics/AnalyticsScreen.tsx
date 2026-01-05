import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Dimensions,
  RefreshControl,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { LineChart } from 'react-native-chart-kit';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import {
  getAnalytics,
  exportToCSV,
  AnalyticsData,
  TopPartner,
} from '../../services/analyticsService';
import Avatar from '../../components/common/Avatar';
import Card from '../../components/common/Card';
import Header from '../../components/common/Header';
import { useTheme } from '../../contexts/ThemeContext';
import { spacing, radius } from '../../constants/theme';

const screenWidth = Dimensions.get('window').width;

export default function AnalyticsScreen() {
  const navigation = useNavigation<any>();
  const { colors } = useTheme();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);

  useFocusEffect(
    useCallback(() => {
      loadAnalytics();
    }, [])
  );

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      const data = await getAnalytics();
      setAnalytics(data);
    } catch (error) {
      console.error('Error loading analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadAnalytics();
    setRefreshing(false);
  };

  const handleExport = async () => {
    try {
      setExporting(true);
      const csv = await exportToCSV();

      const fileName = `zapsplit_export_${Date.now()}.csv`;
      const filePath = `${FileSystem.documentDirectory}${fileName}`;

      await FileSystem.writeAsStringAsync(filePath, csv);

      const canShare = await Sharing.isAvailableAsync();
      if (canShare) {
        await Sharing.shareAsync(filePath, {
          mimeType: 'text/csv',
          dialogTitle: 'Export Split Data',
        });
      } else {
        Alert.alert('Success', 'Data exported to: ' + filePath);
      }
    } catch (error) {
      console.error('Error exporting:', error);
      Alert.alert('Error', 'Failed to export data');
    } finally {
      setExporting(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return `$${amount.toFixed(2)}`;
  };

  const chartConfig = {
    backgroundColor: colors.surface,
    backgroundGradientFrom: colors.surface,
    backgroundGradientTo: colors.surface,
    decimalPlaces: 0,
    color: (opacity = 1) => `rgba(59, 130, 246, ${opacity})`,
    labelColor: () => colors.gray500,
    style: {
      borderRadius: 16,
    },
    propsForDots: {
      r: '4',
      strokeWidth: '2',
      stroke: colors.primary,
    },
  };

  const pieColors = [
    '#3B82F6', // Blue
    '#10B981', // Green
    '#F59E0B', // Yellow
    '#EF4444', // Red
    '#8B5CF6', // Purple
    '#6B7280', // Gray
  ];

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.gray50 }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.gray50 }]}>
      {/* Header */}
      <Header
        title="Analytics"
        onBack={() => navigation.goBack()}
        rightElement={
          <TouchableOpacity
            style={styles.exportButton}
            onPress={handleExport}
            disabled={exporting}
          >
            {exporting ? (
              <ActivityIndicator size="small" color={colors.primary} />
            ) : (
              <Ionicons name="download-outline" size={24} color={colors.primary} />
            )}
          </TouchableOpacity>
        }
      />

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[colors.primary]}
          />
        }
      >
        {/* Monthly Stats */}
        <Text style={[styles.sectionTitle, { color: colors.gray500 }]}>This Month</Text>
        <View style={styles.statsGrid}>
          <Card variant="default" style={[styles.statCard, { backgroundColor: colors.surface }]}>
            <View style={styles.statIconContainer}>
              <Ionicons name="arrow-up-circle" size={24} color={colors.error} />
            </View>
            <Text style={[styles.statAmount, { color: colors.gray900 }]}>
              {formatCurrency(analytics?.monthlyStats.totalSpent || 0)}
            </Text>
            <Text style={[styles.statLabel, { color: colors.gray500 }]}>Spent</Text>
          </Card>

          <Card variant="default" style={[styles.statCard, { backgroundColor: colors.surface }]}>
            <View style={styles.statIconContainer}>
              <Ionicons name="arrow-down-circle" size={24} color={colors.success} />
            </View>
            <Text style={[styles.statAmount, { color: colors.gray900 }]}>
              {formatCurrency(analytics?.monthlyStats.totalReceived || 0)}
            </Text>
            <Text style={[styles.statLabel, { color: colors.gray500 }]}>Received</Text>
          </Card>

          <Card variant="default" style={[styles.statCard, { backgroundColor: colors.surface }]}>
            <View style={styles.statIconContainer}>
              <Ionicons name="receipt" size={24} color={colors.primary} />
            </View>
            <Text style={[styles.statAmount, { color: colors.gray900 }]}>
              {analytics?.monthlyStats.totalSplits || 0}
            </Text>
            <Text style={[styles.statLabel, { color: colors.gray500 }]}>Splits</Text>
          </Card>

          <Card variant="default" style={[styles.statCard, { backgroundColor: colors.surface }]}>
            <View style={styles.statIconContainer}>
              <Ionicons name="calculator" size={24} color={colors.warning} />
            </View>
            <Text style={[styles.statAmount, { color: colors.gray900 }]}>
              {formatCurrency(analytics?.monthlyStats.averageSplitAmount || 0)}
            </Text>
            <Text style={[styles.statLabel, { color: colors.gray500 }]}>Avg Split</Text>
          </Card>
        </View>

        {/* Spending Over Time Chart */}
        <Text style={[styles.sectionTitle, { color: colors.gray500 }]}>Spending Over Time</Text>
        <Card variant="default" style={[styles.chartCard, { backgroundColor: colors.surface }]}>
          {analytics?.spendingByMonth && analytics.spendingByMonth.some(m => m.amount > 0) ? (
            <LineChart
              data={{
                labels: analytics.spendingByMonth.map(m => m.month),
                datasets: [
                  {
                    data: analytics.spendingByMonth.map(m => m.amount || 0),
                  },
                ],
              }}
              width={screenWidth - 64}
              height={200}
              chartConfig={chartConfig}
              bezier
              style={styles.chart}
              withInnerLines={false}
              withOuterLines={false}
              fromZero
            />
          ) : (
            <View style={styles.emptyChart}>
              <Ionicons name="analytics-outline" size={48} color={colors.gray300} />
              <Text style={[styles.emptyChartText, { color: colors.gray400 }]}>No spending data yet</Text>
            </View>
          )}
        </Card>

        {/* Split Breakdown - Modern horizontal bars */}
        <Text style={[styles.sectionTitle, { color: colors.gray500 }]}>Spending by Category</Text>
        <Card variant="default" style={[styles.categoryCard, { backgroundColor: colors.surface }]}>
          {analytics?.splitBreakdown && analytics.splitBreakdown.length > 0 ? (
            <View style={styles.categoryList}>
              {analytics.splitBreakdown.map((item, index) => (
                <View key={item.category} style={styles.categoryItem}>
                  <View style={styles.categoryHeader}>
                    <View style={styles.categoryNameRow}>
                      <View
                        style={[
                          styles.categoryDot,
                          { backgroundColor: pieColors[index % pieColors.length] },
                        ]}
                      />
                      <Text style={[styles.categoryName, { color: colors.gray800 }]}>{item.category}</Text>
                    </View>
                    <Text style={[styles.categoryAmount, { color: colors.gray900 }]}>
                      {formatCurrency(item.amount)}
                    </Text>
                  </View>
                  <View style={[styles.progressBarContainer, { backgroundColor: colors.gray100 }]}>
                    <View
                      style={[
                        styles.progressBar,
                        {
                          width: `${Math.max(item.percentage, 2)}%`,
                          backgroundColor: pieColors[index % pieColors.length],
                        },
                      ]}
                    />
                  </View>
                  <Text style={[styles.categoryPercentage, { color: colors.gray500 }]}>
                    {item.percentage.toFixed(0)}% of total
                  </Text>
                </View>
              ))}
            </View>
          ) : (
            <View style={styles.emptyChart}>
              <Ionicons name="pie-chart-outline" size={48} color={colors.gray300} />
              <Text style={[styles.emptyChartText, { color: colors.gray400 }]}>No category data yet</Text>
            </View>
          )}
        </Card>

        {/* Top Split Partners */}
        <Text style={[styles.sectionTitle, { color: colors.gray500 }]}>Top Split Partners</Text>
        <Card variant="default" style={[styles.partnersCard, { backgroundColor: colors.surface }]}>
          {analytics?.topPartners && analytics.topPartners.length > 0 ? (
            analytics.topPartners.map((partner, index) => (
              <View
                key={partner.userId}
                style={[
                  styles.partnerItem,
                  index < analytics.topPartners.length - 1 && [styles.partnerBorder, { borderBottomColor: colors.gray100 }],
                ]}
              >
                <View style={[styles.partnerRank, { backgroundColor: colors.gray100 }]}>
                  <Text style={[styles.partnerRankText, { color: colors.gray600 }]}>#{index + 1}</Text>
                </View>
                <Avatar
                  name={partner.name}
                  uri={partner.avatarUrl || undefined}
                  size="md"
                />
                <View style={styles.partnerInfo}>
                  <Text style={[styles.partnerName, { color: colors.gray900 }]}>{partner.name}</Text>
                  <Text style={[styles.partnerSplits, { color: colors.gray500 }]}>
                    {partner.splitCount} split{partner.splitCount !== 1 ? 's' : ''}
                  </Text>
                </View>
                <Text style={[styles.partnerAmount, { color: colors.primary }]}>
                  {formatCurrency(partner.totalAmount)}
                </Text>
              </View>
            ))
          ) : (
            <View style={styles.emptyPartners}>
              <Ionicons name="people-outline" size={48} color={colors.gray300} />
              <Text style={[styles.emptyChartText, { color: colors.gray400 }]}>No split partners yet</Text>
            </View>
          )}
        </Card>

        {/* Export Section */}
        <Card variant="default" style={[styles.exportCard, { backgroundColor: colors.surface }]}>
          <TouchableOpacity
            style={styles.exportRow}
            onPress={handleExport}
            disabled={exporting}
          >
            <View style={[styles.exportIconContainer, { backgroundColor: colors.primary + '12' }]}>
              <Ionicons name="document-text-outline" size={24} color={colors.primary} />
            </View>
            <View style={styles.exportInfo}>
              <Text style={[styles.exportTitle, { color: colors.gray900 }]}>Export to CSV</Text>
              <Text style={[styles.exportDescription, { color: colors.gray500 }]}>
                Download all your split data as a spreadsheet
              </Text>
            </View>
            {exporting ? (
              <ActivityIndicator size="small" color={colors.primary} />
            ) : (
              <Ionicons name="chevron-forward" size={20} color={colors.gray400} />
            )}
          </TouchableOpacity>
        </Card>

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  exportButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    padding: spacing.md,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 12,
    marginTop: 8,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    minWidth: '45%',
    padding: spacing.md,
    alignItems: 'center',
  },
  statIconContainer: {
    marginBottom: 8,
  },
  statAmount: {
    fontSize: 20,
    fontWeight: '700',
  },
  statLabel: {
    fontSize: 12,
    marginTop: 4,
  },
  chartCard: {
    padding: spacing.md,
    marginBottom: 24,
  },
  chart: {
    borderRadius: radius.md,
    marginVertical: 8,
  },
  emptyChart: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyChartText: {
    fontSize: 14,
    marginTop: 12,
  },
  categoryCard: {
    padding: spacing.md,
    marginBottom: 24,
  },
  categoryList: {
    gap: 20,
  },
  categoryItem: {
    gap: 8,
  },
  categoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  categoryNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  categoryDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  categoryName: {
    fontSize: 15,
    fontWeight: '500',
  },
  categoryAmount: {
    fontSize: 15,
    fontWeight: '600',
  },
  progressBarContainer: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: 4,
  },
  categoryPercentage: {
    fontSize: 12,
  },
  partnersCard: {
    padding: 0,
    marginBottom: 24,
    overflow: 'hidden',
  },
  partnerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
  },
  partnerBorder: {
    borderBottomWidth: 1,
  },
  partnerRank: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  partnerRankText: {
    fontSize: 12,
    fontWeight: '600',
  },
  partnerInfo: {
    flex: 1,
    marginLeft: 12,
  },
  partnerName: {
    fontSize: 16,
    fontWeight: '600',
  },
  partnerSplits: {
    fontSize: 13,
    marginTop: 2,
  },
  partnerAmount: {
    fontSize: 16,
    fontWeight: '700',
  },
  emptyPartners: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  exportCard: {
    padding: 0,
    marginBottom: 24,
    overflow: 'hidden',
  },
  exportRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
  },
  exportIconContainer: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  exportInfo: {
    flex: 1,
    marginLeft: 12,
  },
  exportTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  exportDescription: {
    fontSize: 13,
    marginTop: 2,
  },
  bottomSpacer: {
    height: 40,
  },
});
