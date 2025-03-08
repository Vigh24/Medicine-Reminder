import { useRef, useEffect } from 'react';
import { Animated, Easing, Platform } from 'react-native';

// Optimized animation configurations
const SPRING_CONFIG = {
  tension: 60,
  friction: 8,
  useNativeDriver: true,
};

const TIMING_CONFIG = {
  duration: Platform.OS === 'ios' ? 300 : 250,
  easing: Easing.bezier(0.4, 0.0, 0.2, 1),
  useNativeDriver: true,
};

export const useAnimatedValue = (initialValue: number = 0) => {
  return useRef(new Animated.Value(initialValue)).current;
};

export const useFadeIn = (customDuration?: number, delay: number = 0) => {
  const opacity = useAnimatedValue(0);

  useEffect(() => {
    Animated.timing(opacity, {
      toValue: 1,
      delay,
      ...TIMING_CONFIG,
      duration: customDuration ?? TIMING_CONFIG.duration,
    }).start();
  }, []);

  return opacity;
};

export const useSlideIn = (
  direction: 'left' | 'right' | 'top' | 'bottom' = 'bottom',
  distance: number = 100,
  customDuration?: number,
  delay: number = 0
) => {
  const translation = useAnimatedValue(distance);

  useEffect(() => {
    Animated.spring(translation, {
      toValue: 0,
      delay,
      ...SPRING_CONFIG,
    }).start();
  }, []);

  switch (direction) {
    case 'left':
      return { transform: [{ translateX: translation }] };
    case 'right':
      return { transform: [{ translateX: translation }] };
    case 'top':
      return { transform: [{ translateY: translation }] };
    case 'bottom':
      return { transform: [{ translateY: translation }] };
  }
};

export const useScale = (
  initialScale: number = 0,
  finalScale: number = 1,
  customDuration?: number,
  delay: number = 0
) => {
  const scale = useAnimatedValue(initialScale);

  useEffect(() => {
    Animated.spring(scale, {
      toValue: finalScale,
      delay,
      ...SPRING_CONFIG,
    }).start();
  }, []);

  return { transform: [{ scale }] };
};

export const usePressAnimation = (scaleValue: number = 0.95) => {
  const animated = useAnimatedValue(1);

  const animatePress = () => {
    Animated.sequence([
      Animated.spring(animated, {
        toValue: scaleValue,
        tension: 120,
        friction: 6,
        useNativeDriver: true,
      }),
      Animated.spring(animated, {
        toValue: 1,
        tension: 80,
        friction: 6,
        useNativeDriver: true,
      }),
    ]).start();
  };

  return { 
    scale: animated, 
    animatePress, 
    style: { transform: [{ scale: animated }] } 
  };
}; 