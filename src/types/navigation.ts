import { StackScreenProps } from '@react-navigation/stack';
import { CompositeScreenProps } from '@react-navigation/native';
import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { ParsedReceipt } from './receipt';

// Main App Navigation Types
export type RootStackParamList = {
  Main: undefined;
  SplitFlow: undefined;
  ConnectStripe: undefined;
  PaymentHistory: undefined;
  // Friends & Groups
  Friends: undefined;
  AddFriend: undefined;
  FriendRequests: undefined;
  FriendProfile: { friendId: string };
  Groups: undefined;
  CreateGroup: undefined;
  GroupDetail: { groupId: string };
  AddGroupMembers: { groupId: string };
  // Notifications
  Notifications: undefined;
  NotificationSettings: undefined;
};

// Bottom Tab Navigation Types
export type MainTabParamList = {
  Home: undefined;
  Scan: undefined;
  Splits: undefined;
  Profile: undefined;
};

// Split Flow Navigation Types
export type SplitFlowParamList = {
  CreateSplit: undefined;
  ScanReceipt: undefined;
  ReviewReceipt: {
    imageUri: string;
  };
  ItemAssignment: {
    receipt: ParsedReceipt;
    imageUri: string; // Receipt image for uploading to storage
    // No selectedFriends needed - each person marks their own items!
  };
  SelectFriends: {
    amount: number;
    title: string;
    description?: string;
  };
  SplitMethod: {
    amount: number;
    title: string;
    description?: string;
    selectedFriends: string[]; // Array of user IDs
  };
  CustomAmounts: {
    amount: number;
    title: string;
    description?: string;
    selectedFriends: string[];
  };
  ReviewSplit: {
    amount: number;
    title: string;
    description?: string;
    selectedFriends: string[];
    splitMethod: 'equal' | 'custom' | 'percentage' | 'receipt';
    customAmounts?: Record<string, number>; // userId -> amount
    receiptImageUri?: string;
  };
  PaymentRequest: {
    amount: number; // Your total amount
    description: string; // e.g., "Your share for dinner at Chipotle"
    splitId?: string;
  };
  SplitDetail: {
    splitId: string;
  };
  SplitSuccess: {
    splitId: string;
    amount: number;
    participantCount: number;
  };
  PayScreen: {
    splitId: string;
    participantId: string;
    recipientId: string;
    amount: number;
  };
};

// Settings/Payment Navigation Types
export type SettingsStackParamList = {
  ConnectStripe: undefined;
  PaymentHistory: undefined;
};

// Screen Props Types

// Split Flow Screen Props
export type CreateSplitScreenProps = StackScreenProps<SplitFlowParamList, 'CreateSplit'>;
export type ScanReceiptScreenProps = StackScreenProps<SplitFlowParamList, 'ScanReceipt'>;
export type ReviewReceiptScreenProps = StackScreenProps<SplitFlowParamList, 'ReviewReceipt'>;
export type ItemAssignmentScreenProps = StackScreenProps<SplitFlowParamList, 'ItemAssignment'>;
export type SelectFriendsScreenProps = StackScreenProps<SplitFlowParamList, 'SelectFriends'>;
export type SplitMethodScreenProps = StackScreenProps<SplitFlowParamList, 'SplitMethod'>;
export type CustomAmountsScreenProps = StackScreenProps<SplitFlowParamList, 'CustomAmounts'>;
export type ReviewSplitScreenProps = StackScreenProps<SplitFlowParamList, 'ReviewSplit'>;
export type PaymentRequestScreenProps = StackScreenProps<SplitFlowParamList, 'PaymentRequest'>;
export type SplitDetailScreenProps = StackScreenProps<SplitFlowParamList, 'SplitDetail'>;
export type SplitSuccessScreenProps = StackScreenProps<SplitFlowParamList, 'SplitSuccess'>;
export type PayScreenProps = StackScreenProps<SplitFlowParamList, 'PayScreen'>;

// Settings/Payment Screen Props
export type ConnectStripeScreenProps = StackScreenProps<SettingsStackParamList, 'ConnectStripe'>;
export type PaymentHistoryScreenProps = StackScreenProps<SettingsStackParamList, 'PaymentHistory'>;

// Main Tab Screen Props
export type HomeScreenProps = CompositeScreenProps<
  BottomTabScreenProps<MainTabParamList, 'Home'>,
  StackScreenProps<RootStackParamList>
>;

export type ScanScreenProps = BottomTabScreenProps<MainTabParamList, 'Scan'>;
export type SplitsScreenProps = BottomTabScreenProps<MainTabParamList, 'Splits'>;
export type ProfileScreenProps = BottomTabScreenProps<MainTabParamList, 'Profile'>;

// Helper type for navigation prop
declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}
