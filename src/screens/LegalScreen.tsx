import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, FONTS, RADIUS, SPACING } from '../theme/theme';
import { BlurHeader, useBlurBackHeaderLayout } from '../components/Blur';
import { IconButton } from '../components/buttons';
import { useApp } from '../context/AppContext';
import { AppBackground } from '../components/Background';

export const SUPPORT_EMAIL = 'support@ultim.app';

type LegalType = 'privacy' | 'terms';

interface LegalScreenProps {
  navigation: any;
  route: { params?: { type?: LegalType } };
}

interface Section {
  heading: string;
  body: string[];
}

const PRIVACY: Section[] = [
  {
    heading: 'Information we collect',
    body: [
      'Account details you provide when signing up: name, mobile number and/or email address.',
      'Approximate location (with your permission) so we can show sports and fitness centers near you. Location is used only while the app is open and is never shared with third parties.',
      'Activity data: the memberships and credits activated for you at a center, session bookings, check-ins and the transactions that result from them.',
      'A push notification token so we can send you booking and credit updates (you can turn this off in your device settings at any time).',
    ],
  },
  {
    heading: 'How we use it',
    body: [
      'To operate your ULTIM account, show nearby facilities and plans, keep your credit balance accurate and let centers verify your check-in with a QR pass.',
      'To send service notifications about your bookings and credits.',
      'To keep the service secure and prevent misuse.',
    ],
  },
  {
    heading: 'What we never do',
    body: [
      'We do not sell your personal data.',
      'We do not collect payment card details in the app — memberships are purchased in person at the center.',
      'We do not track your precise location in the background.',
    ],
  },
  {
    heading: 'Data retention & your rights',
    body: [
      'Account and transaction data is kept while your account is active, and for as long as needed to meet legal and accounting obligations.',
      `You can delete your account at any time from Profile → Delete Account. Deletion removes your profile and personal data from our active systems. You can also write to ${SUPPORT_EMAIL} to request access, correction or deletion of your data.`,
    ],
  },
  {
    heading: 'Children',
    body: [
      'ULTIM is not directed at children under 13, and accounts are not knowingly created for them.',
    ],
  },
  {
    heading: 'Changes',
    body: [
      'If this policy changes materially we will notify you in the app before the change takes effect.',
    ],
  },
];

const TERMS: Section[] = [
  {
    heading: 'Acceptance',
    body: [
      'By creating an account or continuing as a guest you agree to these Terms of Service and to the Privacy Policy.',
    ],
  },
  {
    heading: 'Using ULTIM',
    body: [
      'ULTIM helps you discover sports and fitness centers nearby and manage the credits attached to your memberships.',
      'Memberships are registered and activated in person at the center reception desk — the app itself does not sell memberships.',
      'You are responsible for keeping your login credentials and QR passes private, and for activity carried out through your account.',
    ],
  },
  {
    heading: 'Credits & bookings',
    body: [
      'Credits are granted by a center when you activate a membership there. Credits have no cash value, are non-transferable and expire with the membership plan stated on your pass.',
      'Bookings are subject to the individual center\u2019s availability rules. Cancellations or no-shows may be handled by the center policy shown on your pass.',
      'If a QR pass is misused or shared, the center may refuse service.',
    ],
  },
  {
    heading: 'Acceptable use',
    body: [
      'Do not attempt to break, overload, scrape or gain unauthorised access to the app or its data.',
      'Do not submit false information or impersonate another person.',
    ],
  },
  {
    heading: 'Content & availability',
    body: [
      'Facility photos, prices and plan details are provided by partner centers and may change. We work to keep them accurate but cannot guarantee they are error-free at all times.',
      'The app is provided "as is". To the extent permitted by law we are not liable for indirect losses arising from use of the app or from services provided by centers.',
    ],
  },
  {
    heading: 'Termination',
    body: [
      'You may stop using ULTIM and delete your account at any time. We may suspend accounts that violate these terms or attempt to abuse the service.',
    ],
  },
  {
    heading: 'Contact',
    body: [`Questions about these terms? Write to ${SUPPORT_EMAIL}.`],
  },
];

