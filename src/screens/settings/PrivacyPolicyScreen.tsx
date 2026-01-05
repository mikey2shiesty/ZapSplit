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

export default function PrivacyPolicyScreen() {
  const navigation = useNavigation();

  const openEmail = () => {
    Linking.openURL('mailto:privacy@zapsplit.com');
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <Header title="Privacy Policy" onBack={() => navigation.goBack()} />

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.lastUpdated}>Last Updated: January 2026</Text>

        <Section title="1. Introduction">
          ZapSplit ("we", "our", or "us") is committed to protecting your privacy.
          This Privacy Policy explains how we collect, use, disclose, and safeguard
          your information when you use our mobile application.
        </Section>

        <Section title="2. Information We Collect">
          <BulletPoint>
            <Bold>Account Information:</Bold> Name, email address, and profile photo
          </BulletPoint>
          <BulletPoint>
            <Bold>Financial Information:</Bold> Payment methods and transaction history
            (processed securely through Stripe)
          </BulletPoint>
          <BulletPoint>
            <Bold>Receipt Images:</Bold> Photos of receipts you upload for bill splitting
          </BulletPoint>
          <BulletPoint>
            <Bold>Usage Data:</Bold> App interactions and feature usage patterns
          </BulletPoint>
          <BulletPoint>
            <Bold>Device Information:</Bold> Device type, operating system, and unique identifiers
          </BulletPoint>
        </Section>

        <Section title="3. How We Use Your Information">
          <BulletPoint>To provide and maintain our bill-splitting service</BulletPoint>
          <BulletPoint>To process payments between users via Stripe Connect</BulletPoint>
          <BulletPoint>To analyze receipts using AI-powered optical character recognition</BulletPoint>
          <BulletPoint>To send notifications about payment requests and settlements</BulletPoint>
          <BulletPoint>To improve our services and user experience</BulletPoint>
          <BulletPoint>To comply with legal obligations</BulletPoint>
        </Section>

        <Section title="4. Third-Party Services">
          We share your data with the following third parties:
          {'\n\n'}
          <Bold>Stripe:</Bold> Our payment processor. Stripe processes your payment
          information in accordance with their Privacy Policy.
          {'\n\n'}
          <Bold>Supabase:</Bold> Our backend infrastructure provider, which stores
          your account data securely.
          {'\n\n'}
          <Bold>OpenAI:</Bold> We use OpenAI's Vision API to analyze receipt images
          and extract item information. Receipt images are processed by OpenAI in
          accordance with their data usage policies. You will be asked for consent
          before any receipt is processed.
        </Section>

        <Section title="5. Data Storage & Security">
          Your data is stored on secure servers located in the United States
          (Supabase) and processed by services that may operate globally. We
          implement industry-standard security measures including encryption
          in transit and at rest.
        </Section>

        <Section title="6. Your Rights">
          Under Australian Privacy Law, you have the right to:
          {'\n\n'}
          <BulletPoint>Access your personal information</BulletPoint>
          <BulletPoint>Correct inaccurate information</BulletPoint>
          <BulletPoint>Request deletion of your account and data</BulletPoint>
          <BulletPoint>Withdraw consent for data processing</BulletPoint>
          <BulletPoint>Lodge a complaint with the OAIC</BulletPoint>
        </Section>

        <Section title="7. Data Retention">
          We retain your personal information for as long as your account is
          active. Upon account deletion, we will delete or anonymize your data
          within 30 days, except where retention is required by law.
        </Section>

        <Section title="8. Children's Privacy">
          ZapSplit is not intended for users under 18 years of age. We do not
          knowingly collect personal information from children.
        </Section>

        <Section title="9. Changes to This Policy">
          We may update this Privacy Policy from time to time. We will notify
          you of any changes by updating the "Last Updated" date and, for
          significant changes, by sending you a notification.
        </Section>

        <Section title="10. Contact Us">
          If you have questions about this Privacy Policy or wish to exercise
          your rights, please contact us at:
          {'\n\n'}
          <TouchableOpacity onPress={openEmail}>
            <Text style={styles.link}>privacy@zapsplit.com</Text>
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
