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
import { Colors } from '../constants/colors';
import { useAuth } from '../context/AuthContext';
import { validateEmail, validatePassword } from '../utils/validators';
import { showStandardError, STANDARD_ERROR_MESSAGES } from '../utils/errorHandler';
import { useThrottle } from '../hooks/useDebounce';
import { sanitizeEmail, sanitizeString } from '../utils/sanitize';
import logger from '../utils/logger';

const LoginScreen = ({ navigation, onAuthSuccess }) => {
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
        await signup(sanitizedEmail, sanitizedPassword, sanitizedName, parseInt(sanitizedAge), gender);
      }
      // Call success callback if provided
      if (onAuthSuccess) {
        onAuthSuccess();
      }
    } catch (error) {
      logger.error('Authentication error:', error);
      showStandardError(error, isLogin ? 'login' : 'signup', isLogin ? 'Sign In Failed' : 'Sign Up Failed');
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
      colors={[Colors.primary, Colors.primaryDark, Colors.gradient.pink[0]]}
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
              accessibilityHint={isLogin ? 'Tap to sign in with your email and password' : 'Tap to create a new account'}
              accessibilityRole="button"
              accessibilityState={{ disabled: loading || isAuthPending }}
            >
              <LinearGradient
                colors={loading ? Colors.gradient.disabled || ['#999', '#777'] : Colors.gradient.primary}
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
                  <Text style={styles.primaryButtonText}>
                    {isLogin ? 'Sign In' : 'Sign Up'}
                  </Text>
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
                  style={[styles.googleButton, (loading || isGooglePending) && styles.buttonDisabled]}
                  onPress={handleGoogleSignIn}
                  activeOpacity={0.8}
                  disabled={loading || isGooglePending}
                >
                  {(loading || isGooglePending) ? (
                    <View style={styles.loadingContainer}>
                      <ActivityIndicator size="small" color={Colors.text.tertiary} />
                      <Text style={[styles.googleButtonText, styles.textDisabled]}>Please wait...</Text>
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
                onPress={() => navigation.navigate('ForgotPassword')}
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
              <TouchableOpacity onPress={() => navigation.navigate('TermsOfService')}>
                <Text style={styles.legalLinkText}>Terms of Service</Text>
              </TouchableOpacity>
              <Text style={styles.legalLinkSeparator}> • </Text>
              <TouchableOpacity onPress={() => navigation.navigate('PrivacyPolicy')}>
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
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
    marginTop: 20,
  },
  logoContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: Colors.text.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  title: {
    fontSize: 38,
    fontWeight: '800',
    color: Colors.background.white,
    marginBottom: 10,
    textAlign: 'center',
    textShadow: '0px 2px 4px rgba(0, 0, 0, 0.3)',
  },
  subtitle: {
    fontSize: 16,
    color: Colors.text.white90,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  formContainer: {
    backgroundColor: Colors.background.white95,
    borderRadius: 25,
    padding: 25,
    shadowColor: Colors.text.primary,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 10,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background.lightest,
    borderRadius: 15,
    marginBottom: 15,
    paddingHorizontal: 15,
    borderWidth: 1,
    borderColor: Colors.border.gray,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    paddingVertical: 15,
    fontSize: 16,
    color: Colors.text.dark,
  },
  eyeIcon: {
    padding: 5,
  },
  primaryButton: {
    borderRadius: 15,
    marginTop: 10,
    marginBottom: 20,
    overflow: 'hidden',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  buttonGradient: {
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonText: {
    color: Colors.background.white,
    fontSize: 18,
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
    marginHorizontal: 15,
    color: Colors.text.tertiary,
    fontSize: 14,
    fontWeight: '600',
  },
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.background.white,
    borderWidth: 2,
    borderColor: Colors.border.gray,
    borderRadius: 15,
    paddingVertical: 15,
    marginBottom: 15,
    shadowColor: Colors.text.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  googleButtonText: {
    color: Colors.text.dark,
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 10,
  },
  forgotPasswordButton: {
    marginTop: 15,
    alignItems: 'center',
    paddingVertical: 10,
  },
  forgotPasswordText: {
    color: Colors.primary,
    fontSize: 15,
    fontWeight: '600',
  },
  switchButton: {
    marginTop: 10,
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
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: Colors.background.lightest,
    borderWidth: 1,
    borderColor: Colors.border.gray,
    alignItems: 'center',
  },
  genderButtonActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
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
    opacity: 0.7,
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
    marginTop: 20,
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
