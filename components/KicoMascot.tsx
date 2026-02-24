import React, { useEffect } from 'react';
import { StyleSheet, TouchableWithoutFeedback, useWindowDimensions, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withSpring,
  withTiming
} from 'react-native-reanimated';

const KICO_IMAGE = require('../assets/images/kiko.png');

export default function KicoMascot() {
  const { width } = useWindowDimensions();
  const isTablet = width > 600;

  // Shared values for animations
  const translateY = useSharedValue(0);
  const rotateZ = useSharedValue(0);
  const scaleY = useSharedValue(1);
  const scale = useSharedValue(1); // For interaction

  useEffect(() => {
    // 1. Idle Bounce Animation (Gentle up and down)
    translateY.value = withRepeat(
      withSequence(
        withTiming(-10, { duration: 1500, easing: Easing.inOut(Easing.quad) }),
        withTiming(0, { duration: 1500, easing: Easing.inOut(Easing.quad) })
      ),
      -1, // Infinite loop
      true // Reverse
    );

    // 2. Subtle Wave/Wiggle (Rotation)
    rotateZ.value = withRepeat(
      withSequence(
        withDelay(2000, withTiming(5, { duration: 150 })),
        withTiming(-5, { duration: 150 }),
        withTiming(5, { duration: 150 }),
        withTiming(0, { duration: 150 }),
        withDelay(4000, withTiming(0, { duration: 0 })) // Long pause
      ),
      -1,
      false
    );

    // 3. "Blink" simulation (Squash Y slightly)
    scaleY.value = withRepeat(
      withSequence(
        withDelay(3000, withTiming(0.9, { duration: 100 })),
        withTiming(1, { duration: 100 }),
        withDelay(3500, withTiming(1, { duration: 0 }))
      ),
      -1,
      false
    );
  }, []);

  const handlePress = () => {
    // Interactive: Happy jump/pulse on press
    scale.value = withSequence(
      withSpring(1.2, { damping: 10, stiffness: 200 }),
      withSpring(1.0)
    );
  };

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { translateY: translateY.value },
        { rotateZ: `${rotateZ.value}deg` },
        { scaleY: scaleY.value },
        { scale: scale.value }
      ],
    };
  });

  return (
    <View style={[styles.container, isTablet && styles.tabletContainer]}>
      <TouchableWithoutFeedback onPress={handlePress}>
        <Animated.Image
          source={KICO_IMAGE}
          style={[styles.mascot, isTablet && styles.tabletMascot, animatedStyle]}
          resizeMode="contain"
        />
      </TouchableWithoutFeedback>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 10,
    zIndex: 1, 
    height: 150, 
  },
  tabletContainer: {
    height: 200,
    marginVertical: 20,
  },
  mascot: {
    width: 120,
    height: 120,
  },
  tabletMascot: {
    width: 180,
    height: 180,
  }
});
