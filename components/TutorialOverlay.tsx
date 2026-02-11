import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { Dimensions, LayoutRectangle, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface TutorialOverlayProps {
  isVisible: boolean; 
  onClose: () => void;
  lessonLayout: LayoutRectangle | null;
  progressLayout: LayoutRectangle | null;
}

const { width, height } = Dimensions.get('window');

export default function TutorialOverlay({
  isVisible,
  onClose,
  lessonLayout,
  progressLayout,
}: TutorialOverlayProps) {
  const [step, setStep] = useState(0);

  if (!isVisible) return null;

  // Define steps
  const steps = [
    {
      title: "Welcome!",
      description: "Welcome to KidConnect! Let's quickly learn what each button does.",
      target: null,
      position: 'center',
    },
    {
      title: "Lessons",
      description: "Choose what to do:\n• Vocabulary – learn new words\n• Practices – do exercises\n• Games – play while learning",
      target: lessonLayout,
      position: 'top', // Text appears above or below target
    },
    {
      title: "Progress",
      description: "This shows your overall progress. Aim for 100%!",
      target: progressLayout,
      position: 'bottom',
    },
  ];

  const currentStepData = steps[step];

  const handleNext = () => {
    if (step < steps.length - 1) {
      setStep(step + 1);
    } else {
      onClose();
    }
  };

  const renderHighlight = (target: LayoutRectangle) => {
    return (
      <View
        style={[
          styles.highlightBox,
          {
            top: target.y - 10,
            left: target.x - 10,
            width: target.width + 20,
            height: target.height + 20,
          },
        ]}
      />
    );
  };

  const renderTooltip = () => {
    let top = height / 2 - 100;
    let left = 20;
    let widthVal = width - 40;
    const target = currentStepData.target;

    if (target) {
      // Simple positioning logic
      if (currentStepData.position === 'top') {
         // Try to place above, if not enough space, place below
         if (target.y > 150) {
            top = target.y - 140; 
         } else {
            top = target.y + target.height + 20;
         }
      } else {
        // Default or 'bottom'
        top = target.y + target.height + 20;
        // Check if it goes off screen
        if (top + 150 > height) {
           top = target.y - 140;
        }
      }
    }

    return (
      <View style={[styles.tooltipBubble, { top, left, width: widthVal }]}>
        <Text style={styles.tooltipTitle}>{currentStepData.title}</Text>
        <Text style={styles.tooltipText}>{currentStepData.description}</Text>
        <View style={styles.buttonRow}>
            <TouchableOpacity onPress={onClose} style={styles.skipButton}>
                <Text style={styles.skipText}>Skip</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleNext} style={styles.nextButton}>
                <Text style={styles.nextText}>{step === steps.length - 1 ? "Finish" : "Next"}</Text>
                <Ionicons name="arrow-forward" size={16} color="#fff" />
            </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container} pointerEvents="box-none">
        {/* Semi-transparent background */}
        {/* We use a combination of views to create a 'hole' or just a simple overlay with high opacity if we don't do the hole effect.
            For simplicity and robustness, we'll use a full overlay with opacity and draw a border around the target.
        */}
        <View style={styles.backdrop} />

        {/* Highlight Target */}
        {currentStepData.target && renderHighlight(currentStepData.target)}

        {/* Tooltip */}
        {renderTooltip()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1000,
    elevation: 1000,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  highlightBox: {
    position: 'absolute',
    borderWidth: 2,
    borderColor: '#FFD700', // Gold color for highlight
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderStyle: 'dashed',
  },
  tooltipBubble: {
    position: 'absolute',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  tooltipTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333',
  },
  tooltipText: {
    fontSize: 16,
    color: '#666',
    marginBottom: 16,
    lineHeight: 22,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  skipButton: {
    padding: 8,
  },
  skipText: {
    color: '#999',
    fontSize: 14,
  },
  nextButton: {
    backgroundColor: '#40d5f7',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
  },
  nextText: {
    color: '#fff',
    fontWeight: 'bold',
    marginRight: 4,
  },
});
