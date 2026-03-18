import InstructionButton from "@/components/InstructionButton";
import OfflineGuard from "@/components/OfflineGuard";
import BackButton from "@/components/ui/BackButton";
import { useInstruction } from '@/hooks/useInstruction';
import { playbackService } from "@/services/audio/playback";
import { TTS } from "@/services/audio/tts";
import { ensureMicPermission } from "@/services/mic";
import { addResult } from "@/services/progress";
import { addAttempt } from "@/services/speechlog";
import { speechService } from "@/services/speechService";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useRouter } from 'expo-router';
import * as Speech from "expo-speech";
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, Image, Platform, SafeAreaView, StatusBar, StyleSheet, Text, TouchableOpacity, View, useWindowDimensions } from 'react-native';

type Story = {
  text: string; 
  target: string;
  image: any;
};

function StorySpeak() {
  const router = useRouter();

  const stories: Story[] = useMemo(
    () => [
      { text: "The cat sat on the mat.", target: "cat", image: require("@/assets/storyspeak/cat.png") },
      { text: "I see a big dog.", target: "dog", image: require("@/assets/storyspeak/bigdog.png") },
      { text: "She likes to play.", target: "play", image: require("@/assets/storyspeak/girlplaying.png") },
      { text: "The sun is hot.", target: "sun", image: require("@/assets/storyspeak/hotsun.png") },
      { text: "We go to the park.", target: "park", image: require("@/assets/storyspeak/playpark.png") },
      { text: "The bird can fly.", target: "bird", image: require("@/assets/storyspeak/bird.png") },
      { text: "I like red apples.", target: "apples", image: require("@/assets/storyspeak/redapple.png") },
      { text: "My fish can swim.", target: "fish", image: require("@/assets/storyspeak/fish.png") },
      { text: "The car is fast.", target: "car", image: require("@/assets/storyspeak/racing.png") },
      { text: "I have a blue ball.", target: "ball", image: require("@/assets/storyspeak/blueball.png") },
      { text: "The boy runs fast.", target: "boy", image: require("@/assets/storyspeak/run.png") },
      { text: "The girl reads a book.", target: "book", image: require("@/assets/storyspeak/book.png") },
      { text: "The cow gives milk.", target: "cow", image: require("@/assets/storyspeak/cow.png") },
      { text: "The frog can jump.", target: "frog", image: require("@/assets/storyspeak/frog.png") },
      { text: "The baby drinks milk.", target: "baby", image: require("@/assets/storyspeak/baby.png") },
      { text: "The duck swims in water.", target: "duck", image: require("@/assets/storyspeak/duck.png") },
      { text: "The monkey climbs a tree.", target: "monkey", image: require("@/assets/storyspeak/monkey.png") },
      { text: "The train goes fast.", target: "train", image: require("@/assets/storyspeak/train.png") },
      { text: "The kite flies high.", target: "kite", image: require("@/assets/storyspeak/kite.png") },
      { text: "The flower smells nice.", target: "flower", image: require("@/assets/storyspeak/flower.png") },
    ],
    []
  );  

  const [currentIndex, setCurrentIndex] = useState(0);
  const [mistakes, setMistakes] = useState<Set<number>>(new Set());
  const [recognizedText, setRecognizedText] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [gameCompleted, setGameCompleted] = useState(false);
  const [wordStatus, setWordStatus] = useState<'neutral' | 'correct' | 'incorrect'>('neutral');

  // Instructions
  const { play: playInstruction } = useInstruction(
    'storyspeak',
    "Read the story out loud! Tap the microphone and read the highlighted word."
  );

  useFocusEffect(
    useCallback(() => {
      return () => {
        Speech.stop();
      };
    }, [])
  );

  const currentStory = stories[currentIndex];

  const playSound = async (type: 'correct' | 'wrong') => {
    if (type === 'correct') {
      playbackService.playSound('correct');
    } else {
      playbackService.playSound('incorrect');
    }
  };

  const handleSpeechResult = async (result: { transcript: string; confidence: number }) => {
      const spoken = result.transcript.toLowerCase();
      setRecognizedText(spoken);

      // Check if the spoken text contains the target word
      if (speechService.checkWord(result, currentStory.target)) {
        setWordStatus('correct');
        playSound('correct');
        TTS.speak('Correct!', { rate: 0.9, pitch: 1.1 });
        addAttempt({ activityId: "storyspeak", text: spoken, success: true });
        
        // Delay alert slightly to show visual feedback
        setTimeout(() => {
          Alert.alert('✅ Correct!', `You read the word “${currentStory.target}”!`, [
            {
              text: currentIndex < stories.length - 1 ? 'Next' : 'Finish',
              onPress: async () => {
                if (currentIndex < stories.length - 1) {
                  setCurrentIndex(currentIndex + 1);
                  setRecognizedText('');
                  setWordStatus('neutral');
                } else {
                  setGameCompleted(true);
                  const score = 10 - mistakes.size;
                  await addResult({
                    activityId: "storyspeak",
                    category: "game",
                    score: Math.max(0, score),
                    maxScore: 10,
                    completed: true,
                  });
                  
                  Alert.alert(
                    "Game Over!",
                    `You scored ${score} / 10`,
                    [{ text: "Exit", onPress: handleExit }]
                  );
                }
              },
            },
          ]);
        }, 500);
      } else {
        setMistakes(prev => new Set(prev).add(currentIndex));
        setWordStatus('incorrect');
        playSound('wrong');
        TTS.speak('Try again.', { rate: 0.9, pitch: 1.1 });
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
  };

  useEffect(() => {
    return () => {
       speechService.stopRecording();
    };
  }, []);

  const startListening = async () => {
    if (isListening) return; // Prevent double start

    try {
      const allowed = await ensureMicPermission();
      if (!allowed) return;
      
      setRecognizedText('');
      setWordStatus('neutral');
      setIsListening(true);
      
      const started = await speechService.startRecording();
      if (!started) {
        setIsListening(false);
        Alert.alert("Error", "Could not start microphone");
      }
    } catch (e) {
      console.error('Start error:', e);
      setIsListening(false);
    }
  };

  const stopListening = async () => {
    if (!isListening) return; // Prevent double stop

    try {
      setIsListening(false);
      const uri = await speechService.stopRecording();
      
      if (uri) {
        const result = await speechService.recognizeSpeech(uri);
        handleSpeechResult(result);
      }
    } catch (e) {
      console.error('Stop error:', e);
      setIsListening(false);
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
            <Text 
              key={index} 
              style={[
                styles.highlightedWord,
                wordStatus === 'correct' && styles.wordCorrect,
                wordStatus === 'incorrect' && styles.wordIncorrect
              ]} 
              onPress={startListening}
            >
              {part}
            </Text>
          ) : (
            <Text key={index}>{part}</Text>
          )
        )}
      </Text>
    );
  };

  const { width } = useWindowDimensions();
  const isCompact = width < 600;
  
  // Responsive sizing
  const micSize = isCompact ? 70 : 100;
  const imageSize = isCompact ? 120 : 180;
  const titleSize = isCompact ? 24 : 32;

  return (
    <SafeAreaView style={styles.safeArea}>
      <OfflineGuard>
      <View style={styles.header}>
        <BackButton targetRoute="/games" color="#0277BD" />

        <InstructionButton onPress={playInstruction} />
        
        <TouchableOpacity style={styles.navButton} onPress={handleExit}>
          <Text style={styles.navButtonText}>Exit</Text>
          <Ionicons name="close-circle" size={28} color="#D81B60" />
        </TouchableOpacity>
      </View>

      <View style={styles.mainContainer}>
        {!gameCompleted ? (
          <View style={[styles.card, { flexDirection: 'column' }]}>
            {/* Card Header Label */}
            <Text style={styles.cardLabel}>Reading Practice</Text>
            
            {/* Main Sentence Area (Top) */}
            <View style={styles.sentenceContainer}>
              {renderStoryText()}
            </View>

            {/* Split Content Area */}
            <View style={[styles.contentRow, { flexDirection: isCompact ? 'column-reverse' : 'row' }]}>
              {/* Left: Interaction */}
              <View style={[styles.leftColumn, isCompact && { paddingRight: 0, borderRightWidth: 0, marginTop: 20 }]}>
                <Text style={styles.instructionText}>
                  Read the highlighted word:
                </Text>
                
                <TouchableOpacity
                  style={[styles.micButton, isListening && styles.micButtonActive, { width: micSize, height: micSize, borderRadius: micSize / 2 }]}
                  onPress={isListening ? stopListening : startListening}
                >
                  <Ionicons name={isListening ? "mic" : "mic-outline"} size={micSize * 0.5} color="white" />
                </TouchableOpacity>
                <Text style={styles.micLabel}>
                  {isListening ? "Listening..." : "Tap to Speak"}
                </Text>

                {recognizedText !== '' && (
                  <View style={styles.feedbackContainer}>
                    <Text style={styles.feedbackLabel}>You said:</Text>
                    <Text style={styles.feedbackText}>&quot;{recognizedText}&quot;</Text>
                  </View>
                )}
              </View>

              {/* Right: Image */}
              <View style={[styles.rightColumn, isCompact && { borderLeftWidth: 0, borderBottomWidth: 1, borderBottomColor: '#EEEEEE', paddingBottom: 20 }]}>
                <View style={[styles.imagePlaceholder, { width: imageSize, height: imageSize }]}>
                   <Image source={currentStory.image} style={{ width: imageSize * 0.8, height: imageSize * 0.8 }} resizeMode="contain" />
                </View>
              </View>
            </View>
          </View>
        ) : (
          <View style={[styles.card, styles.centerContent]}>
            <Text style={[styles.congrats, { fontSize: titleSize }]}>🎉 Awesome Job!</Text>
            <Text style={styles.congratsSub}>You finished the story!</Text>
            <TouchableOpacity style={styles.button} onPress={handleExit}>
               <Text style={styles.buttonText}>Back to Games</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
      </OfflineGuard>
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
    color: '#333', // Dark text for sentence
    fontWeight: 'bold',
    lineHeight: 40,
  },
  highlightedWord: {
    color: '#1976D2', // Blue for target word
    textDecorationLine: 'underline',
    backgroundColor: '#E3F2FD', 
  },
  wordCorrect: {
    color: '#2E7D32',
    backgroundColor: '#E8F5E9',
    textDecorationLine: 'none',
  },
  wordIncorrect: {
    color: '#C62828',
    backgroundColor: '#FFEBEE',
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
