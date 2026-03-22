/* eslint-disable sonarjs/no-duplicate-string */
import { useEffect, useState } from 'react';
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
import { LocationService } from '../../../services/LocationService';
import { validateEmail } from '../../../utils/validators';
import { showStandardError, STANDARD_ERROR_MESSAGES } from '../../../utils/errorHandler';
import { useThrottle } from '../../../hooks/useDebounce';
import { sanitizeEmail, sanitizeString } from '../../../utils/sanitize';
import logger from '../../../utils/logger';

export const RegisterScreen = ({ navigation }) => {
  const { signup } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [location, setLocation] = useState(null);
  const [locationLoading, setLocationLoading] = useState(false);
  const [locationError, setLocationError] = useState(null);

  // Request location permission and get current location on mount
  useEffect(() => {
    const getLocation = async () => {
      try {
        setLocationLoading(true);
        setLocationError(null);
        const currentLocation = await LocationService.getCurrentLocation();
        if (currentLocation) {
          setLocation(currentLocation);
        } else {
          setLocationError('Location permission denied or unavailable');
        }
      } catch (error) {
        logger.error('Error getting location during registration:', error);
        setLocationError('Failed to get location. Please enable location services.');
      } finally {
        setLocationLoading(false);
      }
    };

    getLocation();
  }, []);

  // Throttle registration to prevent rapid submissions
  const { execute: executeRegister, isPending: isRegisterPending } = useThrottle(async () => {
    if (loading || isRegisterPending) return;

    try {
      // Sanitize inputs
      const sanitizedEmail = sanitizeEmail(email);
      const sanitizedPassword = sanitizeString(password, { escapeHtml: false }); // Don't escape password
      const sanitizedConfirmPassword = sanitizeString(confirmPassword, { escapeHtml: false });
      const sanitizedName = sanitizeString(name);

      // Validation
      if (!sanitizedEmail) {
        showStandardError('Email is required', 'validation');
        return;
      }

      if (!validateEmail(sanitizedEmail)) {
        showStandardError('Please enter a valid email address', 'validation');
        return;
      }

      if (!sanitizedPassword) {
        showStandardError('Password is required', 'validation');
        return;
      }

      if (sanitizedPassword.length < 8) {
        showStandardError('Password must be at least 8 characters long', 'validation');
        return;
      }

      if (sanitizedPassword !== sanitizedConfirmPassword) {
        showStandardError('Passwords do not match. Please try again.', 'validation');
        return;
      }

      if (!sanitizedName) {
        showStandardError('Name is required', 'validation');
        return;
      }

      // CRITICAL FIX: Location is now optional - allow signup without location
      // Backend will use default location if not provided
      if (!location) {
        Alert.alert(
          'Location Not Available',
          "We couldn't access your location. You can still sign up, but we recommend enabling location services later to find matches nearby. Would you like to continue?",
          [
            {
              text: 'Cancel',
              style: 'cancel',
            },
            {
              text: 'Continue Without Location',
              onPress: async () => {
                // Continue with signup - location will be null, backend will use default
                try {
                  setLoading(true);
                  await signup(
                    sanitizedEmail,
                    sanitizedPassword,
                    sanitizedName,
                    parseInt(age),
                    gender,
                    null
                  );
                } catch (error) {
                  logger.error('Signup error:', error);
                  showStandardError(error, 'signup', 'Sign Up Failed');
                } finally {
                  setLoading(false);
                }
              },
            },
            {
              text: 'Retry Location',
              onPress: async () => {
                try {
                  setLocationLoading(true);
                  setLocationError(null);
                  const currentLocation = await LocationService.getCurrentLocation();
                  if (currentLocation) {
                    setLocation(currentLocation);
                  }
                } catch (error) {
                  logger.error('Error retrying location:', error);
                  setLocationError('Failed to get location. Please enable location services.');
                } finally {
                  setLocationLoading(false);
                }
              },
            },
          ]
        );
        return;
      }

      setLoading(true);

      // Format location as required by backend: { type: 'Point', coordinates: [longitude, latitude] }
      const locationData = {
        type: 'Point',
        coordinates: [location.longitude, location.latitude],
      };

      const result = await signup(
        sanitizedEmail,
        sanitizedPassword,
        sanitizedName,
        age ? parseInt(age) : null,
        gender,
        locationData
      );

      if (result) {
        Alert.alert('Success', 'Account created! Please verify your email address.', [
          {
            text: 'OK',
            onPress: () => navigation.navigate('VerifyEmail'),
          },
        ]);
      }
    } catch (error) {
      showStandardError(error, 'signup', 'Registration Failed');
    } finally {
      setLoading(false);
    }
  });

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Create Account</Text>
          <Text style={styles.subtitle}>Find your perfect match</Text>
        </View>

        {/* Form */}
        <View style={styles.form}>
          {/* Email */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Email *</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter your email"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              editable={!loading}
            />
          </View>

          {/* Name */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Full Name *</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter your full name"
              value={name}
              onChangeText={setName}
              editable={!loading}
            />
          </View>

          {/* Age and Gender Row */}
          <View style={styles.rowInputs}>
            <View style={[styles.inputGroup, styles.flexInput]}>
              <Text style={styles.label}>Age</Text>
              <TextInput
                style={styles.input}
                placeholder="Age"
                value={age}
                onChangeText={setAge}
                keyboardType="numeric"
                editable={!loading}
              />
            </View>

            <View style={[styles.inputGroup, styles.flexInput]}>
              <Text style={styles.label}>Gender</Text>
              <View style={styles.genderPicker}>
                {['Male', 'Female', 'Other'].map((g) => (
                  <TouchableOpacity
                    key={g}
                    style={[
                      styles.genderOption,
                      gender === g.toLowerCase() && styles.genderOptionActive,
                    ]}
                    onPress={() => setGender(g.toLowerCase())}
                    disabled={loading}
                  >
                    <Text
                      style={[
                        styles.genderOptionText,
                        gender === g.toLowerCase() && styles.genderOptionTextActive,
                      ]}
                    >
                      {g[0]}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>

          {/* Password */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Password *</Text>
            <View style={styles.passwordInput}>
              <TextInput
                style={styles.passwordField}
                placeholder="Enter your password"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                editable={!loading}
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                <Text style={styles.passwordToggle}>{showPassword ? '👁️' : '👁️‍🗨️'}</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.helperText}>Minimum 8 characters</Text>
          </View>

          {/* Confirm Password */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Confirm Password *</Text>
            <View style={styles.passwordInput}>
              <TextInput
                style={styles.passwordField}
                placeholder="Confirm your password"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry={!showPassword}
                editable={!loading}
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                <Text style={styles.passwordToggle}>{showPassword ? '👁️' : '👁️‍🗨️'}</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Location Status */}
          {locationLoading && (
            <View style={styles.locationStatus}>
              <ActivityIndicator size="small" color={Colors.accent.red} />
              <Text style={styles.locationStatusText}>Getting your location...</Text>
            </View>
          )}
          {locationError && !locationLoading && (
            <View style={styles.locationError}>
              <Text style={styles.locationErrorText}>⚠️ {locationError}</Text>
              <TouchableOpacity
                onPress={async () => {
                  try {
                    setLocationLoading(true);
                    setLocationError(null);
                    const currentLocation = await LocationService.getCurrentLocation();
                    if (currentLocation) {
                      setLocation(currentLocation);
                    } else {
                      setLocationError('Location permission denied or unavailable');
                    }
                  } catch (error) {
                    logger.error('Error retrying location:', error);
                    setLocationError('Failed to get location. Please enable location services.');
                  } finally {
                    setLocationLoading(false);
                  }
                }}
                style={styles.retryButton}
              >
                <Text style={styles.retryButtonText}>Retry</Text>
              </TouchableOpacity>
            </View>
          )}
          {location && !locationLoading && (
            <View style={styles.locationSuccess}>
              <Text style={styles.locationSuccessText}>✓ Location ready</Text>
            </View>
          )}

          {/* Register Button */}
          <TouchableOpacity
            style={[
              styles.registerBtn,
              (loading || locationLoading || !location) && styles.registerBtnDisabled,
            ]}
            onPress={executeRegister}
            disabled={loading || locationLoading || !location}
          >
            {loading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text style={styles.registerBtnText}>Create Account</Text>
            )}
          </TouchableOpacity>

          {/* Login Link */}
          <View style={styles.loginLink}>
            <Text style={styles.loginLinkText}>Already have an account? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Login')} disabled={loading}>
              <Text style={styles.loginLinkButton}>Sign In</Text>
            </TouchableOpacity>
          </View>

          {/* Legal Links */}
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
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFBFF',
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 40,
  },
  header: {
    marginBottom: 28,
  },
  title: {
    fontSize: 30,
    fontWeight: '800',
    color: Colors.text.dark,
    marginBottom: 6,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 15,
    color: Colors.text.secondary,
    letterSpacing: 0.1,
  },
  form: {
    flex: 1,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 8,
    color: Colors.text.dark,
    letterSpacing: 0.2,
  },
  input: {
    borderWidth: 1.5,
    borderColor: '#E8EAF6',
    borderRadius: 14,
    padding: 14,
    fontSize: 15,
    color: Colors.text.dark,
    backgroundColor: '#F5F6FF',
  },
  rowInputs: {
    flexDirection: 'row',
    gap: 12,
  },
  flexInput: {
    flex: 1,
  },
  genderPicker: {
    flexDirection: 'row',
    gap: 8,
  },
  genderOption: {
    flex: 1,
    paddingVertical: 11,
    borderWidth: 1.5,
    borderColor: '#E8EAF6',
    borderRadius: 12,
    alignItems: 'center',
    backgroundColor: '#F5F6FF',
  },
  genderOptionActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  genderOptionText: {
    fontWeight: '600',
    color: Colors.text.dark,
    fontSize: 14,
  },
  genderOptionTextActive: {
    color: 'white',
  },
  passwordInput: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#E8EAF6',
    borderRadius: 14,
    paddingRight: 12,
    backgroundColor: '#F5F6FF',
  },
  passwordField: {
    flex: 1,
    padding: 14,
    fontSize: 15,
    color: Colors.text.dark,
  },
  passwordToggle: {
    fontSize: 18,
    padding: 8,
  },
  helperText: {
    fontSize: 12,
    color: Colors.text.tertiary,
    marginTop: 6,
    marginLeft: 4,
  },
  registerBtn: {
    paddingVertical: 16,
    backgroundColor: Colors.primary,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 16,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  registerBtnDisabled: {
    opacity: 0.5,
  },
  registerBtnText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  loginLink: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  loginLinkText: {
    color: Colors.text.secondary,
    fontSize: 14,
  },
  loginLinkButton: {
    color: Colors.primary,
    fontSize: 14,
    fontWeight: '700',
  },
  locationStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    gap: 8,
  },
  locationStatusText: {
    fontSize: 14,
    color: Colors.text.secondary,
  },
  locationError: {
    backgroundColor: 'rgba(249,115,22,0.08)',
    borderWidth: 1.5,
    borderColor: 'rgba(249,115,22,0.2)',
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    alignItems: 'center',
  },
  locationErrorText: {
    fontSize: 13,
    color: '#9A3412',
    marginBottom: 8,
    textAlign: 'center',
    lineHeight: 18,
  },
  retryButton: {
    paddingHorizontal: 18,
    paddingVertical: 8,
    backgroundColor: Colors.primary,
    borderRadius: 10,
  },
  retryButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  locationSuccess: {
    backgroundColor: 'rgba(16,185,129,0.08)',
    borderWidth: 1.5,
    borderColor: 'rgba(16,185,129,0.2)',
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
    alignItems: 'center',
  },
  locationSuccessText: {
    fontSize: 13,
    color: '#065F46',
    fontWeight: '600',
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

export default RegisterScreen;
