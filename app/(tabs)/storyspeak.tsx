import { ensureMicPermission } from "@/services/mic";
import { addResult } from "@/services/progress";
import { addAttempt } from "@/services/speechlog";
import { speakCorrection, speakPraise } from "@/services/voiceFeedback";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import Voice from '@react-native-voice/voice';
import { Audio } from 'expo-av';
import { useRouter } from 'expo-router';
import * as Speech from "expo-speech";
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, Platform, SafeAreaView, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

type Story = {
  text: string;
  target: string;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
};

type SpeechResultsEvent = { value?: string[] }; 

function StorySpeak() {
  const router = useRouter();

  const stories: Story[] = useMemo(
    () => [
      { text: "The cat sat on the mat.", target: "cat", icon: "cat" },
      { text: "I see a big dog.", target: "dog", icon: "dog" },
      { text: "She likes to play.", target: "play", icon: "gamepad-variant" },
      { text: "The sun is hot.", target: "sun", icon: "white-balance-sunny" },
      { text: "We go to the park.", target: "park", icon: "pine-tree" },
    ],
    []
  );

  const [currentIndex, setCurrentIndex] = useState(0);
  const [recognizedText, setRecognizedText] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [gameCompleted, setGameCompleted] = useState(false);

  const currentStory = stories[currentIndex];

  const playSound = async (type: 'correct' | 'wrong') => {
    try {
      const file = type === 'correct' 
        ? require('@/assets/music/feedback/correct.mp3')
        : require('@/assets/music/feedback/wrong.mp3');
        
      const { sound } = await Audio.Sound.createAsync(file);
      await sound.playAsync();
      sound.setOnPlaybackStatusUpdate(async (status) => {
        if (status.isLoaded && status.didJustFinish) {
          await sound.unloadAsync();
        }
      });
    } catch (error) {
      console.log('Error playing sound:', error);
    }
  };

  const onSpeechResults = useCallback((event: SpeechResultsEvent) => {
    if (event.value && event.value.length > 0) {
      const spoken = event.value[0].toLowerCase();
      setRecognizedText(spoken);

      // Check if the spoken text contains the target word
      if (spoken.includes(currentStory.target.toLowerCase())) {
        playSound('correct');
        speakPraise(`Great reading! You read ${currentStory.target} correctly.`);
        addAttempt({ activityId: "storyspeak", text: spoken, success: true });
        
        Alert.alert('✅ Correct!', `You read the word “${currentStory.target}”!`, [
          {
            text: currentIndex < stories.length - 1 ? 'Next' : 'Finish',
            onPress: async () => {
              if (currentIndex < stories.length - 1) {
                setCurrentIndex(currentIndex + 1);
                setRecognizedText('');
              } else {
                setGameCompleted(true);
                await addResult({
                  activityId: "storyspeak",
                  category: "game",
                  score: 100,
                  maxScore: 100,
                  completed: true,
                });
              }
            },
          },
        ]);
      } else {
        playSound('wrong');
        speakCorrection(`Try again. Read the word ${currentStory.target}.`);
        addAttempt({ activityId: "storyspeak", text: spoken, success: false });
        
        Alert.alert('❌ Try Again', `You said “${spoken}”. Try reading “${currentStory.target}” again!`, [
          {
            text: 'Try Again',
            onPress: startListening,
          },
          {
            text: 'Cancel',
            style: 'cancel',
          },
        ]);
      }
    }
  }, [currentStory, currentIndex, stories]);

  useEffect(() => {
    ensureMicPermission();

    Voice.onSpeechResults = onSpeechResults;
    Voice.onSpeechEnd = () => setIsListening(false);
    Voice.onSpeechError = (e) => {
      setIsListening(false);
      console.error(e);
    };

    return () => {
      Voice.destroy().then(Voice.removeAllListeners);
    };
  }, [onSpeechResults]);

  const startListening = async () => {
    try {
      const allowed = await ensureMicPermission();
      if (!allowed) return;
      setRecognizedText('');
      setIsListening(true);
      await Voice.start('en-US');
    } catch (e) {
      console.error('Start error:', e);
    }
  };

  const stopListening = async () => {
    try {
      await Voice.stop();
      setIsListening(false);
    } catch (e) {
      console.error('Stop error:', e);
    }
  };

  const handleExit = () => {
    stopListening();
    Speech.stop();
    router.navigate('/games');
  };

  // Helper to render story with highlighted word
  const renderStoryText = () => {
    const parts = currentStory.text.split(new RegExp(`(${currentStory.target})`, 'gi'));
    return (
      <Text style={styles.storyText}>
        {parts.map((part, index) => 
          part.toLowerCase() === currentStory.target.toLowerCase() ? (
            <Text key={index} style={styles.highlightedWord} onPress={startListening}>
              {part}
            </Text>
          ) : (
            <Text key={index}>{part}</Text>
          )
        )}
      </Text>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.navButton} onPress={handleExit}>
          <Ionicons name="arrow-back" size={28} color="#6A1B9A" />
          <Text style={styles.navButtonText}>Back</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.navButton} onPress={handleExit}>
          <Text style={styles.navButtonText}>Exit</Text>
          <Ionicons name="close-circle" size={28} color="#D81B60" />
        </TouchableOpacity>
      </View>

      <View style={styles.mainContainer}>
        {!gameCompleted ? (
          <View style={styles.card}>
            {/* Card Header Label */}
            <Text style={styles.cardLabel}>Reading Practice</Text>
            
            {/* Main Sentence Area (Top) */}
            <View style={styles.sentenceContainer}>
              {renderStoryText()}
            </View>

            {/* Split Content Area */}
            <View style={styles.contentRow}>
              {/* Left: Interaction */}
              <View style={styles.leftColumn}>
                <Text style={styles.instructionText}>
                  Read the highlighted word:
                </Text>
                
                <TouchableOpacity
                  style={[styles.micButton, isListening && styles.micButtonActive]}
                  onPress={isListening ? stopListening : startListening}
                >
                  <Ionicons name={isListening ? "mic" : "mic-outline"} size={40} color="white" />
                </TouchableOpacity>
                <Text style={styles.micLabel}>
                  {isListening ? "Listening..." : "Tap to Speak"}
                </Text>

                {recognizedText !== '' && (
                  <View style={styles.feedbackContainer}>
                    <Text style={styles.feedbackLabel}>You said:</Text>
                    <Text style={styles.feedbackText}>"{recognizedText}"</Text>
                  </View>
                )}
              </View>

              {/* Right: Icon/Image */}
              <View style={styles.rightColumn}>
                <View style={styles.imagePlaceholder}>
                   <MaterialCommunityIcons name={currentStory.icon} size={100} color="#FF7043" />
                </View>
              </View>
            </View>
          </View>
        ) : (
          <View style={[styles.card, styles.centerContent]}>
            <Text style={styles.congrats}>🎉 Awesome Job!</Text>
            <Text style={styles.congratsSub}>You finished the story!</Text>
            <TouchableOpacity style={styles.button} onPress={handleExit}>
               <Text style={styles.buttonText}>Back to Games</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

export default StorySpeak;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#E1F5FE', // Light blue background
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 10,
    alignItems: 'center',
    zIndex: 10,
  },
  navButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.8)',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    gap: 5,
  },
  navButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0277BD',
  },
  mainContainer: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
    backgroundColor: 'white',
    width: '100%',
    maxWidth: 600,
    borderRadius: 20,
    borderWidth: 4,
    borderColor: '#F44336', // Red border
    padding: 20,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    minHeight: 400,
  },
  cardLabel: {
    fontFamily: Platform.OS === 'ios' ? 'Chalkboard SE' : 'sans-serif',
    fontSize: 16,
    color: '#F44336',
    marginBottom: 10,
    fontWeight: 'bold',
  },
  sentenceContainer: {
    marginBottom: 30,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#FFCDD2',
    paddingBottom: 20,
  },
  storyText: {
    fontSize: 32,
    textAlign: 'center',
    color: '#D32F2F', // Red text for sentence
    fontWeight: 'bold',
    lineHeight: 40,
  },
  highlightedWord: {
    color: '#D32F2F', 
    textDecorationLine: 'underline',
    backgroundColor: '#FFEBEE', // Subtle highlight background
  },
  contentRow: {
    flexDirection: 'row',
    flex: 1,
  },
  leftColumn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingRight: 10,
  },
  rightColumn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderLeftWidth: 1,
    borderLeftColor: '#EEEEEE',
  },
  instructionText: {
    fontSize: 18,
    color: '#333',
    marginBottom: 20,
    textAlign: 'center',
  },
  micButton: {
    backgroundColor: '#03A9F4',
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
    elevation: 3,
  },
  micButtonActive: {
    backgroundColor: '#F44336',
    transform: [{ scale: 1.1 }],
  },
  micLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 15,
  },
  imagePlaceholder: {
    width: 150,
    height: 150,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFF3E0',
    borderRadius: 10,
  },
  feedbackContainer: {
    marginTop: 10,
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    padding: 10,
    borderRadius: 8,
    width: '100%',
  },
  feedbackLabel: {
    fontSize: 12,
    color: '#757575',
  },
  feedbackText: {
    fontSize: 16,
    color: '#333',
    fontWeight: 'bold',
    fontStyle: 'italic',
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  congrats: {
    fontSize: 32,
    color: '#4CAF50',
    fontWeight: 'bold',
    marginBottom: 10,
  },
  congratsSub: {
    fontSize: 18,
    color: '#555',
    marginBottom: 30,
  },
  button: {
    backgroundColor: '#03A9F4',
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 25,
  },
  buttonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
});
