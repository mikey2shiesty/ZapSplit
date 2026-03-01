import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { spacing, radius } from '../../constants/theme';
import { useTheme } from '../../contexts/ThemeContext';

const AI_CONSENT_KEY = '@zapsplit_ai_consent';

interface AIConsentModalProps {
  visible: boolean;
  onAccept: () => void;
  onDecline: () => void;
}

export default function AIConsentModal({ visible, onAccept, onDecline }: AIConsentModalProps) {
  const { colors, isDark } = useTheme();
  const handleAccept = async () => {
    try {
      await AsyncStorage.setItem(AI_CONSENT_KEY, 'accepted');
    } catch (error) {
      console.error('Error saving AI consent:', error);
    }
    onAccept();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onDecline}
    >
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={[styles.closeButton, { backgroundColor: colors.gray100 }]} onPress={onDecline}>
            <Ionicons name="close" size={24} color={colors.gray600} />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Icon */}
          <View style={styles.iconContainer}>
            <View style={[styles.iconCircle, { backgroundColor: isDark ? 'rgba(59,130,246,0.15)' : colors.primaryLight }]}>
              <Ionicons name="sparkles" size={40} color={colors.primary} />
            </View>
          </View>

          {/* Title */}
          <Text style={[styles.title, { color: colors.text }]}>AI-Powered Receipt Scanning</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            ZapSplit uses artificial intelligence to read your receipts
          </Text>

          {/* Info Cards */}
          <View style={[styles.infoCard, { backgroundColor: colors.surface }]}>
            <View style={styles.infoHeader}>
              <Ionicons name="eye-outline" size={24} color={colors.primary} />
              <Text style={[styles.infoTitle, { color: colors.text }]}>What We Process</Text>
            </View>
            <Text style={[styles.infoText, { color: colors.textSecondary }]}>
              When you scan a receipt, the image is sent to OpenAI's Vision API to extract:
            </Text>
            <View style={styles.bulletList}>
              <Text style={[styles.bulletItem, { color: colors.textSecondary }]}>
                {'\u2022'} Store/restaurant name
              </Text>
              <Text style={[styles.bulletItem, { color: colors.textSecondary }]}>
                {'\u2022'} Individual items and prices
              </Text>
              <Text style={[styles.bulletItem, { color: colors.textSecondary }]}>
                {'\u2022'} Tax, tip, and total amounts
              </Text>
            </View>
          </View>

          <View style={[styles.infoCard, { backgroundColor: colors.surface }]}>
            <View style={styles.infoHeader}>
              <Ionicons name="shield-checkmark-outline" size={24} color={colors.success} />
              <Text style={[styles.infoTitle, { color: colors.text }]}>How Your Data is Protected</Text>
            </View>
            <View style={styles.bulletList}>
              <Text style={[styles.bulletItem, { color: colors.textSecondary }]}>
                {'\u2022'} Images are processed securely via encrypted connection
              </Text>
              <Text style={[styles.bulletItem, { color: colors.textSecondary }]}>
                {'\u2022'} OpenAI does not store your receipt images
              </Text>
              <Text style={[styles.bulletItem, { color: colors.textSecondary }]}>
                {'\u2022'} Data is used only to extract receipt information
              </Text>
              <Text style={[styles.bulletItem, { color: colors.textSecondary }]}>
                {'\u2022'} We never share your receipts for advertising
              </Text>
            </View>
          </View>

          <View style={[styles.infoCard, { backgroundColor: colors.surface }]}>
            <View style={styles.infoHeader}>
              <Ionicons name="document-text-outline" size={24} color={colors.info} />
              <Text style={[styles.infoTitle, { color: colors.text }]}>Your Rights</Text>
            </View>
            <Text style={[styles.infoText, { color: colors.textSecondary }]}>
              You can withdraw consent at any time by not using the receipt scanning
              feature. For more details, please review our Privacy Policy.
            </Text>
          </View>

          {/* Legal Notice */}
          <Text style={[styles.legalNotice, { color: colors.textSecondary }]}>
            By tapping "Accept & Continue", you consent to your receipt images being
            processed by OpenAI's Vision API in accordance with our Privacy Policy
            and Terms of Service.
          </Text>

          <View style={styles.bottomSpacer} />
        </ScrollView>

        {/* Footer Buttons */}
        <View style={[styles.footer, { borderTopColor: colors.border }]}>
          <TouchableOpacity
            style={[styles.declineButton, { backgroundColor: colors.gray100 }]}
            onPress={onDecline}
            activeOpacity={0.7}
          >
            <Text style={[styles.declineButtonText, { color: colors.text }]}>Decline</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.acceptButton}
            onPress={handleAccept}
            activeOpacity={0.7}
          >
            <Ionicons name="checkmark-circle" size={20} color="#FFFFFF" />
            <Text style={styles.acceptButtonText}>Accept & Continue</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

// Helper function to check if consent has been given
export async function hasAIConsent(): Promise<boolean> {
  try {
    const consent = await AsyncStorage.getItem(AI_CONSENT_KEY);
    return consent === 'accepted';
  } catch (error) {
    console.error('Error checking AI consent:', error);
    return false;
  }
}

// Helper function to reset consent (for testing or settings)
export async function resetAIConsent(): Promise<void> {
  try {
    await AsyncStorage.removeItem(AI_CONSENT_KEY);
  } catch (error) {
    console.error('Error resetting AI consent:', error);
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    padding: spacing.md,
    paddingTop: spacing.xl,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.xl,
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: spacing.xl,
  },
  infoCard: {
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  infoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  infoText: {
    fontSize: 14,
    lineHeight: 22,
  },
  bulletList: {
    marginTop: spacing.sm,
  },
  bulletItem: {
    fontSize: 14,
    lineHeight: 24,
    paddingLeft: spacing.sm,
  },
  legalNotice: {
    fontSize: 13,
    lineHeight: 20,
    textAlign: 'center',
    marginTop: spacing.lg,
  },
  bottomSpacer: {
    height: 20,
  },
  footer: {
    flexDirection: 'row',
    padding: spacing.lg,
    gap: spacing.md,
    borderTopWidth: 1,
  },
  declineButton: {
    flex: 1,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  declineButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  acceptButton: {
    flex: 2,
    flexDirection: 'row',
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    backgroundColor: '#3B82F6',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  acceptButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
