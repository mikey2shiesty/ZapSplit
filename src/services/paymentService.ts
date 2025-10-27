import { Linking, Platform, Share } from 'react-native';
import * as SMS from 'expo-sms';
import * as Clipboard from 'expo-clipboard';

/**
 * Payment Service
 *
 * Handles payment requests for Australian banks (PayID, Bank Transfer)
 * and international options (PayPal).
 *
 * Primary: Australian payment methods
 * Secondary: PayPal for flexibility
 */

// ============================================================================
// TYPES
// ============================================================================

export type PaymentMethod = 'payid' | 'bank_transfer' | 'paypal';

export type AustralianBank =
  | 'CommBank'
  | 'Westpac'
  | 'NAB'
  | 'ANZ'
  | 'ING'
  | 'Macquarie'
  | 'BankWest'
  | 'Suncorp'
  | 'BOQ'
  | 'Other';

export interface PaymentDetails {
  method: PaymentMethod;
  // PayID
  payid?: string; // Phone number or email
  payidType?: 'phone' | 'email';
  // Bank Transfer
  bsb?: string; // e.g., "062-000"
  accountNumber?: string;
  accountName?: string; // Account holder name
  bankName?: AustralianBank;
  // PayPal
  paypalUsername?: string; // For paypal.me/username
}

export interface PaymentRequest {
  recipientName: string; // Who to pay
  amount: number; // Amount in dollars
  description: string; // What it's for (e.g., "Your share for dinner at Chipotle")
  splitId?: string; // Optional split ID for reference
  paymentDetails: PaymentDetails;
}

// ============================================================================
// AUSTRALIAN PAYMENT METHODS
// ============================================================================

/**
 * Format BSB for display (adds hyphen)
 * @param bsb - BSB number (6 digits)
 * @returns Formatted BSB (e.g., "062-000")
 */
export function formatBSB(bsb: string): string {
  const digits = bsb.replace(/\D/g, ''); // Remove non-digits
  if (digits.length === 6) {
    return `${digits.slice(0, 3)}-${digits.slice(3)}`;
  }
  return bsb;
}

/**
 * Format PayID for display
 * @param payid - Phone number or email
 * @param type - Type of PayID
 * @returns Formatted PayID
 */
export function formatPayID(payid: string, type: 'phone' | 'email'): string {
  if (type === 'phone') {
    // Format Australian phone number: 0412 345 678
    const digits = payid.replace(/\D/g, '');
    if (digits.length === 10 && digits.startsWith('0')) {
      return `${digits.slice(0, 4)} ${digits.slice(4, 7)} ${digits.slice(7)}`;
    }
  }
  return payid;
}

/**
 * Generate payment message for SMS/WhatsApp
 */
export function generatePaymentMessage(request: PaymentRequest): string {
  const { recipientName, amount, description, paymentDetails } = request;

  let message = `Hi! 💸\n\n`;
  message += `You owe ${recipientName} $${amount.toFixed(2)} for ${description}.\n\n`;

  // Add payment method details
  if (paymentDetails.method === 'payid' && paymentDetails.payid) {
    message += `Pay via PayID:\n`;
    message += `${formatPayID(paymentDetails.payid, paymentDetails.payidType || 'phone')}\n`;
    if (paymentDetails.accountName) {
      message += `Name: ${paymentDetails.accountName}\n`;
    }
  } else if (paymentDetails.method === 'bank_transfer') {
    message += `Bank Transfer Details:\n`;
    if (paymentDetails.bankName) {
      message += `Bank: ${paymentDetails.bankName}\n`;
    }
    if (paymentDetails.bsb) {
      message += `BSB: ${formatBSB(paymentDetails.bsb)}\n`;
    }
    if (paymentDetails.accountNumber) {
      message += `Account: ${paymentDetails.accountNumber}\n`;
    }
    if (paymentDetails.accountName) {
      message += `Name: ${paymentDetails.accountName}\n`;
    }
  } else if (paymentDetails.method === 'paypal' && paymentDetails.paypalUsername) {
    message += `Pay via PayPal:\n`;
    message += `paypal.me/${paymentDetails.paypalUsername}/${amount.toFixed(2)}\n`;
  }

  message += `\nThanks! 🙏`;

  return message;
}

/**
 * Copy payment details to clipboard
 */
export async function copyPaymentDetails(request: PaymentRequest): Promise<void> {
  const message = generatePaymentMessage(request);
  await Clipboard.setStringAsync(message);
}

/**
 * Share payment details via native share sheet
 * (User can choose SMS, WhatsApp, email, etc.)
 */
export async function sharePaymentDetails(request: PaymentRequest): Promise<void> {
  const message = generatePaymentMessage(request);

  try {
    await Share.share({
      message,
      title: `Payment Request - $${request.amount.toFixed(2)}`,
    });
  } catch (error) {
    console.error('Error sharing payment details:', error);
    throw error;
  }
}

