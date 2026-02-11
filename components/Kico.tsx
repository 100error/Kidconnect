import React, { useEffect, useMemo, useRef } from "react";
import { Animated, Easing, Image, StyleSheet, useWindowDimensions, View } from "react-native";

type KicoState = "idle" | "listening" | "speaking" | "happy" | "sad";

interface Props {
  state?: KicoState;
  progress?: number;
  size?: number;
  lastOpenedSection?: string | null;
  circleWidth?: number;
  circleHeight?: number;
}

const PARTS = {
  BODY: require("@/assets/kico/1765104509919.png"),
  HEAD: require("@/assets/kico/1765104571329.png"),
  ARM_L: require("@/assets/kico/1765104665771.png"),
  ARM_R: require("@/assets/kico/1765104823627.png"),
  LEG_L: require("@/assets/kico/1765105077347.png"),
  LEG_R: require("@/assets/kico/1765105198079.png"),
};

export default function Kico({ state = "idle", progress = 0, size, lastOpenedSection, circleWidth, circleHeight }: Props) {
  const { width: screenW, height: screenH } = useWindowDimensions();
  const baseHeight = useMemo(() => {
    if (circleHeight && circleHeight > 0) return circleHeight;
    const byWidth = screenW * 0.22;
    const byHeight = screenH * 0.18;
    return Math.max(85, Math.min(160, Math.min(byWidth, byHeight)));
  }, [circleHeight, screenW, screenH]);
  const baseWidth = useMemo(() => {
    const circleW = circleWidth && circleWidth > 0 ? circleWidth : baseHeight;
    return circleW * 0.5;
  }, [circleWidth, baseHeight]);

  const breath = useRef(new Animated.Value(0)).current;
  const wave = useRef(new Animated.Value(0)).current;
  const cheer = useRef(new Animated.Value(0)).current;
  const blink = useRef(new Animated.Value(0)).current;
  const mouth = useRef(new Animated.Value(0)).current;
  const nod = useRef(new Animated.Value(0)).current;
  const shake = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(breath, { toValue: 1, duration: 1800, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(breath, { toValue: 0, duration: 1800, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [breath]);

  useEffect(() => {
    const speed = state === "listening" ? 300 : 1200;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(blink, { toValue: 1, duration: 90, useNativeDriver: false }),
        Animated.timing(blink, { toValue: 0, duration: speed, useNativeDriver: false }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [blink, state]);

  useEffect(() => {
    if (state === "speaking") {
      const loop = Animated.loop(
        Animated.sequence([
          Animated.timing(mouth, { toValue: 1, duration: 140, easing: Easing.linear, useNativeDriver: false }),
          Animated.timing(mouth, { toValue: 0, duration: 140, easing: Easing.linear, useNativeDriver: false }),
        ])
      );
      loop.start();
      return () => loop.stop();
    } else {
      mouth.stopAnimation();
      mouth.setValue(0);
    }
  }, [mouth, state]);

  useEffect(() => {
    if (state === "speaking") {
      nod.setValue(0);
      Animated.sequence([
        Animated.timing(nod, { toValue: 1, duration: 160, useNativeDriver: true }),
        Animated.timing(nod, { toValue: 0, duration: 160, useNativeDriver: true }),
      ]).start();
    }
  }, [nod, state]);

  useEffect(() => {
    if (state === "happy" || progress > 0) {
      cheer.setValue(0);
      wave.setValue(0);
      Animated.parallel([
        Animated.sequence([
          Animated.timing(cheer, { toValue: 1, duration: 260, easing: Easing.out(Easing.back(1.4)), useNativeDriver: true }),
          Animated.timing(cheer, { toValue: 0, duration: 260, easing: Easing.bounce, useNativeDriver: true }),
        ]),
        Animated.sequence([
          Animated.timing(wave, { toValue: 1, duration: 180, useNativeDriver: true }),
          Animated.timing(wave, { toValue: -1, duration: 180, useNativeDriver: true }),
          Animated.timing(wave, { toValue: 1, duration: 180, useNativeDriver: true }),
          Animated.timing(wave, { toValue: 0, duration: 180, useNativeDriver: true }),
        ]),
      ]).start();
    }
  }, [state, progress, cheer, wave]);

  useEffect(() => {
    if (lastOpenedSection) {
      Animated.sequence([
        Animated.timing(wave, { toValue: 1, duration: 220, useNativeDriver: true }),
        Animated.timing(wave, { toValue: -1, duration: 220, useNativeDriver: true }),
        Animated.timing(wave, { toValue: 0, duration: 200, useNativeDriver: true }),
      ]).start();
    }
  }, [lastOpenedSection, wave]);

  useEffect(() => {
    if (state === "sad") {
      shake.setValue(0);
      Animated.sequence([
        Animated.timing(shake, { toValue: 1, duration: 90, useNativeDriver: true }),
        Animated.timing(shake, { toValue: -1, duration: 90, useNativeDriver: true }),
        Animated.timing(shake, { toValue: 0, duration: 90, useNativeDriver: true }),
      ]).start();
    } else {
      shake.stopAnimation();
      shake.setValue(0);
    }
  }, [state, shake]);

  const bodyScaleY = breath.interpolate({ inputRange: [0, 1], outputRange: [1, 1.03] });
  const headTilt = breath.interpolate({ inputRange: [0, 1], outputRange: ["-2deg", "2deg"] });
  const nodTilt = nod.interpolate({ inputRange: [0, 1], outputRange: ["0deg", "6deg"] });
  const armRSway = wave.interpolate({ inputRange: [-1, 1], outputRange: ["-28deg", "28deg"] });
  const containerY = cheer.interpolate({ inputRange: [0, 1], outputRange: [0, -16] });
  const headSadTilt = state === "sad" ? "-8deg" : "0deg";
  const shakeX = shake.interpolate({ inputRange: [-1, 1], outputRange: [-6, 6] });
  const blinkH = blink.interpolate({ inputRange: [0, 1], outputRange: [0, 12] });
  const mouthOpen = mouth.interpolate({ inputRange: [0, 1], outputRange: [4, 14] });

  return (
    <Animated.View
      style={[
        styles.container,
        { width: baseWidth, height: baseHeight, transform: [{ translateY: containerY }, { translateX: shakeX }] },
      ]}
    >
      <Image source={PARTS.LEG_R} style={[styles.limb, styles.legR]} />
      <Image source={PARTS.LEG_L} style={[styles.limb, styles.legL]} />
      <Animated.Image source={PARTS.ARM_L} style={[styles.limb, styles.armL, { transform: [{ rotate: headTilt }] }]} />
      <Animated.Image source={PARTS.BODY} style={[styles.body, { transform: [{ scaleY: bodyScaleY }] }]} />
      <Animated.Image
        source={PARTS.ARM_R}
        style={[styles.limb, styles.armR, { transform: [{ translateY: 10 }, { rotate: armRSway }, { translateY: -10 }] }]}
      />
      <Animated.Image
        source={PARTS.HEAD}
        style={[styles.head, { transform: [{ rotate: headSadTilt }, { rotate: nodTilt }, { rotate: headTilt }] }]}
      />
      <View pointerEvents="none" style={[styles.overlay, { width: baseWidth, height: baseHeight }]}>
        <Animated.View style={[styles.eyelid, { height: blinkH }]} />
        <Animated.View style={[styles.mouth, { height: mouthOpen }]} />
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
  },
  body: {
    position: "absolute",
    width: 60,
    height: 70,
    resizeMode: "contain",
    zIndex: 10,
  },
  head: {
    position: "absolute",
    top: 10,
    width: 70,
    height: 70,
    resizeMode: "contain",
    zIndex: 20,
  },
  limb: {
    position: "absolute",
    resizeMode: "contain",
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
  overlay: {
    position: "absolute",
    top: 0,
    left: 0,
    alignItems: "center",
    justifyContent: "center",
  },
  eyelid: {
    position: "absolute",
    top: 28,
    width: 28,
    borderRadius: 8,
    backgroundColor: "rgba(0,0,0,0.35)",
  },
  mouth: {
    position: "absolute",
    top: 62,
    width: 16,
    borderRadius: 10,
    backgroundColor: "rgba(0,0,0,0.45)",
  },
});
