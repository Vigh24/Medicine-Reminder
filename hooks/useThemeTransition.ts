import { useRef, useEffect } from 'react';
import { Animated, Easing, Platform } from 'react-native';

const THEME_TRANSITION_CONFIG = {
  duration: Platform.OS === 'ios' ? 300 : 250,
  easing: Easing.bezier(0.4, 0.0, 0.2, 1),
  useNativeDriver: true,
};

export const useThemeTransition = (isDark: boolean) => {
  const transition = useRef(new Animated.Value(isDark ? 1 : 0)).current;

  useEffect(() => {
    Animated.timing(transition, {
      toValue: isDark ? 1 : 0,
      ...THEME_TRANSITION_CONFIG,
    }).start();
  }, [isDark]);

  const interpolate = (outputRange: [any, any]) => {
    return transition.interpolate({
      inputRange: [0, 1],
      outputRange,
      extrapolate: 'clamp',
    });
  };

  return {
    transition,
    interpolate,
    rotate: interpolate(['0deg', '360deg']),
    scale: interpolate([1, 0.95]),
  };
}; 