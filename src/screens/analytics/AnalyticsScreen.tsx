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
import { colors } from '../../constants/theme';

const screenWidth = Dimensions.get('window').width;

export default function AnalyticsScreen() {
  const navigation = useNavigation<any>();
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
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={colors.gray900} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Analytics</Text>
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
      </View>

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
        <Text style={styles.sectionTitle}>This Month</Text>
        <View style={styles.statsGrid}>
          <Card variant="default" style={styles.statCard}>
            <View style={styles.statIconContainer}>
              <Ionicons name="arrow-up-circle" size={24} color={colors.error} />
            </View>
            <Text style={styles.statAmount}>
              {formatCurrency(analytics?.monthlyStats.totalSpent || 0)}
            </Text>
            <Text style={styles.statLabel}>Spent</Text>
          </Card>

          <Card variant="default" style={styles.statCard}>
            <View style={styles.statIconContainer}>
              <Ionicons name="arrow-down-circle" size={24} color={colors.success} />
            </View>
            <Text style={styles.statAmount}>
              {formatCurrency(analytics?.monthlyStats.totalReceived || 0)}
            </Text>
            <Text style={styles.statLabel}>Received</Text>
          </Card>

          <Card variant="default" style={styles.statCard}>
            <View style={styles.statIconContainer}>
              <Ionicons name="receipt" size={24} color={colors.primary} />
            </View>
            <Text style={styles.statAmount}>
              {analytics?.monthlyStats.totalSplits || 0}
            </Text>
            <Text style={styles.statLabel}>Splits</Text>
          </Card>

          <Card variant="default" style={styles.statCard}>
            <View style={styles.statIconContainer}>
              <Ionicons name="calculator" size={24} color={colors.warning} />
            </View>
            <Text style={styles.statAmount}>
              {formatCurrency(analytics?.monthlyStats.averageSplitAmount || 0)}
            </Text>
            <Text style={styles.statLabel}>Avg Split</Text>
          </Card>
        </View>

        {/* Spending Over Time Chart */}
        <Text style={styles.sectionTitle}>Spending Over Time</Text>
        <Card variant="default" style={styles.chartCard}>
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
              <Text style={styles.emptyChartText}>No spending data yet</Text>
            </View>
          )}
        </Card>

        {/* Split Breakdown - Modern horizontal bars */}
        <Text style={styles.sectionTitle}>Spending by Category</Text>
        <Card variant="default" style={styles.categoryCard}>
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
                      <Text style={styles.categoryName}>{item.category}</Text>
                    </View>
                    <Text style={styles.categoryAmount}>
                      {formatCurrency(item.amount)}
                    </Text>
                  </View>
                  <View style={styles.progressBarContainer}>
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
                  <Text style={styles.categoryPercentage}>
                    {item.percentage.toFixed(0)}% of total
                  </Text>
                </View>
              ))}
            </View>
          ) : (
            <View style={styles.emptyChart}>
              <Ionicons name="pie-chart-outline" size={48} color={colors.gray300} />
              <Text style={styles.emptyChartText}>No category data yet</Text>
            </View>
          )}
        </Card>

        {/* Top Split Partners */}
        <Text style={styles.sectionTitle}>Top Split Partners</Text>
        <Card variant="default" style={styles.partnersCard}>
          {analytics?.topPartners && analytics.topPartners.length > 0 ? (
            analytics.topPartners.map((partner, index) => (
              <View
                key={partner.userId}
                style={[
                  styles.partnerItem,
                  index < analytics.topPartners.length - 1 && styles.partnerBorder,
                ]}
              >
                <View style={styles.partnerRank}>
                  <Text style={styles.partnerRankText}>#{index + 1}</Text>
                </View>
                <Avatar
                  name={partner.name}
                  uri={partner.avatarUrl || undefined}
                  size="md"
                />
                <View style={styles.partnerInfo}>
                  <Text style={styles.partnerName}>{partner.name}</Text>
                  <Text style={styles.partnerSplits}>
                    {partner.splitCount} split{partner.splitCount !== 1 ? 's' : ''}
                  </Text>
                </View>
                <Text style={styles.partnerAmount}>
                  {formatCurrency(partner.totalAmount)}
                </Text>
              </View>
            ))
          ) : (
            <View style={styles.emptyPartners}>
              <Ionicons name="people-outline" size={48} color={colors.gray300} />
              <Text style={styles.emptyChartText}>No split partners yet</Text>
            </View>
          )}
        </Card>

        {/* Export Section */}
        <Card variant="default" style={styles.exportCard}>
          <TouchableOpacity
            style={styles.exportRow}
            onPress={handleExport}
            disabled={exporting}
          >
            <View style={styles.exportIconContainer}>
              <Ionicons name="document-text-outline" size={24} color={colors.primary} />
            </View>
            <View style={styles.exportInfo}>
              <Text style={styles.exportTitle}>Export to CSV</Text>
              <Text style={styles.exportDescription}>
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
    backgroundColor: colors.gray50,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.gray50,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    paddingTop: 60,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray200,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    flex: 1,
    fontSize: 20,
    fontWeight: '700',
    color: colors.gray900,
    textAlign: 'center',
  },
  exportButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.gray500,
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
    padding: 16,
    alignItems: 'center',
  },
  statIconContainer: {
    marginBottom: 8,
  },
  statAmount: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.gray900,
  },
  statLabel: {
    fontSize: 12,
    color: colors.gray500,
    marginTop: 4,
  },
  chartCard: {
    padding: 16,
    marginBottom: 24,
  },
  chart: {
    borderRadius: 12,
    marginVertical: 8,
  },
  emptyChart: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyChartText: {
    fontSize: 14,
    color: colors.gray400,
    marginTop: 12,
  },
  categoryCard: {
    padding: 16,
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
    color: colors.gray800,
  },
  categoryAmount: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.gray900,
  },
  progressBarContainer: {
    height: 8,
    backgroundColor: colors.gray100,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: 4,
  },
  categoryPercentage: {
    fontSize: 12,
    color: colors.gray500,
  },
  partnersCard: {
    padding: 0,
    marginBottom: 24,
    overflow: 'hidden',
  },
  partnerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  partnerBorder: {
    borderBottomWidth: 1,
    borderBottomColor: colors.gray100,
  },
  partnerRank: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.gray100,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  partnerRankText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.gray600,
  },
  partnerInfo: {
    flex: 1,
    marginLeft: 12,
  },
  partnerName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.gray900,
  },
  partnerSplits: {
    fontSize: 13,
    color: colors.gray500,
    marginTop: 2,
  },
  partnerAmount: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.primary,
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
    padding: 16,
  },
  exportIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primaryLight,
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
    color: colors.gray900,
  },
  exportDescription: {
    fontSize: 13,
    color: colors.gray500,
    marginTop: 2,
  },
  bottomSpacer: {
    height: 40,
  },
});
