import React, { useRef, useEffect, useState } from "react";
import {View,Text,TouchableOpacity,StyleSheet,ImageBackground,} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { Audio } from "expo-av";
import { LinearGradient } from "expo-linear-gradient";

// OPTIONAL: For circular progress visual
import * as Progress from "react-native-progress";

const Home = () => {
  const navigation = useNavigation();
  const bgMusicRef = useRef<Audio.Sound | null>(null);

  // Simulated scores for each lesson (0-100)
  const [scores, setScores] = useState({
    vocab: 0,
    pract: 0,
    games: 0,
  });

  // Calculate average progress
  const progress = Math.round(
    (scores.vocab + scores.pract + scores.games) / 3
  );

  const lessons = [
    { id: "1", title: "Vocabulary", screen: "vocab", image: require("../assets/images/voc.png") },
    { id: "2", title: "Practices", screen: "pract", image: require("../assets/images/pract.png") },
    { id: "3", title: "Games", screen: "games", image: require("../assets/images/game.png") },
  ];

  // PLAY BACKGROUND MUSIC
  useEffect(() => {
    const loadMusic = async () => {
      const { sound } = await Audio.Sound.createAsync(
        require("../assets/music/fun.mp3"),
        { shouldPlay: true, isLooping: true }
      );
      bgMusicRef.current = sound;
    };

    loadMusic();

    return () => {
      if (bgMusicRef.current) {
        bgMusicRef.current.stopAsync();
        bgMusicRef.current.unloadAsync();
      }
    };
  }, []);

  const handleLessonPress = async (lesson: { screen: string }) => {
    try {
      if (bgMusicRef.current) {
        await bgMusicRef.current.pauseAsync();
      }

      const { sound } = await Audio.Sound.createAsync(
        require("../assets/music/drop.mp3")
      );
      await sound.playAsync();

      sound.setOnPlaybackStatusUpdate(async (status) => {
        if (status.didJustFinish) {
          await sound.unloadAsync();

          // Navigate to lesson and pass a callback to update score
          navigation.navigate(lesson.screen, {
            onComplete: (newScore: number) => {
              setScores((prev) => ({
                ...prev,
                [lesson.screen]: newScore,
              }));
            },
          });
        }
      });
    } catch (error) {
      console.log(error);
      navigation.navigate(lesson.screen);
    }
  };

  return (
    <ImageBackground
      source={require("../assets/back.png")}
      style={styles.bg}
    >
      <View style={styles.container}>

        {/* Lesson Buttons */}
        <View style={styles.lessonContainer}>
          {lessons.map((lesson) => (
            <TouchableOpacity
              key={lesson.id}
              style={styles.lessonItemWrapper}
              onPress={() => handleLessonPress(lesson)}
            >
              <ImageBackground
                source={lesson.image}
                style={styles.buttonImage}
                imageStyle={{ borderRadius: 20 }}
              >
                <LinearGradient
                  colors={["#00000055", "#00000020"]}
                  style={styles.overlay}
                >
                  <Text style={styles.lessonTitle}>{lesson.title}</Text>
                </LinearGradient>
              </ImageBackground>
            </TouchableOpacity>
          ))}
        </View>

        {/* Progress Circle */}
        <View style={styles.progressContainer}>
          <Progress.Circle
            size={95}
            progress={progress / 100}
            showsText={true}
            formatText={() => `${progress}%`}
            color="rgb(64, 213, 247)"
            unfilledColor="rgba(255,255,255,0.3)"
            borderWidth={2}
            thickness={6}
          />
        </View>

      </View>
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  bg: {
    flex: 1,
    resizeMode: "cover",
  },
  container: {
    flex: 1,
    paddingTop: 45,
    paddingHorizontal: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  lessonContainer: {
    width: "100%",
    justifyContent: "center",
  },
  lessonItemWrapper: {
    marginVertical: 12,
    borderRadius: 20,
    overflow: "hidden",
  },
  buttonImage: {
    width: "100%",
    height: 95,
    justifyContent: "center",
  },
  overlay: {
    flex: 1,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  lessonTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#ffffff",
    textShadowColor: "#000",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  progressContainer: {
    position: "absolute",
    top: 100,
    right: 20,
  },
});

export default Home;
