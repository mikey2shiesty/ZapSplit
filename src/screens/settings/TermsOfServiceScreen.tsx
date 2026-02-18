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

export default function TermsOfServiceScreen() {
  const navigation = useNavigation();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  const openEmail = () => {
    Linking.openURL(`mailto:${CONTACT_EMAIL}`);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.gray50, paddingTop: insets.top }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={[styles.backButton, { backgroundColor: colors.gray50 }]}>
          <Ionicons name="arrow-back" size={24} color={colors.gray900} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.gray900 }]}>Terms of Service</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Effective Date */}
        <Text style={[styles.effectiveDate, { color: colors.gray500 }]}>
          Effective Date: {EFFECTIVE_DATE}
        </Text>

        <Text style={[styles.bodyText, { color: colors.gray700 }]}>
          Please read these Terms of Service ("Terms") carefully before using the ZapSplit mobile application and website (collectively, the "Service") operated by ZapSplit ("we", "us", or "our").
        </Text>
        <Text style={[styles.bodyText, { color: colors.gray700 }]}>
          By accessing or using the Service, you agree to be bound by these Terms. If you do not agree, do not use the Service.
        </Text>

        {/* 1. Eligibility */}
        <SectionHeader title="1. Eligibility" colors={colors} />
        <Text style={[styles.bodyText, { color: colors.gray700 }]}>
          You must be at least 18 years of age to use ZapSplit. By creating an account, you represent and warrant that:
        </Text>
        <Bullet colors={colors} text="You are at least 18 years old." />
        <Bullet colors={colors} text="You are legally capable of entering into a binding agreement." />
        <Bullet colors={colors} text="You are not prohibited from using the Service under any applicable Australian or international law." />

        {/* 2. Description of Service */}
        <SectionHeader title="2. Description of Service" colors={colors} />
        <Text style={[styles.bodyText, { color: colors.gray700 }]}>
          ZapSplit is a bill-splitting platform that allows users to:
        </Text>
        <Bullet colors={colors} text="Create and manage shared expenses with friends and other people." />
        <Bullet colors={colors} text="Scan receipts using AI-powered optical character recognition to automatically extract items and prices." />
        <Bullet colors={colors} text="Share payment links with anyone, including people who do not have a ZapSplit account." />
        <Bullet colors={colors} text="Request and collect payments via Stripe." />
        <Bullet colors={colors} text="Track payment history, balances, and settlement status." />
        <Text style={[styles.bodyText, { color: colors.gray700 }]}>
          ZapSplit is not a bank, financial institution, or licensed payment facility. We facilitate payments through third-party payment processors.
        </Text>

        {/* 3. Account Registration */}
        <SectionHeader title="3. Account Registration" colors={colors} />
        <Text style={[styles.bodyText, { color: colors.gray700 }]}>
          To use certain features of the Service, you must create an account. You agree to:
        </Text>
        <Bullet colors={colors} text="Provide accurate, current, and complete information during registration." />
        <Bullet colors={colors} text="Maintain and promptly update your account information." />
        <Bullet colors={colors} text="Keep your login credentials secure and confidential." />
        <Bullet colors={colors} text="Accept responsibility for all activity that occurs under your account." />
        <Text style={[styles.bodyText, { color: colors.gray700 }]}>
          You must notify us immediately if you suspect any unauthorised access to your account.
        </Text>

        {/* 4. Payment Terms */}
        <SectionHeader title="4. Payment Terms" colors={colors} />

        <SubSection number="4.1" colors={colors}>
          All payment processing is handled by Stripe, a PCI-compliant third-party payment processor. Your use of payment features is also subject to Stripe's Services Agreement.
        </SubSection>
        <SubSection number="4.2" colors={colors}>
          A platform fee of $0.50 AUD applies per transaction processed through the Service. Standard Stripe processing fees also apply and are displayed before you confirm any payment.
        </SubSection>
        <SubSection number="4.3" colors={colors}>
          You are responsible for ensuring you have sufficient funds or credit available for any payments you initiate.
        </SubSection>
        <SubSection number="4.4" colors={colors}>
          Refunds and payment disputes are subject to Stripe's dispute resolution process. We will assist where possible but are not liable for payment processing errors caused by third parties.
        </SubSection>
        <SubSection number="4.5" colors={colors}>
          All amounts displayed in the Service are in Australian Dollars (AUD) unless otherwise stated.
        </SubSection>

        {/* 5. Receipt Scanning and AI Processing */}
        <SectionHeader title="5. Receipt Scanning and AI Processing" colors={colors} />

        <SubSection number="5.1" colors={colors}>
          The Service uses artificial intelligence (OpenAI's Vision API) to analyse receipt images and extract item names, quantities, and prices.
        </SubSection>
        <SubSection number="5.2" colors={colors}>
          By using the receipt scanning feature, you consent to your receipt images being transmitted to and processed by OpenAI in accordance with their data usage policies.
        </SubSection>
        <SubSection number="5.3" colors={colors}>
          AI-generated results are provided as a convenience and may not always be 100% accurate. You are responsible for reviewing and verifying all parsed receipt data before creating a split.
        </SubSection>
        <SubSection number="5.4" colors={colors}>
          We are not liable for any errors, disputes, or financial losses arising from inaccurate receipt parsing.
        </SubSection>

        {/* 6. User Conduct */}
        <SectionHeader title="6. User Conduct" colors={colors} />
        <Text style={[styles.bodyText, { color: colors.gray700 }]}>
          You agree not to use the Service to:
        </Text>
        <Bullet colors={colors} text="Engage in any illegal, fraudulent, or deceptive activity." />
        <Bullet colors={colors} text="Attempt to defraud other users or create false payment requests." />
        <Bullet colors={colors} text="Upload fabricated, altered, or misleading receipt images." />
        <Bullet colors={colors} text="Harass, threaten, or abuse other users." />
        <Bullet colors={colors} text="Attempt to gain unauthorised access to the Service or other users' accounts." />
        <Bullet colors={colors} text="Use the Service for money laundering, terrorism financing, or any activity that violates applicable anti-money laundering laws." />
        <Bullet colors={colors} text="Interfere with or disrupt the integrity or performance of the Service." />
        <Text style={[styles.bodyText, { color: colors.gray700 }]}>
          We reserve the right to suspend or terminate accounts that violate these terms without prior notice.
        </Text>

        {/* 7. Intellectual Property */}
        <SectionHeader title="7. Intellectual Property" colors={colors} />
        <Text style={[styles.bodyText, { color: colors.gray700 }]}>
          The Service, including its design, code, features, logos, and content, is owned by ZapSplit and protected by Australian and international copyright, trademark, and intellectual property laws. You may not copy, modify, distribute, sell, or create derivative works based on the Service without our prior written consent.
        </Text>

        {/* 8. User Content */}
        <SectionHeader title="8. User Content" colors={colors} />
        <Text style={[styles.bodyText, { color: colors.gray700 }]}>
          You retain ownership of any content you upload to the Service (such as receipt images and profile photos). By uploading content, you grant us a limited, non-exclusive licence to use, process, and store that content solely for the purpose of providing the Service to you.
        </Text>

        {/* 9. Third-Party Services */}
        <SectionHeader title="9. Third-Party Services" colors={colors} />
        <Text style={[styles.bodyText, { color: colors.gray700 }]}>
          The Service integrates with third-party services including Stripe (payments), Supabase (infrastructure), OpenAI (receipt scanning), and Apple/Google (authentication). Your use of these services is subject to their respective terms and conditions. We are not responsible for the actions, content, or policies of any third-party service.
        </Text>

        {/* 10. Disclaimers */}
        <SectionHeader title="10. Disclaimers" colors={colors} />

        <SubSection number="10.1" colors={colors}>
          THE SERVICE IS PROVIDED ON AN "AS IS" AND "AS AVAILABLE" BASIS WITHOUT WARRANTIES OF ANY KIND, WHETHER EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT.
        </SubSection>
        <SubSection number="10.2" colors={colors}>
          We do not guarantee that the Service will be uninterrupted, secure, or error-free at all times.
        </SubSection>
        <SubSection number="10.3" colors={colors}>
          We are not a party to any financial arrangements between users. We are not responsible for disputes between users regarding split amounts, payment obligations, or any other matters arising from shared expenses.
        </SubSection>

        {/* 11. Limitation of Liability */}
        <SectionHeader title="11. Limitation of Liability" colors={colors} />
        <Text style={[styles.bodyText, { color: colors.gray700 }]}>
          To the maximum extent permitted by the Australian Consumer Law and other applicable legislation:
        </Text>
        <Bullet colors={colors} text="ZapSplit shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising from or related to your use of the Service." />
        <Bullet colors={colors} text="Our total liability for any claim arising from the Service shall not exceed the total fees you have paid to us in the 12 months preceding the claim." />
        <Bullet colors={colors} text="Nothing in these Terms excludes or limits liability that cannot be excluded or limited under Australian law, including liability under the Australian Consumer Law." />

        {/* 12. Indemnification */}
        <SectionHeader title="12. Indemnification" colors={colors} />
        <Text style={[styles.bodyText, { color: colors.gray700 }]}>
          You agree to indemnify, defend, and hold harmless ZapSplit and its officers, directors, employees, and agents from and against any claims, liabilities, damages, losses, or expenses (including reasonable legal fees) arising out of or in any way connected with your use of the Service, your violation of these Terms, or your violation of any rights of another person.
        </Text>

        {/* 13. Termination */}
        <SectionHeader title="13. Termination" colors={colors} />

        <SubSection number="13.1" colors={colors}>
          You may delete your account at any time through the app settings. Upon deletion, your data will be handled in accordance with our Privacy Policy.
        </SubSection>
        <SubSection number="13.2" colors={colors}>
          We may suspend or terminate your access to the Service at any time, with or without cause, including for violation of these Terms.
        </SubSection>
        <SubSection number="13.3" colors={colors}>
          Upon termination, your right to use the Service ceases immediately. Any outstanding payment obligations survive termination.
        </SubSection>

        {/* 14. Governing Law */}
        <SectionHeader title="14. Governing Law and Dispute Resolution" colors={colors} />
        <Text style={[styles.bodyText, { color: colors.gray700 }]}>
          These Terms are governed by and construed in accordance with the laws of Western Australia. Any disputes arising from these Terms or the Service shall be subject to the exclusive jurisdiction of the courts of Western Australia.
        </Text>

        {/* 15. Changes to Terms */}
        <SectionHeader title="15. Changes to These Terms" colors={colors} />
        <Text style={[styles.bodyText, { color: colors.gray700 }]}>
          We reserve the right to modify these Terms at any time. We will notify you of material changes by updating the "Effective Date" at the top and, where appropriate, through an in-app notification. Your continued use of the Service after changes are posted constitutes your acceptance of the revised Terms. If you do not agree with the changes, you must stop using the Service.
        </Text>

        {/* 16. Severability */}
        <SectionHeader title="16. Severability" colors={colors} />
        <Text style={[styles.bodyText, { color: colors.gray700 }]}>
          If any provision of these Terms is found to be invalid or unenforceable by a court of competent jurisdiction, the remaining provisions shall continue in full force and effect.
        </Text>

        {/* 17. Contact */}
        <SectionHeader title="17. Contact Us" colors={colors} />
        <Text style={[styles.bodyText, { color: colors.gray700 }]}>
          If you have any questions about these Terms of Service, please contact us:
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

function SubSection({ number, children, colors }: { number: string; children: React.ReactNode; colors: any }) {
  return (
    <Text style={[styles.bodyText, { color: colors.gray700 }]}>
      <Text style={{ fontWeight: '600', color: colors.gray900 }}>{number} </Text>
      {children}
    </Text>
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
