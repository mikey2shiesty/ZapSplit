import React, { useCallback, useEffect, useRef } from 'react';
import { View, ActivityIndicator, StyleSheet, Alert } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import DocumentScanner, { ResponseType } from 'react-native-document-scanner-plugin';
import { useTheme } from '../../contexts/ThemeContext';

// Thin wrapper: when this screen mounts, immediately open the native document
// scanner. On success, navigate to ReviewReceipt with the cropped imageUri.
// On cancel/error, pop back. The screen itself is just a black loading state
// while the OS-level scanner takes over the foreground.
//
// Previously this was a custom camera with no perspective correction. Replaced
// to match the Scan-tab flow so receipts get auto-deskewed and contrast-boosted
// before going to GPT.

interface ScanReceiptScreenProps {
  navigation: any;
  route: any;
}

export default function ScanReceiptScreen({ navigation }: ScanReceiptScreenProps) {
  const { colors } = useTheme();
  const launchedRef = useRef(false);

  const launchScanner = useCallback(async () => {
    if (launchedRef.current) return;
    launchedRef.current = true;

    try {
      const { scannedImages } = await DocumentScanner.scanDocument({
        maxNumDocuments: 1,
        croppedImageQuality: 100,
        responseType: ResponseType.ImageFilePath,
      });

      if (scannedImages && scannedImages.length > 0) {
        // Replace this screen with the review so backing out doesn't return
        // here (which would re-open the scanner in an infinite loop).
        navigation.replace('ReviewReceipt', { imageUri: scannedImages[0] });
      } else {
        // User cancelled. Pop back to wherever they came from.
        navigation.goBack();
      }
    } catch (error: any) {
      console.error('Document scanner error:', error);
      Alert.alert(
        'Scan failed',
        error?.message || 'Could not open the document scanner. Please try again.',
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    }
  }, [navigation]);

  // Launch on first focus only — guarded by launchedRef so re-focuses are ignored.
  useFocusEffect(
    useCallback(() => {
      launchScanner();
    }, [launchScanner])
  );

  useEffect(() => {
    // Safety net in case useFocusEffect doesn't fire on cold start.
    launchScanner();
  }, [launchScanner]);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ActivityIndicator size="large" color={colors.primary} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
