import { settingsService } from '@/services/settings';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Modal, StyleSheet, Switch, Text, TouchableOpacity, TouchableWithoutFeedback, View } from 'react-native';

interface SettingsModalProps {
  visible: boolean;
  onClose: () => void;
}

export default function SettingsModal({ visible, onClose }: SettingsModalProps) {
  const router = useRouter();
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [musicEnabled, setMusicEnabled] = useState(true);

  useEffect(() => {
    if (visible) {
      loadSettings();
    }
  }, [visible]);

  const loadSettings = async () => {
    const s = await settingsService.isSoundEnabled();
    const m = await settingsService.isMusicEnabled();
    setSoundEnabled(s);
    setMusicEnabled(m);
  };

  const toggleSound = async (value: boolean) => {
    setSoundEnabled(value);
    await settingsService.setSoundEnabled(value);
  };

  const toggleMusic = async (value: boolean) => {
    setMusicEnabled(value);
    await settingsService.setMusicEnabled(value);
  };

  const handleProfilePress = () => {
    onClose();
    router.push('/profile');
  };

  return (
    <Modal
      transparent={true}
      visible={visible}
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback>
            <View style={styles.popup}>
              {/* Header with Close Button */}
              <View style={styles.header}>
                <Text style={styles.title}>Settings</Text>
                <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                  <Ionicons name="close" size={28} color="#666" />
                </TouchableOpacity>
              </View>

              {/* Profile Option */}
              <TouchableOpacity style={styles.row} onPress={handleProfilePress}>
                <View style={styles.rowLeft}>
                  <Ionicons name="person-circle-outline" size={32} color="#4CAF50" />
                  <Text style={styles.rowText}>Profile</Text>
                </View>
                <Ionicons name="chevron-forward" size={24} color="#999" />
              </TouchableOpacity>

              <View style={styles.divider} />

              {/* Sound Option */}
              <View style={styles.row}>
                <View style={styles.rowLeft}>
                  <Ionicons 
                    name={soundEnabled ? "volume-high" : "volume-mute"} 
                    size={32} 
                    color="#FF9800" 
                  />
                  <Text style={styles.rowText}>Sound</Text>
                </View>
                <Switch
                  value={soundEnabled}
                  onValueChange={toggleSound}
                  trackColor={{ false: "#e0e0e0", true: "#FFCC80" }}
                  thumbColor={soundEnabled ? "#FF9800" : "#f4f3f4"}
                />
              </View>

              <View style={styles.divider} />

              {/* Music Option */}
              <View style={styles.row}>
                <View style={styles.rowLeft}>
                  <Ionicons 
                    name={musicEnabled ? "musical-notes" : "musical-note-outline"} 
                    size={32} 
                    color="#2196F3" 
                  />
                  <Text style={styles.rowText}>Music</Text>
                </View>
                <Switch
                  value={musicEnabled}
                  onValueChange={toggleMusic}
                  trackColor={{ false: "#e0e0e0", true: "#90CAF9" }}
                  thumbColor={musicEnabled ? "#2196F3" : "#f4f3f4"}
                />
              </View>

            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  popup: {
    width: '85%',
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 20,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  closeButton: {
    padding: 5,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 15,
  },
  rowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 15,
  },
  rowText: {
    fontSize: 18,
    color: '#333',
    fontWeight: '500',
  },
  divider: {
    height: 1,
    backgroundColor: '#eee',
    marginVertical: 5,
  },
});
