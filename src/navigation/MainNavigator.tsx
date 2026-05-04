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

// ZapSplit 2026 Friendly Fintech tab bar.
// Standard label-under-icon layout. Active icon sits inside a 36pt soft-blue
// circle (Coinbase pattern). On iOS, the bar's background is a Liquid Glass
// BlurView so the canvas peeks through — that's the only iOS 26 signal here.

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

  const baseHeight = 56;
  const totalHeight = baseHeight + (Platform.OS === 'ios' ? insets.bottom : 12);

  return (
    <View style={[styles.tabBarWrapper, { height: totalHeight }]}>
      {Platform.OS === 'ios' ? (
        <BlurView
          intensity={90}
          tint={isDark ? 'dark' : 'light'}
          style={StyleSheet.absoluteFill}
        />
      ) : (
        <View
          style={[
            StyleSheet.absoluteFill,
            { backgroundColor: colors.surface },
          ]}
        />
      )}
      <View
        style={[
          styles.tabBarTopBorder,
          { backgroundColor: colors.border },
        ]}
      />

      <View style={[styles.tabBarRow, { paddingBottom: Platform.OS === 'ios' ? insets.bottom : 12 }]}>
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
          const iconColor = focused ? colors.primary : colors.textSecondary;
          const labelColor = focused ? colors.primary : colors.textSecondary;
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
              style={({ pressed }) => [
                styles.tabItem,
                pressed && { opacity: 0.7 },
              ]}
            >
              <View
                style={[
                  styles.tabIconCircle,
                  focused && { backgroundColor: colors.primaryLight },
                ]}
              >
                <Ionicons name={iconName} size={20} color={iconColor} />
              </View>
              <Text style={[styles.tabLabel, { color: labelColor }]}>
                {String(label)}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

// Tab Navigator Component
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
    overflow: 'hidden',
  },
  tabBarTopBorder: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    height: StyleSheet.hairlineWidth,
  },
  tabBarRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingTop: 8,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  tabIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0,
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