/**
 * Send payment request via SMS
 * @param phoneNumber - Recipient's phone number
 * @param request - Payment request details
 */
export async function sendPaymentViaSMS(
  phoneNumber: string,
  request: PaymentRequest
): Promise<void> {
  const message = generatePaymentMessage(request);

  const isAvailable = await SMS.isAvailableAsync();
  if (!isAvailable) {
    throw new Error('SMS is not available on this device');
  }

  await SMS.sendSMSAsync([phoneNumber], message);
}

/**
 * Send payment request via WhatsApp
 * @param phoneNumber - Recipient's phone number (with country code)
 * @param request - Payment request details
 */
export async function sendPaymentViaWhatsApp(
  phoneNumber: string,
  request: PaymentRequest
): Promise<void> {
  const message = generatePaymentMessage(request);

  // Remove non-digits and format for WhatsApp
  const digits = phoneNumber.replace(/\D/g, '');
  // Australian numbers: remove leading 0, add +61
  const formattedNumber = digits.startsWith('0') ? `61${digits.slice(1)}` : digits;

  const whatsappUrl = `whatsapp://send?phone=${formattedNumber}&text=${encodeURIComponent(
    message
  )}`;

  const canOpen = await Linking.canOpenURL(whatsappUrl);
  if (!canOpen) {
    throw new Error('WhatsApp is not installed');
  }

  await Linking.openURL(whatsappUrl);
}

// ============================================================================
// PAYPAL INTEGRATION
// ============================================================================

/**
 * Open PayPal payment link (paypal.me)
 * @param request - Payment request with PayPal username
 */
export async function openPayPalPayment(request: PaymentRequest): Promise<void> {
  const { paypalUsername } = request.paymentDetails;

  if (!paypalUsername) {
    throw new Error('PayPal username not provided');
  }

  // PayPal.me link with amount in AUD
  const paypalUrl = `https://www.paypal.me/${paypalUsername}/${request.amount.toFixed(
    2
  )}AUD`;

  const canOpen = await Linking.canOpenURL(paypalUrl);
  if (!canOpen) {
    throw new Error('Cannot open PayPal link');
  }

  await Linking.openURL(paypalUrl);
}

// ============================================================================
// AUSTRALIAN BANKING APP DEEP LINKS
// ============================================================================

/**
 * Open CommBank app (if installed)
 * Falls back to web banking if app not available
 */
export async function openCommBankApp(): Promise<boolean> {
  // CommBank app deep link (if they have one publicly available)
  const commBankUrl = 'commbank://';

  const canOpen = await Linking.canOpenURL(commBankUrl);
  if (canOpen) {
    await Linking.openURL(commBankUrl);
    return true;
  }

  // Fallback to web banking
  await Linking.openURL('https://www.commbank.com.au/netbank/');
  return false;
}

/**
 * Prompt user to open their banking app
 * Since most Australian banks don't have public deep links,
 * we just show instructions
 */
export function getBankingAppInstructions(bankName?: AustralianBank): string {
  const defaultInstructions = `
1. Open your banking app
2. Select "Pay" or "Transfer"
3. Choose "PayID" or "New Payee"
4. Enter the payment details shown above
5. Review and send the payment
  `.trim();

  if (bankName === 'CommBank') {
    return `
1. Open CommBank app
2. Tap "Pay & Transfer"
3. Select "PayID" or "To a new payee"
4. Enter the payment details shown above
5. Review and confirm payment
    `.trim();
  }

  return defaultInstructions;
}

// ============================================================================
// VALIDATION
// ============================================================================

/**
 * Validate BSB format (Australian BSB is 6 digits, displayed as XXX-XXX)
 */
export function validateBSB(bsb: string): boolean {
  const digits = bsb.replace(/\D/g, '');
  return digits.length === 6;
}

/**
 * Validate Australian account number (typically 6-9 digits)
 */
export function validateAccountNumber(accountNumber: string): boolean {
  const digits = accountNumber.replace(/\D/g, '');
  return digits.length >= 6 && digits.length <= 9;
}

/**
 * Validate Australian mobile number
 */
export function validateAustralianMobile(phone: string): boolean {
  const digits = phone.replace(/\D/g, '');
  // Australian mobiles: 04XX XXX XXX (10 digits starting with 04)
  return digits.length === 10 && digits.startsWith('04');
}

/**
 * Validate PayID (phone or email)
 */
export function validatePayID(payid: string, type: 'phone' | 'email'): boolean {
  if (type === 'phone') {
    return validateAustralianMobile(payid);
  }
  // Basic email validation
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(payid);
}

/**
 * Validate PayPal username
 */
export function validatePayPalUsername(username: string): boolean {
  // PayPal usernames are alphanumeric, can include dots, underscores, hyphens
  return /^[a-zA-Z0-9._-]+$/.test(username) && username.length >= 3;
}
