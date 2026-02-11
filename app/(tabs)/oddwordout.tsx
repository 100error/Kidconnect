import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import Voice, { SpeechErrorEvent, SpeechResultsEvent } from '@react-native-voice/voice';
import { Audio } from 'expo-av';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import * as Speech from 'expo-speech';
import React, { useEffect, useState } from 'react';
import {
  Modal,
  Platform,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';

import BackButton from '@/components/ui/BackButton';
import { ensureMicPermission } from '@/services/mic';
import { addResult } from '@/services/progress';

// --- Types ---
type Option = {
  id: string;
  word: string;
  icon: string; // MaterialCommunityIcons name
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
      { id: '1a', word: 'Apple', icon: 'food-apple', isOdd: false },
      { id: '1b', word: 'Banana', icon: 'fruit-cherries', isOdd: false }, // using cherries as generic fruit placeholder
      { id: '1c', word: 'Grapes', icon: 'fruit-grapes', isOdd: false },
      { id: '1d', word: 'Carrot', icon: 'carrot', isOdd: true },
    ]
  },
  {
    id: 'q2',
    options: [
      { id: '2a', word: 'Cat', icon: 'cat', isOdd: false },
      { id: '2b', word: 'Dog', icon: 'dog', isOdd: false },
      { id: '2c', word: 'Cow', icon: 'cow', isOdd: false },
      { id: '2d', word: 'Bus', icon: 'bus', isOdd: true },
    ]
  },
  {
    id: 'q3',
    options: [
      { id: '3a', word: 'Red', icon: 'palette', isOdd: false },
      { id: '3b', word: 'Blue', icon: 'water', isOdd: false },
      { id: '3c', word: 'Green', icon: 'grass', isOdd: false },
      { id: '3d', word: 'Chair', icon: 'chair-school', isOdd: true },
    ]
  },
  {
    id: 'q4',
    options: [
      { id: '4a', word: 'One', icon: 'numeric-1-box', isOdd: false },
      { id: '4b', word: 'Two', icon: 'numeric-2-box', isOdd: false },
      { id: '4c', word: 'Three', icon: 'numeric-3-box', isOdd: false },
      { id: '4d', word: 'A', icon: 'alpha-a-box', isOdd: true },
    ]
  },
  {
    id: 'q5',
    options: [
      { id: '5a', word: 'Eye', icon: 'eye', isOdd: false },
      { id: '5b', word: 'Ear', icon: 'ear-hearing', isOdd: false },
      { id: '5c', word: 'Nose', icon: 'emoticon-outline', isOdd: false },
      { id: '5d', word: 'Shirt', icon: 'tshirt-crew', isOdd: true },
    ]
  },
  {
    id: 'q6',
    options: [
      { id: '6a', word: 'Circle', icon: 'circle-outline', isOdd: false },
      { id: '6b', word: 'Square', icon: 'square-outline', isOdd: false },
      { id: '6c', word: 'Triangle', icon: 'triangle-outline', isOdd: false },
      { id: '6d', word: 'Pizza', icon: 'pizza', isOdd: true },
    ]
  },
  {
    id: 'q7',
    options: [
      { id: '7a', word: 'Sun', icon: 'weather-sunny', isOdd: false },
      { id: '7b', word: 'Rain', icon: 'weather-rainy', isOdd: false },
      { id: '7c', word: 'Snow', icon: 'weather-snowy', isOdd: false },
      { id: '7d', word: 'Pig', icon: 'pig', isOdd: true },
    ]
  },
  {
    id: 'q8',
    options: [
      { id: '8a', word: 'Pen', icon: 'pen', isOdd: false },
      { id: '8b', word: 'Book', icon: 'book-open-variant', isOdd: false },
      { id: '8c', word: 'Desk', icon: 'desk', isOdd: false },
      { id: '8d', word: 'Ball', icon: 'soccer', isOdd: true },
    ]
  },
  {
    id: 'q9',
    options: [
      { id: '9a', word: 'Bed', icon: 'bed', isOdd: false },
      { id: '9b', word: 'Lamp', icon: 'lamp', isOdd: false },
      { id: '9c', word: 'Sofa', icon: 'sofa', isOdd: false },
      { id: '9d', word: 'Tree', icon: 'tree', isOdd: true },
    ]
  },
  {
    id: 'q10',
    options: [
      { id: '10a', word: 'Water', icon: 'water', isOdd: false },
      { id: '10b', word: 'Milk', icon: 'bottle-soda', isOdd: false },
      { id: '10c', word: 'Juice', icon: 'glass-cocktail', isOdd: false },
      { id: '10d', word: 'Bread', icon: 'bread-slice', isOdd: true },
    ]
  },
];

const PASSING_SCORE = 6;
const TOTAL_QUESTIONS = 10;

