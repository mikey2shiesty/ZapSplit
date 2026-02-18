import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';
import { spacing, radius } from '../../constants/theme';

const CONTACT_EMAIL = 'zapsplit@gmail.com';
const EFFECTIVE_DATE = '18 February 2026';

export default function PrivacyPolicyScreen() {
  const navigation = useNavigation();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  const openEmail = () => {
    Linking.openURL(`mailto:${CONTACT_EMAIL}`);
  };

  const openLink = (url: string) => {
    Linking.openURL(url);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.gray50, paddingTop: insets.top }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={[styles.backButton, { backgroundColor: colors.gray50 }]}>
          <Ionicons name="arrow-back" size={24} color={colors.gray900} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.gray900 }]}>Privacy Policy</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Effective Date */}
        <Text style={[styles.effectiveDate, { color: colors.gray500 }]}>
          Effective Date: {EFFECTIVE_DATE}
        </Text>

        {/* Intro */}
        <Text style={[styles.bodyText, { color: colors.gray700 }]}>
          ZapSplit ("we", "us", or "our") operates the ZapSplit mobile application and website (collectively, the "Service"). This Privacy Policy explains how we collect, use, disclose, and protect your personal information when you use our Service, in accordance with the Australian Privacy Act 1988 (Cth) and the Australian Privacy Principles (APPs).
        </Text>
        <Text style={[styles.bodyText, { color: colors.gray700 }]}>
          By using ZapSplit, you agree to the collection and use of information as described in this policy.
        </Text>

        {/* 1. Information We Collect */}
        <SectionHeader title="1. Information We Collect" colors={colors} />

        <SubHeader title="Information you provide to us:" colors={colors} />
        <Bullet colors={colors} bold="Account information" text=" — your name, email address, and profile photo when you create an account." />
        <Bullet colors={colors} bold="Authentication data" text=" — credentials from third-party sign-in providers (Apple, Google) if you choose to sign in with those services. We receive only your name and email; we never see your password." />
        <Bullet colors={colors} bold="Payment information" text=" — payment card details and billing information. This is collected and processed directly by Stripe and is never stored on our servers." />
        <Bullet colors={colors} bold="Receipt images" text=" — photos of receipts you upload for bill splitting. These are processed to extract item and pricing information." />
        <Bullet colors={colors} bold="Split and transaction data" text=" — details of splits you create, including amounts, participants, and payment status." />
        <Bullet colors={colors} bold="Contact information of others" text=" — names and optionally email or phone numbers of people you add to splits who may not have a ZapSplit account." />

        <SubHeader title="Information collected automatically:" colors={colors} />
        <Bullet colors={colors} bold="Device information" text=" — device model, operating system version, and unique device identifiers." />
        <Bullet colors={colors} bold="Usage data" text=" — how you interact with the Service, including features used and actions taken." />
        <Bullet colors={colors} bold="Log data" text=" — IP address, access times, and referring URLs when you use our web payment pages." />

        {/* 2. How We Use Your Information */}
        <SectionHeader title="2. How We Use Your Information" colors={colors} />
        <Text style={[styles.bodyText, { color: colors.gray700 }]}>We use your information to:</Text>
        <Bullet colors={colors} text="Provide, operate, and maintain the Service" />
        <Bullet colors={colors} text="Process payments and facilitate bill splitting between users" />
        <Bullet colors={colors} text="Analyse receipt images using AI-powered optical character recognition" />
        <Bullet colors={colors} text="Send you notifications about payment requests, settlements, and account activity" />
        <Bullet colors={colors} text="Generate shareable payment links for split participants" />
        <Bullet colors={colors} text="Detect, prevent, and address fraud or technical issues" />
        <Bullet colors={colors} text="Comply with legal obligations" />

        {/* 3. Third-Party Services */}
        <SectionHeader title="3. Third-Party Service Providers" colors={colors} />
        <Text style={[styles.bodyText, { color: colors.gray700 }]}>
          We share your information with the following third-party service providers who assist us in operating the Service:
        </Text>

        <ThirdPartyItem
          colors={colors}
          name="Stripe"
          purpose="Payment processing"
          description="Processes all payment transactions. Your payment card details are collected directly by Stripe and are subject to Stripe's Privacy Policy. We do not store your full card number."
          onPress={() => openLink('https://stripe.com/au/privacy')}
        />
        <ThirdPartyItem
          colors={colors}
          name="Supabase"
          purpose="Backend infrastructure and authentication"
          description="Hosts our database, handles user authentication, and stores your account data. Data is encrypted in transit and at rest."
          onPress={() => openLink('https://supabase.com/privacy')}
        />
        <ThirdPartyItem
          colors={colors}
          name="OpenAI"
          purpose="Receipt scanning (OCR)"
          description="Analyses receipt images you upload to extract item names and prices. Images are sent to OpenAI's API for processing. OpenAI does not use this data to train their models."
          onPress={() => openLink('https://openai.com/policies/privacy-policy')}
        />
        <ThirdPartyItem
          colors={colors}
          name="Apple / Google"
          purpose="Authentication"
          description="If you sign in with Apple or Google, we receive your name and email from these providers. We do not receive or store your Apple or Google password."
        />
        <ThirdPartyItem
          colors={colors}
          name="Expo / EAS"
          purpose="App delivery and push notifications"
          description="Used to deliver app updates and send push notifications about payment activity."
        />

        {/* 4. Data Storage and Security */}
        <SectionHeader title="4. Data Storage and Security" colors={colors} />
        <Text style={[styles.bodyText, { color: colors.gray700 }]}>
          Your data is stored on secure servers provided by Supabase (hosted on Amazon Web Services). While our servers may be located outside Australia, we take reasonable steps to ensure your data is treated securely and in accordance with this policy.
        </Text>
        <Text style={[styles.bodyText, { color: colors.gray700 }]}>
          We implement industry-standard security measures including:
        </Text>
        <Bullet colors={colors} text="Encryption of data in transit (TLS/SSL) and at rest" />
        <Bullet colors={colors} text="Row Level Security (RLS) policies on all database tables" />
        <Bullet colors={colors} text="Secure authentication with hashed passwords" />
        <Bullet colors={colors} text="Payment data handled exclusively by PCI-compliant Stripe" />
        <Text style={[styles.bodyText, { color: colors.gray700 }]}>
          No method of electronic storage is 100% secure. While we strive to use commercially acceptable means to protect your personal information, we cannot guarantee its absolute security.
        </Text>

        {/* 5. Data Retention */}
        <SectionHeader title="5. Data Retention" colors={colors} />
        <Text style={[styles.bodyText, { color: colors.gray700 }]}>
          We retain your personal information for as long as your account is active or as needed to provide you the Service. If you delete your account, we will delete or anonymise your personal data within 30 days, except where we are required to retain it for legal, tax, or regulatory purposes.
        </Text>
        <Text style={[styles.bodyText, { color: colors.gray700 }]}>
          Receipt images are retained only for as long as the associated split is active. Transaction records may be retained for up to 7 years for financial compliance purposes.
        </Text>

        {/* 6. Your Rights */}
        <SectionHeader title="6. Your Rights" colors={colors} />
        <Text style={[styles.bodyText, { color: colors.gray700 }]}>
          Under the Australian Privacy Act 1988, you have the right to:
        </Text>
        <Bullet colors={colors} bold="Access" text=" — request a copy of the personal information we hold about you." />
        <Bullet colors={colors} bold="Correction" text=" — request correction of any inaccurate or incomplete information." />
        <Bullet colors={colors} bold="Deletion" text=" — request deletion of your account and associated data." />
        <Bullet colors={colors} bold="Withdraw consent" text=" — withdraw your consent for data processing at any time." />
        <Bullet colors={colors} bold="Complain" text=" — lodge a complaint with the Office of the Australian Information Commissioner (OAIC) if you believe your privacy has been breached." />
        <Text style={[styles.bodyText, { color: colors.gray700 }]}>
          To exercise any of these rights, please contact us at the email address below.
        </Text>

        {/* 7. Children's Privacy */}
        <SectionHeader title="7. Children's Privacy" colors={colors} />
        <Text style={[styles.bodyText, { color: colors.gray700 }]}>
          The Service is not intended for use by anyone under the age of 18. We do not knowingly collect personal information from children under 18. If we become aware that we have collected personal information from a child, we will take steps to delete it promptly.
        </Text>

        {/* 8. International Data Transfers */}
        <SectionHeader title="8. International Data Transfers" colors={colors} />
        <Text style={[styles.bodyText, { color: colors.gray700 }]}>
          Your information may be transferred to and processed in countries other than Australia, including the United States, where our service providers operate. By using the Service, you consent to the transfer of your information to these countries, which may have different data protection laws than Australia.
        </Text>

        {/* 9. Changes to This Policy */}
        <SectionHeader title="9. Changes to This Policy" colors={colors} />
        <Text style={[styles.bodyText, { color: colors.gray700 }]}>
          We may update this Privacy Policy from time to time. We will notify you of material changes by updating the "Effective Date" at the top of this policy and, where appropriate, through an in-app notification. Your continued use of the Service after changes are posted constitutes your acceptance of the updated policy.
        </Text>

        {/* 10. Contact Us */}
        <SectionHeader title="10. Contact Us" colors={colors} />
        <Text style={[styles.bodyText, { color: colors.gray700 }]}>
          If you have any questions about this Privacy Policy, wish to exercise your privacy rights, or have a complaint, please contact us:
        </Text>

        <View style={[styles.contactCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.contactRow}>
            <Ionicons name="mail-outline" size={18} color={colors.primary} />
            <TouchableOpacity onPress={openEmail}>
              <Text style={[styles.contactText, { color: colors.primary }]}>{CONTACT_EMAIL}</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.contactRow}>
            <Ionicons name="location-outline" size={18} color={colors.gray500} />
            <Text style={[styles.contactText, { color: colors.gray700 }]}>Perth, Western Australia</Text>
          </View>
        </View>

        <Text style={[styles.bodyText, { color: colors.gray500, fontSize: 13, marginTop: spacing.lg }]}>
          If you are not satisfied with our response, you may lodge a complaint with the Office of the Australian Information Commissioner (OAIC) at www.oaic.gov.au.
        </Text>

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </View>
  );
}

