import React, { useMemo } from 'react';
import { StatusBar, Animated, Platform, Dimensions, Easing } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import type { 
  StackNavigationOptions,
  StackCardInterpolatedStyle,
  StackCardInterpolationProps,
  TransitionSpecs,
} from '@react-navigation/stack';
import { StyleSheet } from 'react-native';
import { SafeAreaProvider } from "react-native-safe-area-context"
import HomeScreen from "./screens/HomeScreen"
import LoginScreen from "./screens/LoginScreen"
import ProfileScreen from './screens/ProfileScreen';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import { PerformanceMonitor } from './components/PerformanceMonitor';

type RootStackParamList = {
  Login: undefined;
  Home: undefined;
  Profile: undefined;
};

const Stack = createStackNavigator<RootStackParamList>();

// Optimized transition configurations
const SPRING_SPEC = {
  animation: 'spring',
  config: {
    stiffness: 1000,
    damping: 500,
    mass: 3,
    overshootClamping: true,
    restDisplacementThreshold: 0.01,
    restSpeedThreshold: 0.01,
    useNativeDriver: true,
  },
} as const;

const TIMING_SPEC = {
  animation: 'timing',
  config: {
    duration: Platform.OS === 'ios' ? 300 : 250,
    easing: Easing.bezier(0.4, 0.0, 0.2, 1),
    useNativeDriver: true,
  },
} as const;

const fadeInterpolator = ({ current }: StackCardInterpolationProps): StackCardInterpolatedStyle => ({
  cardStyle: {
    opacity: current.progress.interpolate({
      inputRange: [0, 1],
      outputRange: [0, 1],
      extrapolate: 'clamp',
    }),
  },
});

const slideInterpolator = ({ current, next, layouts }: StackCardInterpolationProps): StackCardInterpolatedStyle => ({
  cardStyle: {
    transform: [
      {
        translateX: current.progress.interpolate({
          inputRange: [0, 1],
          outputRange: [layouts.screen.width, 0],
          extrapolate: 'clamp',
        }),
      },
      {
        scale: current.progress.interpolate({
          inputRange: [0, 1],
          outputRange: [0.95, 1],
          extrapolate: 'clamp',
        }),
      },
    ],
  },
  overlayStyle: {
    opacity: current.progress.interpolate({
      inputRange: [0, 1],
      outputRange: [0, 0.3],
      extrapolate: 'clamp',
    }),
  },
});

function AppNavigator() {
  const { session } = useAuth();
  const { colors } = useTheme();

  const screenOptions = useMemo<StackNavigationOptions>(() => ({
    headerShown: false,
    cardStyle: { backgroundColor: colors.background },
    gestureEnabled: Platform.OS === 'ios',
    gestureDirection: 'horizontal',
    cardStyleInterpolator: slideInterpolator,
    transitionSpec: {
      open: SPRING_SPEC,
      close: SPRING_SPEC,
    },
    gestureResponseDistance: Platform.OS === 'ios' ? Dimensions.get('window').width : 50,
    detachPreviousScreen: Platform.OS === 'ios' && Platform.constants.interfaceIdiom !== 'pad',
    freezeOnBlur: true,
    animationEnabled: true,
  }), [colors.background]);

  const loginOptions = useMemo<StackNavigationOptions>(() => ({
    cardStyle: { backgroundColor: colors.background },
    cardStyleInterpolator: fadeInterpolator,
    transitionSpec: {
      open: TIMING_SPEC,
      close: TIMING_SPEC,
    },
    gestureEnabled: false,
    animationEnabled: true,
  }), [colors.background]);

  const homeOptions = useMemo<StackNavigationOptions>(() => ({
    cardStyle: { backgroundColor: colors.background },
    cardStyleInterpolator: fadeInterpolator,
    transitionSpec: {
      open: TIMING_SPEC,
      close: TIMING_SPEC,
    },
    gestureEnabled: false,
    animationEnabled: true,
  }), [colors.background]);

  const profileOptions = useMemo<StackNavigationOptions>(() => ({
    cardStyle: { backgroundColor: colors.background },
    gestureEnabled: Platform.OS === 'ios',
    gestureDirection: 'horizontal',
    cardStyleInterpolator: slideInterpolator,
    transitionSpec: {
      open: SPRING_SPEC,
      close: SPRING_SPEC,
    },
    animationEnabled: true,
  }), [colors.background]);

  return (
    <Stack.Navigator screenOptions={screenOptions}>
      {!session ? (
        <Stack.Screen 
          name="Login" 
          component={LoginScreen}
          options={loginOptions}
        />
      ) : (
        <>
          <Stack.Screen 
            name="Home" 
            component={HomeScreen}
            options={homeOptions}
          />
          <Stack.Screen 
            name="Profile" 
            component={ProfileScreen}
            options={profileOptions}
          />
        </>
      )}
    </Stack.Navigator>
  );
}

const AppContent = React.memo(() => {
  const { colors } = useTheme();
  
  return (
    <NavigationContainer>
      <StatusBar
        barStyle={colors.statusBar}
        backgroundColor="transparent"
        translucent
      />
      <AppNavigator />
      <PerformanceMonitor />
    </NavigationContainer>
  );
});

AppContent.displayName = 'AppContent';

export default function App() {
  return (
    <GestureHandlerRootView style={styles.container}>
      <SafeAreaProvider>
        <ThemeProvider>
          <AuthProvider>
            <AppContent />
          </AuthProvider>
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1
  }
});
