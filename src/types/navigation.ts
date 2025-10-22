import { StackScreenProps } from '@react-navigation/stack';
import { CompositeScreenProps } from '@react-navigation/native';
import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';

// Main App Navigation Types
export type RootStackParamList = {
  Main: undefined;
  SplitFlow: undefined;
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
    splitMethod: 'equal' | 'custom' | 'percentage';
    customAmounts?: Record<string, number>; // userId -> amount
  };
  SplitSuccess: {
    splitId: string;
    amount: number;
    participantCount: number;
  };
};

// Screen Props Types

// Split Flow Screen Props
export type CreateSplitScreenProps = StackScreenProps<SplitFlowParamList, 'CreateSplit'>;
export type SelectFriendsScreenProps = StackScreenProps<SplitFlowParamList, 'SelectFriends'>;
export type SplitMethodScreenProps = StackScreenProps<SplitFlowParamList, 'SplitMethod'>;
export type CustomAmountsScreenProps = StackScreenProps<SplitFlowParamList, 'CustomAmounts'>;
export type ReviewSplitScreenProps = StackScreenProps<SplitFlowParamList, 'ReviewSplit'>;
export type SplitSuccessScreenProps = StackScreenProps<SplitFlowParamList, 'SplitSuccess'>;

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
