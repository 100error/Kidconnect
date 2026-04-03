import GradientButton from "@/components/GradientButton";
import { useAuth } from "@/context/AuthContext";
import { MUSIC_SOURCES, musicService } from "@/services/audio/music";
import { UserProfile, profileService } from "@/services/profile";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  Alert,
  FlatList,
  Image,
  ImageBackground,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from "react-native";

// Avatar images from assets/avatart folder
const AVATAR_IMAGES = [
  { id: "a1", source: require("@/assets/avatarcrop/ha.png") },
  { id: "a2", source: require("@/assets/avatarcrop/happy.png") },
  { id: "a3", source: require("@/assets/avatarcrop/kico.png") },
  { id: "a4", source: require("@/assets/avatarcrop/sad.png") },
  { id: "a5", source: require("@/assets/avatarcrop/wow.png") },
  { id: "a6", source: require("@/assets/avatarcrop/yay.png") },
];

const BACKGROUND_IMAGE = require("@/assets/images/int.png");

export default function ProfileScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isTablet = width > 600;
  const { refreshProfile } = useAuth();

  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<UserProfile | null>(null);

  // State for Registration & Editing
  const [username, setUsername] = useState("");
  const [selectedAvatar, setSelectedAvatar] = useState<string | null>(null);

  // Editing Mode State
  const [isEditing, setIsEditing] = useState(false);

  // ✅ AUTO-PLAY BACKGROUND MUSIC ON FOCUS
  useFocusEffect(
    useCallback(() => {
      void musicService.playAsync(MUSIC_SOURCES.profile);
      return () => {};
    }, []),
  );

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const p = await profileService.getProfile();
      setProfile(p);
      if (p) {
        setUsername(p.username);
        setSelectedAvatar(p.avatarId);
      }
    } catch (e) {
      console.error("Failed to load profile", e);
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async () => {
    if (!username.trim()) {
      Alert.alert("Oops!", "Please enter your name.");
      return;
    }
    if (!selectedAvatar) {
      Alert.alert("Oops!", "Please choose an avatar.");
      return;
    }

    try {
      setLoading(true);
      const newProfile = await profileService.saveProfile(
        username.trim(),
        selectedAvatar,
      );
      await refreshProfile();
      setProfile(newProfile);
      Alert.alert("Success!", "Profile saved on this device.");
    } catch (e) {
      Alert.alert("Error", "Could not save profile.");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async () => {
    if (!username.trim()) {
      Alert.alert("Oops!", "Please enter your name.");
      return;
    }
    if (!selectedAvatar) {
      Alert.alert("Oops!", "Please choose an avatar.");
      return;
    }

    try {
      setLoading(true);
      const updatedProfile = await profileService.updateProfile(
        username.trim(),
        selectedAvatar,
      );
      await refreshProfile();
      setProfile(updatedProfile);
      setIsEditing(false);
      Alert.alert("Success!", "Profile updated!");
    } catch (e) {
      Alert.alert("Error", "Could not update profile.");
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    router.back();
  };

  const getAvatarSource = (id: string) => {
    const avatar = AVATAR_IMAGES.find((a) => a.id === id);
    return avatar ? avatar.source : null;
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <Text>Loading...</Text>
      </View>
    );
  }

  const renderAvatarItem = ({ item }: { item: (typeof AVATAR_IMAGES)[0] }) => (
    <TouchableOpacity
      onPress={() => setSelectedAvatar(item.id)}
      style={[
        styles.avatarOption,
        selectedAvatar === item.id && styles.avatarSelected,
      ]}
    >
      <Image
        source={item.source}
        style={styles.avatarImage}
        resizeMode="cover"
      />
      {selectedAvatar === item.id && (
        <View style={styles.selectedOverlay}>
          <Ionicons name="checkmark-circle" size={24} color="#fff" />
        </View>
      )}
    </TouchableOpacity>
  );

  // --- REGISTERED VIEW ---
  if (profile && !isEditing) {
    const avatarSource = getAvatarSource(profile.avatarId);

    return (
      <ImageBackground source={BACKGROUND_IMAGE} style={styles.bgContainer}>
        <View style={styles.overlay}>
          <SafeAreaView style={styles.container}>
            <View style={styles.header}>
              <TouchableOpacity onPress={handleBack} style={styles.backButton}>
                <Ionicons name="arrow-back" size={28} color="#333" />
              </TouchableOpacity>
              <Text style={styles.title}>My Profile</Text>
              <View style={{ width: 28 }} />
            </View>

            <View style={styles.content}>
              <View style={styles.avatarContainer}>
                <View style={styles.avatarCircleLarge}>
                  {avatarSource ? (
                    <Image
                      source={avatarSource}
                      style={styles.avatarImageLarge}
                    />
                  ) : (
                    <Ionicons name="person" size={80} color="#fff" />
                  )}
                </View>
              </View>

              <View style={styles.usernameRow}>
                <Text style={styles.usernameDisplay}>{profile.username}</Text>
                <TouchableOpacity
                  onPress={() => setIsEditing(true)}
                  style={styles.editButton}
                >
                  <Ionicons name="pencil" size={20} color="#fff" />
                </TouchableOpacity>
              </View>

              <View style={styles.infoBox}>
                <Ionicons name="checkmark-circle" size={24} color="#4CAF50" />
                <Text style={styles.infoText}>
                  Profile saved on this device
                </Text>
              </View>

              <View style={styles.idContainer}>
                <Text style={styles.deviceIdLabel}>Device ID:</Text>
                <Text
                  style={styles.deviceIdText}
                  numberOfLines={1}
                  ellipsizeMode="middle"
                >
                  {profile.deviceId}
                </Text>
              </View>
            </View>
          </SafeAreaView>
        </View>
      </ImageBackground>
    );
  }

  // --- REGISTRATION / EDIT VIEW ---
  const isUpdate = !!profile;
  const titleText = isUpdate ? "Edit Profile" : "Create Profile";
  const buttonText = isUpdate ? "Save Changes" : "Register / Save Profile";
  const onSave = isUpdate ? handleUpdate : handleRegister;

  return (
    <ImageBackground source={BACKGROUND_IMAGE} style={styles.bgContainer}>
      <View style={styles.overlay}>
        <SafeAreaView style={styles.container}>
          <View style={styles.header}>
            <TouchableOpacity
              onPress={isUpdate ? () => setIsEditing(false) : handleBack}
              style={styles.backButton}
            >
              <Ionicons name="arrow-back" size={28} color="#333" />
            </TouchableOpacity>
            <Text style={styles.title}>{titleText}</Text>
            <View style={{ width: 28 }} />
          </View>

          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            style={{ flex: 1 }}
          >
            <ScrollView
              contentContainerStyle={[
                styles.content,
                isTablet && styles.tabletContent,
              ]}
            >
              <Text style={styles.label}>1. Choose your Avatar</Text>

              <FlatList
                data={AVATAR_IMAGES}
                keyExtractor={(item) => item.id}
                numColumns={3}
                scrollEnabled={false}
                contentContainerStyle={styles.grid}
                renderItem={renderAvatarItem}
              />

              <Text style={styles.label}>2. What is your name?</Text>
              <TextInput
                style={styles.input}
                placeholder="Type your name..."
                placeholderTextColor="#999"
                value={username}
                onChangeText={setUsername}
                maxLength={15}
              />

              <View style={styles.buttonContainer}>
                <GradientButton
                  title={buttonText}
                  icon="save"
                  colors={["#4CAF50", "#81C784"]}
                  onPress={onSave}
                />
              </View>
            </ScrollView>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  bgContainer: {
    flex: 1,
    resizeMode: "cover",
  },
  overlay: {
    flex: 1,
    backgroundColor: "rgba(238, 247, 249, 0.85)", // Soft overlay for readability
  },
  container: {
    flex: 1,
    paddingTop: Platform.OS === "android" ? 30 : 0,
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    borderBottomWidth: 1,
    borderBottomColor: "#ddd",
    marginTop: -30, // Adjust for SafeAreaView on some devices if needed, or remove
  },
  backButton: {
    padding: 5,
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#333",
    // fontFamily: 'Baloo2-Regular', // Assuming this font is loaded
  },
  content: {
    flexGrow: 1,
    padding: 20,
    alignItems: "center",
  },
  tabletContent: {
    width: "70%",
    alignSelf: "center",
  },
  label: {
    fontSize: 20,
    fontWeight: "700",
    color: "#00695C",
    alignSelf: "flex-start",
    marginTop: 10,
    marginBottom: 15,
    textShadowColor: "rgba(255, 255, 255, 0.5)",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  grid: {
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarOption: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
    margin: 10,
    borderWidth: 3,
    borderColor: "#fff",
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    overflow: "hidden",
  },
  avatarImage: {
    width: "100%",
    height: "100%",
  },
  avatarSelected: {
    borderColor: "#4CAF50",
    borderWidth: 4,
    transform: [{ scale: 1.05 }],
    elevation: 8,
    shadowColor: "#4CAF50",
    shadowOpacity: 0.5,
    shadowRadius: 6,
  },
  selectedOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(76, 175, 80, 0.3)",
    justifyContent: "center",
    alignItems: "center",
  },
  input: {
    width: "100%",
    backgroundColor: "#fff",
    borderRadius: 15,
    padding: 15,
    fontSize: 20,
    borderWidth: 2,
    borderColor: "#ddd",
    marginBottom: 30,
    elevation: 2,
    color: "#333",
  },
  buttonContainer: {
    width: "100%",
    marginTop: 10,
    marginBottom: 40,
  },

  // Registered Styles
  avatarContainer: {
    marginTop: 40,
    marginBottom: 20,
    elevation: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
  avatarCircleLarge: {
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 6,
    borderColor: "#fff",
    overflow: "hidden",
  },
  avatarImageLarge: {
    width: "100%",
    height: "100%",
  },
  usernameRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 30,
    backgroundColor: "rgba(255,255,255,0.6)",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 30,
  },
  usernameDisplay: {
    fontSize: 36,
    fontWeight: "bold",
    color: "#004D40",
    marginRight: 15,
    textShadowColor: "rgba(255,255,255,0.8)",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  editButton: {
    backgroundColor: "#26A69A",
    padding: 8,
    borderRadius: 20,
    elevation: 3,
  },
  infoBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(232, 245, 233, 0.9)",
    padding: 15,
    borderRadius: 12,
    marginBottom: 20,
    width: "100%",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#C8E6C9",
  },
  infoText: {
    fontSize: 16,
    color: "#2E7D32",
    marginLeft: 10,
    fontWeight: "600",
  },
  idContainer: {
    marginTop: 20,
    padding: 15,
    backgroundColor: "rgba(255, 255, 255, 0.5)",
    borderRadius: 8,
    width: "100%",
    alignItems: "center",
  },
  deviceIdLabel: {
    fontSize: 12,
    color: "#555", 
    marginBottom: 4,
  },
  deviceIdText: {
    fontSize: 14,
    color: "#333",
    fontFamily: Platform.OS === "ios" ? "Courier" : "monospace",
  },
});
