import { TTS } from "@/services/audio/tts";
import { Ionicons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { AnimatePresence, MotiView } from "moti";
import React, { useEffect } from "react";
import {
  Image,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";

interface AuthGuardModalProps {
  visible: boolean;
  onClose: () => void;
}

const KICO_SAD = require("@/assets/avatarfull/sad.png");

export default function AuthGuardModal({
  visible,
  onClose,
}: AuthGuardModalProps) {
  const router = useRouter();
  const { width, height } = useWindowDimensions();
  const isTablet = width > 600;

  const TITLE = "Oops! Almost There! 😊";
  const MESSAGE = "Let’s make your profile first so you can enjoy all the fun!";

  useEffect(() => {
    if (visible) {
      // Small delay before speaking for smoother UX
      const timer = setTimeout(() => {
        TTS.speak(MESSAGE, {
          rate: 0.9,
          pitch: 1.1,
        });
      }, 300);

      return () => {
        clearTimeout(timer);
        TTS.stop();
      };
    } else {
      TTS.stop();
    }
  }, [visible]);

  const handleGoToProfile = () => {
    TTS.stop();
    onClose();
    router.push("/profile");
  };

  const handleGoHome = () => {
    TTS.stop();
    onClose();
    router.push("/home");
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <BlurView intensity={50} tint="light" style={styles.overlay}>
        <AnimatePresence>
          {visible && (
            <MotiView
              from={{ scale: 0.7, opacity: 0, translateY: 50 }}
              animate={{ scale: 1, opacity: 1, translateY: 0 }}
              exit={{ scale: 0.7, opacity: 0, translateY: 50 }}
              transition={{ type: "spring", damping: 15, stiffness: 120 }}
              style={[styles.modalContainer, isTablet && styles.tabletModal]}
            >
              <LinearGradient
                colors={["#FFF9C4", "#FFFFFF", "#E3F2FD"]}
                style={styles.content}
              >
                {/* Close Button */}
                <TouchableOpacity
                  style={styles.closeButton}
                  onPress={handleGoHome}
                >
                  <Ionicons name="close-circle" size={36} color="#FF7043" />
                </TouchableOpacity>

                {/* Character Section - Main Focus */}
                <MotiView
                  from={{ translateY: 0 }}
                  animate={{ translateY: -10 }}
                  transition={{
                    type: "timing",
                    duration: 2000,
                    loop: true,
                    repeatReverse: true,
                  }}
                  style={styles.characterContainer}
                >
                  <Image
                    source={KICO_SAD}
                    style={styles.mascot}
                    resizeMode="contain"
                  />
                </MotiView>

                {/* Text Content */}
                <View style={styles.textSection}>
                  <Text style={styles.title}>{TITLE}</Text>
                  <Text style={styles.message}>{MESSAGE}</Text>
                </View>

                {/* Actions */}
                <View style={styles.buttonSection}>
                  <TouchableOpacity
                    style={styles.primaryButton}
                    onPress={handleGoToProfile}
                    activeOpacity={0.8}
                  >
                    <LinearGradient
                      colors={["#FF7043", "#FFAB91"]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={styles.buttonGradient}
                    >
                      <Ionicons name="star" size={24} color="white" />
                      <Text style={styles.buttonText}>Let’s Go!</Text>
                    </LinearGradient>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.secondaryButton}
                    onPress={handleGoHome}
                  >
                    <Text style={styles.secondaryButtonText}>Wait a Bit</Text>
                  </TouchableOpacity>
                </View>
              </LinearGradient>
            </MotiView>
          )}
        </AnimatePresence>
      </BlurView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalContainer: {
    width: "100%",
    maxWidth: 420,
    borderRadius: 50,
    overflow: "hidden",
    borderWidth: 10,
    borderColor: "white",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 15 },
    shadowOpacity: 0.3,
    shadowRadius: 25,
    elevation: 20,
  },
  tabletModal: {
    maxWidth: 550,
  },
  content: {
    padding: 30,
    alignItems: "center",
  },
  closeButton: {
    position: "absolute",
    top: 20,
    right: 20,
    zIndex: 10,
  },
  characterContainer: {
    width: "100%",
    height: 220,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 10,
    marginTop: 10,
  },
  mascot: {
    width: 220,
    height: 220,
  },
  textSection: {
    alignItems: "center",
    marginBottom: 30,
  },
  title: {
    fontSize: 34,
    fontWeight: "900",
    color: "#FF7043",
    marginBottom: 12,
    textAlign: "center",
    fontFamily: "System",
  },
  message: {
    fontSize: 22,
    color: "#546E7A",
    textAlign: "center",
    lineHeight: 32,
    paddingHorizontal: 10,
    fontWeight: "600",
  },
  buttonSection: {
    width: "100%",
    alignItems: "center",
  },
  primaryButton: {
    width: "100%",
    height: 70,
    borderRadius: 35,
    overflow: "hidden",
    marginBottom: 15,
    shadowColor: "#FF7043",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 8,
  },
  buttonGradient: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  buttonText: {
    color: "white",
    fontSize: 24,
    fontWeight: "900",
    textTransform: "uppercase",
    letterSpacing: 1.5,
  },
  secondaryButton: {
    paddingVertical: 12,
  },
  secondaryButtonText: {
    color: "#90A4AE",
    fontSize: 18,
    fontWeight: "700",
    textDecorationLine: "underline",
  },
});
