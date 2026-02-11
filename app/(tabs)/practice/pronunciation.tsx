import BackButton from "@/components/ui/BackButton";
import InstructionModal from "@/components/InstructionModal";
import { checkInstructionSeen, markInstructionSeen } from "@/services/instructions";
import { addResult } from "@/services/progress";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import * as Speech from "expo-speech";
import React, { useEffect, useState } from "react";
import { Dimensions, FlatList, Modal, SafeAreaView, StatusBar, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { vowelSections } from "../common";

const { width } = Dimensions.get("window");
const CARD_MARGIN = 6;
// Calculate card size for 3 columns
const CARD_SIZE = (width - 40 - (CARD_MARGIN * 6)) / 3;

interface CardItem {
  id: string;
  matchKey: string;
  word: string;
  icon: keyof typeof Ionicons.glyphMap;
  type: 'image' | 'word';
  color: string;
  state: 'idle' | 'selected' | 'matched' | 'mismatch';
}

export default function PracticePronunciation() {
  const router = useRouter();
  const [restartCount, setRestartCount] = useState(0);
  const [cards, setCards] = useState<CardItem[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [mistakes, setMistakes] = useState<Set<string>>(new Set());
  const [showResult, setShowResult] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showInstruction, setShowInstruction] = useState(false);

  useEffect(() => {
    checkInstructionSeen('pronunciation').then(seen => {
      if (!seen) setShowInstruction(true);
    });
  }, []);

  // Pastel colors palette
  const cardColors = [
    "#FFF9C4", // Yellow
    "#E1F5FE", // Light Blue
    "#F8BBD0", // Pink
    "#DCEDC8", // Light Green
    "#D1C4E9", // Lavender
    "#B2EBF2", // Cyan
    "#FFCCBC", // Deep Orange
    "#F0F4C3", // Lime
    "#CFD8DC", // Blue Grey
    "#FFE0B2", // Orange
  ];

  // Initialize Game
  useEffect(() => {
    // 1. Get all valid items
    const allExamples = vowelSections.flatMap(section => section.examples);
    const validItems = allExamples.filter(item => item.icon);
    
    // 2. Select 10 random items
    const shuffledItems = [...validItems].sort(() => 0.5 - Math.random()).slice(0, 10);
    
    // 3. Create Pairs (Image Card + Word Card)
    const newCards: CardItem[] = [];
    shuffledItems.forEach((item, index) => {
      const color = cardColors[index % cardColors.length];
      
      // Image Card
      newCards.push({
        id: `img-${index}`,
        matchKey: item.word,
        word: item.word,
        icon: item.icon as any,
        type: 'image',
        color: color,
        state: 'idle'
      });
      
      // Word Card
      newCards.push({
        id: `txt-${index}`,
        matchKey: item.word,
        word: item.word,
        icon: item.icon as any,
        type: 'word',
        color: color,
        state: 'idle'
      });
    });

    // 4. Shuffle all cards
    setCards(newCards.sort(() => 0.5 - Math.random()));
    setMistakes(new Set());
    setSelectedId(null);
    setShowResult(false);
    setIsProcessing(false);
  }, [restartCount]);

  const handleCardPress = (card: CardItem) => {
    if (isProcessing || card.state === 'matched' || card.state === 'selected') return;

    // Play TTS on tap (optional but helpful)
    Speech.speak(card.word, { rate: 1.0 });

    if (!selectedId) {
      // First card selected
      setCards(prev => prev.map(c => c.id === card.id ? { ...c, state: 'selected' } : c));
      setSelectedId(card.id);
    } else {
      // Second card selected
      const firstCard = cards.find(c => c.id === selectedId);
      if (!firstCard) return;

      setCards(prev => prev.map(c => c.id === card.id ? { ...c, state: 'selected' } : c));
      setIsProcessing(true);

      // Check Match
      if (firstCard.matchKey === card.matchKey) {
        // Correct Match
        setTimeout(() => {
          setCards(prev => prev.map(c => 
            c.matchKey === card.matchKey ? { ...c, state: 'matched' } : c
          ));
          Speech.speak("Good job!", { rate: 1.1 });
          setSelectedId(null);
          setIsProcessing(false);
          checkCompletion();
        }, 500);
      } else {
        // Incorrect Match
        setTimeout(() => {
          setCards(prev => prev.map(c => 
            c.id === firstCard.id || c.id === card.id ? { ...c, state: 'mismatch' } : c
          ));
          Speech.speak("Try again", { rate: 1.0 });
          setMistakes(prev => new Set(prev).add(firstCard.matchKey).add(card.matchKey));
        }, 500);

        // Reset after delay
        setTimeout(() => {
          setCards(prev => prev.map(c => 
            c.state === 'mismatch' ? { ...c, state: 'idle' } : c
          ));
          setSelectedId(null);
          setIsProcessing(false);
        }, 1500);
      }
    }
  };

  const checkCompletion = () => {
    // We need to check if this was the last pair. 
    // State updates are async, so we count matched cards + 2 (the ones just matched)
    // Actually, safer to rely on an effect or just check count.
    // Let's use a timeout to check the state after update.
    setTimeout(() => {
      setCards(currentCards => {
        const matchedCount = currentCards.filter(c => c.state === 'matched').length;
        if (matchedCount === 20) {
          handleFinish();
        }
        return currentCards;
      });
    }, 600);
  };

  const handleFinish = async () => {
    const score = Math.max(0, 10 - mistakes.size);
    const passed = score >= 6;
    
    // Save Result
    await addResult({
      activityId: "pronunciation-matching",
      category: "practice",
      score: score * 10,
      maxScore: 100,
      completed: true,
    });

    setShowResult(true);
    Speech.speak(passed ? "Awesome! You did it!" : "Good practice! Try again.", { rate: 0.95 });
  };

  const handleRestart = () => {
    setRestartCount(prev => prev + 1);
  };

  const handleExit = () => {
    router.replace('/pract');
  };

  return (
    <LinearGradient colors={["#E0F2F1", "#80CBC4"]} style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="dark-content" />
        
        {/* Header */}
        <View style={styles.header}>
          <BackButton targetRoute="/pract" color="#00695C" />
          <Text style={styles.title}>Match Pairs</Text>
          <View style={styles.scoreBadge}>
             {/* Show matched pairs count */}
             <Text style={styles.scoreText}>
               {cards.filter(c => c.state === 'matched').length / 2} / 10
             </Text>
          </View>
        </View>

        <Text style={styles.subtitle}>Tap matched pictures and words!</Text>

        {/* Grid */}
        <FlatList
          data={cards}
          keyExtractor={(item) => item.id}
          numColumns={3}
          contentContainerStyle={styles.listContainer}
          columnWrapperStyle={styles.columnWrapper}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[
                styles.card,
                { 
                  backgroundColor: item.state === 'matched' ? '#E8F5E9' : item.color,
                  borderColor: item.state === 'selected' ? '#2196F3' : 
                               item.state === 'mismatch' ? '#F44336' : 
                               item.state === 'matched' ? '#4CAF50' : 'transparent',
                  opacity: item.state === 'matched' ? 0.6 : 1,
                }
              ]}
              onPress={() => handleCardPress(item)}
              activeOpacity={0.8}
            >
              {item.type === 'image' ? (
                <Ionicons name={item.icon} size={32} color="#00695C" />
              ) : (
                <Text style={styles.wordText} numberOfLines={1} adjustsFontSizeToFit>
                  {item.word}
                </Text>
              )}
              
              {/* Status Indicator (Icon Overlay) */}
              {item.state === 'matched' && (
                <View style={styles.statusOverlay}>
                  <Ionicons name="checkmark-circle" size={24} color="#4CAF50" />
                </View>
              )}
            </TouchableOpacity>
          )}
        />

        {/* Result Modal */}
        <Modal
          visible={showResult}
          transparent={true}
          animationType="fade"
          onRequestClose={handleExit}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>
                {(10 - mistakes.size) >= 6 ? "Great Job! 🎉" : "Keep Trying! 💪"}
              </Text>
              
              <View style={styles.resultScoreContainer}>
                <Text style={styles.resultScoreLabel}>Your Score</Text>
                <Text style={[
                  styles.resultScoreValue, 
                  { color: (10 - mistakes.size) >= 6 ? "#4CAF50" : "#FF9800" }
                ]}>
                  {Math.max(0, 10 - mistakes.size)} / 10
                </Text>
              </View>

              <View style={styles.modalButtons}>
                <TouchableOpacity style={styles.tryAgainButton} onPress={handleRestart}>
                  <Text style={styles.buttonText}>Try Again</Text>
                  <Ionicons name="refresh" size={20} color="#FFF" style={{marginLeft: 8}} />
                </TouchableOpacity>

                <TouchableOpacity style={styles.exitButton} onPress={handleExit}>
                  <Text style={styles.buttonText}>Exit</Text>
                  <Ionicons name="exit-outline" size={20} color="#FFF" style={{marginLeft: 8}} />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        <InstructionModal
          visible={showInstruction}
          onClose={() => {
            setShowInstruction(false);
            markInstructionSeen('pronunciation');
          }}
          instructionText={`Tap a card to hear the word.\nMatch the picture with the correct word.\nHave fun learning!`}
          iconName="mic"
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
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  title: {
    fontSize: 26,
    fontWeight: "bold",
    color: "#00695C",
  },
  scoreBadge: {
    backgroundColor: "rgba(255,255,255,0.8)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: "#00695C",
  },
  scoreText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#00695C",
  },
  subtitle: {
    textAlign: "center",
    fontSize: 18,
    color: "#00796B",
    marginBottom: 10,
    fontWeight: "600",
  },
  listContainer: {
    padding: 20,
    paddingBottom: 40,
    alignItems: 'center',
  },
  columnWrapper: {
    justifyContent: "center", // Center columns
    gap: CARD_MARGIN,
  },
  card: {
    width: CARD_SIZE,
    height: CARD_SIZE,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: CARD_MARGIN,
    borderWidth: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
    padding: 5,
  },
  wordText: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#004D40",
    textAlign: "center",
  },
  statusOverlay: {
    position: "absolute",
    top: 5,
    right: 5,
  },
  
  // Modal Styles (Reused)
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    width: "85%",
    backgroundColor: "white",
    borderRadius: 25,
    padding: 25,
    alignItems: "center",
    elevation: 10,
  },
  modalTitle: {
    fontSize: 26,
    fontWeight: "bold",
    color: "#00695C",
    marginBottom: 20,
    textAlign: "center",
  },
  resultScoreContainer: {
    alignItems: "center",
    marginBottom: 25,
    backgroundColor: "#E0F2F1",
    padding: 20,
    borderRadius: 20,
    width: "100%",
  },
  resultScoreLabel: {
    fontSize: 18,
    color: "#00695C",
    marginBottom: 5,
    fontWeight: "600",
  },
  resultScoreValue: {
    fontSize: 48,
    fontWeight: "900",
  },
  modalButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    gap: 15,
  },
  tryAgainButton: {
    flex: 1,
    backgroundColor: "#26C6DA",
    paddingVertical: 15,
    borderRadius: 15,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    elevation: 3,
  },
  exitButton: {
    flex: 1,
    backgroundColor: "#FF7043",
    paddingVertical: 15,
    borderRadius: 15,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    elevation: 3,
  },
  buttonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
});
