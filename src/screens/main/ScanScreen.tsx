import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';
import DocumentScanner, { ResponseType } from 'react-native-document-scanner-plugin';
import { useTheme } from '../../contexts/ThemeContext';
import { spacing, radius, layout } from '../../constants/theme';
import { useStripeAccountStatus } from '../../hooks/useStripeAccountStatus';
import VerifyIdRequiredModal from '../../components/modals/VerifyIdRequiredModal';

// Receipt capture screen. iOS-26-Liquid-Glass tab bar overlays content, so we
// pad the bottom by tab bar height + safe area inset.
//
// Capture pipeline (post-L3):
//   • "Scan Receipt" opens the native document scanner (Apple Vision /
//     ML Kit) which auto-detects edges, perspective-corrects, and returns a
//     clean rectangular JPEG. Way better OCR input than a raw camera frame.
//   • "Upload from gallery" stays on expo-image-picker for users who already
//     have a photo. Sent as-is; gets the server-side sum-check protection but
//     no perspective correction.
//
// Both paths land on SplitFlow > ReviewReceipt with the captured imageUri.

export default function ScanScreen() {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const bottomOffset = layout.tabBarHeight + insets.bottom;
  const { colors } = useTheme();
  const [busy, setBusy] = useState(false);

  const stripeStatus = useStripeAccountStatus();
  const canReceive = stripeStatus.payoutsEnabled && stripeStatus.currentlyDue.length === 0;
  const [showVerifyGate, setShowVerifyGate] = useState(false);

  const guardCanReceive = (): boolean => {
    if (stripeStatus.loading) return true; // optimistic — let the action proceed; the gate will catch them downstream if needed
    if (!canReceive) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      setShowVerifyGate(true);
      return false;
    }
    return true;
  };

  const goToReview = (imageUri: string) => {
    navigation.navigate('SplitFlow', {
      screen: 'ReviewReceipt',
      params: { imageUri },
    });
  };

  const handleScan = async () => {
    if (!guardCanReceive()) return;
    try {
      setBusy(true);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      // Native scanner: auto-edges + perspective correction + corner-handle UI.
      const { scannedImages } = await DocumentScanner.scanDocument({
        maxNumDocuments: 1,
        croppedImageQuality: 100,
        responseType: ResponseType.ImageFilePath,
      });

      if (scannedImages && scannedImages.length > 0) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        goToReview(scannedImages[0]);
      }
      // If user cancelled the scanner, scannedImages is empty/null — do nothing.
    } catch (error: any) {
      console.error('Error scanning document:', error);
      Alert.alert(
        'Scan failed',
        error?.message || 'Could not open the document scanner. Please try again.'
      );
    } finally {
      setBusy(false);
    }
  };

  const handlePickFromGallery = async () => {
    if (!guardCanReceive()) return;
    try {
      setBusy(true);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [3, 4],
        quality: 0.9,
      });

      if (!result.canceled && result.assets[0]) {
        goToReview(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
      {/* Three sections distributed top-to-bottom so the screen never has a
          dead-zone gap above the tab bar. */}
      <View style={[styles.body, { paddingBottom: bottomOffset + spacing.lg }]}>
        {/* TOP: Title + hero icon */}
        <View style={styles.topGroup}>
          <Text style={[styles.title, { color: colors.text }]}>Scan a receipt</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            Capture a clear photo and we’ll split it for you.
          </Text>
          <View style={[styles.heroIcon, { backgroundColor: colors.primary + '15' }]}>
            <Ionicons name="receipt-outline" size={52} color={colors.primary} />
          </View>
        </View>

        {/* MIDDLE: CTAs */}
        <View style={styles.middleGroup}>
          <TouchableOpacity
            style={[styles.primaryButton, { backgroundColor: colors.primary }]}
            onPress={handleScan}
            disabled={busy}
            activeOpacity={0.85}
          >
            {busy ? (
              <ActivityIndicator color={colors.textInverse ?? '#FFFFFF'} />
            ) : (
              <>
                <Ionicons name="scan-outline" size={22} color={colors.textInverse ?? '#FFFFFF'} />
                <Text style={[styles.primaryButtonLabel, { color: colors.textInverse ?? '#FFFFFF' }]}>
                  Scan with camera
                </Text>
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.secondaryButton, { borderColor: colors.border }]}
            onPress={handlePickFromGallery}
            disabled={busy}
            activeOpacity={0.7}
          >
            <Ionicons name="images-outline" size={22} color={colors.text} />
            <Text style={[styles.secondaryButtonLabel, { color: colors.text }]}>
              Upload from gallery
            </Text>
          </TouchableOpacity>
        </View>

        {/* BOTTOM: Tips */}
        <View style={[styles.tipsCard, { backgroundColor: colors.surface }]}>
          <View style={styles.tipRow}>
            <Ionicons name="sunny-outline" size={18} color={colors.textSecondary} />
            <Text style={[styles.tipText, { color: colors.textSecondary }]}>
              Good lighting helps accuracy
            </Text>
          </View>
          <View style={styles.tipRow}>
            <Ionicons name="phone-portrait-outline" size={18} color={colors.textSecondary} />
            <Text style={[styles.tipText, { color: colors.textSecondary }]}>
              Hold your phone flat over the receipt
            </Text>
          </View>
          <View style={styles.tipRow}>
            <Ionicons name="resize-outline" size={18} color={colors.textSecondary} />
            <Text style={[styles.tipText, { color: colors.textSecondary }]}>
              Make sure the whole receipt fits in frame
            </Text>
          </View>
        </View>
      </View>

      <VerifyIdRequiredModal
        visible={showVerifyGate}
        onClose={() => setShowVerifyGate(false)}
        title="Verify ID to scan receipts"
        message="Scanning a receipt creates a split where friends pay you. Finish verifying your ID with Stripe so the money can reach your bank."
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  body: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
    justifyContent: 'space-between',
  },
  topGroup: {
    alignItems: 'center',
  },
  middleGroup: {
    width: '100%',
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    letterSpacing: -0.5,
    textAlign: 'center',
    marginBottom: spacing.sm + 2,
  },
  subtitle: {
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: spacing.xl + spacing.md,
    maxWidth: 320,
  },
  heroIcon: {
    width: 128,
    height: 128,
    borderRadius: 64,
    alignItems: 'center',
    justifyContent: 'center',
  },

  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: 18,
    width: '100%',
    borderRadius: radius.pill ?? 30,
    marginBottom: spacing.md,
  },
  primaryButtonLabel: {
    fontSize: 17,
    fontWeight: '600',
  },

  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: 16,
    width: '100%',
    borderRadius: radius.pill ?? 30,
    borderWidth: 1,
  },
  secondaryButtonLabel: {
    fontSize: 16,
    fontWeight: '500',
  },

  tipsCard: {
    width: '100%',
    borderRadius: radius.md ?? 16,
    padding: spacing.lg,
    gap: spacing.md,
  },
  tipRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  tipText: {
    fontSize: 14,
    flex: 1,
  },
});
