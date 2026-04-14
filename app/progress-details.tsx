import BackButton from "@/components/ui/BackButton";
import { useSafeAsync } from "@/hooks/useSafeAsync";
import { ActivityResult, getAllResults } from "@/services/progress";
import { speechService } from "@/services/speechService";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "expo-router";
import * as Speech from "expo-speech";
import React, { useCallback, useMemo, useState } from "react";
import {
    Dimensions,
    Platform,
    SafeAreaView,
    ScrollView,
    StatusBar,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import Animated, {
    useAnimatedStyle,
    useSharedValue,
    withSpring,
} from "react-native-reanimated";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const COLUMN_COUNT = 7;
const GRID_PADDING = 20;
const BLOCK_SIZE = (SCREEN_WIDTH - GRID_PADDING * 2 - 40) / COLUMN_COUNT;

type GroupedResults = {
  [date: string]: ActivityResult[];
};

export default function ProgressDetails() {
  const { isMountedRef, safeRun } = useSafeAsync();
  const [allResults, setAllResults] = useState<ActivityResult[]>([]);
  const [selectedDate, setSelectedDate] = useState<string | null>(
    new Date().toDateString(),
  );
  const [currentMonth, setCurrentMonth] = useState(new Date());

  useFocusEffect(
    useCallback(() => {
      const loadProgress = async () => {
        const results = await getAllResults();
        if (isMountedRef.current) setAllResults(results);
      };
      loadProgress();
      return () => {
        speechService.stopRecording();
        Speech.stop();
      };
    }, []),
  );

  const groupedResults = useMemo(() => {
    return allResults.reduce<GroupedResults>((acc, result) => {
      const dateKey = new Date(result.timestamp).toDateString();
      if (!acc[dateKey]) acc[dateKey] = [];
      acc[dateKey].push(result);
      return acc;
    }, {});
  }, [allResults]);

  const stats = useMemo(() => {
    const dates = Object.keys(groupedResults).sort(
      (a, b) => new Date(b).getTime() - new Date(a).getTime(),
    );
    let streak = 0;
    const today = new Date().toDateString();
    let checkDate = new Date();

    // Calculate Streak
    while (true) {
      const dateStr = checkDate.toDateString();
      if (groupedResults[dateStr]) {
        streak++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        // If it's today and no activity, check yesterday to continue streak
        if (dateStr === today && streak === 0) {
          checkDate.setDate(checkDate.getDate() - 1);
          continue;
        }
        break;
      }
    }

    return {
      streak,
      totalActiveDays: dates.length,
    };
  }, [groupedResults]);

  const calendarDays = useMemo(() => {
    const days = [];
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const startOfMonth = new Date(year, month, 1);
    const endOfMonth = new Date(year, month + 1, 0);

    // Padding for start of month
    for (let i = 0; i < startOfMonth.getDay(); i++) {
      days.push(null);
    }

    for (let d = 1; d <= endOfMonth.getDate(); d++) {
      const date = new Date(year, month, d);
      days.push(date);
    }
    return days;
  }, [currentMonth]);

  const changeMonth = (offset: number) => {
    const newDate = new Date(
      currentMonth.getFullYear(),
      currentMonth.getMonth() + offset,
      1,
    );
    setCurrentMonth(newDate);
  };

  const getDayColor = (date: Date) => {
    const dateStr = date.toDateString();
    const dayResults = groupedResults[dateStr];
    if (!dayResults || dayResults.length === 0) return "#E0E0E0";

    const avgScore =
      dayResults.reduce((sum, r) => sum + r.score / r.maxScore, 0) /
      dayResults.length;

    if (avgScore >= 0.8) return "#4CAF50"; // Green
    if (avgScore >= 0.5) return "#FFC107"; // Yellow
    return "#F44336"; // Red
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getScoreColor = (score: number, maxScore: number) => {
    const pct = score / maxScore;
    if (pct >= 0.8) return "#4CAF50";
    if (pct >= 0.5) return "#FF9800";
    return "#F44336";
  };

  const selectedDayResults = useMemo(() => {
    if (!selectedDate) return [];
    const results = groupedResults[selectedDate] || [];

    // ✅ UI SAFETY FILTER: Ensure unique results per activityId + day
    const latestResultsMap = new Map<string, ActivityResult>();
    results.forEach((r) => {
      const existing = latestResultsMap.get(r.activityId);
      if (
        !existing ||
        new Date(r.timestamp).getTime() > new Date(existing.timestamp).getTime()
      ) {
        latestResultsMap.set(r.activityId, r);
      }
    });

    // Convert back to array and sort by timestamp DESC (latest first)
    return Array.from(latestResultsMap.values()).sort(
      (a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
    );
  }, [selectedDate, groupedResults]);

  const getDisplayName = (id: string) => {
    const displayNameMap: Record<string, string> = {
      "pronunciation-matching": "Match Pairs",
      "sentence-build-worksheet": "Sentence Builder",
      "present-simple-tense": "Present Simple Tense",
      fixsentence: "Fix the Sentence",
      riddles: "Riddles",
      oddwordout: "Odd Word Out",
      storyspeak: "Story Speak",
      speakit: "Speak It Game",
      causeeffect: "Cause and Effect",
      // Legacy mapping for old data
      matchpairs: "Match Pairs",
      sentencebuild: "Sentence Builder",
      presentsimple: "Present Simple Tense",
    };

    // Remove session timestamp for mapping (e.g. "fixsentence-1234567" -> "fixsentence")
    const baseId = id.split("-")[0];

    if (displayNameMap[baseId]) return displayNameMap[baseId];

    // Handle legacy patterns
    if (id.startsWith("fixsentence-")) return "Fix the Sentence";
    if (id === "presentsimpletense") return "Present Simple Tense";

    return baseId.replace(/-/g, " ");
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <BackButton targetRoute="/home" color="#0277BD" />
        <Text style={styles.headerTitle}>My Journey</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Stats Section */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statEmoji}>🔥</Text>
            <Text style={styles.statValue}>{stats.streak}</Text>
            <Text style={styles.statLabel}>Day Streak</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statEmoji}>⭐</Text>
            <Text style={styles.statValue}>{stats.totalActiveDays}</Text>
            <Text style={styles.statLabel}>Active Days</Text>
          </View>
        </View>

        {/* Calendar Grid */}
        <View style={styles.calendarCard}>
          <View style={styles.calendarHeader}>
            <TouchableOpacity
              onPress={() => changeMonth(-1)}
              style={styles.navButton}
            >
              <Ionicons name="chevron-back" size={24} color="#0288D1" />
            </TouchableOpacity>
            <Text style={styles.monthTitle}>
              {currentMonth.toLocaleString("default", {
                month: "long",
                year: "numeric",
              })}
            </Text>
            <TouchableOpacity
              onPress={() => changeMonth(1)}
              style={styles.navButton}
            >
              <Ionicons name="chevron-forward" size={24} color="#0288D1" />
            </TouchableOpacity>
          </View>
          <View style={styles.weekdayRow}>
            {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
              <Text key={i} style={styles.weekdayText}>
                {d}
              </Text>
            ))}
          </View>
          <View style={styles.grid}>
            {calendarDays.map((date, i) => {
              if (!date)
                return <View key={`empty-${i}`} style={styles.dayBlockEmpty} />;

              const dateStr = date.toDateString();
              const isToday = dateStr === new Date().toDateString();
              const isSelected = dateStr === selectedDate;
              const hasActivity = groupedResults[dateStr]?.length > 0;
              const isFuture = date.getTime() > new Date().getTime();

              return (
                <DayBlock
                  key={dateStr}
                  date={date}
                  color={getDayColor(date)}
                  isToday={isToday}
                  isSelected={isSelected}
                  hasActivity={hasActivity}
                  isFuture={isFuture}
                  onPress={() => setSelectedDate(dateStr)}
                />
              );
            })}
          </View>
        </View>

        {/* Selected Day Details */}
        <View style={styles.detailsSection}>
          <Text style={styles.detailsTitle}>
            {selectedDate === new Date().toDateString()
              ? "Today's Activity"
              : selectedDate
                ? new Date(selectedDate).toLocaleDateString(undefined, {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })
                : "Select a day"}
          </Text>

          {selectedDayResults.length === 0 ? (
            <Text style={styles.emptyText}>
              No activity recorded for this day.
            </Text>
          ) : (
            selectedDayResults.map((item, idx) => (
              <View key={idx} style={styles.activityItem}>
                <View style={styles.activityHeader}>
                  <Text style={styles.activityName}>
                    {getDisplayName(item.activityId)}
                  </Text>
                  <Text style={styles.activityTime}>
                    {formatTime(item.timestamp)}
                  </Text>
                </View>
                <View style={styles.activityFooter}>
                  <Text style={styles.scoreText}>
                    Score:{" "}
                    <Text
                      style={{
                        color: getScoreColor(item.score, item.maxScore),
                      }}
                    >
                      {item.score}/{item.maxScore}
                    </Text>
                  </Text>
                  <View style={styles.categoryBadge}>
                    <Text style={styles.categoryText}>
                      {item.category.toUpperCase()}
                    </Text>
                  </View>
                </View>
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function DayBlock({
  date,
  color,
  isToday,
  isSelected,
  hasActivity,
  isFuture,
  onPress,
}: any) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: isFuture ? 0.4 : 1,
  }));

  const handlePress = () => {
    if (isFuture) return;
    scale.value = withSpring(0.9, { damping: 10 }, () => {
      scale.value = withSpring(1);
    });
    onPress();
  };

  return (
    <TouchableOpacity onPress={handlePress} activeOpacity={isFuture ? 1 : 0.7}>
      <Animated.View
        style={[
          styles.dayBlock,
          { backgroundColor: color },
          isToday && styles.todayBlock,
          isSelected && styles.selectedBlock,
          animatedStyle,
        ]}
      >
        <Text style={[styles.dayText, color !== "#E0E0E0" && styles.whiteText]}>
          {date.getDate()}
        </Text>
        {hasActivity && (
          <View style={styles.starContainer}>
            <Text style={styles.starText}>⭐</Text>
          </View>
        )}
      </Animated.View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#F0F9FF",
    paddingTop: Platform.OS === "android" ? StatusBar.currentHeight : 0,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#FFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E0F2F1",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#0277BD",
  },
  scrollContent: {
    padding: GRID_PADDING,
  },
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  statCard: {
    flex: 0.48,
    backgroundColor: "#FFF",
    borderRadius: 20,
    padding: 15,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  statEmoji: { fontSize: 24, marginBottom: 5 },
  statValue: { fontSize: 24, fontWeight: "900", color: "#333" },
  statLabel: { fontSize: 12, color: "#757575", fontWeight: "600" },
  calendarCard: {
    backgroundColor: "#FFF",
    borderRadius: 24,
    padding: 20,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  calendarHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 15,
  },
  navButton: {
    padding: 5,
  },
  monthTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#333",
    textTransform: "capitalize",
  },
  weekdayRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  weekdayText: {
    width: BLOCK_SIZE,
    textAlign: "center",
    fontSize: 12,
    fontWeight: "700",
    color: "#BDBDBD",
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  dayBlock: {
    width: BLOCK_SIZE,
    height: BLOCK_SIZE,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 8,
    position: "relative",
  },
  dayBlockEmpty: {
    width: BLOCK_SIZE,
    height: BLOCK_SIZE,
    marginBottom: 8,
  },
  dayText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#757575",
  },
  whiteText: { color: "#FFF" },
  starContainer: {
    position: "absolute",
    top: -2,
    right: -2,
    backgroundColor: "white",
    borderRadius: 10,
    width: 16,
    height: 16,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1,
    elevation: 2,
  },
  starText: {
    fontSize: 10,
  },
  todayBlock: {
    borderWidth: 2,
    borderColor: "#0288D1",
  },
  selectedBlock: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 6,
    elevation: 8,
    transform: [{ scale: 1.1 }],
    zIndex: 10,
  },
  detailsSection: {
    paddingBottom: 40,
  },
  detailsTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#333",
    marginBottom: 15,
  },
  activityItem: {
    backgroundColor: "#FFF",
    borderRadius: 18,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  activityHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  activityName: {
    fontSize: 16,
    fontWeight: "700",
    color: "#424242",
    textTransform: "capitalize",
  },
  activityTime: {
    fontSize: 12,
    color: "#9E9E9E",
    fontWeight: "600",
  },
  activityFooter: {
    flexDirection: "row",
    alignItems: "center",
  },
  scoreText: {
    fontSize: 14,
    fontWeight: "600",
    marginRight: 15,
  },
  categoryBadge: {
    backgroundColor: "#E1F5FE",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  categoryText: {
    fontSize: 10,
    fontWeight: "800",
    color: "#0288D1",
  },
  emptyText: {
    textAlign: "center",
    color: "#9E9E9E",
    marginTop: 20,
    fontSize: 16,
    fontStyle: "italic",
  },
});
