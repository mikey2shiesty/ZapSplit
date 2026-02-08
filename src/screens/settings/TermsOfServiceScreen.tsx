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
import Header from '../../components/common/Header';
import { useTheme } from '../../contexts/ThemeContext';

export default function TermsOfServiceScreen() {
  const navigation = useNavigation();
  const { colors } = useTheme();

  const openEmail = () => {
    Linking.openURL('mailto:legal@zapsplit.com');
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.surface }]}>
      {/* Header */}
      <Header title="Terms of Service" onBack={() => navigation.goBack()} />

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={[styles.lastUpdated, { color: colors.gray500 }]}>Last Updated: January 2026</Text>

        <Section title="1. Acceptance of Terms" colors={colors}>
          By downloading, installing, or using ZapSplit ("the App"), you agree
          to be bound by these Terms of Service ("Terms"). If you do not agree
          to these Terms, do not use the App.
        </Section>

        <Section title="2. Description of Service" colors={colors}>
          ZapSplit is a mobile application that enables users to:
          {'\n\n'}
          <BulletPoint colors={colors}>Split bills and expenses with friends</BulletPoint>
          <BulletPoint colors={colors}>Scan receipts to automatically parse items</BulletPoint>
          <BulletPoint colors={colors}>Request and send payments via Stripe Connect</BulletPoint>
          <BulletPoint colors={colors}>Track payment history and balances</BulletPoint>
        </Section>

        <Section title="3. Eligibility" colors={colors}>
          You must be at least 18 years old to use ZapSplit. By using the App,
          you represent that you are of legal age to form a binding contract
          and are not prohibited from using the App under Australian law.
        </Section>

        <Section title="4. Account Registration" colors={colors}>
          You must provide accurate and complete information when creating an
          account. You are responsible for maintaining the confidentiality of
          your account credentials and for all activities under your account.
        </Section>

        <Section title="5. Payment Services" colors={colors}>
          <Bold colors={colors}>5.1</Bold> ZapSplit facilitates peer-to-peer payments through
          Stripe Connect. We are not a bank or financial institution.
          {'\n\n'}
          <Bold colors={colors}>5.2</Bold> All payment processing is handled by Stripe and
          subject to Stripe's terms of service.
          {'\n\n'}
          <Bold colors={colors}>5.3</Bold> Transaction fees may apply. Current fees are
          displayed before confirming any payment.
          {'\n\n'}
          <Bold colors={colors}>5.4</Bold> You are responsible for ensuring you have sufficient
          funds or credit for transactions.
        </Section>

        <Section title="6. User Conduct" colors={colors}>
          You agree not to:
          {'\n\n'}
          <BulletPoint colors={colors}>Use the App for any illegal purpose</BulletPoint>
          <BulletPoint colors={colors}>Attempt to defraud other users</BulletPoint>
          <BulletPoint colors={colors}>Upload false or misleading receipt information</BulletPoint>
          <BulletPoint colors={colors}>Harass, abuse, or harm other users</BulletPoint>
          <BulletPoint colors={colors}>Attempt to gain unauthorized access to the App</BulletPoint>
          <BulletPoint colors={colors}>Use the App for money laundering or terrorism financing</BulletPoint>
        </Section>

        <Section title="7. Receipt Scanning & AI" colors={colors}>
          <Bold colors={colors}>7.1</Bold> The App uses artificial intelligence (OpenAI Vision)
          to analyze receipt images. Results may not always be 100% accurate.
          {'\n\n'}
          <Bold colors={colors}>7.2</Bold> You are responsible for verifying parsed receipt
          data before creating splits.
          {'\n\n'}
          <Bold colors={colors}>7.3</Bold> By using the receipt scanning feature, you consent
          to your receipt images being processed by OpenAI.
        </Section>

        <Section title="8. Intellectual Property" colors={colors}>
          The App, including its design, features, and content, is owned by
          ZapSplit and protected by copyright and trademark laws. You may not
          copy, modify, or distribute any part of the App without permission.
        </Section>

        <Section title="9. Disclaimers" colors={colors}>
          <Bold colors={colors}>9.1</Bold> THE APP IS PROVIDED "AS IS" WITHOUT WARRANTIES OF
          ANY KIND, EXPRESS OR IMPLIED.
          {'\n\n'}
          <Bold colors={colors}>9.2</Bold> We do not guarantee uninterrupted or error-free
          service.
          {'\n\n'}
          <Bold colors={colors}>9.3</Bold> We are not responsible for disputes between users
          regarding payments or split amounts.
        </Section>

        <Section title="10. Limitation of Liability" colors={colors}>
          To the maximum extent permitted by law, ZapSplit shall not be liable
          for any indirect, incidental, special, consequential, or punitive
          damages arising from your use of the App.
        </Section>

        <Section title="11. Indemnification" colors={colors}>
          You agree to indemnify and hold harmless ZapSplit from any claims,
          damages, or expenses arising from your use of the App or violation
          of these Terms.
        </Section>

        <Section title="12. Termination" colors={colors}>
          We may suspend or terminate your account at any time for violation
          of these Terms. You may delete your account at any time through the
          App settings.
        </Section>

        <Section title="13. Governing Law" colors={colors}>
          These Terms are governed by the laws of Australia. Any disputes shall
          be resolved in the courts of New South Wales, Australia.
        </Section>

        <Section title="14. Changes to Terms" colors={colors}>
          We may update these Terms at any time. Continued use of the App after
          changes constitutes acceptance of the new Terms.
        </Section>

        <Section title="15. Contact" colors={colors}>
          For questions about these Terms, contact us at:
          {'\n\n'}
          <TouchableOpacity onPress={openEmail}>
            <Text style={[styles.link, { color: colors.primary }]}>legal@zapsplit.com</Text>
          </TouchableOpacity>
        </Section>

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </View>
  );
}

// Helper Components
function Section({ title, children, colors }: { title: string; children: React.ReactNode; colors: any }) {
  return (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, { color: colors.gray900 }]}>{title}</Text>
      <Text style={[styles.sectionContent, { color: colors.gray700 }]}>{children}</Text>
    </View>
  );
}

function Bold({ children, colors }: { children: React.ReactNode; colors: any }) {
  return <Text style={[styles.bold, { color: colors.gray900 }]}>{children}</Text>;
}

function BulletPoint({ children, colors }: { children: React.ReactNode; colors: any }) {
  return (
    <Text style={[styles.bulletPoint, { color: colors.gray700 }]}>
      {'\n'}  {'\u2022'}  {children}
    </Text>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  lastUpdated: {
    fontSize: 14,
    marginBottom: 24,
    fontStyle: 'italic',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 12,
  },
  sectionContent: {
    fontSize: 15,
    lineHeight: 24,
  },
  bold: {
    fontWeight: '600',
  },
  bulletPoint: {
    fontSize: 15,
    lineHeight: 24,
  },
  link: {
    fontSize: 15,
    textDecorationLine: 'underline',
  },
  bottomSpacer: {
    height: 40,
  },
});
