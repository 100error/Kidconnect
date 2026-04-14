import { useAuth } from "@/context/AuthContext";
import { kicoAudio, KicoAudioState } from "@/services/audio/kicoAudio";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import * as Network from "expo-network";
import { AnimatePresence, MotiView } from "moti";
import React, { useEffect, useRef, useState } from "react";
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  useWindowDimensions,
  View,
} from "react-native";
import Animated, {
  cancelAnimation,
  Easing,
  useAnimatedProps,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from "react-native-reanimated";

const AnimatedTouchableOpacity =
  Animated.createAnimatedComponent(TouchableOpacity);
const AnimatedLinearGradient = Animated.createAnimatedComponent(LinearGradient);

// Asset Imports - Multi-Part Puppet
const BODY_IMG = require("../assets/kico/body.png");
const HEAD_IMG = require("../assets/kico/head.png");
const EYES_IMG = require("../assets/kico/eyes.png");
const UPPER_BEAK_IMG = require("../assets/kico/upperbeak.png");
const LOWER_BEAK_IMG = require("../assets/kico/lowerbeak.png");
const WING_L_IMG = require("../assets/kico/leftwing.png");
const WING_R_IMG = require("../assets/kico/rightwing.png");
const LEG_L_IMG = require("../assets/kico/leftleg.png");
const LEG_R_IMG = require("../assets/kico/rightleg.png");

// --- UI Constants ---
const GRADIENT_SETS = [
  ["#FFB300", "#FF8F00"], // mustard → orange
  ["#F44336", "#E91E63"], // red → pink
  ["#2196F3", "#03A9F4"], // blue → light blue
  ["#4CAF50", "#009688"], // green → teal
  ["#E91E63", "#9C27B0"], // pink → purple
  ["#9C27B0", "#3F51B5"], // purple → indigo
] as const;
const ROTATION_INTERVAL = 10000; // 10 seconds
const TRANSITION_DURATION = 800; // 800ms

export default function KicoMascot() {
  const { width } = useWindowDimensions();
  const isTablet = width > 600;
  const { profile } = useAuth();

  // --- Voice Assistant State ---
  const [isConnected, setIsConnected] = useState<boolean | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const isMounted = useRef(true);

  // --- UI State ---
  const colorIndex = useSharedValue(0);

  // --- Shared Values ---
  // Global Movement (Bounce/Jump)
  const translateY = useSharedValue(0);
  const scale = useSharedValue(1);

  // Body Parts
  const headRotate = useSharedValue(0);
  const eyesScaleY = useSharedValue(1); // For blinking

  // Beak Animation Values
  const lowerBeakRotate = useSharedValue(0); // For smile/open mouth
  const lowerBeakTranslateY = useSharedValue(0); // For opening mouth

  const wingRotate = useSharedValue(0); // For flapping

  // Interaction State
  const isInteracting = useSharedValue(false);

  // --- Animation Setup ---
  useEffect(() => {
    isMounted.current = true;
    startIdleAnimation();
    checkNetwork();

    const sub = Network.addNetworkStateListener(
      (state: Network.NetworkState) => {
        setIsConnected(state.isConnected ?? false);
      },
    );

    // Subscribe to kicoAudio state
    const listener = (state: KicoAudioState) => {
      if (isMounted.current) {
        setIsListening(state.isListening);
        setIsProcessing(state.isProcessing);
        setMessage(state.message);
      }
    };
    kicoAudio.addListener(listener);

    // --- Dynamic Color Rotation ---
    const colorInterval = setInterval(() => {
      if (isMounted.current) {
        colorIndex.value = (colorIndex.value + 1) % GRADIENT_SETS.length;
      }
    }, ROTATION_INTERVAL);

    return () => {
      isMounted.current = false;
      if (sub && typeof sub.remove === "function") {
        sub.remove();
      }
      kicoAudio.removeListener(listener);
      kicoAudio.stopAll();
      clearInterval(colorInterval);
    };
  }, []);

  const checkNetwork = async () => {
    try {
      const state = await Network.getNetworkStateAsync();
      setIsConnected(state.isConnected ?? false);
    } catch (e) {
      setIsConnected(false);
    }
  };

  const handleMicPress = () => {
    if (isListening) {
      kicoAudio.stopListening();
    } else {
      kicoAudio.startListening(() => profile?.username);
    }
  };

  const startIdleAnimation = () => {
    translateY.value = withTiming(0, { duration: 300 });
    wingRotate.value = withRepeat(
      withSequence(
        withTiming(2, { duration: 3000, easing: Easing.inOut(Easing.quad) }),
        withTiming(-2, { duration: 3000, easing: Easing.inOut(Easing.quad) }),
      ),
      -1,
      true,
    );
    eyesScaleY.value = withRepeat(
      withSequence(
        withDelay(3500, withTiming(0.1, { duration: 120 })),
        withTiming(1, { duration: 120 }),
        withDelay(4000, withTiming(1, { duration: 0 })),
      ),
      -1,
      false,
    );
    headRotate.value = withTiming(0, { duration: 300 });
    lowerBeakRotate.value = withTiming(0, { duration: 300 });
  };

  const handlePress = () => {
    if (isInteracting.value) return;
    isInteracting.value = true;

    // --- 1. Refined Soft Jump Animation ---
    // Goal: Light, playful, natural hop. Max scale range 0.97-1.03.
    // Ease-out on takeoff, ease-in on landing.
    translateY.value = withSequence(
      withTiming(8, { duration: 80, easing: Easing.out(Easing.quad) }), // Subtle crouch (pre-jump)
      withTiming(-25, { duration: 250, easing: Easing.out(Easing.cubic) }), // Gentle hop up
      withSpring(0, { damping: 15, stiffness: 200, mass: 1 }), // Soft landing (no bounce)
    );

    // --- 2. Subtle Squash & Stretch ---
    // Reduced exaggeration for "solid" feel
    scale.value = withSequence(
      withTiming(0.97, { duration: 80 }), // Slight squash on crouch
      withTiming(1.03, { duration: 250 }), // Slight stretch on way up
      withTiming(1, { duration: 200 }), // Return to normal
    );

    // --- 3. Fast Wing Flap ---
    cancelAnimation(wingRotate);
    wingRotate.value = withSequence(
      withRepeat(withTiming(20, { duration: 80 }), 4, true),
      withTiming(0, { duration: 150 }),
    );

    // --- 4. Beak Happy Reaction (Open Mouth Smile) ---
    cancelAnimation(lowerBeakRotate);
    lowerBeakRotate.value = withSequence(
      withTiming(15, { duration: 150 }), // Open Wide (Smile)
      withDelay(300, withTiming(0, { duration: 150 })), // Close
    );

    lowerBeakTranslateY.value = withSequence(
      withTiming(4, { duration: 150 }), // Drop down slightly
      withDelay(300, withTiming(0, { duration: 150 })), // Return up
    );

    // --- 5. Eyes Squint (Blink) ---
    cancelAnimation(eyesScaleY);
    eyesScaleY.value = withSequence(
      withTiming(0.2, { duration: 100 }),
      withDelay(100, withTiming(1, { duration: 100 })),
    );

    // --- Reset to Idle after interaction ---
    setTimeout(() => {
      isInteracting.value = false;
      startIdleAnimation();
    }, 800);
  };

  // --- Animated Styles ---

  // Whole Character Container
  const containerStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }, { scale: scale.value }],
  }));

  // Head (Parented to Body via layout, rotates around neck)
  // Fix pivot: originY should be bottom of head
  const headStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: 60 }, // Move pivot point down to neck area (visual bottom of head)
      { rotate: `${headRotate.value}deg` },
      { translateY: -60 },
    ],
  }));

  // Eyes (Inside Head)
  const eyesStyle = useAnimatedStyle(() => ({
    transform: [{ scaleY: eyesScaleY.value }],
  }));

  // Upper Beak (Fixed relative to head, mostly)
  const upperBeakStyle = useAnimatedStyle(() => ({
    // Mostly static, could add slight movement if needed
  }));

  // Lower Beak (Hinged at top)
  const lowerBeakStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: lowerBeakTranslateY.value },
      // Pivot around top edge of lower beak
      { translateY: -10 },
      { rotate: `${lowerBeakRotate.value}deg` },
      { translateY: 10 },
    ],
  }));

  // Wings (Behind Body, rotate around shoulder)
  // Left Wing Pivot: Top Right corner roughly (Shoulder)
  const leftWingStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: 30 },
      { translateY: 20 }, // Move pivot to shoulder
      { rotate: `${-wingRotate.value}deg` },
      { translateX: -30 },
      { translateY: -20 },
    ],
  }));

  // Right Wing Pivot: Top Left corner roughly (Shoulder)
  const rightWingStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: -30 },
      { translateY: 20 }, // Move pivot to shoulder
      { rotate: `${wingRotate.value}deg` },
      { translateX: 30 },
      { translateY: -20 },
    ],
  }));

  // --- Dynamic UI Styles ---
  const gradientProps = useAnimatedProps(() => {
    const index = Math.floor(colorIndex.value) % GRADIENT_SETS.length;
    const [c1, c2] = GRADIENT_SETS[index];

    return {
      colors: [
        withTiming(c1, { duration: TRANSITION_DURATION }),
        withTiming(c2, { duration: TRANSITION_DURATION }),
      ] as any,
    };
  });

  const bubbleTailDynamicStyle = useAnimatedStyle(() => {
    const index = Math.floor(colorIndex.value) % GRADIENT_SETS.length;
    const [c1] = GRADIENT_SETS[index];

    return {
      borderBottomColor: withTiming(c1, { duration: TRANSITION_DURATION }),
    };
  });

  return (
    <View style={[styles.wrapper, isTablet && styles.tabletWrapper]}>
      {/* Speech Bubble Overlay */}
      <AnimatePresence>
        {message && (
          <MotiView
            from={{ opacity: 0, scale: 0.5, translateY: 20 }}
            animate={{ opacity: 1, scale: 1, translateY: 0 }}
            exit={{ opacity: 0, scale: 0.5, translateY: 20 }}
            style={styles.bubbleOverlay}
          >
            <AnimatedLinearGradient
              animatedProps={gradientProps}
              colors={[GRADIENT_SETS[0][0], GRADIENT_SETS[0][1]]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.bubbleGradient}
            >
              <View style={styles.bubbleInner}>
                <Text style={styles.bubbleText}>{message}</Text>
              </View>
            </AnimatedLinearGradient>
            <Animated.View
              style={[styles.bubbleTail, bubbleTailDynamicStyle]}
            />
          </MotiView>
        )}
      </AnimatePresence>

      {/* Listening Indicator Overlay */}
      <AnimatePresence>
        {isListening && (
          <MotiView
            from={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            style={styles.listeningOverlay}
          >
            <AnimatedLinearGradient
              animatedProps={gradientProps}
              colors={[GRADIENT_SETS[0][0], GRADIENT_SETS[0][1]]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={StyleSheet.absoluteFill}
            />
            <View style={styles.listeningContent}>
              <Ionicons name="mic" size={16} color="#FFF" />
              <Text style={styles.listeningText}>Kico is listening...</Text>
            </View>
          </MotiView>
        )}
      </AnimatePresence>

      {/* Microphone Button (Right Side) */}
      <AnimatedTouchableOpacity
        style={[
          styles.micButton,
          isListening && styles.micButtonListening,
          isProcessing && styles.micButtonProcessing,
        ]}
        onPress={handleMicPress}
        activeOpacity={0.7}
      >
        <AnimatedLinearGradient
          animatedProps={gradientProps}
          colors={[GRADIENT_SETS[0][0], GRADIENT_SETS[0][1]]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.micGradient}
        >
          {isProcessing ? (
            <Ionicons name="sync" size={24} color="#FFF" />
          ) : (
            <Ionicons
              name={isListening ? "stop" : "mic"}
              size={24}
              color="#FFF"
            />
          )}
        </AnimatedLinearGradient>
      </AnimatedTouchableOpacity>

      <TouchableWithoutFeedback onPress={handlePress}>
        <Animated.View style={[styles.characterContainer, containerStyle]}>
          {/* Layer 1: Back Parts (Behind Body) */}
          <Animated.Image
            source={WING_L_IMG}
            style={[styles.part, styles.wingLeft, leftWingStyle]}
            resizeMode="contain"
          />
          <Animated.Image
            source={WING_R_IMG}
            style={[styles.part, styles.wingRight, rightWingStyle]}
            resizeMode="contain"
          />

          {/* Layer 2: Legs (Under Body) */}
          <Animated.Image
            source={LEG_L_IMG}
            style={[styles.part, styles.legLeft]}
            resizeMode="contain"
          />
          <Animated.Image
            source={LEG_R_IMG}
            style={[styles.part, styles.legRight]}
            resizeMode="contain"
          />

          {/* Layer 3: Body (Core) */}
          <Animated.Image
            source={BODY_IMG}
            style={[styles.part, styles.body]}
            resizeMode="contain"
          />

          {/* Layer 4: Head Group (Top) */}
          <Animated.View style={[styles.headContainer, headStyle]}>
            <Animated.Image
              source={HEAD_IMG}
              style={styles.headImage}
              resizeMode="contain"
            />

            {/* Face Parts (Inside Head) */}
            <Animated.Image
              source={EYES_IMG}
              style={[styles.facePart, styles.eyes, eyesStyle]}
              resizeMode="contain"
            />

            {/* Beak Assembly - Lower first (behind), then Upper */}
            <Animated.Image
              source={LOWER_BEAK_IMG}
              style={[styles.facePart, styles.lowerBeak, lowerBeakStyle]}
              resizeMode="contain"
            />
            <Animated.Image
              source={UPPER_BEAK_IMG}
              style={[styles.facePart, styles.upperBeak, upperBeakStyle]}
              resizeMode="contain"
            />
          </Animated.View>
        </Animated.View>
      </TouchableWithoutFeedback>
    </View> 
  );
}

// --- VISUAL CONSTANTS ---
// Based on "Duo" Scale: 25-35% of screen.
// Refined layout to be TIGHT and INTACT.

const CONTAINER_W = 320;
const CONTAINER_H = 230;
const CENTER_X = CONTAINER_W / 2;

// Body visual anchor (top of body relative to container)
const BODY_TOP = 19;
const BODY_W = 180;
const BODY_H = 160;

const styles = StyleSheet.create({
  wrapper: {
    alignItems: "center",
    justifyContent: "center",
    width: CONTAINER_W,
    height: CONTAINER_H,
    marginTop: 10, // Reduced from 40 to remove empty space
  },

  tabletWrapper: {
    transform: [{ scale: 1.5 }],
  },

  characterContainer: {
    width: CONTAINER_W,
    height: CONTAINER_H,
    position: "relative",
  },

  part: {
    position: "absolute",
  },

  /* ================= BODY (CORE ANCHOR) ================= */
  body: {
    width: BODY_W,
    height: BODY_H + 15, // overlap buffer
    zIndex: 20,
    top: BODY_TOP,
    left: (CONTAINER_W - BODY_W) / 2,
  },

  /* ================= LEGS (ATTACHED UNDER BODY) ================= */
  legLeft: {
    width: 180,
    height: 160,
    zIndex: 30,
    top: BODY_TOP + BODY_H - 148, // unified depth
    left: CENTER_X - 65,
  },

  legRight: {
    width: 180,
    height: 160,
    zIndex: 30,
    top: BODY_TOP + BODY_H - 148, // unified depth
    left: CENTER_X - 90,
  },

  /* ================= HEAD GROUP (DEEP OVERLAP) ================= */
  headContainer: {
    position: "absolute",
    width: 180,
    height: 160,
    zIndex: 30,
    top: 30, // deep overlap = solid neck
    left: (CONTAINER_W - 180) / 2,
    alignItems: "center",
    justifyContent: "center",
  },

  headImage: {
    width: "100%",
    height: "100%",
  },

  facePart: {
    position: "absolute",
    zIndex: 31,
  },

  /* ================= FACE ================= */
  eyes: {
    width: 180,
    height: 160,
    top: 1,
    left: "1%",
    transform: [{ translateX: -10 }],
  },

  // Upper Beak: Fixed Anchor
  upperBeak: {
    width: 180,
    height: 160,
    top: 1,
    left: "40%", // Corrected to align with lower beak
    zIndex: 33, // On top of lower beak
    transform: [{ translateX: -70 }],
  },

  // Lower Beak: Animated Hinge
  lowerBeak: {
    width: 180,
    height: 160,
    top: 1, // Same start pos
    left: "1%",
    zIndex: 32, // Behind upper beak slightly
    transform: [{ translateX: -70 }],
  },

  /* ================= WINGS (SHOULDER-LOCKED) ================= */
  wingLeft: {
    width: 190,
    height: 190,
    zIndex: 10,
    top: BODY_TOP + -10,
    left: CENTER_X - 90, // pulled inward
  },

  wingRight: {
    width: 190,
    height: 190,
    zIndex: 10,
    top: BODY_TOP + -10,
    left: CENTER_X + -99, // pulled inward
  },

  /* ================= VOICE ASSISTANT OVERLAYS ================= */
  bubbleOverlay: {
    position: "absolute",
    top: -95, // Higher above head to avoid sun overlap as requested
    left: 0,
    right: 0,
    alignItems: "center", // Horizontal center relative to parent (wrapper)
    zIndex: 100,
  },
  bubbleGradient: {
    borderRadius: 24,
    padding: 6, // Slightly thicker border for more playfulness
    maxWidth: 220,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 10,
  },
  bubbleInner: {
    backgroundColor: "#FFF",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 18,
  },
  bubbleText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
    textAlign: "center",
  },
  bubbleTail: {
    width: 0,
    height: 0,
    backgroundColor: "transparent",
    borderStyle: "solid",
    borderLeftWidth: 10,
    borderRightWidth: 10,
    borderBottomWidth: 15,
    borderLeftColor: "transparent",
    borderRightColor: "transparent",
    borderBottomColor: "#FFB300",
    transform: [{ rotate: "180deg" }],
    marginTop: -4, // Tighter connection
  },
  listeningOverlay: {
    position: "absolute",
    top: -50,
    alignSelf: "center",
    borderRadius: 25,
    overflow: "hidden", // Clip gradient to border radius
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 5,
    elevation: 4,
    zIndex: 100,
  },
  listeningContent: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 15,
    paddingVertical: 8,
  },
  listeningText: {
    fontSize: 13,
    color: "#FFF", // Changed to white for better contrast on gradient
    fontWeight: "bold",
    marginLeft: 8,
  },
  micButton: {
    position: "absolute",
    left: "72%",
    top: "45%",
    width: 60, // Slightly bigger
    height: 60,
    borderRadius: 30,
    backgroundColor: "transparent",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 5, // Chunkier border
    borderColor: "#FFF",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 12,
    zIndex: 110,
    overflow: "hidden",
  },
  micGradient: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  micButtonListening: {
    transform: [{ scale: 1.15 }],
  },
  micButtonProcessing: {
    // Keep processing style
  },
});
