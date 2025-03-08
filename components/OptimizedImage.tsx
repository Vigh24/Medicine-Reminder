import React, { useState } from 'react';
import {
  Image,
  ImageProps,
  StyleSheet,
  View,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { LoadingIndicator } from './LoadingIndicator';

interface OptimizedImageProps extends Omit<ImageProps, 'source'> {
  source: { uri: string } | number;
  fallback?: number;
}

export const OptimizedImage: React.FC<OptimizedImageProps> = ({
  source,
  fallback,
  style,
  ...props
}) => {
  const { colors } = useTheme();
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  const handleError = () => {
    setHasError(true);
    setIsLoading(false);
  };

  const handleLoad = () => {
    setIsLoading(false);
  };

  return (
    <View style={[styles.container, style]}>
      {!hasError && (
        <Image
          source={source}
          onError={handleError}
          onLoad={handleLoad}
          {...props}
          style={[
            StyleSheet.absoluteFill,
            style,
            Platform.select({
              android: {
                // Fix for Android image scaling issues
                width: undefined,
                height: undefined,
              },
            }),
          ]}
        />
      )}

      {hasError && fallback && (
        <Image
          source={fallback}
          style={[
            StyleSheet.absoluteFill,
            style,
            Platform.select({
              android: {
                width: undefined,
                height: undefined,
              },
            }),
          ]}
          {...props}
        />
      )}

      {isLoading && (
        <View style={[StyleSheet.absoluteFill, styles.loadingContainer]}>
          <LoadingIndicator size={24} color={colors.primary} />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
    backgroundColor: 'transparent',
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
  },
}); 