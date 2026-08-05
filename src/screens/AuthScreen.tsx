import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FONTS, RADIUS, SPACING } from '../theme/theme';
import { useApp } from '../context/AppContext';
import { GradientButton } from '../components/buttons';

type AuthMode = 'PHONE' | 'EMAIL';
type EmailSubTab = 'LOGIN' | 'REGISTER';
type OtpStep = 'PHONE_INPUT' | 'OTP_INPUT' | 'NAME_INPUT';

const { width: SCREEN_W } = Dimensions.get('window');
const OTP_LENGTH = 4;

// ─────────────────────────────────────────────────────────────────────────────
// OTP Boxes Component — 4 individual digit boxes
// ─────────────────────────────────────────────────────────────────────────────
interface OtpBoxesProps {
  value: string;
  onChange: (v: string) => void;
  colors: any;
  disabled?: boolean;
  autoFocus?: boolean;
}

const OtpBoxes: React.FC<OtpBoxesProps> = ({ value, onChange, colors, disabled, autoFocus }) => {
  const inputRef = useRef<TextInput>(null);
  const [cursorOn, setCursorOn] = useState(true);

  // Blinking cursor effect
  useEffect(() => {
    const t = setInterval(() => setCursorOn((p) => !p), 530);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    if (autoFocus) {
      const t = setTimeout(() => inputRef.current?.focus(), 150);
      return () => clearTimeout(t);
    }
  }, [autoFocus]);

  const BOX_GAP = 14;
  const BOX_W = Math.floor((SCREEN_W - SPACING.containerPadding * 2 - BOX_GAP * (OTP_LENGTH - 1)) / OTP_LENGTH);
  const BOX_H = Math.round(BOX_W * 1.18);

  return (
    <TouchableOpacity
      activeOpacity={1}
      onPress={() => inputRef.current?.focus()}
      style={{ alignItems: 'center' }}
    >
      {/* Hidden real input — captures keyboard */}
      <TextInput
        ref={inputRef}
        value={value}
        onChangeText={(t) => {
          const filtered = t.replace(/[^0-9]/g, '').slice(0, OTP_LENGTH);
          onChange(filtered);
        }}
        keyboardType="number-pad"
        maxLength={OTP_LENGTH}
        style={styles.hiddenInput}
        caretHidden
        editable={!disabled}
      />

      {/* 4 visual boxes */}
      <View style={{ flexDirection: 'row', gap: BOX_GAP }}>
        {Array.from({ length: OTP_LENGTH }).map((_, idx) => {
          const char = value[idx] ?? '';
          const isActive = idx === value.length && !disabled;
          const isFilled = char !== '';

          const boxBorderColor = isActive
            ? colors.primary
            : isFilled
            ? `${colors.primary}70`
            : colors.border;

          return (
            <View
              key={idx}
              style={[
                {
                  width: BOX_W,
                  height: BOX_H,
                  borderRadius: 16,
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: colors.surfaceLow,
                  borderWidth: isActive ? 2 : 1.5,
                  borderColor: boxBorderColor,
                },
                isActive && {
                  shadowColor: colors.primary,
                  shadowOpacity: 0.45,
                  shadowOffset: { width: 0, height: 0 },
                  shadowRadius: 10,
                  elevation: 6,
                },
              ]}
            >
              {isFilled ? (
                <Text
                  style={{
                    fontSize: 32,
                    fontFamily: FONTS.black,
                    color: colors.onSurface,
                    lineHeight: 38,
                  }}
                >
                  {char}
                </Text>
              ) : isActive && cursorOn ? (
                <View
                  style={{
                    width: 2,
                    height: 32,
                    borderRadius: 2,
                    backgroundColor: colors.primary,
                  }}
                />
              ) : null}
            </View>
          );
        })}
      </View>
    </TouchableOpacity>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Main Auth Screen
// ─────────────────────────────────────────────────────────────────────────────
export const AuthScreen: React.FC = () => {
  const {
    sendPhoneOtp,
    loginWithPhone,
    loginWithEmail,
    registerWithEmail,
    updateFullName,
    isLoading,
    colors,
  } = useApp();
  const insets = useSafeAreaInsets();

  const [authMode, setAuthMode] = useState<AuthMode>('PHONE');
  const [emailSubTab, setEmailSubTab] = useState<EmailSubTab>('LOGIN');
  const [otpStep, setOtpStep] = useState<OtpStep>('PHONE_INPUT');

  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [localLoading, setLocalLoading] = useState(false);

  // Phone OTP
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [pendingUserId, setPendingUserId] = useState<string | null>(null);
  const [otpUserName, setOtpUserName] = useState('');
  const [resendTimer, setResendTimer] = useState(0);

  // Email
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [regFullName, setRegFullName] = useState('');
  const [focusedField, setFocusedField] = useState<string | null>(null);

  useEffect(() => {
    let t: NodeJS.Timeout;
    if (resendTimer > 0) t = setInterval(() => setResendTimer((p) => p - 1), 1000);
    return () => { if (t) clearInterval(t); };
  }, [resendTimer]);

  // Auto-submit when all 4 digits entered
  useEffect(() => {
    if (otp.length === OTP_LENGTH && !isBusy && !error) {
      handleVerifyOtp();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [otp]);

  const clear = () => { setError(null); setNotice(null); };
  const isBusy = isLoading || localLoading;

  const switchMode = (mode: AuthMode) => {
    setAuthMode(mode);
    clear();
    setOtpStep('PHONE_INPUT');
  };

  const formattedPhone = (() => {
    const raw = phone.trim().replace(/[^\d+]/g, '');
    return raw.startsWith('+') ? raw : `+91 ${raw}`;
  })();

  // ── Phone OTP handlers ─────────────────────────────────────────────────────
  const handleSendOtp = async () => {
    clear();
    const raw = phone.trim().replace(/[^\d+]/g, '');
    if (!raw || raw.replace(/\D/g, '').length < 10) {
      setError('Enter a valid 10-digit phone number.');
      return;
    }
    const finalPhone = raw.startsWith('+') ? raw : `+91${raw}`;
    setLocalLoading(true);
    const res = await sendPhoneOtp(finalPhone);
    setLocalLoading(false);
    if (res.success) {
      setOtpStep('OTP_INPUT');
      setOtp('');
      setResendTimer(60);
      clear();
    } else {
      setError(res.error || 'Failed to send OTP. Try again.');
    }
  };

  const handleVerifyOtp = async () => {
    clear();
    if (otp.length < OTP_LENGTH) {
      setError(`Enter all ${OTP_LENGTH} digits.`);
      return;
    }
    const raw = phone.trim().replace(/[^\d+]/g, '');
    const finalPhone = raw.startsWith('+') ? raw : `+91${raw}`;
    setLocalLoading(true);
    const res = await loginWithPhone(finalPhone, otp);
    setLocalLoading(false);
    if (res.needsName && res.pendingUserId) {
      setPendingUserId(res.pendingUserId);
      setOtpStep('NAME_INPUT');
      clear();
    } else if (!res.success) {
      setError(res.error || 'Incorrect code. Please try again.');
      setOtp('');
    }
  };

  const handleSaveName = async () => {
    clear();
    if (!otpUserName.trim() || otpUserName.trim().length < 2) {
      setError('Enter your full name (at least 2 characters).');
      return;
    }
    if (!pendingUserId) { setError('Session error. Please restart.'); return; }
    setLocalLoading(true);
    const res = await updateFullName(pendingUserId, otpUserName.trim());
    setLocalLoading(false);
    if (!res.success) setError(res.error || 'Could not save your name.');
  };

  // ── Email handlers ─────────────────────────────────────────────────────────
  const handleEmailLogin = async () => {
    clear();
    if (!email.trim() || !password) { setError('Enter your email and password.'); return; }
    setLocalLoading(true);
    const res = await loginWithEmail(email.trim(), password);
    setLocalLoading(false);
    if (!res.success) setError(res.error || 'Incorrect email or password.');
  };

  const handleEmailRegister = async () => {
    clear();
    if (!regFullName.trim()) { setError('Enter your full name.'); return; }
    if (!email.trim() || !email.includes('@')) { setError('Enter a valid email address.'); return; }
    if (!password || password.length < 8) { setError('Password must be at least 8 characters.'); return; }
    setLocalLoading(true);
    const res = await registerWithEmail(email.trim(), password, regFullName.trim());
    setLocalLoading(false);
    if (res.success) {
      setNotice(res.message || 'Account created! Check your email to verify, then log in.');
      setEmail(''); setPassword(''); setRegFullName('');
      setTimeout(() => { setEmailSubTab('LOGIN'); clear(); }, 5000);
    } else {
      setError(res.error || 'Registration failed. Try again.');
    }
  };

  const inputBorder = (field: string) => ({
    borderColor: focusedField === field ? colors.primary : colors.border,
    borderWidth: focusedField === field ? 1.5 : 1,
  });

  // ─────────────────────────────────────────────────────────────────────────
  //  OTP SCREEN — Dedicated full-screen layout, boxes in upper half
  // ─────────────────────────────────────────────────────────────────────────
  if (otpStep === 'OTP_INPUT') {
    return (
      <KeyboardAvoidingView
        style={[styles.root, { backgroundColor: colors.background }]}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <StatusBar barStyle="light-content" backgroundColor={colors.background} />
        <View
          style={{
            flex: 1,
            paddingTop: insets.top + 16,
            paddingHorizontal: SPACING.containerPadding,
            paddingBottom: insets.bottom + 20,
          }}
        >
          {/* Back row */}
          <TouchableOpacity
            style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 40 }}
            onPress={() => { setOtpStep('PHONE_INPUT'); setOtp(''); clear(); }}
          >
            <Ionicons name="arrow-back" size={20} color={colors.onSurface} />
            <Text style={{ fontSize: 15, fontFamily: FONTS.medium, color: colors.onSurface }}>
              Back
            </Text>
          </TouchableOpacity>

          {/* Title */}
          <Text style={{ fontSize: 30, fontFamily: FONTS.black, color: colors.onSurface, letterSpacing: -0.5, lineHeight: 36 }}>
            Enter the code
          </Text>
          <Text style={{ fontSize: 15, fontFamily: FONTS.regular, color: colors.textMuted, marginTop: 10, lineHeight: 22 }}>
            We sent a 4-digit code to{'\n'}
            <Text style={{ color: colors.onSurface, fontFamily: FONTS.semiBold }}>{formattedPhone}</Text>
          </Text>

          {/* OTP Boxes */}
          <View style={{ marginTop: 48, marginBottom: 8 }}>
            <OtpBoxes
              value={otp}
              onChange={(v) => { setOtp(v); if (error) setError(null); }}
              colors={colors}
              disabled={isBusy}
              autoFocus
            />
          </View>

          {/* Error inline */}
          {error && (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 16 }}>
              <Ionicons name="alert-circle" size={15} color={colors.error} />
              <Text style={{ flex: 1, fontSize: 13, fontFamily: FONTS.medium, color: colors.error, lineHeight: 18 }}>
                {error}
              </Text>
            </View>
          )}

          {/* Verify button */}
          <GradientButton
            label="VERIFY & LOGIN"
            icon={otp.length === OTP_LENGTH ? 'checkmark-circle' : undefined}
            iconPosition="right"
            onPress={handleVerifyOtp}
            loading={isBusy}
            disabled={otp.length !== OTP_LENGTH}
            fullWidth
            style={{ marginTop: 36 }}
          />

          {/* Resend */}
          <TouchableOpacity
            style={{ alignItems: 'center', marginTop: 20, paddingVertical: 10, opacity: resendTimer > 0 ? 0.45 : 1 }}
            onPress={handleSendOtp}
            disabled={resendTimer > 0 || isBusy}
          >
            <Text style={{ fontSize: 14, fontFamily: FONTS.medium, color: colors.textMuted, lineHeight: 20 }}>
              {resendTimer > 0 ? (
                <>
                  Resend code in{' '}
                  <Text style={{ color: colors.primary, fontFamily: FONTS.semiBold }}>{resendTimer}s</Text>
                </>
              ) : (
                <>
                  Didn't get the code?{' '}
                  <Text style={{ color: colors.primary, fontFamily: FONTS.semiBold }}>Resend</Text>
                </>
              )}
            </Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  //  MAIN SCREEN — Phone step / Email / Name collection
  // ─────────────────────────────────────────────────────────────────────────
  return (
    <KeyboardAvoidingView
      style={[styles.root, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <StatusBar barStyle="light-content" backgroundColor={colors.background} />
      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          { paddingTop: insets.top + 20, paddingBottom: insets.bottom + 32 },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* ── BRAND HERO ──────────────────────────────────────────────── */}
        <View style={styles.hero}>
          <View style={[styles.badge, { borderColor: `${colors.primary}44` }]}>
            <View style={[styles.badgeDot, { backgroundColor: colors.primary }]} />
            <Text style={[styles.badgeText, { color: colors.primary }]}>
              HYPER-LOCAL SPORTS &amp; FITNESS
            </Text>
          </View>
          <Text style={[styles.brandWord, { color: colors.onSurface }]}>
            ULTIM<Text style={{ color: colors.primary }}>.</Text>
          </Text>
          <Text style={[styles.brandTagline, { color: colors.textMuted }]}>
            One pass. Every court &amp; gym.
          </Text>
        </View>

        {/* ── FEEDBACK BANNERS ─────────────────────────────────────────── */}
        {error && (
          <View style={[styles.banner, styles.bannerError, { borderColor: `${colors.error}55` }]}>
            <Ionicons name="alert-circle" size={16} color={colors.error} />
            <Text style={[styles.bannerText, { color: colors.error }]}>{error}</Text>
          </View>
        )}
        {notice && (
          <View style={[styles.banner, styles.bannerSuccess, { borderColor: '#22c55e55' }]}>
            <Ionicons name="checkmark-circle" size={16} color="#22c55e" />
            <Text style={[styles.bannerText, { color: '#22c55e' }]}>{notice}</Text>
          </View>
        )}

        {/* ── MODE TOGGLE ──────────────────────────────────────────────── */}
        {otpStep !== 'NAME_INPUT' && (
          <View style={[styles.modeRow, { backgroundColor: colors.surfaceContainer, borderColor: colors.border }]}>
            {(['PHONE', 'EMAIL'] as AuthMode[]).map((m) => (
              <TouchableOpacity
                key={m}
                style={[styles.modeBtn, authMode === m && { backgroundColor: colors.primary }]}
                onPress={() => switchMode(m)}
                activeOpacity={0.8}
              >
                <Ionicons
                  name={m === 'PHONE' ? 'call' : 'mail'}
                  size={14}
                  color={authMode === m ? '#fff' : colors.textMuted}
                />
                <Text style={[styles.modeBtnLabel, { color: authMode === m ? '#fff' : colors.textMuted }]}>
                  {m === 'PHONE' ? 'Phone OTP' : 'Email'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* ── FORM CARD ────────────────────────────────────────────────── */}
        <View style={[styles.card, { backgroundColor: colors.surfaceContainer, borderColor: colors.border }]}>

          {/* ═══ PHONE FLOW ═══ */}
          {authMode === 'PHONE' && (
            <>
              {otpStep === 'PHONE_INPUT' && (
                <View>
                  <Text style={[styles.cardTitle, { color: colors.onSurface }]}>Enter your phone</Text>
                  <Text style={[styles.cardSub, { color: colors.textMuted }]}>
                    We'll send a one-time 4-digit code via SMS.
                  </Text>
                  <View style={[styles.inputWrap, inputBorder('phone'), { backgroundColor: colors.surfaceLow }]}>
                    <Ionicons name="call-outline" size={18} color={colors.textMuted} style={styles.inputIcon} />
                    <TextInput
                      style={[styles.input, { color: colors.onSurface, fontFamily: FONTS.regular }]}
                      placeholder="+91 98765 43210"
                      placeholderTextColor={colors.textMuted}
                      keyboardType="phone-pad"
                      value={phone}
                      onChangeText={setPhone}
                      onFocus={() => setFocusedField('phone')}
                      onBlur={() => setFocusedField(null)}
                      editable={!isBusy}
                    />
                  </View>
                  <GradientButton
                    label="SEND OTP"
                    icon="arrow-forward"
                    iconPosition="right"
                    onPress={handleSendOtp}
                    loading={isBusy}
                    fullWidth
                    style={{ marginTop: 18 }}
                  />
                </View>
              )}

              {otpStep === 'NAME_INPUT' && (
                <View>
                  <View style={[styles.welcomeIcon, { backgroundColor: `${colors.primary}18` }]}>
                    <Ionicons name="person-add" size={28} color={colors.primary} />
                  </View>
                  <Text style={[styles.cardTitle, { color: colors.onSurface, textAlign: 'center' }]}>
                    Welcome to ULTIM!
                  </Text>
                  <Text style={[styles.cardSub, { color: colors.textMuted, textAlign: 'center' }]}>
                    What should we call you?
                  </Text>
                  <View style={[styles.inputWrap, inputBorder('name'), { backgroundColor: colors.surfaceLow }]}>
                    <Ionicons name="person-outline" size={18} color={colors.textMuted} style={styles.inputIcon} />
                    <TextInput
                      style={[styles.input, { color: colors.onSurface, fontFamily: FONTS.regular }]}
                      placeholder="Your full name"
                      placeholderTextColor={colors.textMuted}
                      value={otpUserName}
                      onChangeText={setOtpUserName}
                      onFocus={() => setFocusedField('name')}
                      onBlur={() => setFocusedField(null)}
                      autoCapitalize="words"
                      editable={!isBusy}
                      autoFocus
                    />
                  </View>
                  <GradientButton
                    label="LET'S GO"
                    icon="rocket"
                    iconPosition="right"
                    onPress={handleSaveName}
                    loading={isBusy}
                    fullWidth
                    style={{ marginTop: 18 }}
                  />
                </View>
              )}
            </>
          )}

          {/* ═══ EMAIL FLOW ═══ */}
          {authMode === 'EMAIL' && (
            <View>
              <View style={[styles.subTabRow, { borderBottomColor: colors.border }]}>
                {(['LOGIN', 'REGISTER'] as EmailSubTab[]).map((t) => (
                  <TouchableOpacity
                    key={t}
                    style={[
                      styles.subTab,
                      emailSubTab === t && { borderBottomColor: colors.primary, borderBottomWidth: 2 },
                    ]}
                    onPress={() => { setEmailSubTab(t); clear(); }}
                  >
                    <Text style={[styles.subTabText, { color: emailSubTab === t ? colors.primary : colors.textMuted }]}>
                      {t === 'LOGIN' ? 'Log In' : 'Create Account'}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {emailSubTab === 'LOGIN' && (
                <View style={{ marginTop: 20 }}>
                  <View style={[styles.inputWrap, inputBorder('email'), { backgroundColor: colors.surfaceLow }]}>
                    <Ionicons name="mail-outline" size={18} color={colors.textMuted} style={styles.inputIcon} />
                    <TextInput
                      style={[styles.input, { color: colors.onSurface, fontFamily: FONTS.regular }]}
                      placeholder="Email address"
                      placeholderTextColor={colors.textMuted}
                      keyboardType="email-address"
                      autoCapitalize="none"
                      value={email}
                      onChangeText={setEmail}
                      onFocus={() => setFocusedField('email')}
                      onBlur={() => setFocusedField(null)}
                      editable={!isBusy}
                    />
                  </View>
                  <View style={[styles.inputWrap, inputBorder('pass'), { backgroundColor: colors.surfaceLow, marginTop: 12 }]}>
                    <Ionicons name="lock-closed-outline" size={18} color={colors.textMuted} style={styles.inputIcon} />
                    <TextInput
                      style={[styles.input, { color: colors.onSurface, fontFamily: FONTS.regular }]}
                      placeholder="Password"
                      placeholderTextColor={colors.textMuted}
                      secureTextEntry={!showPassword}
                      value={password}
                      onChangeText={setPassword}
                      onFocus={() => setFocusedField('pass')}
                      onBlur={() => setFocusedField(null)}
                      editable={!isBusy}
                    />
                    <TouchableOpacity onPress={() => setShowPassword((p) => !p)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                      <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={18} color={colors.textMuted} />
                    </TouchableOpacity>
                  </View>
                  <GradientButton
                    label="LOG IN"
                    icon="arrow-forward"
                    iconPosition="right"
                    onPress={handleEmailLogin}
                    loading={isBusy}
                    fullWidth
                    style={{ marginTop: 18 }}
                  />
                  <TouchableOpacity style={styles.ghostBtn} onPress={() => { setEmailSubTab('REGISTER'); clear(); }}>
                    <Text style={[styles.ghostBtnText, { color: colors.textMuted }]}>
                      Don't have an account?{' '}
                      <Text style={{ color: colors.primary, fontFamily: FONTS.semiBold }}>Sign up</Text>
                    </Text>
                  </TouchableOpacity>
                </View>
              )}

              {emailSubTab === 'REGISTER' && (
                <View style={{ marginTop: 20 }}>
                  <View style={[styles.inputWrap, inputBorder('rname'), { backgroundColor: colors.surfaceLow }]}>
                    <Ionicons name="person-outline" size={18} color={colors.textMuted} style={styles.inputIcon} />
                    <TextInput
                      style={[styles.input, { color: colors.onSurface, fontFamily: FONTS.regular }]}
                      placeholder="Full name"
                      placeholderTextColor={colors.textMuted}
                      value={regFullName}
                      onChangeText={setRegFullName}
                      onFocus={() => setFocusedField('rname')}
                      onBlur={() => setFocusedField(null)}
                      autoCapitalize="words"
                      editable={!isBusy}
                    />
                  </View>
                  <View style={[styles.inputWrap, inputBorder('remail'), { backgroundColor: colors.surfaceLow, marginTop: 12 }]}>
                    <Ionicons name="mail-outline" size={18} color={colors.textMuted} style={styles.inputIcon} />
                    <TextInput
                      style={[styles.input, { color: colors.onSurface, fontFamily: FONTS.regular }]}
                      placeholder="Email address"
                      placeholderTextColor={colors.textMuted}
                      keyboardType="email-address"
                      autoCapitalize="none"
                      value={email}
                      onChangeText={setEmail}
                      onFocus={() => setFocusedField('remail')}
                      onBlur={() => setFocusedField(null)}
                      editable={!isBusy}
                    />
                  </View>
                  <View style={[styles.inputWrap, inputBorder('rpass'), { backgroundColor: colors.surfaceLow, marginTop: 12 }]}>
                    <Ionicons name="lock-closed-outline" size={18} color={colors.textMuted} style={styles.inputIcon} />
                    <TextInput
                      style={[styles.input, { color: colors.onSurface, fontFamily: FONTS.regular }]}
                      placeholder="Password (min. 8 characters)"
                      placeholderTextColor={colors.textMuted}
                      secureTextEntry={!showPassword}
                      value={password}
                      onChangeText={setPassword}
                      onFocus={() => setFocusedField('rpass')}
                      onBlur={() => setFocusedField(null)}
                      editable={!isBusy}
                    />
                    <TouchableOpacity onPress={() => setShowPassword((p) => !p)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                      <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={18} color={colors.textMuted} />
                    </TouchableOpacity>
                  </View>
                  <GradientButton
                    label="CREATE ACCOUNT"
                    icon="arrow-forward"
                    iconPosition="right"
                    onPress={handleEmailRegister}
                    loading={isBusy}
                    fullWidth
                    style={{ marginTop: 18 }}
                  />
                  <TouchableOpacity style={styles.ghostBtn} onPress={() => { setEmailSubTab('LOGIN'); clear(); }}>
                    <Text style={[styles.ghostBtnText, { color: colors.textMuted }]}>
                      Already have an account?{' '}
                      <Text style={{ color: colors.primary, fontFamily: FONTS.semiBold }}>Log in</Text>
                    </Text>
                  </TouchableOpacity>
                  <View style={[styles.legalNote, { borderTopColor: colors.border }]}>
                    <Text style={[styles.legalText, { color: colors.textMuted }]}>
                      You'll receive a verification email. Verify before logging in.
                    </Text>
                  </View>
                </View>
              )}
            </View>
          )}
        </View>

        {/* Footer */}
        <View style={styles.dividerRow}>
          <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
          <Text style={[styles.dividerText, { color: colors.textMuted }]}>ULTIM © 2025</Text>
          <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { paddingHorizontal: SPACING.containerPadding, flexGrow: 1 },
  hiddenInput: {
    position: 'absolute',
    opacity: 0,
    width: 1,
    height: 1,
    pointerEvents: 'none',
  },
  // ── Brand Hero
  hero: { alignItems: 'center', marginBottom: 28 },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: RADIUS.full,
    paddingHorizontal: 12,
    paddingVertical: 5,
    marginBottom: 14,
    gap: 6,
  },
  badgeDot: { width: 6, height: 6, borderRadius: 3 },
  badgeText: { fontSize: 10, fontFamily: FONTS.bold, letterSpacing: 0.5 },
  brandWord: { fontSize: 54, fontFamily: FONTS.black, letterSpacing: 2, lineHeight: 60 },
  brandTagline: { fontSize: 14, fontFamily: FONTS.regular, marginTop: 6, textAlign: 'center', lineHeight: 20 },
  // ── Banners
  banner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    borderWidth: 1,
    borderRadius: RADIUS.lg,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 14,
  },
  bannerError: { backgroundColor: 'rgba(239,68,68,0.08)' },
  bannerSuccess: { backgroundColor: 'rgba(34,197,94,0.08)' },
  bannerText: { flex: 1, fontSize: 13, fontFamily: FONTS.medium, lineHeight: 19 },
  // ── Mode toggle
  modeRow: {
    flexDirection: 'row',
    borderRadius: RADIUS.full,
    borderWidth: 1,
    padding: 4,
    marginBottom: 16,
  },
  modeBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: RADIUS.full,
    gap: 7,
  },
  modeBtnLabel: { fontSize: 13, fontFamily: FONTS.semiBold, letterSpacing: 0.2 },
  // ── Card
  card: { borderRadius: 20, borderWidth: 1, padding: 24, marginBottom: 20 },
  cardTitle: { fontSize: 22, fontFamily: FONTS.bold, letterSpacing: -0.3, marginBottom: 6, lineHeight: 28 },
  cardSub: { fontSize: 14, fontFamily: FONTS.regular, lineHeight: 20, marginBottom: 20 },
  // ── Welcome icon
  welcomeIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginBottom: 16,
  },
  // ── Inputs
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: RADIUS.md,
    paddingHorizontal: 14,
    height: 52,
  },
  inputIcon: { marginRight: 10 },
  input: { flex: 1, fontSize: 15, height: '100%' },
  // ── Buttons
  ghostBtn: { alignItems: 'center', justifyContent: 'center', paddingVertical: 14, marginTop: 4 },
  ghostBtnText: { fontSize: 13, fontFamily: FONTS.regular, lineHeight: 19 },
  // ── Sub-tabs
  subTabRow: { flexDirection: 'row', borderBottomWidth: 1, marginBottom: 4 },
  subTab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
    marginBottom: -1,
  },
  subTabText: { fontSize: 14, fontFamily: FONTS.semiBold },
  // ── Legal
  legalNote: { borderTopWidth: 1, marginTop: 20, paddingTop: 14 },
  legalText: { fontSize: 12, fontFamily: FONTS.regular, lineHeight: 18, textAlign: 'center' },
  // ── Footer divider
  dividerRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 8 },
  dividerLine: { flex: 1, height: 1 },
  dividerText: { fontSize: 11, fontFamily: FONTS.medium, letterSpacing: 0.5 },
});
