import { useRef, useEffect } from 'react';
import { Animated, Easing } from 'react-native';

export const useAnimatedValue = (initialValue: number = 0) => {
  return useRef(new Animated.Value(initialValue)).current;
};

export const useFadeIn = (duration: number = 500, delay: number = 0) => {
  const opacity = useAnimatedValue(0);

  useEffect(() => {
    Animated.timing(opacity, {
      toValue: 1,
      duration,
      delay,
      useNativeDriver: true,
      easing: Easing.ease,
    }).start();
  }, []);

  return opacity;
};

export const useSlideIn = (
  direction: 'left' | 'right' | 'top' | 'bottom' = 'bottom',
  distance: number = 100,
  duration: number = 500,
  delay: number = 0
) => {
  const translation = useAnimatedValue(distance);

  useEffect(() => {
    Animated.timing(translation, {
      toValue: 0,
      duration,
      delay,
      useNativeDriver: true,
      easing: Easing.out(Easing.back(1.5)),
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
  duration: number = 500,
  delay: number = 0
) => {
  const scale = useAnimatedValue(initialScale);

  useEffect(() => {
    Animated.timing(scale, {
      toValue: finalScale,
      duration,
      delay,
      useNativeDriver: true,
      easing: Easing.out(Easing.back(1.5)),
    }).start();
  }, []);

  return { transform: [{ scale }] };
};

export const usePressAnimation = () => {
  const scale = useAnimatedValue(1);

  const animatePress = () => {
    Animated.sequence([
      Animated.timing(scale, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
        easing: Easing.ease,
      }),
      Animated.timing(scale, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
        easing: Easing.ease,
      }),
    ]).start();
  };

  return { scale, animatePress, style: { transform: [{ scale }] } };
}; 