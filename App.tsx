import React from 'react';
import { StatusBar, Animated, Platform } from 'react-native';
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

type RootStackParamList = {
  Login: undefined;
  Home: undefined;
  Profile: undefined;
};

const Stack = createStackNavigator<RootStackParamList>();

const transitionConfig = {
  animation: 'timing',
  config: {
    duration: 300,
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

const slideInterpolator = ({ current, layouts }: StackCardInterpolationProps): StackCardInterpolatedStyle => ({
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
          outputRange: [0.92, 1],
          extrapolate: 'clamp',
        }),
      },
    ],
    opacity: current.progress.interpolate({
      inputRange: [0, 1],
      outputRange: [0.5, 1],
      extrapolate: 'clamp',
    }),
  },
  overlayStyle: {
    opacity: current.progress.interpolate({
      inputRange: [0, 1],
      outputRange: [0, 0.5],
      extrapolate: 'clamp',
    }),
  },
});

function AppNavigator() {
  const { session } = useAuth();
  const { colors } = useTheme();

  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        cardStyle: { backgroundColor: colors.background },
        gestureEnabled: true,
        gestureDirection: 'horizontal',
        cardStyleInterpolator: slideInterpolator,
        transitionSpec: {
          open: transitionConfig,
          close: transitionConfig,
        },
      }}
    >
      {!session ? (
        <Stack.Screen 
          name="Login" 
          component={LoginScreen}
          options={{
            cardStyle: { backgroundColor: colors.background },
            cardStyleInterpolator: fadeInterpolator,
          }}
        />
      ) : (
        <>
          <Stack.Screen 
            name="Home" 
            component={HomeScreen}
            options={{
              cardStyle: { backgroundColor: colors.background },
              cardStyleInterpolator: fadeInterpolator,
            }}
          />
          <Stack.Screen 
            name="Profile" 
            component={ProfileScreen}
            options={{
              cardStyle: { backgroundColor: colors.background },
              gestureEnabled: true,
              gestureDirection: 'horizontal',
              cardStyleInterpolator: slideInterpolator,
            }}
          />
        </>
      )}
    </Stack.Navigator>
  );
}

function AppContent() {
  const { colors } = useTheme();
  
  return (
    <NavigationContainer>
      <StatusBar
        barStyle={colors.statusBar}
        backgroundColor="transparent"
        translucent
      />
      <AppNavigator />
    </NavigationContainer>
  );
}

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