export const LegalScreen: React.FC<LegalScreenProps> = ({ navigation, route }) => {
  const type: LegalType = route?.params?.type === 'terms' ? 'terms' : 'privacy';
  const { colors } = useApp();
  const { top: headerTop, height: headerHeight } = useBlurBackHeaderLayout();

  const title = type === 'privacy' ? 'Privacy Policy' : 'Terms of Service';
  const sections = type === 'privacy' ? PRIVACY : TERMS;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <AppBackground />

      <ScrollView
        contentContainerStyle={[styles.content, { paddingTop: headerHeight + 24 }]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={[styles.title, { color: colors.onSurface }]}>{title}</Text>
        <Text style={[styles.updated, { color: colors.textMuted }]}>
          Last updated: January 2026
        </Text>

        {sections.map((section) => (
          <View
            key={section.heading}
            style={[styles.sectionCard, { backgroundColor: colors.glass, borderColor: colors.glassBorder }]}
          >
            <Text style={[styles.sectionHeading, { color: colors.onSurface }]}>
              {section.heading}
            </Text>
            {section.body.map((paragraph, i) => (
              <Text key={i} style={[styles.paragraph, { color: colors.textMuted }]}>
                {paragraph}
              </Text>
            ))}
          </View>
        ))}

        <TouchableOpacity
          style={[styles.contactBtn, { backgroundColor: colors.emberPanel, borderColor: colors.emberBorder }]}
          onPress={() => Linking.openURL(`mailto:${SUPPORT_EMAIL}`)}
          activeOpacity={0.85}
        >
          <Ionicons name="mail-outline" size={16} color={colors.primary} />
          <Text style={[styles.contactText, { color: colors.primary }]}>Contact support</Text>
        </TouchableOpacity>

        <Text style={[styles.footer, { color: 'rgba(255,255,255,0.32)' }]}>
          ULTIM · {SUPPORT_EMAIL}
        </Text>
      </ScrollView>

      <BlurHeader
        height={headerHeight}
        contentStyle={{
          paddingTop: headerTop,
          paddingHorizontal: SPACING.containerPadding,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <IconButton
          icon="arrow-back"
          size={40}
          iconSize={22}
          iconColor={colors.onSurface}
          backgroundColor={colors.glassHigh}
          onPress={() => navigation.goBack()}
        />
        <Text style={[styles.headerTitle, { color: colors.onSurface }]}>{title}</Text>
        <View style={{ width: 40 }} />
      </BlurHeader>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  headerTitle: {
    fontSize: 16,
    fontFamily: FONTS.extraBold,
    letterSpacing: 0.5,
  },
  content: {
    paddingHorizontal: SPACING.containerPadding,
    paddingBottom: SPACING.xl,
  },
  title: {
    fontSize: 26,
    fontFamily: FONTS.bold,
    letterSpacing: -0.5,
  },
  updated: {
    fontSize: 11.5,
    fontFamily: FONTS.medium,
    marginTop: 4,
    marginBottom: SPACING.md,
  },
  sectionCard: {
    borderRadius: RADIUS.card,
    borderWidth: 1,
    padding: 16,
    marginBottom: 12,
  },
  sectionHeading: {
    fontSize: 14.5,
    fontFamily: FONTS.bold,
    letterSpacing: -0.2,
    marginBottom: 8,
  },
  paragraph: {
    fontSize: 13,
    fontFamily: FONTS.regular,
    lineHeight: 20,
    marginBottom: 8,
  },
  contactBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 48,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    marginTop: 6,
  },
  contactText: {
    fontSize: 12,
    fontFamily: FONTS.bold,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  footer: {
    textAlign: 'center',
    fontSize: 10.5,
    fontFamily: FONTS.medium,
    marginTop: 22,
  },
});
