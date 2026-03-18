import InstructionButton from "@/components/InstructionButton";
import OfflineGuard from "@/components/OfflineGuard";
import BackButton from '@/components/ui/BackButton';
import { useInstruction } from '@/hooks/useInstruction';
import { playbackService } from '@/services/audio/playback';
import { TTS } from '@/services/audio/tts';
import { ensureMicPermission } from '@/services/mic';
import { addResult } from '@/services/progress';
import { addAttempt } from '@/services/speechlog';
import { speechService } from '@/services/speechService';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect, useRouter } from 'expo-router';
import * as Speech from 'expo-speech';
import React, { useCallback, useEffect, useState } from 'react';
import {
  Modal,
  Platform,
  SafeAreaView,
  StatusBar, 
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
  Image
} from 'react-native';
// --- Types ---
type Option = {
  id: string;
  word: string;
  image: any;
  isOdd: boolean;
};

type Question = {
  id: string;
  options: Option[]; 
};

// --- Data ---
const QUESTIONS: Question[] = [
  {
    id: 'q1',
    options: [
      { id: '1a', word: 'Apple', image: require('@/assets/oddwordout/apple.png'), isOdd: false },
      { id: '1b', word: 'Banana', image: require('@/assets/oddwordout/banana.png'), isOdd: false },
      { id: '1c', word: 'Grapes', image: require('@/assets/oddwordout/grapes.png'), isOdd: false },
      { id: '1d', word: 'Carrot', image: require('@/assets/oddwordout/carrot.png'), isOdd: true },
    ]
  },
  {
    id: 'q2', 
    options: [
      { id: '2a', word: 'Cat', image: require('@/assets/oddwordout/cat.png'), isOdd: false },
      { id: '2b', word: 'Dog', image: require('@/assets/oddwordout/dog.png'), isOdd: false },
      { id: '2c', word: 'Cow', image: require('@/assets/oddwordout/cow.png'), isOdd: false },
      { id: '2d', word: 'Bus', image: require('@/assets/oddwordout/bus.png'), isOdd: true },
    ]
  },
  {
    id: 'q3',
    options: [
      { id: '3a', word: 'Red', image: require('@/assets/oddwordout/red.png'), isOdd: false },
      { id: '3b', word: 'Blue', image: require('@/assets/oddwordout/blue.png'), isOdd: false },
      { id: '3c', word: 'Green', image: require('@/assets/oddwordout/green.png'), isOdd: false },
      { id: '3d', word: 'Chair', image: require('@/assets/oddwordout/chair.png'), isOdd: true },
    ]
  },
  {
    id: 'q4',
    options: [
      { id: '4a', word: 'One', image: require('@/assets/oddwordout/one.png'), isOdd: false },
      { id: '4b', word: 'Two', image: require('@/assets/oddwordout/two.png'), isOdd: false },
      { id: '4c', word: 'Three', image: require('@/assets/oddwordout/3.png'), isOdd: false },
      { id: '4d', word: 'A', image: require('@/assets/oddwordout/alphabet.png'), isOdd: true },
    ]
  },
  {
    id: 'q5',
    options: [
      { id: '5a', word: 'Eyes', image: require('@/assets/oddwordout/eyes.png'), isOdd: false },
      { id: '5b', word: 'Ear', image: require('@/assets/oddwordout/ear.png'), isOdd: false },
      { id: '5c', word: 'Nose', image: require('@/assets/oddwordout/nose.png'), isOdd: false },
      { id: '5d', word: 'Shirt', image: require('@/assets/oddwordout/shirt.png'), isOdd: true },
    ]
  },
  {
    id: 'q6',
    options: [
      { id: '6a', word: 'Circle', image: require('@/assets/oddwordout/circle.png'), isOdd: false },
      { id: '6b', word: 'Square', image: require('@/assets/oddwordout/square.png'), isOdd: false },
      { id: '6c', word: 'Triangle', image: require('@/assets/oddwordout/triangle.png'), isOdd: false },
      { id: '6d', word: 'Pizza', image: require('@/assets/oddwordout/pizza.png'), 
      isOdd: true },
    ]
  },
  {
    id: 'q7',
    options: [
      { id: '7a', word: 'Sun', image: require('@/assets/oddwordout/sun.png'), isOdd: false },
      { id: '7b', word: 'Rain', image: require('@/assets/oddwordout/rain.png'), isOdd: false },
      { id: '7c', word: 'Snow', image: require('@/assets/oddwordout/snow.png'), isOdd: false },
      { id: '7d', word: 'Pig', image: require('@/assets/oddwordout/pig.png'), isOdd: true },
    ]
  },
  {
    id: 'q8',
    options: [
      { id: '8a', word: 'Pen', image: require('@/assets/oddwordout/pen.png'), isOdd: false },
      { id: '8b', word: 'Book', image: require('@/assets/oddwordout/book.png'), isOdd: false },
      { id: '8c', word: 'Desk', image: require('@/assets/oddwordout/desk.png'), isOdd: false },
      { id: '8d', word: 'Ball', image: require('@/assets/oddwordout/ball.png'), isOdd: true },
    ]
  },
  {
    id: 'q9',
    options: [
      { id: '9a', word: 'Bed', image: require('@/assets/oddwordout/bed.png'), isOdd: false },
      { id: '9b', word: 'Lamp', image: require('@/assets/oddwordout/lamp.png'), isOdd: false },
      { id: '9c', word: 'Sofa', image: require('@/assets/oddwordout/sofa.png'), isOdd: false },
      { id: '9d', word: 'Tree', image: require('@/assets/oddwordout/tree.png'), isOdd: true },
    ]
  }, 
  {
    id: 'q10',
    options: [
      { id: '10a', word: 'Water', image: require('@/assets/oddwordout/water.png'), isOdd: false },
      { id: '10b', word: 'Milk', image: require('@/assets/oddwordout/milk.png'), isOdd: false },
      { id: '10c', word: 'Juice', image: require('@/assets/oddwordout/juice.png'), isOdd: false },
      { id: '10d', word: 'Breads', image: require('@/assets/oddwordout/breads.png'), isOdd: true },
    ]
  },
];