// --- Helper Components ---

function SectionHeader({ title, colors }: { title: string; colors: any }) {
  return (
    <Text style={[styles.sectionTitle, { color: colors.gray900 }]}>{title}</Text>
  );
}

function SubHeader({ title, colors }: { title: string; colors: any }) {
  return (
    <Text style={[styles.subHeader, { color: colors.gray800 }]}>{title}</Text>
  );
}

function Bullet({ colors, text, bold }: { colors: any; text: string; bold?: string }) {
  return (
    <View style={styles.bulletRow}>
      <Text style={[styles.bulletDot, { color: colors.gray400 }]}>{'\u2022'}</Text>
      <Text style={[styles.bulletText, { color: colors.gray700 }]}>
        {bold && <Text style={{ fontWeight: '600', color: colors.gray900 }}>{bold}</Text>}
        {text}
      </Text>
    </View>
  );
}

function ThirdPartyItem({ colors, name, purpose, description, onPress }: {
  colors: any;
  name: string;
  purpose: string;
  description: string;
  onPress?: () => void;
}) {
  return (
    <View style={[styles.thirdPartyCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <View style={styles.thirdPartyHeader}>
        <Text style={[styles.thirdPartyName, { color: colors.gray900 }]}>{name}</Text>
        <Text style={[styles.thirdPartyPurpose, { color: colors.primary }]}>{purpose}</Text>
      </View>
      <Text style={[styles.thirdPartyDesc, { color: colors.gray600 }]}>{description}</Text>
      {onPress && (
        <TouchableOpacity onPress={onPress} style={styles.thirdPartyLink}>
          <Text style={[styles.thirdPartyLinkText, { color: colors.primary }]}>View their privacy policy</Text>
          <Ionicons name="open-outline" size={14} color={colors.primary} />
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingTop: spacing.xs,
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  placeholder: {
    width: 44,
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.lg,
  },
  effectiveDate: {
    fontSize: 13,
    marginTop: spacing.lg,
    marginBottom: spacing.md,
  },
  bodyText: {
    fontSize: 15,
    lineHeight: 23,
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    marginTop: spacing.xl,
    marginBottom: spacing.sm,
  },
  subHeader: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: spacing.sm,
  },
  bulletRow: {
    flexDirection: 'row',
    paddingRight: spacing.md,
    marginBottom: 6,
  },
  bulletDot: {
    fontSize: 15,
    lineHeight: 23,
    marginRight: 8,
    marginLeft: 4,
  },
  bulletText: {
    fontSize: 15,
    lineHeight: 23,
    flex: 1,
  },
  thirdPartyCard: {
    borderRadius: radius.md,
    borderWidth: 1,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  thirdPartyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  thirdPartyName: {
    fontSize: 15,
    fontWeight: '700',
  },
  thirdPartyPurpose: {
    fontSize: 12,
    fontWeight: '600',
  },
  thirdPartyDesc: {
    fontSize: 14,
    lineHeight: 20,
  },
  thirdPartyLink: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    gap: 4,
  },
  thirdPartyLinkText: {
    fontSize: 13,
    fontWeight: '600',
  },
  contactCard: {
    borderRadius: radius.md,
    borderWidth: 1,
    padding: spacing.md,
    marginTop: spacing.sm,
    gap: spacing.sm,
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  contactText: {
    fontSize: 15,
  },
  bottomSpacer: {
    height: 60,
  },
});
