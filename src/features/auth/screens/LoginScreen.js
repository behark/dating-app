/* eslint-disable sonarjs/cognitive-complexity */
import Ionicons from '@expo/vector-icons/Ionicons';
import { LinearGradient } from 'expo-linear-gradient';
import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Colors } from '../../../constants/colors';
import { useAuth } from '../../../context/AuthContext';
import { validateEmail, validatePassword } from '../../../utils/validators';
import { showStandardError, STANDARD_ERROR_MESSAGES } from '../../../utils/errorHandler';
import { useThrottle } from '../../../hooks/useDebounce';
import { sanitizeEmail, sanitizeString } from '../../../utils/sanitize';
import logger from '../../../utils/logger';

const LoginScreen = ({ navigation, onAuthSuccess, isModal }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState('');
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login, signup, signInWithGoogle, isGoogleSignInConfigured } = useAuth();

  // Throttle auth calls to prevent rapid submissions
  const { execute: executeAuth, isPending: isAuthPending } = useThrottle(async () => {
    if (loading || isAuthPending) return;

    // Sanitize inputs
    const sanitizedEmail = sanitizeEmail(email);
    const sanitizedPassword = sanitizeString(password, { escapeHtml: false }); // Don't escape password
    const sanitizedName = isLogin ? null : sanitizeString(name);
    const sanitizedAge = isLogin ? null : age;

    // Input validation
    if (!sanitizedEmail || !sanitizedPassword) {
      showStandardError(STANDARD_ERROR_MESSAGES.REQUIRED_FIELD, 'validation');
      return;
    }

    // Additional validation for signup
    if (!isLogin) {
      if (!sanitizedName || !sanitizedAge || !gender) {
        showStandardError('Please fill in all required fields (name, age, gender)', 'validation');
        return;
      }

      const ageNum = parseInt(sanitizedAge);
      if (isNaN(ageNum) || ageNum < 18 || ageNum > 100) {
        showStandardError('Please enter a valid age between 18 and 100', 'validation');
        return;
      }
    }

    if (!validateEmail(sanitizedEmail)) {
      showStandardError('Please enter a valid email address', 'validation');
      return;
    }

    if (!isLogin && !validatePassword(sanitizedPassword, { minLength: 8 })) {
      showStandardError('Password must be at least 8 characters long', 'validation');
      return;
    }

    setLoading(true);
    try {
      if (isLogin) {
        await login(sanitizedEmail, sanitizedPassword);
      } else {
        await signup(
          sanitizedEmail,
          sanitizedPassword,
          sanitizedName,
          parseInt(sanitizedAge),
          gender
        );
      }
      // Call success callback if provided
      if (onAuthSuccess) {
        onAuthSuccess();
      }
    } catch (error) {
      logger.error('Authentication error:', error);
      showStandardError(
        error,
        isLogin ? 'login' : 'signup',
        isLogin ? 'Sign In Failed' : 'Sign Up Failed'
      );
    } finally {
      setLoading(false);
    }
  }, 500);

  const handleAuth = () => {
    executeAuth();
  };

  // Throttle Google sign-in to prevent rapid clicks
  const { execute: executeGoogleSignIn, isPending: isGooglePending } = useThrottle(async () => {
    if (loading || isGooglePending) return;

    setLoading(true);
    try {
      await signInWithGoogle();
      // Call success callback if provided
      if (onAuthSuccess) {
        onAuthSuccess();
      }
    } catch (error) {
      logger.error('Google sign-in error:', error);
      showStandardError(error, 'login', 'Google Sign-In Failed');
    } finally {
      setLoading(false);
    }
  }, 500);

  const handleGoogleSignIn = () => {
    executeGoogleSignIn();
  };

  return (
    <LinearGradient
      colors={[Colors.primary, '#8B5CF6', Colors.gradient.pink[0]]}
      style={styles.container}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <View style={styles.logoContainer}>
              <Ionicons name="heart" size={60} color={Colors.background.white} />
            </View>
            <Text style={styles.title}>{isLogin ? 'Welcome Back' : 'Join Us'}</Text>
            <Text style={styles.subtitle}>
              {isLogin ? 'Sign in to find your perfect match' : 'Create an account to get started'}
            </Text>
          </View>

          <View style={styles.formContainer}>
            {!isLogin && (
              <>
                <View style={styles.inputContainer}>
                  <Ionicons
                    name="person-outline"
                    size={20}
                    color={Colors.primary}
                    style={styles.inputIcon}
                  />
                  <TextInput
                    style={styles.input}
                    placeholder="Name"
                    placeholderTextColor={Colors.text.tertiary}
                    value={name}
                    onChangeText={setName}
                    autoCapitalize="words"
                  />
                </View>

                <View style={styles.inputContainer}>
                  <Ionicons
                    name="calendar-outline"
                    size={20}
                    color={Colors.primary}
                    style={styles.inputIcon}
                  />
                  <TextInput
                    style={styles.input}
                    placeholder="Age"
                    placeholderTextColor={Colors.text.tertiary}
                    value={age}
                    onChangeText={setAge}
                    keyboardType="number-pad"
                    maxLength={2}
                  />
                </View>

                <View style={styles.inputContainer}>
                  <Ionicons
                    name="male-female-outline"
                    size={20}
                    color={Colors.primary}
                    style={styles.inputIcon}
                  />
                  <View style={styles.genderContainer}>
                    <TouchableOpacity
                      style={[styles.genderButton, gender === 'male' && styles.genderButtonActive]}
                      onPress={() => setGender('male')}
                      accessibilityLabel="Male"
                      accessibilityRole="radio"
                      accessibilityState={{ selected: gender === 'male' }}
                    >
                      <Text
                        style={[styles.genderText, gender === 'male' && styles.genderTextActive]}
                      >
                        Male
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[
                        styles.genderButton,
                        gender === 'female' && styles.genderButtonActive,
                      ]}
                      onPress={() => setGender('female')}
                      accessibilityLabel="Female"
                      accessibilityRole="radio"
                      accessibilityState={{ selected: gender === 'female' }}
                    >
                      <Text
                        style={[styles.genderText, gender === 'female' && styles.genderTextActive]}
                      >
                        Female
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.genderButton, gender === 'other' && styles.genderButtonActive]}
                      onPress={() => setGender('other')}
                      accessibilityLabel="Other"
                      accessibilityRole="radio"
                      accessibilityState={{ selected: gender === 'other' }}
                    >
                      <Text
                        style={[styles.genderText, gender === 'other' && styles.genderTextActive]}
                      >
                        Other
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </>
            )}

            <View style={styles.inputContainer}>
              <Ionicons
                name="mail-outline"
                size={20}
                color={Colors.primary}
                style={styles.inputIcon}
              />
              <TextInput
                style={styles.input}
                placeholder="Email"
                placeholderTextColor={Colors.text.tertiary}
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
                autoComplete="email"
                accessibilityLabel="Email address input"
                accessibilityHint="Enter your email address to sign in"
                accessibilityRole="textbox"
                // Web: form input association
                nativeID="auth-email-input"
              />
            </View>

            <View style={styles.inputContainer}>
              <Ionicons
                name="lock-closed-outline"
                size={20}
                color={Colors.primary}
                style={styles.inputIcon}
              />
              <TextInput
                style={styles.input}
                placeholder="Password"
                placeholderTextColor={Colors.text.tertiary}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                autoComplete="password"
                accessibilityLabel="Password input"
                accessibilityHint="Enter your password"
                accessibilityRole="textbox"
                // Web: associate with form for accessibility
                nativeID="auth-password-input"
              />
              <TouchableOpacity
                onPress={() => setShowPassword(!showPassword)}
                style={styles.eyeIcon}
                accessibilityLabel={showPassword ? 'Hide password' : 'Show password'}
                accessibilityHint="Tap to toggle password visibility"
                accessibilityRole="button"
              >
                <Ionicons
                  name={showPassword ? 'eye-outline' : 'eye-off-outline'}
                  size={20}
                  color={Colors.text.tertiary}
                />
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={[styles.primaryButton, (loading || isAuthPending) && styles.buttonDisabled]}
              onPress={handleAuth}
              activeOpacity={0.8}
              disabled={loading || isAuthPending}
              accessibilityLabel={isLogin ? 'Sign in button' : 'Sign up button'}
              accessibilityHint={
                isLogin
                  ? 'Tap to sign in with your email and password'
                  : 'Tap to create a new account'
              }
              accessibilityRole="button"
              accessibilityState={{ disabled: loading || isAuthPending }}
            >
              <LinearGradient
                colors={
                  loading ? Colors.gradient.disabled || ['#999', '#777'] : Colors.gradient.primary
                }
                style={styles.buttonGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                {loading ? (
                  <View style={styles.loadingContainer}>
                    <ActivityIndicator size="small" color={Colors.background.white} />
                    <Text style={styles.primaryButtonText}>Please wait...</Text>
                  </View>
                ) : (
                  <Text style={styles.primaryButtonText}>{isLogin ? 'Sign In' : 'Sign Up'}</Text>
                )}
              </LinearGradient>
            </TouchableOpacity>

            {isGoogleSignInConfigured && (
              <>
                <View style={styles.divider}>
                  <View style={styles.dividerLine} />
                  <Text style={styles.dividerText}>OR</Text>
                  <View style={styles.dividerLine} />
                </View>

                <TouchableOpacity
                  style={[
                    styles.googleButton,
                    (loading || isGooglePending) && styles.buttonDisabled,
                  ]}
                  onPress={handleGoogleSignIn}
                  activeOpacity={0.8}
                  disabled={loading || isGooglePending}
                >
                  {loading || isGooglePending ? (
                    <View style={styles.loadingContainer}>
                      <ActivityIndicator size="small" color={Colors.text.tertiary} />
                      <Text style={[styles.googleButtonText, styles.textDisabled]}>
                        Please wait...
                      </Text>
                    </View>
                  ) : (
                    <>
                      <Ionicons name="logo-google" size={20} color={Colors.brand.google} />
                      <Text style={styles.googleButtonText}>Continue with Google</Text>
                    </>
                  )}
                </TouchableOpacity>
              </>
            )}

            {isLogin && (
              <TouchableOpacity
                onPress={() => {
                  if (isModal && onAuthSuccess) {
                    onAuthSuccess(); // close modal first
                  }
                  navigation.navigate('ForgotPassword');
                }}
                style={styles.forgotPasswordButton}
              >
                <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity onPress={() => setIsLogin(!isLogin)} style={styles.switchButton}>
              <Text style={styles.switchText}>
                {isLogin ? "Don't have an account? " : 'Already have an account? '}
                <Text style={styles.switchTextBold}>{isLogin ? 'Sign Up' : 'Sign In'}</Text>
              </Text>
            </TouchableOpacity>

            <View style={styles.legalLinks}>
              <TouchableOpacity
                onPress={() => {
                  if (isModal && onAuthSuccess) {
                    onAuthSuccess(); // close modal first
                  }
                  navigation.navigate('TermsOfService');
                }}
              >
                <Text style={styles.legalLinkText}>Terms of Service</Text>
              </TouchableOpacity>
              <Text style={styles.legalLinkSeparator}> • </Text>
              <TouchableOpacity
                onPress={() => {
                  if (isModal && onAuthSuccess) {
                    onAuthSuccess(); // close modal first
                  }
                  navigation.navigate('PrivacyPolicy');
                }}
              >
                <Text style={styles.legalLinkText}>Privacy Policy</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
    paddingTop: 60,
  },
  header: {
    alignItems: 'center',
    marginBottom: 36,
    marginTop: 20,
  },
  logoContainer: {
    width: 90,
    height: 90,
    borderRadius: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
  },
  title: {
    fontSize: 34,
    fontWeight: '800',
    color: Colors.background.white,
    marginBottom: 8,
    textAlign: 'center',
    letterSpacing: -0.5,
    ...Platform.select({
      web: { textShadow: '0px 2px 8px rgba(0, 0, 0, 0.2)' },
      default: {
        textShadowColor: 'rgba(0, 0, 0, 0.2)',
        textShadowOffset: { width: 0, height: 2 },
        textShadowRadius: 8,
      },
    }),
  },
  subtitle: {
    fontSize: 15,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    paddingHorizontal: 20,
    lineHeight: 22,
    letterSpacing: 0.1,
  },
  formContainer: {
    backgroundColor: Colors.background.white95,
    borderRadius: 28,
    padding: 24,
    shadowColor: '#1A1A2E',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.12,
    shadowRadius: 32,
    elevation: 12,
    ...Platform.select({
      web: {
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
      },
      default: {},
    }),
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background.lightest,
    borderRadius: 14,
    marginBottom: 14,
    paddingHorizontal: 16,
    borderWidth: 1.5,
    borderColor: Colors.border.gray,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    paddingVertical: 16,
    fontSize: 16,
    color: Colors.text.dark,
    letterSpacing: 0.1,
  },
  eyeIcon: {
    padding: 8,
  },
  primaryButton: {
    borderRadius: 14,
    marginTop: 10,
    marginBottom: 20,
    overflow: 'hidden',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 10,
  },
  buttonGradient: {
    paddingVertical: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonText: {
    color: Colors.background.white,
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.border.gray,
  },
  dividerText: {
    marginHorizontal: 16,
    color: Colors.text.tertiary,
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 1,
  },
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.background.white,
    borderWidth: 1.5,
    borderColor: Colors.border.gray,
    borderRadius: 14,
    paddingVertical: 15,
    marginBottom: 15,
    shadowColor: '#1A1A2E',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  googleButtonText: {
    color: Colors.text.dark,
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 10,
  },
  forgotPasswordButton: {
    marginTop: 16,
    alignItems: 'center',
    paddingVertical: 10,
  },
  forgotPasswordText: {
    color: Colors.primary,
    fontSize: 14,
    fontWeight: '600',
  },
  switchButton: {
    marginTop: 8,
    alignItems: 'center',
    paddingVertical: 10,
  },
  switchText: {
    color: Colors.text.secondary,
    fontSize: 15,
  },
  switchTextBold: {
    color: Colors.primary,
    fontWeight: '700',
  },
  genderContainer: {
    flex: 1,
    flexDirection: 'row',
    gap: 8,
  },
  genderButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: Colors.background.lightest,
    borderWidth: 1.5,
    borderColor: Colors.border.gray,
    alignItems: 'center',
  },
  genderButtonActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  genderText: {
    fontSize: 14,
    color: Colors.text.secondary,
    fontWeight: '600',
  },
  genderTextActive: {
    color: Colors.background.white,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  textDisabled: {
    color: Colors.text.tertiary,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  legalLinks: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 24,
    paddingVertical: 10,
  },
  legalLinkText: {
    fontSize: 12,
    color: Colors.primary,
    fontWeight: '500',
  },
  legalLinkSeparator: {
    fontSize: 12,
    color: Colors.text.tertiary,
    marginHorizontal: 8,
  },
});

export default LoginScreen;