export default function OddWordOutScreen() {
  const router = useRouter();

  // State
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [selectedOption, setSelectedOption] = useState<Option | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState('Tap the odd word!');
  const [feedbackType, setFeedbackType] = useState<'neutral' | 'success' | 'error'>('neutral');
  const [showResultModal, setShowResultModal] = useState(false);
  
  // Logic helpers
  const currentQuestion = QUESTIONS[currentQIndex];

  // Sounds
  const playSound = async (type: 'correct' | 'wrong') => {
    try {
      const file = type === 'correct' 
        ? require('@/assets/music/feedback/correct.mp3')
        : require('@/assets/music/feedback/wrong.mp3');
      const { sound } = await Audio.Sound.createAsync(file);
      await sound.playAsync();
    } catch (e) {
      console.log('Sound error', e);
    }
  };

  const speak = (text: string) => {
    Speech.stop();
    Speech.speak(text, { rate: 0.9, pitch: 1.1 });
  };

  // --- Voice Setup ---
  useEffect(() => {
    Voice.onSpeechResults = onSpeechResults;
    Voice.onSpeechError = onSpeechError;
    return () => {
      Voice.destroy().then(Voice.removeAllListeners);
    };
  }, [selectedOption]);

  const onSpeechResults = (e: SpeechResultsEvent) => {
    setIsListening(false);
    const spokenText = e.value?.[0] || '';
    handlePronunciationCheck(spokenText);
  };

  const onSpeechError = (e: SpeechErrorEvent) => {
    setIsListening(false);
    setFeedbackMessage('Could not hear you. Try again.');
    setFeedbackType('error');
    speak('Could not hear you. Try again.');
  };

  // --- Game Logic ---

  const handleOptionSelect = (option: Option) => {
    if (isListening) return; // Prevent changing while listening
    setSelectedOption(option);
    setFeedbackMessage(`Now say "${option.word}"`);
    setFeedbackType('neutral');
    speak(`Now say ${option.word}`);
  };

  const startListening = async () => {
    if (!selectedOption) return;
    const allowed = await ensureMicPermission();
    if (!allowed) {
      setFeedbackMessage('Microphone permission needed.');
      return;
    }

    try {
      setFeedbackMessage('Listening...');
      setIsListening(true);
      await Voice.start('en-US');
    } catch (e) {
      console.error(e);
      setIsListening(false);
    }
  };

  const handlePronunciationCheck = (spokenText: string) => {
    if (!selectedOption) return;

    const target = selectedOption.word.toLowerCase();
    const spoken = spokenText.toLowerCase();
    
    // Check if spoken text contains the target word
    if (spoken.includes(target) || spoken === target) {
      if (selectedOption.isOdd) {
        handleCorrectAnswer();
      } else {
        handleWrongChoice();
      }
    } else {
      setFeedbackMessage(`Did you say "${selectedOption.word}"? Try again.`);
      setFeedbackType('error');
      playSound('wrong');
      speak(`Try again. Say ${selectedOption.word}`);
    }
  };

  const handleCorrectAnswer = () => {
    setFeedbackMessage('Great job! That is the odd one!');
    setFeedbackType('success');
    setScore(s => s + 1);
    playSound('correct');
    speak('Great job!');
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    setTimeout(() => {
      nextQuestion();
    }, 1500);
  };

  const handleWrongChoice = () => {
    setFeedbackMessage(`${selectedOption?.word} belongs here! Find the odd one.`);
    setFeedbackType('error');
    playSound('wrong');
    speak(`${selectedOption?.word} belongs here. Try finding the odd one.`);
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
    const finalScore = Math.round((score / TOTAL_QUESTIONS) * 100);
    
    await addResult({
      activityId: 'oddwordout',
      category: 'game',
      score: finalScore,
      maxScore: 100,
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
        
        {/* HEADER */}
        <View style={styles.header}>
          <BackButton targetRoute="/games" />
          <View style={styles.headerContent}>
            <Text style={styles.title}>Odd Word Out</Text>
            <Text style={styles.subtitle}>Tap the word that does not belong.</Text>
          </View>
          <View style={{ width: 40 }} /> 
        </View>

        {/* PROGRESS */}
        <View style={styles.progressContainer}>
          <Text style={styles.progressText}>Question {currentQIndex + 1} / {TOTAL_QUESTIONS}</Text>
          <View style={styles.scoreBadge}>
             <Ionicons name="star" size={16} color="#FFD700" />
             <Text style={styles.scoreText}>{score}</Text>
          </View>
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
                      isSelected && styles.optionSelected
                    ]}
                    onPress={() => handleOptionSelect(opt)}
                    activeOpacity={0.8}
                  >
                    <View style={styles.iconCircle}>
                      <MaterialCommunityIcons 
                        name={opt.icon as any} 
                        size={32} 
                        color={isSelected ? '#FFF' : '#0288D1'} 
                      />
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
                onPress={startListening}
                disabled={isListening}
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

      </SafeAreaView>

      {/* RESULT MODAL */}
      <Modal visible={showResultModal} transparent animationType="fade">
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
    width: '45%', // Fallback for wrap
    aspectRatio: 1, // Square
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
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#E1F5FE',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
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
