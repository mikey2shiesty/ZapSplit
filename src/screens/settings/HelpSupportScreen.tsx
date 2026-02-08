import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';
import Header from '../../components/common/Header';

interface FAQItem {
  question: string;
  answer: string;
}

const faqs: FAQItem[] = [
  {
    question: 'How do I create a split?',
    answer:
      'Tap the "+" button on the home screen or use the Scan tab to photograph a receipt. Choose your friends, select a split method (equal, custom, percentage, or receipt-based), and share the payment link.',
  },
  {
    question: 'How do I receive payments?',
    answer:
      'You need to connect a Stripe account. Go to Profile → Connect Stripe Account and complete the onboarding. Once set up, payments from your splits will be sent directly to your bank account.',
  },
  {
    question: 'How fast will I receive my money?',
    answer:
      'Payments are processed instantly. Once someone pays their share, the money is sent to your connected bank account right away via instant payout.',
  },
  {
    question: 'What fees are involved?',
    answer:
      'A small processing fee is applied to cover payment costs. This includes the Stripe processing fee (split between payer and receiver) and an instant payout fee so you get your money immediately.',
  },
  {
    question: 'How does receipt scanning work?',
    answer:
      'ZapSplit uses AI-powered OCR to read your receipts. Just take a photo or upload an image, and the app will automatically extract items, prices, tax, and tip. You can then assign items to each person.',
  },
  {
    question: 'Can people pay without the app?',
    answer:
      'Yes! When you share a split, a web payment link is generated. Recipients can open it in any browser and pay with their card, Apple Pay, or Google Pay — no app download required.',
  },
  {
    question: 'How do I delete my account?',
    answer:
      'Go to Profile → Settings → scroll to the bottom and tap "Delete Account". You\'ll need to type "delete my account" to confirm. This permanently removes your data.',
  },
  {
    question: 'Is my financial data secure?',
    answer:
      'Yes. All payments are processed by Stripe, a PCI DSS Level 1 certified payment processor. ZapSplit never stores your card details directly.',
  },
];

export default function HelpSupportScreen() {
  const navigation = useNavigation<any>();
  const { colors } = useTheme();
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  const toggleFAQ = (index: number) => {
    setExpandedIndex(expandedIndex === index ? null : index);
  };

  const handleEmailSupport = () => {
    Linking.openURL('mailto:support@zapsplit.app?subject=ZapSplit%20Support%20Request');
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.gray50 }]}>
      <Header title="Help & Support" onBack={() => navigation.goBack()} />

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Contact Support Card */}
        <View style={[styles.supportCard, { backgroundColor: colors.primary }]}>
          <Ionicons name="chatbubbles" size={32} color="#fff" />
          <View style={styles.supportCardText}>
            <Text style={styles.supportCardTitle}>Need help?</Text>
            <Text style={styles.supportCardSubtitle}>
              Our team is here to assist you
            </Text>
          </View>
          <TouchableOpacity
            style={styles.supportCardButton}
            onPress={handleEmailSupport}
            activeOpacity={0.8}
          >
            <Text style={[styles.supportCardButtonText, { color: colors.primary }]}>
              Email Us
            </Text>
          </TouchableOpacity>
        </View>

        {/* FAQ Section */}
        <Text style={[styles.sectionTitle, { color: colors.gray500 }]}>
          FREQUENTLY ASKED QUESTIONS
        </Text>
        <View style={[styles.faqContainer, { backgroundColor: colors.surface }]}>
          {faqs.map((faq, index) => (
            <View key={index}>
              {index > 0 && (
                <View style={[styles.divider, { backgroundColor: colors.gray100 }]} />
              )}
              <TouchableOpacity
                style={styles.faqItem}
                onPress={() => toggleFAQ(index)}
                activeOpacity={0.7}
              >
                <View style={styles.faqQuestion}>
                  <Text style={[styles.faqQuestionText, { color: colors.gray900 }]}>
                    {faq.question}
                  </Text>
                  <Ionicons
                    name={expandedIndex === index ? 'chevron-up' : 'chevron-down'}
                    size={20}
                    color={colors.gray400}
                  />
                </View>
                {expandedIndex === index && (
                  <Text style={[styles.faqAnswer, { color: colors.gray600 }]}>
                    {faq.answer}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          ))}
        </View>

        {/* Quick Links */}
        <Text style={[styles.sectionTitle, { color: colors.gray500 }]}>
          QUICK LINKS
        </Text>
        <View style={[styles.linksContainer, { backgroundColor: colors.surface }]}>
          <QuickLink
            icon="document-text-outline"
            label="Terms of Service"
            onPress={() => navigation.navigate('TermsOfService')}
            colors={colors}
          />
          <View style={[styles.divider, { backgroundColor: colors.gray100 }]} />
          <QuickLink
            icon="lock-closed-outline"
            label="Privacy Policy"
            onPress={() => navigation.navigate('PrivacyPolicy')}
            colors={colors}
          />
          <View style={[styles.divider, { backgroundColor: colors.gray100 }]} />
          <QuickLink
            icon="mail-outline"
            label="Contact Support"
            subtitle="support@zapsplit.app"
            onPress={handleEmailSupport}
            colors={colors}
          />
        </View>

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </View>
  );
}

function QuickLink({
  icon,
  label,
  subtitle,
  onPress,
  colors,
}: {
  icon: string;
  label: string;
  subtitle?: string;
  onPress: () => void;
  colors: any;
}) {
  return (
    <TouchableOpacity style={styles.quickLink} onPress={onPress} activeOpacity={0.7}>
      <View style={[styles.quickLinkIcon, { backgroundColor: colors.gray100 }]}>
        <Ionicons name={icon as any} size={20} color={colors.gray700} />
      </View>
      <View style={styles.quickLinkContent}>
        <Text style={[styles.quickLinkLabel, { color: colors.gray900 }]}>{label}</Text>
        {subtitle && (
          <Text style={[styles.quickLinkSubtitle, { color: colors.gray500 }]}>
            {subtitle}
          </Text>
        )}
      </View>
      <Ionicons name="chevron-forward" size={20} color={colors.gray400} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  supportCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderRadius: 16,
    marginBottom: 24,
    gap: 12,
  },
  supportCardText: {
    flex: 1,
  },
  supportCardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
  },
  supportCardSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 2,
  },
  supportCardButton: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
  },
  supportCardButtonText: {
    fontSize: 14,
    fontWeight: '700',
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.5,
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  faqContainer: {
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 24,
  },
  faqItem: {
    padding: 16,
  },
  faqQuestion: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  faqQuestionText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
  },
  faqAnswer: {
    fontSize: 14,
    lineHeight: 21,
    marginTop: 10,
  },
  divider: {
    height: 1,
    marginLeft: 16,
  },
  linksContainer: {
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 24,
  },
  quickLink: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 12,
  },
  quickLinkIcon: {
    width: 36,
    height: 36,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  quickLinkContent: {
    flex: 1,
  },
  quickLinkLabel: {
    fontSize: 16,
    fontWeight: '500',
  },
  quickLinkSubtitle: {
    fontSize: 13,
    marginTop: 2,
  },
  bottomSpacer: {
    height: 40,
  },
});
