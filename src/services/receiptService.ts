/**
 * Receipt Service
 *
 * Handles AI-powered receipt parsing using OpenAI Vision API
 * and receipt image storage in Supabase
 */

import * as FileSystem from 'expo-file-system/legacy';
import { supabase } from './supabase';
import {
  ParsedReceipt,
  ReceiptParseError,
  ReceiptParseErrorType,
} from '../types/receipt';

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';

/**
 * Upload receipt image to Supabase Storage
 *
 * @param imageUri - Local file URI of the receipt image
 * @param userId - User ID for organizing storage
 * @returns Public URL of the uploaded image
 */
export async function uploadReceiptToStorage(
  imageUri: string,
  userId: string
): Promise<string> {
  try {
    // Read the image file as base64
    const base64 = await FileSystem.readAsStringAsync(imageUri, {
      encoding: 'base64',
    });

    // Generate unique filename
    const timestamp = Date.now();
    const filename = `${userId}/receipts/${timestamp}.jpg`;

    // Convert base64 to blob
    const arrayBuffer = Uint8Array.from(atob(base64), c => c.charCodeAt(0));

    // Upload to Supabase Storage
    const { error } = await supabase.storage
      .from('split-receipts')
      .upload(filename, arrayBuffer, {
        contentType: 'image/jpeg',
        upsert: false,
      });

    if (error) {
      throw new Error(`Failed to upload receipt: ${error.message}`);
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('split-receipts')
      .getPublicUrl(filename);

    return urlData.publicUrl;
  } catch (error) {
    console.error('Error uploading receipt to storage:', error);
    throw error;
  }
}

/**
 * Parse receipt using OpenAI Vision API
 *
 * @param imageUri - Local file URI of the receipt image
 * @returns Parsed receipt data with items, totals, etc.
 */
export async function parseReceiptWithAI(
  imageUri: string
): Promise<ParsedReceipt> {
  try {
    // Read image as base64
    const base64 = await FileSystem.readAsStringAsync(imageUri, {
      encoding: 'base64',
    });

    // Get auth token for the edge function
    const { data: sessionData } = await supabase.auth.getSession();
    const accessToken = sessionData?.session?.access_token;
    if (!accessToken) {
      throw new Error('Not authenticated');
    }

    // Call parse-receipt edge function (OpenAI key stays server-side)
    const response = await fetch(`${SUPABASE_URL}/functions/v1/parse-receipt`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
        apikey: SUPABASE_ANON_KEY,
      },
      body: JSON.stringify({ base64Image: base64 }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || response.statusText);
    }

    const { content } = await response.json();
    if (!content) {
      throw new Error('No content in response');
    }

    // Check if AI indicates this is not a receipt
    const notReceiptIndicators = [
      "doesn't contain a receipt",
      "does not contain a receipt",
      "not a receipt",
      "unable to extract",
      "cannot extract",
      "can't extract",
      "no receipt",
      "isn't a receipt",
      "is not a receipt",
      "doesn't appear to be a receipt",
      "does not appear to be a receipt",
    ];

    const contentLower = content.toLowerCase();
    const isNotReceipt = notReceiptIndicators.some(indicator =>
      contentLower.includes(indicator)
    );

    if (isNotReceipt) {
      const parseError: ReceiptParseError = {
        type: ReceiptParseErrorType.INVALID_IMAGE,
        message: 'Please take a photo of a receipt',
        details: 'The image does not appear to be a receipt. Please try again with a clear photo of your receipt.',
      };
      throw parseError;
    }

    // Parse the JSON response
    let parsedReceipt: ParsedReceipt;
    try {
      // Remove markdown code blocks if present
      const jsonContent = content
        .replace(/```json\n?/g, '')
        .replace(/```\n?/g, '')
        .trim();
      parsedReceipt = JSON.parse(jsonContent);
    } catch (parseError) {
      console.error('Failed to parse OpenAI response:', content);

      // If JSON parsing fails, it might still be a non-receipt message we didn't catch
      const error: ReceiptParseError = {
        type: ReceiptParseErrorType.INVALID_IMAGE,
        message: 'Please take a photo of a receipt',
        details: 'Could not read the receipt. Please try again with a clearer photo.',
      };
      throw error;
    }

    // Validate the parsed receipt
    const validationError = validateReceipt(parsedReceipt);
    if (validationError) {
      throw new Error(validationError);
    }

    return parsedReceipt;
  } catch (error: any) {
    console.error('Error parsing receipt with AI:', error);

    // If it's already a ReceiptParseError, re-throw it
    if (error && error.type && error.message) {
      throw error;
    }

    // Convert to ReceiptParseError
    const parseError: ReceiptParseError = {
      type: ReceiptParseErrorType.API_ERROR,
      message: 'Failed to parse receipt',
      details: error instanceof Error ? error.message : 'Unknown error',
    };

    throw parseError;
  }
}

