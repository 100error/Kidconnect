import BackButton from '@/components/ui/BackButton';
import InstructionModal from "@/components/InstructionModal";
import { checkInstructionSeen, markInstructionSeen } from "@/services/instructions";
import { addResult } from '@/services/progress';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import * as Speech from 'expo-speech';
import React, { useEffect, useState } from 'react';
import { Modal, Platform, SafeAreaView, ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

// ----------------------------------------------------------------------------
// TYPES & DATA
// ----------------------------------------------------------------------------

type Question = {
  id: string;
  part1: string;
  part2: string;
  options: [string, string];
  correct: string;
  icon: keyof typeof Ionicons.glyphMap;
};

const questions: Question[] = [
  { 
    id: '1', 
    part1: 'She', 
    part2: 'dinner with her grandparents every Monday.', 
    options: ['has', 'have'], 
    correct: 'has',
    icon: 'restaurant'
  },
  { 
    id: '2', 
    part1: 'Gemma', 
    part2: 'going to school.', 
    options: ['enjoy', 'enjoys'], 
    correct: 'enjoys',
    icon: 'school'
  },
  { 
    id: '3', 
    part1: 'Her dogs', 
    part2: 'at the postman when he comes.', 
    options: ['bark', 'barks'], 
    correct: 'bark',
    icon: 'paw'
  },
  { 
    id: '4', 
    part1: 'She has to', 
    part2: 'so her friend doesn\'t wake up.', 
    options: ['tiptoe', 'tiptoes'], 
    correct: 'tiptoe',
    icon: 'walk'
  },
  { 
    id: '5', 
    part1: 'My mother', 
    part2: 'at the same stall every time.', 
    options: ['shop', 'shops'], 
    correct: 'shops',
    icon: 'cart'
  },
  { 
    id: '6', 
    part1: 'Patricia and her friends', 
    part2: 'to play at the park.', 
    options: ['love', 'loves'], 
    correct: 'love',
    icon: 'happy'
  },
  { 
    id: '7', 
    part1: 'Nasreen', 
    part2: 'money packets during Hari Raya.', 
    options: ['receive', 'receives'], 
    correct: 'receives',
    icon: 'gift'
  },
  { 
    id: '8', 
    part1: 'We always', 
    part2: 'up early in the morning.', 
    options: ['get', 'gets'], 
    correct: 'get',
    icon: 'sunny'
  },
  { 
    id: '9', 
    part1: 'They', 
    part2: 'English very well.', 
    options: ['speak', 'speaks'], 
    correct: 'speak',
    icon: 'language'
  },
  { 
    id: '10', 
    part1: 'She', 
    part2: 'tennis on Saturdays.', 
    options: ['play', 'plays'], 
    correct: 'plays',
    icon: 'tennisball'
  },
];

// ----------------------------------------------------------------------------
// COMPONENT
// ----------------------------------------------------------------------------

export default function PresentSimpleTenseScreen() {
  const router = useRouter();

  // State
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [results, setResults] = useState<Record<string, boolean>>({}); // true = correct, false = incorrect
  const [activeId, setActiveId] = useState<string | null>(null); // Which question is currently being interacted with
  const [isCompleted, setIsCompleted] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [finalScore, setFinalScore] = useState(0);
  const [showInstruction, setShowInstruction] = useState(false);

  // Play instructions on mount
  useEffect(() => {
    checkInstructionSeen('presentsimpletense').then(seen => {
      if (!seen) {
        setShowInstruction(true);
      } else {
        const timeout = setTimeout(() => {
          Speech.speak("Fill in the blank with the correct verb in the bracket.", { rate: 0.9, pitch: 1.1 });
        }, 500);
        return () => clearTimeout(timeout);
      }
    });
  }, []);

  // Handle saving when all done
  useEffect(() => {
    const checkCompletion = async () => {
      const answeredCount = Object.keys(answers).length;
      if (answeredCount === questions.length && !isCompleted) {
        setIsCompleted(true);
        
        // Calculate score
        let score = 0;
        Object.keys(answers).forEach(key => {
          if (results[key]) score++;
        });

        // Save progress
        await addResult({
          activityId: 'presentsimpletense',
          category: 'practice',
          score: score,
          maxScore: questions.length,
          completed: true,
        });

        // Final feedback
        if (score >= 6) {
          Speech.speak(`Great job! You got ${score} out of 10.`, { rate: 0.9, pitch: 1.1 });
        } else {
          Speech.speak(`Good try! You got ${score} out of 10. Keep practicing.`, { rate: 0.9, pitch: 1.1 });
        }

        setFinalScore(score);
        setModalVisible(true);
      }
    };

    checkCompletion();
  }, [answers, results, isCompleted]);

  const handleTryAgain = () => {
    setAnswers({});
    setResults({});
    setActiveId(null);
    setIsCompleted(false);
    setModalVisible(false);
    setFinalScore(0);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const handleExit = () => {
    setModalVisible(false);
    router.replace('/pract');
  };

  const handleSelect = (question: Question, option: string) => {
    // Speak the word
    Speech.stop();
    Speech.speak(option, { rate: 0.9, pitch: 1.1 });

    const isCorrect = option === question.correct;
    
    setAnswers(prev => ({ ...prev, [question.id]: option }));
    setResults(prev => ({ ...prev, [question.id]: isCorrect }));
    setActiveId(null); // Close selection view if open

    // Feedback
    if (isCorrect) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Speech.speak("Correct!", { rate: 1.0, pitch: 1.2 });
    } else {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Speech.speak("Try again.", { rate: 1.0, pitch: 0.9 });
    }
  };

  const handleBlankTap = (id: string) => {
    if (results[id]) return; // Already correct, don't re-open
    setActiveId(activeId === id ? null : id);
    Haptics.selectionAsync();
  };

  const speakSentence = (text: string) => {
    Speech.stop();
    Speech.speak(text, { rate: 0.9 });
  };

  return (
    <LinearGradient colors={["#FFF3E0", "#FFE0B2"]} style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        
        {/* HEADER */}
        <View style={styles.header}>
          <BackButton targetRoute="/pract" color="#5D4037" />
          <Text style={styles.headerTitle}>Present Simple Tense</Text>
          <View style={{ width: 40 }} /> 
        </View>

        {/* INSTRUCTION */}
        <View style={styles.instructionContainer}>
          <Text style={styles.instructionText}>
            Fill in the blank with the correct verb in the bracket.
          </Text>
          <TouchableOpacity onPress={() => Speech.speak("Fill in the blank with the correct verb in the bracket.", { rate: 0.9 })}>
            <Ionicons name="volume-high" size={24} color="#FB8C00" />
          </TouchableOpacity>
        </View>

        {/* LIST */}
        <ScrollView contentContainerStyle={styles.listContent} showsVerticalScrollIndicator={false}>
          {questions.map((q, index) => {
            const answer = answers[q.id];
            const isCorrect = results[q.id];
            const isWrong = answer && !isCorrect;
            const isOpen = activeId === q.id;

            return (
              <View key={q.id} style={styles.card}>
                <View style={styles.cardHeader}>
                  <View style={styles.numberBadge}>
                    <Text style={styles.numberText}>{index + 1}</Text>
                  </View>
                  <Ionicons name={q.icon} size={28} color="#FB8C00" style={styles.icon} />
                </View>

                {/* SENTENCE */}
                <View style={styles.sentenceContainer}>
                  <Text style={styles.sentenceText}>
                    {q.part1}{" "}
                    <Text
                      style={[
                        styles.blank,
                        isCorrect && styles.blankCorrect,
                        isWrong && styles.blankWrong,
                        isOpen && styles.blankActive
                      ]}
                      onPress={() => handleBlankTap(q.id)}
                    >
                      {answer ? ` ${answer} ` : " _______ "}
                    </Text>
                    {" "}{q.part2}
                  </Text>
                  
                  {/* BRACKETS / OPTIONS */}
                  <Text style={styles.bracketsText}>
                    ({q.options.join(" / ")})
                  </Text>
                </View>

                {/* INTERACTIVE OPTIONS (Visible when active or always? Prompt says "Tapping a blank allows...") */}
                {/* We'll show them when active OR just show them below for easier access if blank is tapped */}
                {isOpen && !isCorrect && (
                  <View style={styles.optionsContainer}>
                    {q.options.map((opt) => (
                      <TouchableOpacity 
                        key={opt} 
                        style={styles.optionButton} 
                        onPress={() => handleSelect(q, opt)}
                      >
                        <Text style={styles.optionButtonText}>{opt}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}

                {/* FEEDBACK ICON */}
                {isCorrect && (
                  <View style={styles.feedbackIcon}>
                    <Ionicons name="checkmark-circle" size={32} color="#4CAF50" />
                  </View>
                )}
                 {isWrong && !isOpen && (
                  <View style={styles.feedbackIcon}>
                    <Ionicons name="close-circle" size={32} color="#F44336" />
                  </View>
                )}

              </View>
            );
          })}
          
          <View style={{ height: 40 }} />
        </ScrollView>

        {/* RESULT MODAL */}
        <Modal
          animationType="fade"
          transparent={true}
          visible={modalVisible}
          onRequestClose={() => {}}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Practice Complete!</Text>
              
              <View style={styles.scoreContainer}>
                <Text style={styles.scoreLabel}>Your Score</Text>
                <Text style={styles.scoreValue}>{finalScore} / 10</Text>
              </View>

              <View style={[styles.resultBadge, finalScore >= 6 ? styles.resultPass : styles.resultFail]}>
                <Ionicons 
                  name={finalScore >= 6 ? "checkmark-circle" : "close-circle"} 
                  size={32} 
                  color="#FFF" 
                />
                <Text style={styles.resultText}>
                  {finalScore >= 6 ? "PASSED" : "FAILED"}
                </Text>
              </View>

              <View style={styles.modalButtons}>
                <TouchableOpacity style={[styles.modalButton, styles.tryAgainButton]} onPress={handleTryAgain}>
                  <Ionicons name="refresh" size={24} color="#FFF" />
                  <Text style={styles.modalButtonText}>TRY AGAIN</Text>
                </TouchableOpacity>

                <TouchableOpacity style={[styles.modalButton, styles.exitButton]} onPress={handleExit}>
                  <Ionicons name="exit" size={24} color="#FFF" />
                  <Text style={styles.modalButtonText}>EXIT</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        <InstructionModal
          visible={showInstruction}
          onClose={() => {
            setShowInstruction(false);
            markInstructionSeen('presentsimpletense');
          }}
          instructionText={`Read the sentence.\nChoose the correct verb.\nFinish all items to see your score!`}
          iconName="time"
        />

      </SafeAreaView>
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
    paddingVertical: 15,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#5D4037',
  },
  instructionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    padding: 15,
    borderRadius: 15,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 2,
  },
  instructionText: {
    flex: 1,
    fontSize: 16,
    color: '#5D4037',
    marginRight: 10,
    fontWeight: '500',
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  card: {
    backgroundColor: '#FFF',
    borderRadius: 20,
    padding: 20,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  numberBadge: {
    backgroundColor: '#FB8C00',
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  numberText: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 14,
  },
  icon: {
    opacity: 0.8,
  },
  sentenceContainer: {
    marginBottom: 10,
  },
  sentenceText: {
    fontSize: 18,
    color: '#3E2723',
    lineHeight: 30,
    flexWrap: 'wrap',
  },
  blank: {
    fontWeight: 'bold',
    color: '#1E88E5',
    textDecorationLine: 'underline',
  },
  blankCorrect: {
    color: '#4CAF50',
    textDecorationLine: 'none',
  },
  blankWrong: {
    color: '#F44336',
  },
  blankActive: {
    backgroundColor: '#E3F2FD',
    color: '#1565C0',
  },
  bracketsText: {
    fontSize: 16,
    color: '#8D6E63',
    fontStyle: 'italic',
    marginTop: 5,
  },
  optionsContainer: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 10,
  },
  optionButton: {
    flex: 1,
    backgroundColor: '#FB8C00',
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
  },
  optionButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  feedbackIcon: {
    position: 'absolute',
    right: 15,
    top: 15,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#FFF',
    borderRadius: 25,
    padding: 30,
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#5D4037',
    marginBottom: 20,
  },
  scoreContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  scoreLabel: {
    fontSize: 18,
    color: '#8D6E63',
    marginBottom: 5,
  },
  scoreValue: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#FB8C00',
  },
  resultBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 50,
    marginBottom: 30,
    gap: 10,
  },
  resultPass: {
    backgroundColor: '#4CAF50',
  },
  resultFail: {
    backgroundColor: '#F44336',
  },
  resultText: {
    color: '#FFF',
    fontSize: 24,
    fontWeight: 'bold',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 15,
    width: '100%',
  },
  modalButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
    borderRadius: 15,
    gap: 8,
  },
  tryAgainButton: {
    backgroundColor: '#FB8C00',
  },
  exitButton: {
    backgroundColor: '#9E9E9E',
  },
  modalButtonText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
});
