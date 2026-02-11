import BackButton from "@/components/ui/BackButton";
import ExplanationView from "@/components/ui/ExplanationView";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { useFocusEffect } from "expo-router";
import * as Speech from "expo-speech";
import React, { useMemo, useState } from "react";
import { Platform, ScrollView, StatusBar, StyleSheet, Text, TouchableOpacity, View } from "react-native";

type IrregularItem = {
  id: string;
  word: string;
  soundsLike: string;
  spelling: string;
  icon: keyof typeof Ionicons.glyphMap;
  example: string;
};

type IrregularGroup = {
  title: string;
  items: IrregularItem[];
  color: string;
  darkColor: string;
  what: string;
  where: string;
  how: string;
  when: string;
};

export default function Irregular() {
  const [playingId, setPlayingId] = useState<string | null>(null);

  const irregularGroups: IrregularGroup[] = useMemo(() => [
    {
      title: "Tricky Vowels",
      color: "#E1F5FE", // Light Blue
      darkColor: "#0288D1",
      what: "Words with vowels that sound different.",
      where: "In many common words.",
      how: "Memorize the spelling pattern.",
      when: "Writing words like 'friend' or 'people'.",
      items: [
        { id: "iv1", word: "Friend", soundsLike: "frend", spelling: "f-r-i-e-n-d", icon: "people", example: "My best friend plays with me." },
        { id: "iv2", word: "People", soundsLike: "peepul", spelling: "p-e-o-p-l-e", icon: "people-circle", example: "There are many people in the park." },
        { id: "iv3", word: "Beautiful", soundsLike: "beautifull", spelling: "b-e-a-u-t-i-f-u-l", icon: "flower", example: "The flower is beautiful." },
        { id: "iv4", word: "Laugh", soundsLike: "laf", spelling: "l-a-u-g-h", icon: "happy", example: "The joke made me laugh." },
      ],
    },
    {
      title: "Silent Letters",
      color: "#FFF3E0", // Light Orange
      darkColor: "#FF9800",
      what: "Letters we write but do not say.",
      where: "In words like 'Wednesday' or 'receipt'.",
      how: "Remember the hidden letters.",
      when: "Spelling these special words.",
      items: [
        { id: "sl1", word: "Wednesday", soundsLike: "Wensday", spelling: "w-e-d-n-e-s-d-a-y", icon: "calendar", example: "We go to the park on Wednesday." },
        { id: "sl2", word: "Receipt", soundsLike: "receet", spelling: "r-e-c-e-i-p-t", icon: "receipt", example: "Dad got a receipt from the store." },
        { id: "sl3", word: "Biscuit", soundsLike: "biskit", spelling: "b-i-s-c-u-i-t", icon: "nutrition", example: "I ate a yummy biscuit." },
        { id: "sl4", word: "Island", soundsLike: "iland", spelling: "i-s-l-a-n-d", icon: "map", example: "The island is in the ocean." },
        { id: "sl5", word: "Muscle", soundsLike: "mussel", spelling: "m-u-s-c-l-e", icon: "fitness", example: "Exercise builds muscle." },
        { id: "sl6", word: "Knee", soundsLike: "nee", spelling: "k-n-e-e", icon: "body", example: "I scraped my knee." },
        { id: "sl7", word: "Knife", soundsLike: "nife", spelling: "k-n-i-f-e", icon: "restaurant", example: "Use a knife to cut the apple." },
        { id: "sl8", word: "Hour", soundsLike: "our", spelling: "h-o-u-r", icon: "time", example: "The movie is one hour long." },
        { id: "sl9", word: "Ghost", soundsLike: "gost", spelling: "g-h-o-s-t", icon: "skull", example: "The ghost said boo!" },
        { id: "sl10", word: "Answer", soundsLike: "anser", spelling: "a-n-s-w-e-r", icon: "chatbox", example: "I know the answer." },
      ],
    },
    {
      title: "Strange Sounds",
      color: "#F3E5F5", // Light Purple
      darkColor: "#9C27B0",
      what: "Words that sound very different from their spelling.",
      where: "Borrowed words or old English.",
      how: "Listen and repeat to learn.",
      when: "Using words like 'colonel'.",
      items: [
          { id: "ss1", word: "Colonel", soundsLike: "kernel", spelling: "c-o-l-o-n-e-l", icon: "medal", example: "The colonel leads the soldiers." },
          { id: "ss2", word: "Through", soundsLike: "thru", spelling: "t-h-r-o-u-g-h", icon: "arrow-forward", example: "We walked through the door." },
          { id: "ss3", word: "Enough", soundsLike: "enuf", spelling: "e-n-o-u-g-h", icon: "hand-left", example: "I have enough food." },
          { id: "ss4", word: "Rough", soundsLike: "ruff", spelling: "r-o-u-g-h", icon: "thumbs-down", example: "The dog's fur is rough." },
          { id: "ss5", word: "Tough", soundsLike: "tuff", spelling: "t-o-u-g-h", icon: "barbell", example: "The meat was tough to chew." },
          { id: "ss6", word: "Cough", soundsLike: "koff", spelling: "c-o-u-g-h", icon: "thermometer", example: "Cover your mouth when you cough." },
          { id: "ss7", word: "Dough", soundsLike: "doe", spelling: "d-o-u-g-h", icon: "pizza", example: "We made pizza dough." },
          { id: "ss8", word: "Choir", soundsLike: "kwire", spelling: "c-h-o-i-r", icon: "musical-notes", example: "The choir sings beautifully." },
          { id: "ss9", word: "Queue", soundsLike: "kyoo", spelling: "q-u-e-u-e", icon: "people", example: "Stand in the queue for tickets." },
          { id: "ss10", word: "Yacht", soundsLike: "yot", spelling: "y-a-c-h-t", icon: "boat", example: "The yacht sailed on the sea." },
      ]
    },
    {
      title: "Irregular Verbs (A-G)",
      color: "#FFEBEE", // Light Red
      darkColor: "#D32F2F",
      what: "Verbs that change spelling in the past tense.",
      where: "In sentences about the past.",
      how: "Memorize the new word form.",
      when: "Saying what you did yesterday.",
      items: [
        { id: "iv_a1", word: "Be (Was/Were)", soundsLike: "wuz/wur", spelling: "b-e", icon: "person", example: "I was happy yesterday." },
        { id: "iv_a2", word: "Become (Became)", soundsLike: "bi-kaym", spelling: "b-e-c-a-m-e", icon: "arrow-up", example: "The caterpillar became a butterfly." },
        { id: "iv_a3", word: "Begin (Began)", soundsLike: "bi-gan", spelling: "b-e-g-a-n", icon: "play", example: "The race began at noon." },
        { id: "iv_a4", word: "Break (Broke)", soundsLike: "brohk", spelling: "b-r-o-k-e", icon: "hammer", example: "He broke his toy." },
        { id: "iv_a5", word: "Bring (Brought)", soundsLike: "brawt", spelling: "b-r-o-u-g-h-t", icon: "basket", example: "She brought a cake." },
        { id: "iv_a6", word: "Buy (Bought)", soundsLike: "bawt", spelling: "b-o-u-g-h-t", icon: "cart", example: "Mom bought some milk." },
        { id: "iv_a7", word: "Catch (Caught)", soundsLike: "kawt", spelling: "c-a-u-g-h-t", icon: "hand-left", example: "He caught the ball." },
        { id: "iv_a8", word: "Choose (Chose)", soundsLike: "chohz", spelling: "c-h-o-s-e", icon: "checkbox", example: "She chose the red dress." },
        { id: "iv_a9", word: "Come (Came)", soundsLike: "kaym", spelling: "c-a-m-e", icon: "walk", example: "He came to my house." },
        { id: "iv_a10", word: "Do (Did)", soundsLike: "did", spelling: "d-i-d", icon: "checkmark-circle", example: "I did my homework." },
        { id: "iv_a11", word: "Draw (Drew)", soundsLike: "droo", spelling: "d-r-e-w", icon: "pencil", example: "She drew a picture." },
        { id: "iv_a12", word: "Drink (Drank)", soundsLike: "drank", spelling: "d-r-a-n-k", icon: "water", example: "He drank some water." },
        { id: "iv_a13", word: "Drive (Drove)", soundsLike: "drohv", spelling: "d-r-o-v-e", icon: "car", example: "Dad drove the car." },
        { id: "iv_a14", word: "Eat (Ate)", soundsLike: "ayt", spelling: "a-t-e", icon: "fast-food", example: "We ate pizza for lunch." },
        { id: "iv_a15", word: "Fall (Fell)", soundsLike: "fel", spelling: "f-e-l-l", icon: "arrow-down", example: "The leaves fell down." },
        { id: "iv_a16", word: "Feel (Felt)", soundsLike: "felt", spelling: "f-e-l-t", icon: "heart", example: "I felt sad yesterday." },
        { id: "iv_a17", word: "Find (Found)", soundsLike: "fownd", spelling: "f-o-u-n-d", icon: "search", example: "She found a coin." },
        { id: "iv_a18", word: "Fly (Flew)", soundsLike: "floo", spelling: "f-l-e-w", icon: "airplane", example: "The bird flew away." },
        { id: "iv_a19", word: "Forget (Forgot)", soundsLike: "for-got", spelling: "f-o-r-g-o-t", icon: "help", example: "I forgot my bag." },
        { id: "iv_a20", word: "Get (Got)", soundsLike: "got", spelling: "g-o-t", icon: "gift", example: "He got a new toy." },
        { id: "iv_a21", word: "Give (Gave)", soundsLike: "gayv", spelling: "g-a-v-e", icon: "gift", example: "She gave me a gift." },
        { id: "iv_a22", word: "Go (Went)", soundsLike: "went", spelling: "w-e-n-t", icon: "walk", example: "We went to the zoo." },
      ]
    },
    {
      title: "Irregular Verbs (H-S)",
      color: "#E0F2F1", // Light Teal
      darkColor: "#00796B",
      what: "More verbs that change spelling in the past.",
      where: "Describing past actions.",
      how: "Practice using them in sentences.",
      when: "Telling a story about yesterday.",
      items: [
        { id: "iv_b1", word: "Have (Had)", soundsLike: "had", spelling: "h-a-d", icon: "briefcase", example: "I had a good time." },
        { id: "iv_b2", word: "Hear (Heard)", soundsLike: "herd", spelling: "h-e-a-r-d", icon: "ear", example: "I heard a noise." },
        { id: "iv_b3", word: "Keep (Kept)", soundsLike: "kept", spelling: "k-e-p-t", icon: "lock-closed", example: "He kept his promise." },
        { id: "iv_b4", word: "Know (Knew)", soundsLike: "noo", spelling: "k-n-e-w", icon: "school", example: "She knew the answer." },
        { id: "iv_b5", word: "Leave (Left)", soundsLike: "left", spelling: "l-e-f-t", icon: "exit", example: "They left early." },
        { id: "iv_b6", word: "Make (Made)", soundsLike: "mayd", spelling: "m-a-d-e", icon: "construct", example: "Mom made a cake." },
        { id: "iv_b7", word: "Meet (Met)", soundsLike: "met", spelling: "m-e-t", icon: "people", example: "I met a new friend." },
        { id: "iv_b8", word: "Pay (Paid)", soundsLike: "payd", spelling: "p-a-i-d", icon: "cash", example: "Dad paid for the food." },
        { id: "iv_b9", word: "Put (Put)", soundsLike: "poot", spelling: "p-u-t", icon: "download", example: "She put the book away." },
        { id: "iv_b10", word: "Read (Read)", soundsLike: "red", spelling: "r-e-a-d", icon: "book", example: "I read a book last night." },
        { id: "iv_b11", word: "Ride (Rode)", soundsLike: "rohd", spelling: "r-o-d-e", icon: "bicycle", example: "He rode his bike." },
        { id: "iv_b12", word: "Run (Ran)", soundsLike: "ran", spelling: "r-a-n", icon: "walk", example: "She ran fast." },
        { id: "iv_b13", word: "Say (Said)", soundsLike: "sed", spelling: "s-a-i-d", icon: "chatbubble", example: "He said hello." },
        { id: "iv_b14", word: "See (Saw)", soundsLike: "saw", spelling: "s-a-w", icon: "eye", example: "I saw a rainbow." },
        { id: "iv_b15", word: "Sell (Sold)", soundsLike: "sohld", spelling: "s-o-l-d", icon: "pricetag", example: "They sold lemonade." },
        { id: "iv_b16", word: "Send (Sent)", soundsLike: "sent", spelling: "s-e-n-t", icon: "send", example: "I sent a letter." },
        { id: "iv_b17", word: "Sing (Sang)", soundsLike: "sang", spelling: "s-a-n-g", icon: "mic", example: "She sang a song." },
        { id: "iv_b18", word: "Sit (Sat)", soundsLike: "sat", spelling: "s-a-t", icon: "cafe", example: "He sat on the chair." },
        { id: "iv_b19", word: "Sleep (Slept)", soundsLike: "slept", spelling: "s-l-e-p-t", icon: "bed", example: "The baby slept well." },
        { id: "iv_b20", word: "Speak (Spoke)", soundsLike: "spohk", spelling: "s-p-o-k-e", icon: "megaphone", example: "He spoke softly." },
      ]
    },
    {
      title: "Irregular Verbs (T-Z)",
      color: "#FFF3E0", // Light Orange
      darkColor: "#EF6C00",
      what: "Final group of irregular past tense verbs.",
      where: "Everywhere in English conversation.",
      how: "Use them often to remember.",
      when: "Talking about what happened before.",
      items: [
        { id: "iv_c1", word: "Take (Took)", soundsLike: "took", spelling: "t-o-o-k", icon: "hand-right", example: "She took a cookie." },
        { id: "iv_c2", word: "Teach (Taught)", soundsLike: "tawt", spelling: "t-a-u-g-h-t", icon: "school", example: "The teacher taught us math." },
        { id: "iv_c3", word: "Tell (Told)", soundsLike: "tohld", spelling: "t-o-l-d", icon: "information-circle", example: "He told a funny story." },
        { id: "iv_c4", word: "Think (Thought)", soundsLike: "thawt", spelling: "t-h-o-u-g-h-t", icon: "bulb", example: "I thought about you." },
        { id: "iv_c5", word: "Understand (Understood)", soundsLike: "un-der-stood", spelling: "u-n-d-e-r-s-t-o-o-d", icon: "happy", example: "She understood the lesson." },
        { id: "iv_c6", word: "Wear (Wore)", soundsLike: "wor", spelling: "w-o-r-e", icon: "shirt", example: "He wore a blue shirt." },
        { id: "iv_c7", word: "Win (Won)", soundsLike: "wun", spelling: "w-o-n", icon: "trophy", example: "We won the game." },
        { id: "iv_c8", word: "Write (Wrote)", soundsLike: "roht", spelling: "w-r-o-t-e", icon: "create", example: "She wrote a letter." },
      ]
    }
  ], []);

  useFocusEffect(
    React.useCallback(() => {
      return () => {
        Speech.stop();
        setPlayingId(null);
      };
    }, [])
  );

  const handlePlay = (id: string, text: string) => {
    Speech.stop();
    setPlayingId(id);

    Speech.speak(text, {
      rate: 0.9,
      pitch: 1.1,
      onDone: () => setPlayingId(null),
      onStopped: () => setPlayingId(null),
      onError: () => setPlayingId(null),
    });
    Haptics.selectionAsync();
  };

  const handleStop = () => {
    Speech.stop();
    setPlayingId(null);
  };

  const handleGroupPlay = (group: IrregularGroup) => {
    Speech.stop();
    setPlayingId(group.title);

    const textToSpeak = `${group.title}. What: ${group.what}. Where: ${group.where}. How: ${group.how}. When: ${group.when}.`;
    Speech.speak(textToSpeak, {
        rate: 0.9,
        pitch: 1.1,
        onDone: () => setPlayingId(null),
        onStopped: () => setPlayingId(null),
        onError: () => setPlayingId(null),
    });
    Haptics.selectionAsync();
  };

  return (
    <LinearGradient colors={["#FAFAFA", "#F5F5F5"]} style={styles.container}>
      <View style={styles.header}>
        <BackButton targetRoute="/vocab" color="#333" />
        <Text style={styles.headerTitle}>Irregular Words</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Text style={styles.introText}>
          Tricky words that don't follow the rules!
        </Text>

        {irregularGroups.map((group) => (
          <View key={group.title} style={styles.groupContainer}>
            <View style={[styles.groupHeader, { backgroundColor: group.darkColor }]}>
              <Text style={styles.groupTitle}>{group.title}</Text>
              <Ionicons 
                name={playingId === group.title ? "stop-circle" : "volume-medium"} 
                size={24} 
                color="white" 
                style={{ marginLeft: 10 }}
                onPress={() => playingId === group.title ? handleStop() : handleGroupPlay(group)}
              />
            </View>

            <View style={styles.explanationContainer}>
                <ExplanationView 
                    what={group.what}
                    where={group.where}
                    how={group.how}
                    when={group.when}
                    darkColor={group.darkColor}
                />
            </View>
            
            <View style={styles.grid}>
              {group.items.map((item) => (
                <TouchableOpacity
                    key={item.id}
                    style={[styles.card, { borderColor: group.darkColor, backgroundColor: group.color }]}
                    onPress={() => {
                        const textToSpeak = `${item.word}. Sounds like ${item.soundsLike}. Example: ${item.example}`;
                        handlePlay(item.id, textToSpeak);
                    }}
                    activeOpacity={0.9}
                >
                    <View style={styles.cardHeader}>
                        <Ionicons name={item.icon} size={32} color={group.darkColor} />
                        <View style={styles.wordContainer}>
                            <Text style={styles.wordText}>{item.word}</Text>
                            <Text style={styles.soundsLikeText}>Sounds like: {item.soundsLike}</Text>
                        </View>
                        <Ionicons 
                            name={playingId === item.id ? "stop-circle" : "volume-high"} 
                            size={28} 
                            color={group.darkColor} 
                        />
                    </View>
                    <View style={styles.divider} />
                    <Text style={styles.exampleText}>"{item.example}"</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ))}
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: Platform.OS === "android" ? StatusBar.currentHeight : 0,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  introText: {
    fontSize: 16,
    color: "#555",
    textAlign: "center",
    marginBottom: 20,
    fontStyle: "italic",
  },
  groupContainer: {
    marginBottom: 32,
  },
  groupHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 12,
    alignSelf: "flex-start",
  },
  groupTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#fff",
  },
  explanationContainer: {
    marginBottom: 16,
  },
  grid: {
    gap: 12,
  },
  card: {
    width: "100%",
    borderRadius: 16,
    borderWidth: 2,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  wordContainer: {
    flex: 1,
    marginLeft: 12,
  },
  wordText: {
    fontSize: 20,
    fontWeight: "800",
    color: "#333",
  },
  soundsLikeText: {
    fontSize: 14,
    color: "#666",
    fontStyle: "italic",
  },
  divider: {
    height: 1,
    backgroundColor: "rgba(0,0,0,0.1)",
    marginVertical: 8,
  },
  exampleText: {
    fontSize: 16,
    color: "#444",
    fontStyle: "italic",
    textAlign: "center",
  },
});
