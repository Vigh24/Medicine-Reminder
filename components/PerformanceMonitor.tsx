import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, InteractionManager, Platform } from 'react-native';
import { useTheme } from '../context/ThemeContext';

interface PerformanceMetrics {
  fps: number;
  jsThreadTime: number;
  lastUpdate: number;
}

export const PerformanceMonitor: React.FC<{ enabled?: boolean }> = ({ 
  enabled = __DEV__ 
}) => {
  const { colors } = useTheme();
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    fps: 0,
    jsThreadTime: 0,
    lastUpdate: Date.now(),
  });

  useEffect(() => {
    if (!enabled) return;

    let frameCount = 0;
    let lastFrameTime = performance.now();
    let rafId: number;

    const measurePerformance = () => {
      const now = performance.now();
      const delta = now - lastFrameTime;
      frameCount++;

      if (delta >= 1000) {
        const fps = Math.round((frameCount * 1000) / delta);
        const jsThreadTime = Math.round(delta / frameCount);

        setMetrics({
          fps,
          jsThreadTime,
          lastUpdate: Date.now(),
        });

        frameCount = 0;
        lastFrameTime = now;
      }

      rafId = requestAnimationFrame(measurePerformance);
    };

    // Start measuring after interactions are complete
    InteractionManager.runAfterInteractions(() => {
      rafId = requestAnimationFrame(measurePerformance);
    });

    return () => {
      if (rafId) {
        cancelAnimationFrame(rafId);
      }
    };
  }, [enabled]);

  if (!enabled) return null;

  return (
    <View style={[styles.container, { backgroundColor: colors.card }]}>
      <Text style={[styles.text, { color: colors.text }]}>
        FPS: {metrics.fps}
      </Text>
      <Text style={[styles.text, { color: colors.text }]}>
        JS: {metrics.jsThreadTime.toFixed(1)}ms
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 40,
    right: 10,
    padding: 8,
    borderRadius: 8,
    opacity: 0.8,
    flexDirection: 'row',
    gap: 8,
  },
  text: {
    fontSize: 12,
    fontFamily: Platform.select({ ios: 'Menlo', android: 'monospace' }),
  },
}); 