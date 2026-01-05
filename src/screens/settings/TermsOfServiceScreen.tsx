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
import { colors } from '../../constants/theme';

export default function TermsOfServiceScreen() {
  const navigation = useNavigation();

  const openEmail = () => {
    Linking.openURL('mailto:legal@zapsplit.com');
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <Header title="Terms of Service" onBack={() => navigation.goBack()} />

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.lastUpdated}>Last Updated: January 2026</Text>

        <Section title="1. Acceptance of Terms">
          By downloading, installing, or using ZapSplit ("the App"), you agree
          to be bound by these Terms of Service ("Terms"). If you do not agree
          to these Terms, do not use the App.
        </Section>

        <Section title="2. Description of Service">
          ZapSplit is a mobile application that enables users to:
          {'\n\n'}
          <BulletPoint>Split bills and expenses with friends</BulletPoint>
          <BulletPoint>Scan receipts to automatically parse items</BulletPoint>
          <BulletPoint>Request and send payments via Stripe Connect</BulletPoint>
          <BulletPoint>Track payment history and balances</BulletPoint>
        </Section>

        <Section title="3. Eligibility">
          You must be at least 18 years old to use ZapSplit. By using the App,
          you represent that you are of legal age to form a binding contract
          and are not prohibited from using the App under Australian law.
        </Section>

        <Section title="4. Account Registration">
          You must provide accurate and complete information when creating an
          account. You are responsible for maintaining the confidentiality of
          your account credentials and for all activities under your account.
        </Section>

        <Section title="5. Payment Services">
          <Bold>5.1</Bold> ZapSplit facilitates peer-to-peer payments through
          Stripe Connect. We are not a bank or financial institution.
          {'\n\n'}
          <Bold>5.2</Bold> All payment processing is handled by Stripe and
          subject to Stripe's terms of service.
          {'\n\n'}
          <Bold>5.3</Bold> Transaction fees may apply. Current fees are
          displayed before confirming any payment.
          {'\n\n'}
          <Bold>5.4</Bold> You are responsible for ensuring you have sufficient
          funds or credit for transactions.
        </Section>

        <Section title="6. User Conduct">
          You agree not to:
          {'\n\n'}
          <BulletPoint>Use the App for any illegal purpose</BulletPoint>
          <BulletPoint>Attempt to defraud other users</BulletPoint>
          <BulletPoint>Upload false or misleading receipt information</BulletPoint>
          <BulletPoint>Harass, abuse, or harm other users</BulletPoint>
          <BulletPoint>Attempt to gain unauthorized access to the App</BulletPoint>
          <BulletPoint>Use the App for money laundering or terrorism financing</BulletPoint>
        </Section>

        <Section title="7. Receipt Scanning & AI">
          <Bold>7.1</Bold> The App uses artificial intelligence (OpenAI Vision)
          to analyze receipt images. Results may not always be 100% accurate.
          {'\n\n'}
          <Bold>7.2</Bold> You are responsible for verifying parsed receipt
          data before creating splits.
          {'\n\n'}
          <Bold>7.3</Bold> By using the receipt scanning feature, you consent
          to your receipt images being processed by OpenAI.
        </Section>

        <Section title="8. Intellectual Property">
          The App, including its design, features, and content, is owned by
          ZapSplit and protected by copyright and trademark laws. You may not
          copy, modify, or distribute any part of the App without permission.
        </Section>

        <Section title="9. Disclaimers">
          <Bold>9.1</Bold> THE APP IS PROVIDED "AS IS" WITHOUT WARRANTIES OF
          ANY KIND, EXPRESS OR IMPLIED.
          {'\n\n'}
          <Bold>9.2</Bold> We do not guarantee uninterrupted or error-free
          service.
          {'\n\n'}
          <Bold>9.3</Bold> We are not responsible for disputes between users
          regarding payments or split amounts.
        </Section>

        <Section title="10. Limitation of Liability">
          To the maximum extent permitted by law, ZapSplit shall not be liable
          for any indirect, incidental, special, consequential, or punitive
          damages arising from your use of the App.
        </Section>

        <Section title="11. Indemnification">
          You agree to indemnify and hold harmless ZapSplit from any claims,
          damages, or expenses arising from your use of the App or violation
          of these Terms.
        </Section>

        <Section title="12. Termination">
          We may suspend or terminate your account at any time for violation
          of these Terms. You may delete your account at any time through the
          App settings.
        </Section>

        <Section title="13. Governing Law">
          These Terms are governed by the laws of Australia. Any disputes shall
          be resolved in the courts of New South Wales, Australia.
        </Section>

        <Section title="14. Changes to Terms">
          We may update these Terms at any time. Continued use of the App after
          changes constitutes acceptance of the new Terms.
        </Section>

        <Section title="15. Contact">
          For questions about these Terms, contact us at:
          {'\n\n'}
          <TouchableOpacity onPress={openEmail}>
            <Text style={styles.link}>legal@zapsplit.com</Text>
          </TouchableOpacity>
        </Section>

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </View>
  );
}

// Helper Components
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <Text style={styles.sectionContent}>{children}</Text>
    </View>
  );
}

function Bold({ children }: { children: React.ReactNode }) {
  return <Text style={styles.bold}>{children}</Text>;
}

function BulletPoint({ children }: { children: React.ReactNode }) {
  return (
    <Text style={styles.bulletPoint}>
      {'\n'}  {'\u2022'}  {children}
    </Text>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  lastUpdated: {
    fontSize: 14,
    color: colors.gray500,
    marginBottom: 24,
    fontStyle: 'italic',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.gray900,
    marginBottom: 12,
  },
  sectionContent: {
    fontSize: 15,
    color: colors.gray700,
    lineHeight: 24,
  },
  bold: {
    fontWeight: '600',
    color: colors.gray900,
  },
  bulletPoint: {
    fontSize: 15,
    color: colors.gray700,
    lineHeight: 24,
  },
  link: {
    fontSize: 15,
    color: colors.primary,
    textDecorationLine: 'underline',
  },
  bottomSpacer: {
    height: 40,
  },
});
