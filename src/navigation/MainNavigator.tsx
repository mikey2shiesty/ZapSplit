import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import {
  createBottomTabNavigator,
  BottomTabBarProps,
} from '@react-navigation/bottom-tabs';
import { Platform, View, Text, Pressable, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import HomeScreen from '../screens/main/HomeScreen';
import ScanScreen from '../screens/main/ScanScreen';
import SplitsScreen from '../screens/main/SplitsScreen';
import ProfileScreen from '../screens/main/ProfileScreen';
import SplitFlowNavigator from './SplitFlowNavigator';
// Lazy load Stripe screens to avoid initialization errors
const ConnectStripeScreen = require('../screens/settings/ConnectStripeScreen').default;
const PaymentHistoryScreen = require('../screens/payments/PaymentHistoryScreen').default;
// Friends & Groups screens
import FriendsScreen from '../screens/friends/FriendsScreen';
import AddFriendScreen from '../screens/friends/AddFriendScreen';
import FriendRequestsScreen from '../screens/friends/FriendRequestsScreen';
import FriendProfileScreen from '../screens/friends/FriendProfileScreen';
import GroupsScreen from '../screens/groups/GroupsScreen';
import CreateGroupScreen from '../screens/groups/CreateGroupScreen';
import GroupDetailScreen from '../screens/groups/GroupDetailScreen';
import AddGroupMembersScreen from '../screens/groups/AddGroupMembersScreen';
// Notification screens
import NotificationsScreen from '../screens/notifications/NotificationsScreen';
import NotificationSettingsScreen from '../screens/notifications/NotificationSettingsScreen';
// Privacy & Security screens
import PrivacySettingsScreen from '../screens/settings/PrivacySettingsScreen';
import BlockedUsersScreen from '../screens/settings/BlockedUsersScreen';
// Legal & Compliance screens
import PrivacyPolicyScreen from '../screens/settings/PrivacyPolicyScreen';
import TermsOfServiceScreen from '../screens/settings/TermsOfServiceScreen';
import DeleteAccountScreen from '../screens/settings/DeleteAccountScreen';
// Settings & Profile screens
import SettingsScreen from '../screens/settings/SettingsScreen';
import EditProfileScreen from '../screens/settings/EditProfileScreen';
import ChangePasswordScreen from '../screens/settings/ChangePasswordScreen';
import HelpSupportScreen from '../screens/settings/HelpSupportScreen';
// Analytics
import AnalyticsScreen from '../screens/analytics/AnalyticsScreen';
import { RootStackParamList, MainTabParamList } from '../types/navigation';
import { useTheme } from '../contexts/ThemeContext';

const Stack = createStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();

// JS-side iOS 26-inspired tab bar. The "real" iOS 26 Liquid Glass needs the
// native bottom tab navigator (`createNativeBottomTabNavigator`), which only
// works in a dev build that includes the matching native module — Expo Go and
// our current dev build don't have it. Switch to native once the next EAS
// build with Xcode 26 is on the device.

type TabIconName = keyof typeof Ionicons.glyphMap;

const TAB_ICONS: Record<string, { active: TabIconName; inactive: TabIconName }> = {
  Home: { active: 'home', inactive: 'home-outline' },
  Scan: { active: 'camera', inactive: 'camera-outline' },
  Splits: { active: 'receipt', inactive: 'receipt-outline' },
  Profile: { active: 'person', inactive: 'person-outline' },
};

function FriendlyTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const bottomInset = Math.max(insets.bottom, 12);

  return (
    <View
      style={[styles.tabBarWrapper, { paddingBottom: bottomInset }]}
      pointerEvents="box-none"
    >
      <View style={styles.row}>
        {state.routes.map((route, index) => {
          const { options } = descriptors[route.key];
          const focused = state.index === index;

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });
            if (!focused && !event.defaultPrevented) {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              navigation.navigate(route.name as never);
            }
          };

          const icons = TAB_ICONS[route.name] ?? TAB_ICONS.Home;
          const iconName = focused ? icons.active : icons.inactive;
          const tone = focused ? colors.primary : colors.textSecondary;
          const label =
            options.tabBarLabel !== undefined
              ? (options.tabBarLabel as string)
              : options.title !== undefined
              ? options.title
              : route.name;

          return (
            <Pressable
              key={route.key}
              onPress={onPress}
              accessibilityRole="button"
              accessibilityState={focused ? { selected: true } : {}}
              accessibilityLabel={options.tabBarAccessibilityLabel}
              hitSlop={6}
              style={({ pressed }) => [
                styles.item,
                pressed && { opacity: 0.6 },
              ]}
            >
              {focused && (
                <View
                  style={[
                    styles.activeCapsule,
                    {
                      borderColor: isDark
                        ? 'rgba(255,255,255,0.14)'
                        : 'rgba(15,24,48,0.10)',
                    },
                  ]}
                  pointerEvents="none"
                >
                  {Platform.OS === 'ios' && (
                    <BlurView
                      intensity={50}
                      tint={isDark ? 'dark' : 'light'}
                      style={StyleSheet.absoluteFill}
                    />
                  )}
                  <View
                    style={[
                      StyleSheet.absoluteFill,
                      {
                        backgroundColor: isDark
                          ? 'rgba(40,48,68,0.62)'
                          : 'rgba(255,255,255,0.72)',
                      },
                    ]}
                  />
                  <View
                    style={[
                      styles.activeTopHighlight,
                      {
                        backgroundColor: isDark
                          ? 'rgba(255,255,255,0.08)'
                          : 'rgba(255,255,255,0.55)',
                      },
                    ]}
                  />
                </View>
              )}

              <View style={styles.itemContent}>
                <Ionicons name={iconName} size={24} color={tone} />
                <Text
                  style={[
                    styles.label,
                    {
                      color: tone,
                      fontWeight: focused ? '600' : '500',
                    },
                  ]}
                >
                  {String(label)}
                </Text>
              </View>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

function MainTabs() {
  return (
    <Tab.Navigator
      tabBar={(props) => <FriendlyTabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Scan" component={ScanScreen} />
      <Tab.Screen name="Splits" component={SplitsScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  tabBarWrapper: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 8,
    paddingTop: 6,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'stretch',
    justifyContent: 'space-around',
  },
  item: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
    paddingVertical: 6,
    minHeight: 56,
    position: 'relative',
  },
  itemContent: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  activeCapsule: {
    position: 'absolute',
    top: 4,
    bottom: 4,
    left: 6,
    right: 6,
    borderRadius: 22,
    borderWidth: 1,
    overflow: 'hidden',
  },
  activeTopHighlight: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 1,
  },
  label: {
    fontSize: 10,
    letterSpacing: 0.1,
  },
});

// Main Navigator with Modal Stack
export default function MainNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      {/* Main Tab Navigator */}
      <Stack.Screen name="Main" component={MainTabs} />

      {/* Split Flow */}
      <Stack.Screen
        name="SplitFlow"
        component={SplitFlowNavigator}
        options={{
          presentation: 'card',
          headerShown: false,
        }}
      />

      {/* Stripe Connect */}
      <Stack.Screen
        name="ConnectStripe"
        component={ConnectStripeScreen}
        options={{
          presentation: 'card',
          headerShown: false,
        }}
      />

      {/* Payment History */}
      <Stack.Screen
        name="PaymentHistory"
        component={PaymentHistoryScreen}
        options={{
          presentation: 'card',
          headerShown: false,
        }}
      />

      {/* Friends Screens */}
      <Stack.Screen
        name="Friends"
        component={FriendsScreen}
        options={{
          presentation: 'card',
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="AddFriend"
        component={AddFriendScreen}
        options={{
          presentation: 'card',
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="FriendRequests"
        component={FriendRequestsScreen}
        options={{
          presentation: 'card',
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="FriendProfile"
        component={FriendProfileScreen}
        options={{
          presentation: 'card',
          headerShown: false,
        }}
      />

      {/* Groups Screens */}
      <Stack.Screen
        name="Groups"
        component={GroupsScreen}
        options={{
          presentation: 'card',
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="CreateGroup"
        component={CreateGroupScreen}
        options={{
          presentation: 'card',
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="GroupDetail"
        component={GroupDetailScreen}
        options={{
          presentation: 'card',
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="AddGroupMembers"
        component={AddGroupMembersScreen}
        options={{
          presentation: 'card',
          headerShown: false,
        }}
      />

      {/* Notification Screens */}
      <Stack.Screen
        name="Notifications"
        component={NotificationsScreen}
        options={{
          presentation: 'card',
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="NotificationSettings"
        component={NotificationSettingsScreen}
        options={{
          presentation: 'card',
          headerShown: false,
        }}
      />

      {/* Privacy & Security Screens */}
      <Stack.Screen
        name="PrivacySettings"
        component={PrivacySettingsScreen}
        options={{
          presentation: 'card',
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="BlockedUsers"
        component={BlockedUsersScreen}
        options={{
          presentation: 'card',
          headerShown: false,
        }}
      />

      {/* Legal & Compliance Screens */}
      <Stack.Screen
        name="PrivacyPolicy"
        component={PrivacyPolicyScreen}
        options={{
          presentation: 'card',
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="TermsOfService"
        component={TermsOfServiceScreen}
        options={{
          presentation: 'card',
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="DeleteAccount"
        component={DeleteAccountScreen}
        options={{
          presentation: 'card',
          headerShown: false,
        }}
      />

      {/* Settings & Profile Screens */}
      <Stack.Screen
        name="Settings"
        component={SettingsScreen}
        options={{
          presentation: 'card',
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="EditProfile"
        component={EditProfileScreen}
        options={{
          presentation: 'card',
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="ChangePassword"
        component={ChangePasswordScreen}
        options={{
          presentation: 'card',
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="HelpSupport"
        component={HelpSupportScreen}
        options={{
          presentation: 'card',
          headerShown: false,
        }}
      />

      {/* Analytics */}
      <Stack.Screen
        name="Analytics"
        component={AnalyticsScreen}
        options={{
          presentation: 'card',
          headerShown: false,
        }}
      />
    </Stack.Navigator>
  );
}
