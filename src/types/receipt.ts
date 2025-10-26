/**
 * Receipt Types
 *
 * Types for AI-powered receipt parsing and item assignment
 */

/**
 * Individual item extracted from a receipt
 */
export interface ReceiptItem {
  id: string; // Unique identifier for the item
  name: string; // Item name (e.g., "Cheeseburger")
  price: number; // Item price in dollars
  quantity: number; // Number of this item ordered
}

/**
 * Complete parsed receipt from OpenAI Vision API
 */
export interface ParsedReceipt {
  items: ReceiptItem[]; // Array of extracted items
  subtotal: number; // Sum of all items before tax/tip
  tax: number; // Tax amount
  tip: number; // Tip amount (if present on receipt)
  total: number; // Final total amount
  merchant?: string; // Restaurant/store name (optional)
  date?: string; // Receipt date (optional)
  confidence: number; // AI confidence score (0-1)
}

/**
 * Error types that can occur during receipt parsing
 */
export enum ReceiptParseErrorType {
  API_ERROR = 'API_ERROR', // OpenAI API failure
  INVALID_IMAGE = 'INVALID_IMAGE', // Image is not a receipt
  NO_ITEMS_FOUND = 'NO_ITEMS_FOUND', // AI couldn't extract any items
  INVALID_RESPONSE = 'INVALID_RESPONSE', // AI response doesn't match expected format
  NETWORK_ERROR = 'NETWORK_ERROR', // Network connection failed
}

/**
 * Receipt parsing error with detailed information
 */
export interface ReceiptParseError {
  type: ReceiptParseErrorType;
  message: string; // User-friendly error message
  details?: string; // Technical details for debugging
}

/**
 * OpenAI Vision API request format
 */
export interface OpenAIVisionRequest {
  model: string;
  messages: Array<{
    role: 'user' | 'system';
    content: Array<{
      type: 'text' | 'image_url';
      text?: string;
      image_url?: {
        url: string;
      };
    }>;
  }>;
  max_tokens: number;
  temperature?: number;
}

/**
 * OpenAI Vision API response format
 */
export interface OpenAIVisionResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: Array<{
    index: number;
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }>;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}
