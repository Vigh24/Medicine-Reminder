import { useRef, useEffect } from 'react';
import { Animated } from 'react-native';

export const useThemeTransition = (isDark: boolean) => {
  const transition = useRef(new Animated.Value(isDark ? 1 : 0)).current;

  useEffect(() => {
    Animated.timing(transition, {
      toValue: isDark ? 1 : 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [isDark]);

  const interpolate = (outputRange: [any, any]) => {
    return transition.interpolate({
      inputRange: [0, 1],
      outputRange,
    });
  };

  return {
    transition,
    interpolate,
    rotate: interpolate(['0deg', '360deg']),
    scale: interpolate([1, 0.9]),
  };
}; 