import { createNativeStackNavigator } from '@react-navigation/native-stack';

import {
  HomeScreen,
  LoginScreen,
  ForgotPasswordScreen,
  RegisterScreen,
  EmailVerificationScreen,
  TermsOfServiceScreen,
  PrivacyPolicyScreen,
} from '../screens';

const Stack = createNativeStackNavigator();

const AuthStack = () => (
  <Stack.Navigator
    screenOptions={{
      headerShown: false,
      animation: 'slide_from_right',
      gestureEnabled: true,
      // Prevent blank flash between screens
      animationTypeForReplace: 'push',
    }}
  >
    {/* Guest mode: Show HomeScreen with limited access */}
    <Stack.Screen
      name="Home"
      component={HomeScreen}
      options={{
        headerShown: false,
        // Home is the root -- no gesture back
        gestureEnabled: false,
      }}
    />
    <Stack.Screen
      name="Login"
      component={LoginScreen}
      options={{
        title: 'Sign In',
        presentation: 'modal',
        animation: 'slide_from_bottom',
        gestureEnabled: true,
      }}
    />
    <Stack.Screen
      name="Register"
      component={RegisterScreen}
      options={{
        title: 'Create Account',
        presentation: 'card',
      }}
    />
    <Stack.Screen
      name="ForgotPassword"
      component={ForgotPasswordScreen}
      options={{
        title: 'Reset Password',
        presentation: 'card',
      }}
    />
    <Stack.Screen
      name="VerifyEmail"
      component={EmailVerificationScreen}
      options={{
        title: 'Verify Email',
        presentation: 'card',
        // Prevent going back from verification to avoid confusion
        gestureEnabled: false,
      }}
    />
    <Stack.Screen
      name="TermsOfService"
      component={TermsOfServiceScreen}
      options={{
        title: 'Terms of Service',
        presentation: 'card',
      }}
    />
    <Stack.Screen
      name="PrivacyPolicy"
      component={PrivacyPolicyScreen}
      options={{
        title: 'Privacy Policy',
        presentation: 'card',
      }}
    />
  </Stack.Navigator>
);

export default AuthStack;
