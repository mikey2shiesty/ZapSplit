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
  OpenAIVisionRequest,
  OpenAIVisionResponse,
} from '../types/receipt';

const OPENAI_API_KEY = process.env.EXPO_PUBLIC_OPENAI_API_KEY;
const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';

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
    const { data, error } = await supabase.storage
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
    if (!OPENAI_API_KEY) {
      throw new Error('OpenAI API key not configured');
    }

    // Read image as base64
    const base64 = await FileSystem.readAsStringAsync(imageUri, {
      encoding: 'base64',
    });

    // Prepare the request to OpenAI Vision API
    const request: OpenAIVisionRequest = {
      model: 'gpt-4o', // Latest vision model
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: `You are a receipt parsing assistant. Analyze this receipt image and extract the following information in JSON format:

{
  "items": [
    {"id": "uuid", "name": "item name", "price": 0.00, "quantity": 1}
  ],
  "subtotal": 0.00,
  "tax": 0.00,
  "tip": 0.00,
  "total": 0.00,
  "merchant": "restaurant name",
  "date": "YYYY-MM-DD",
  "confidence": <calculated>
}

IMPORTANT RULES:
1. Extract ALL food/drink items with their exact prices
2. Generate a unique ID for each item (use simple incrementing numbers like "1", "2", "3")
3. If quantity is not shown, assume quantity = 1
4. Set subtotal to the sum of all items BEFORE tax and tip
5. Extract tax amount (if shown)
6. Extract tip amount (if shown, otherwise set to 0)
7. Set total to the final amount on the receipt
8. CONFIDENCE SCORING - Set based on how well you could read the receipt:
   - 0.98-1.0: Perfect quality, all text crystal clear
   - 0.90-0.97: Good quality, most text readable
   - 0.80-0.89: Moderate quality, some items may be unclear
   - 0.70-0.79: Poor quality, had to guess some values
   - Below 0.70: Very poor quality, many items unreadable

Return ONLY the JSON object, no additional text.`,
            },
            {
              type: 'image_url',
              image_url: {
                url: `data:image/jpeg;base64,${base64}`,
              },
            },
          ],
        },
      ],
      max_tokens: 1000,
      temperature: 0.2, // Low temperature for consistent, accurate parsing
    };

    // Call OpenAI API
    const response = await fetch(OPENAI_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(
        `OpenAI API error: ${errorData.error?.message || response.statusText}`
      );
    }

    const data: OpenAIVisionResponse = await response.json();

    // Extract the JSON from the response
    const content = data.choices[0]?.message?.content;
    if (!content) {
      throw new Error('No content in OpenAI response');
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
