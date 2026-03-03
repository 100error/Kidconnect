import { speakPraise } from '@/services/voiceFeedback';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Animated, Easing, Image, StyleSheet, TouchableWithoutFeedback } from 'react-native';

const PARTS = {
  BODY: require('@/assets/kico/1765104509919.png'),
  HEAD: require('@/assets/kico/1765104571329.png'),
  ARM_L: require('@/assets/kico/1765104665771.png'),
  ARM_R: require('@/assets/kico/1765104823627.png'),
  LEG_L: require('@/assets/kico/1765105077347.png'),
  LEG_R: require('@/assets/kico/1765105198079.png'),
};

interface KicoAvatarProps {
  progress?: number;
  size?: number;
}

export default function KicoAvatar({ progress = 0, size = 1.0 }: KicoAvatarProps) {
  const breathAnim = useRef(new Animated.Value(0)).current;
  const waveAnim = useRef(new Animated.Value(0)).current;
  const cheerAnim = useRef(new Animated.Value(0)).current;
  const [isWaving, setIsWaving] = useState(false);

  useEffect(() => {
    const breathe = Animated.loop(
      Animated.sequence([
        Animated.timing(breathAnim, { toValue: 1, duration: 2000, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(breathAnim, { toValue: 0, duration: 2000, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ])
    );
    breathe.start();
    return () => breathe.stop();
  }, [breathAnim]);

  const triggerCheer = useCallback(() => {
    speakPraise("Yay! Great job!");
    cheerAnim.setValue(0);
    Animated.sequence([
      Animated.timing(cheerAnim, { toValue: 1, duration: 300, easing: Easing.out(Easing.back(1.5)), useNativeDriver: true }),
      Animated.timing(cheerAnim, { toValue: 0, duration: 300, easing: Easing.bounce, useNativeDriver: true }),
    ]).start();
  }, [cheerAnim]);

  useEffect(() => {
    if (progress > 0) {
      triggerCheer();
    }
  }, [progress, triggerCheer]);

  const triggerWave = () => {
    if (isWaving) return;
    setIsWaving(true);
    speakPraise("Hi friend! Let's learn!");
    Animated.loop(
      Animated.sequence([
        Animated.timing(waveAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
        Animated.timing(waveAnim, { toValue: -1, duration: 200, useNativeDriver: true }),
      ]),
      { iterations: 4 }
    ).start(() => {
      Animated.timing(waveAnim, { toValue: 0, duration: 200, useNativeDriver: true }).start();
      setIsWaving(false);
    });
  };

  const bodyScaleY = breathAnim.interpolate({ inputRange: [0, 1], outputRange: [1, 1.03] });
  const headRotate = breathAnim.interpolate({ inputRange: [0, 1], outputRange: ['-2deg', '2deg'] });
  
  // Fix: Interpolate to numbers first, add them, then convert to string
  const breathDeg = breathAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 5] });
  const waveDeg = waveAnim.interpolate({ inputRange: [-1, 1], outputRange: [-30, 30] });
  const armRRotateVal = Animated.add(breathDeg, waveDeg);
  const armRRotate = armRRotateVal.interpolate({ inputRange: [-360, 360], outputRange: ['-360deg', '360deg'] });

  const containerTranslateY = cheerAnim.interpolate({ inputRange: [0, 1], outputRange: [0, -20] });

  return (
    <TouchableWithoutFeedback onPress={triggerWave}>
      <Animated.View style={[styles.container, { transform: [{ scale: size }, { translateY: containerTranslateY }] }]}>
        <Image source={PARTS.LEG_R} style={[styles.limb, styles.legR]} />
        <Image source={PARTS.LEG_L} style={[styles.limb, styles.legL]} />
        <Animated.Image
          source={PARTS.ARM_L}
          style={[styles.limb, styles.armL, { transform: [{ rotate: breathAnim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '-5deg'] }) }] }]}
        />
        <Animated.Image
          source={PARTS.BODY}
          style={[styles.body, { transform: [{ scaleY: bodyScaleY }] }]}
        />
        <Animated.Image
          source={PARTS.ARM_R}
          style={[styles.limb, styles.armR, { transform: [{ translateY: 10 }, { rotate: armRRotate }, { translateY: -10 }] }]}
        />
        <Animated.Image
          source={PARTS.HEAD}
          style={[styles.head, { transform: [{ rotate: headRotate }, { translateY: -5 }] }]}
        />
      </Animated.View>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: {
    width: 150,
    height: 150,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: {
    position: 'absolute',
    width: 60,
    height: 70,
    resizeMode: 'contain',
    zIndex: 10,
  },
  head: {
    position: 'absolute',
    top: 10,
    width: 70,
    height: 70,
    resizeMode: 'contain',
    zIndex: 20,
  },
  limb: {
    position: 'absolute',
    resizeMode: 'contain',
    zIndex: 5,
  },
  armL: {
    left: 20,
    top: 40,
    width: 30,
    height: 40,
  },
  armR: {
    right: 20,
    top: 40,
    width: 30,
    height: 40,
    zIndex: 15,
  },
  legL: {
    left: 35,
    top: 90,
    width: 25,
    height: 35,
  },
  legR: {
    right: 35,
    top: 90,
    width: 25,
    height: 35,
  },
});
