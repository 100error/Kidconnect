import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Alert, FlatList, Platform, SafeAreaView, StyleSheet, Text, TextInput, TouchableOpacity, View, useWindowDimensions } from 'react-native';
import { UserProfile, profileService } from '@/services/profile';
import GradientButton from '@/components/GradientButton';

const AVATAR_OPTIONS = [
  'person', 'happy', 'skull', 'flower', 'leaf', 'planet', 
  'rocket', 'school', 'star', 'football', 'bicycle', 'paw'
];

export default function ProfileScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isTablet = width > 600;

  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<UserProfile | null>(null);

  // Registration State
  const [username, setUsername] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState<string | null>(null);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const p = await profileService.getProfile();
      setProfile(p);
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
      const newProfile = await profileService.saveProfile(username.trim(), selectedAvatar);
      setProfile(newProfile);
      Alert.alert("Success!", "Profile saved on this device.");
    } catch (e) {
      Alert.alert("Error", "Could not save profile.");
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    router.back();
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <Text>Loading...</Text>
      </View>
    );
  }

  // --- REGISTERED VIEW ---
  if (profile) {
    return (
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
              <Ionicons name={profile.avatarId as any} size={80} color="#fff" />
            </View>
          </View>
          
          <Text style={styles.usernameDisplay}>{profile.username}</Text>
          
          <View style={styles.infoBox}>
            <Ionicons name="checkmark-circle" size={24} color="#4CAF50" />
            <Text style={styles.infoText}>Profile saved on this device</Text>
          </View>

          <View style={styles.idContainer}>
             <Text style={styles.deviceIdLabel}>Device ID:</Text>
             <Text style={styles.deviceIdText} numberOfLines={1} ellipsizeMode="middle">
               {profile.deviceId}
             </Text>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  // --- REGISTRATION VIEW ---
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={28} color="#333" />
        </TouchableOpacity>
        <Text style={styles.title}>Create Profile</Text>
        <View style={{ width: 28 }} />
      </View>

      <View style={[styles.content, isTablet && styles.tabletContent]}>
        <Text style={styles.label}>1. Choose your Avatar</Text>
        
        <FlatList
          data={AVATAR_OPTIONS}
          keyExtractor={(item) => item}
          numColumns={4}
          scrollEnabled={false}
          contentContainerStyle={styles.grid}
          renderItem={({ item }) => (
            <TouchableOpacity 
              onPress={() => setSelectedAvatar(item)}
              style={[
                styles.avatarOption, 
                selectedAvatar === item && styles.avatarSelected
              ]}
            >
              <Ionicons 
                name={item as any} 
                size={32} 
                color={selectedAvatar === item ? "#fff" : "#666"} 
              />
            </TouchableOpacity>
          )}
        />

        <Text style={styles.label}>2. What is your name?</Text>
        <TextInput
          style={styles.input}
          placeholder="Type your name..."
          value={username}
          onChangeText={setUsername}
          maxLength={15}
        />

        <View style={styles.buttonContainer}>
          <GradientButton
            title="Register / Save Profile"
            icon="save"
            colors={["#4CAF50", "#81C784"]}
            onPress={handleRegister}
          />
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#eef7f9',
    paddingTop: Platform.OS === 'android' ? 30 : 0,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  backButton: {
    padding: 5,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
  },
  content: {
    flex: 1,
    padding: 20,
    alignItems: 'center',
  },
  tabletContent: {
    width: '60%',
    alignSelf: 'center',
  },
  label: {
    fontSize: 18,
    fontWeight: '600',
    color: '#00695C',
    alignSelf: 'flex-start',
    marginTop: 20,
    marginBottom: 10,
  },
  grid: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarOption: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    margin: 8,
    borderWidth: 2,
    borderColor: '#ddd',
    elevation: 2,
  },
  avatarSelected: {
    backgroundColor: '#26A69A',
    borderColor: '#004D40',
    transform: [{ scale: 1.1 }],
  },
  input: {
    width: '100%',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
    fontSize: 18,
    borderWidth: 1,
    borderColor: '#ddd',
    marginBottom: 30,
    elevation: 1,
  },
  buttonContainer: {
    width: '100%',
    marginTop: 10,
  },
  
  // Registered Styles
  avatarContainer: {
    marginTop: 40,
    marginBottom: 20,
    elevation: 5,
  },
  avatarCircleLarge: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: '#26A69A',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: '#fff',
  },
  usernameDisplay: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#004D40',
    marginBottom: 30,
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5E9',
    padding: 15,
    borderRadius: 12,
    marginBottom: 20,
    width: '100%',
    justifyContent: 'center',
  },
  infoText: {
    fontSize: 16,
    color: '#2E7D32',
    marginLeft: 10,
    fontWeight: '600',
  },
  idContainer: {
    marginTop: 20,
    padding: 15,
    backgroundColor: 'rgba(0,0,0,0.05)',
    borderRadius: 8,
    width: '100%',
    alignItems: 'center',
  },
  deviceIdLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  deviceIdText: {
    fontSize: 14,
    color: '#333',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
});