/**
 * Validate parsed receipt data
 *
 * @param receipt - Parsed receipt to validate
 * @returns Error message if invalid, null if valid
 */
export function validateReceipt(receipt: ParsedReceipt): string | null {
  // Check required fields
  if (!receipt.items || !Array.isArray(receipt.items)) {
    return 'Receipt must have an items array';
  }

  if (receipt.items.length === 0) {
    return 'Receipt must have at least one item';
  }

  // Validate each item
  for (const item of receipt.items) {
    if (!item.id || !item.name || typeof item.price !== 'number') {
      return 'Invalid item in receipt';
    }

    if (item.price < 0) {
      return 'Item price cannot be negative';
    }

    if (!item.quantity || item.quantity < 1) {
      return 'Item quantity must be at least 1';
    }
  }

  // Validate totals
  if (typeof receipt.subtotal !== 'number' || receipt.subtotal < 0) {
    return 'Invalid subtotal';
  }

  if (typeof receipt.tax !== 'number' || receipt.tax < 0) {
    return 'Invalid tax amount';
  }

  if (typeof receipt.tip !== 'number' || receipt.tip < 0) {
    return 'Invalid tip amount';
  }

  if (typeof receipt.total !== 'number' || receipt.total < 0) {
    return 'Invalid total';
  }

  // Validate confidence score
  if (
    typeof receipt.confidence !== 'number' ||
    receipt.confidence < 0 ||
    receipt.confidence > 1
  ) {
    return 'Invalid confidence score';
  }

  // Check if total roughly matches subtotal + tax + tip
  const calculatedTotal = receipt.subtotal + receipt.tax + receipt.tip;
  const difference = Math.abs(calculatedTotal - receipt.total);

  // Allow for small rounding differences (up to $0.10)
  if (difference > 0.1) {
    console.warn(
      `Total mismatch: calculated ${calculatedTotal}, actual ${receipt.total}`
    );
    // Don't fail validation, but log warning
  }

  return null;
}

/**
 * Helper function to format receipt for display
 *
 * @param receipt - Parsed receipt
 * @returns Formatted string for debugging/logging
 */
export function formatReceiptForDisplay(receipt: ParsedReceipt): string {
  let output = `Receipt from ${receipt.merchant || 'Unknown'}\n`;
  output += `Date: ${receipt.date || 'Unknown'}\n\n`;
  output += 'Items:\n';

  receipt.items.forEach((item) => {
    output += `  ${item.quantity}x ${item.name} - $${item.price.toFixed(2)}\n`;
  });

  output += `\nSubtotal: $${receipt.subtotal.toFixed(2)}\n`;
  output += `Tax: $${receipt.tax.toFixed(2)}\n`;
  output += `Tip: $${receipt.tip.toFixed(2)}\n`;
  output += `Total: $${receipt.total.toFixed(2)}\n`;
  output += `\nConfidence: ${(receipt.confidence * 100).toFixed(0)}%`;

  return output;
}