const PASSING_SCORE = 6;
const TOTAL_QUESTIONS = 10;

export default function OddWordOutScreen() {
  const router = useRouter();
  const { width, height } = useWindowDimensions();
  const isTablet = width > 600;
  const numColumns = isTablet ? 4 : 2;
  const gap = 10;
  const screenPadding = 16;
  const cardPadding = 20;
  const totalPadding = (screenPadding * 2) + (cardPadding * 2);
  
  // Responsive calculations
  const optionWidth = (width - totalPadding - (gap * (numColumns - 1))) / numColumns;
  const optionHeight = optionWidth * 1.2; // Maintain aspect ratio

  // State
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [selectedOption, setSelectedOption] = useState<Option | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState('Tap the odd word!');
  const [feedbackType, setFeedbackType] = useState<'neutral' | 'success' | 'error'>('neutral');
  const [showResultModal, setShowResultModal] = useState(false);
  
  // Instructions
  const { play: playInstruction } = useInstruction(
    'oddwordout',
    "Find the odd one out! Look at the pictures and tap the one that doesn't belong."
  );

  useFocusEffect(
    useCallback(() => {
      return () => {
        Speech.stop();
      };
    }, [])
  );

  // Logic helpers
  const currentQuestion = QUESTIONS[currentQIndex];

  // Sounds
  const playSound = async (type: 'correct' | 'wrong') => {
    if (type === 'correct') {
      playbackService.playSound('correct');
    } else {
      playbackService.playSound('incorrect');
    }
  };

  const speak = (text: string) => {
    TTS.speak(text, { rate: 0.9, pitch: 1.1 });
  };

  // --- Voice Setup ---
  useEffect(() => {
    return () => {
      speechService.stopRecording();
    };
  }, []);

  // --- Game Logic ---

  const handleOptionSelect = (option: Option) => {
    if (isListening) return; // Prevent changing while listening
    setSelectedOption(option);
    setFeedbackMessage(`Now say "${option.word}"`);
    setFeedbackType('neutral');
    speak(`Now say ${option.word}`);
  };

  const handleMicPress = () => {
    if (isListening) {
      handleStopAndEvaluate();
    } else {
      toggleListening();
    }
  };

  const toggleListening = async () => {
    if (!selectedOption) return;

    if (isListening) {
      // Prevent double stop if already processing
      return; 
    }

    // Start
    const allowed = await ensureMicPermission();
    if (!allowed) {
      setFeedbackMessage('Microphone permission needed.');
      return;
    }

    try {
      setFeedbackMessage('Listening...');
      setIsListening(true);
      await speechService.startRecording();
    } catch (e) {
      console.error(e);
      setIsListening(false);
    }
  };

  const handleStopAndEvaluate = async () => {
     if (!isListening) return;

     setIsListening(false);
     try {
       const uri = await speechService.stopRecording();
       if (uri) {
          const result = await speechService.recognizeSpeech(uri);
          handlePronunciationCheck(result);
       }
     } catch (e) {
       console.error(e);
       setFeedbackMessage('Could not hear you. Try again.');
       setFeedbackType('error');
     }
  };

  const handlePronunciationCheck = (result: { transcript: string; confidence: number }) => {
    if (!selectedOption) return;

    const target = selectedOption.word
      .toLowerCase()
      .replace(/[^\w\s]/g, '')
      .trim();

    const spoken = result.transcript
      ?.toLowerCase()
      .replace(/[^\w\s]/g, '')
      .trim();

    console.log("Spoken:", spoken, "Target:", target, "Confidence:", result.confidence);

    // 1️⃣ First: pronunciation check ONLY
    const pronouncedCorrectly = speechService.checkWord(result, target);

    // Log attempt
    addAttempt({ activityId: 'oddwordout', text: spoken || '', success: pronouncedCorrectly });

    if (!pronouncedCorrectly) {
      setFeedbackMessage(`Try again. Say "${selectedOption.word}"`);
      setFeedbackType('error');
      playSound('wrong');
      speak(`Try again. Say ${selectedOption.word}`);
      return;
    }

    // 2️⃣ Then: game logic
    if (selectedOption.isOdd) {
      handleCorrectAnswer();
    } else {
      handleWrongChoice();
    }
  };

  const handleCorrectAnswer = () => {
    setFeedbackMessage('Great job! That is the odd one!');
    setFeedbackType('success');
    setScore(s => s + 1);
    playSound('correct');
    TTS.speak('Correct!', { rate: 0.9, pitch: 1.1 });
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    setTimeout(() => {
      nextQuestion();
    }, 1500);
  };

  const handleWrongChoice = () => {
    setFeedbackMessage(`${selectedOption?.word} belongs here! Find the odd one.`);
    setFeedbackType('error');
    playSound('wrong');
    TTS.speak('Try again.', { rate: 0.9, pitch: 1.1 });
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    // Allow retry, do not advance
    setSelectedOption(null);
  };

  const nextQuestion = () => {
    if (currentQIndex < TOTAL_QUESTIONS - 1) {
      setCurrentQIndex(prev => prev + 1);
      setSelectedOption(null);
      setFeedbackMessage('Tap the odd word!');
      setFeedbackType('neutral');
    } else {
      finishGame();
    }
  };

  const finishGame = () => {
    setShowResultModal(true);
  };

  const saveAndExit = async () => {
    await addResult({
      activityId: 'oddwordout',
      category: 'game',
      score: score,
      maxScore: TOTAL_QUESTIONS,
      completed: true
    });
    
    router.dismissAll();
    router.replace('/games');
  };

  const handleRetryGame = () => {
    setShowResultModal(false);
    setCurrentQIndex(0);
    setScore(0);
    setSelectedOption(null);
    setFeedbackMessage('Tap the odd word!');
    setFeedbackType('neutral');
  };

  // --- Render ---

  return (
    <LinearGradient colors={['#E0F7FA', '#E1F5FE']} style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <OfflineGuard>
          {/* HEADER */}
          <View style={styles.header}>
            <BackButton targetRoute="/games" />
            <View style={styles.headerContent}>
              <Text style={styles.title}>Odd Word Out</Text>
              <Text style={styles.subtitle}>Tap the word that does not belong.</Text>
            </View>
            <InstructionButton onPress={playInstruction} />
          </View>

          {/* PROGRESS */}
          <View style={styles.progressContainer}>
            <Text style={styles.progressText}>Question {currentQIndex + 1} / {TOTAL_QUESTIONS}</Text>
          </View>

          {/* MAIN CONTENT */}
          <View style={styles.content}>
            
            {/* QUESTION CARD */}
            <View style={styles.card}>
              <View style={styles.optionsRow}>
                {currentQuestion.options.map((opt) => {
                  const isSelected = selectedOption?.id === opt.id;
                  return (
                    <TouchableOpacity
                      key={opt.id}
                      style={[
                        styles.optionButton,
                        { width: optionWidth, height: optionHeight },
                        isSelected && styles.optionSelected
                      ]}
                      onPress={() => handleOptionSelect(opt)}
                      activeOpacity={0.8}
                    >
                      <View style={styles.iconCircle}>
                        <Image source={opt.image} style={styles.optionImage} resizeMode="contain" />
                      </View>
                      <Text style={[
                        styles.optionText,
                        isSelected && styles.optionTextSelected
                      ]}>
                        {opt.word}
                      </Text>
                      {isSelected && (
                         <View style={styles.checkBadge}>
                           <Ionicons name="checkmark" size={12} color="#FFF" />
                         </View>
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* FEEDBACK / MIC SECTION */}
            <View style={styles.bottomSection}>
              <Text style={[
                styles.feedbackText, 
                feedbackType === 'error' && styles.textError,
                feedbackType === 'success' && styles.textSuccess
              ]}>
                {feedbackMessage}
              </Text>

              {selectedOption && !showResultModal && (
                <TouchableOpacity
                  style={[styles.micButton, isListening && styles.micActive]}
                  onPress={handleMicPress}
                >
                  <Ionicons 
                    name={isListening ? "mic" : "mic-outline"} 
                    size={40} 
                    color="white" 
                  />
                  {isListening && (
                    <View style={styles.pulseRing} />
                  )}
                </TouchableOpacity>
              )}
            </View>

          </View>
        </OfflineGuard>
      </SafeAreaView>

      {/* RESULT MODAL */}
      <Modal visible={showResultModal} transparent animationType="fade" onRequestClose={saveAndExit}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Game Over!</Text>
            
            <View style={styles.resultCircle}>
              <Text style={styles.resultScore}>{score} / {TOTAL_QUESTIONS}</Text>
            </View>

            <Text style={styles.modalMessage}>
              {score >= PASSING_SCORE ? "Awesome Job!" : "Keep Practicing!"}
            </Text>

            <TouchableOpacity style={styles.modalButton} onPress={handleRetryGame}>
              <LinearGradient colors={['#4FC3F7', '#039BE5']} style={styles.gradientBtn}>
                <Ionicons name="refresh" size={24} color="white" />
                <Text style={styles.btnText}>Try Again</Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.modalButton, { marginTop: 10 }]} onPress={saveAndExit}>
              <View style={styles.outlineBtn}>
                <Ionicons name="exit-outline" size={24} color="#555" />
                <Text style={[styles.btnText, { color: '#555' }]}>Exit</Text>
              </View>
            </TouchableOpacity>

          </View>
        </View>
      </Modal>

    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  headerContent: {
    alignItems: 'center',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#01579B',
  },
  subtitle: {
    fontSize: 14,
    color: '#0277BD',
    marginTop: 2,
  },
  progressContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    marginBottom: 10,
    alignItems: 'center',
  },
  progressText: {
    fontSize: 16,
    color: '#555',
    fontWeight: '600',
  },
  scoreBadge: {
    flexDirection: 'row',
    backgroundColor: '#FFF',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    alignItems: 'center',
    gap: 4,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  scoreText: {
    fontWeight: 'bold',
    color: '#333',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 24,
    padding: 20,
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    marginBottom: 30,
  },
  optionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
    gap: 10,
  },
  optionButton: {
    // width handled dynamically
    // aspectRatio handled dynamically or via height
    backgroundColor: '#F5F5F5',
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
    marginBottom: 10,
  },
  optionSelected: {
    backgroundColor: '#0288D1',
    borderColor: '#01579B',
  },
  iconCircle: {
    // dimensions handled dynamically
    backgroundColor: '#E1F5FE',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  optionImage: {
    width: 48,
    height: 48,
  },
  optionText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  optionTextSelected: {
    color: 'white',
  },
  checkBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#4CAF50',
    borderRadius: 10,
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bottomSection: {
    alignItems: 'center',
    height: 150, // Fixed height to prevent layout jumps
    justifyContent: 'flex-start',
  },
  feedbackText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0277BD',
    marginBottom: 20,
    textAlign: 'center',
  },
  textError: {
    color: '#D32F2F',
  },
  textSuccess: {
    color: '#388E3C',
  },
  micButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#03A9F4',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 6,
  },
  micActive: {
    backgroundColor: '#D32F2F',
  },
  pulseRing: {
    position: 'absolute',
    width: 90,
    height: 90,
    borderRadius: 45,
    borderWidth: 2,
    borderColor: '#FFCDD2',
    opacity: 0.6,
  },
  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCard: {
    width: '80%',
    backgroundColor: 'white',
    borderRadius: 24,
    padding: 30,
    alignItems: 'center',
    elevation: 10,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#01579B',
    marginBottom: 20,
  },
  resultCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#E1F5FE',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    borderWidth: 4,
    borderColor: '#03A9F4',
  },
  resultScore: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#0277BD',
  },
  modalMessage: {
    fontSize: 18,
    color: '#555',
    marginBottom: 24,
    textAlign: 'center',
  },
  modalButton: {
    width: '100%',
    height: 50,
    borderRadius: 25,
    overflow: 'hidden',
  },
  gradientBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  outlineBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    borderWidth: 2,
    borderColor: '#DDD',
    borderRadius: 25,
  },
  btnText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
  },
});
