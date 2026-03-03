import React from "react";
import { StyleSheet, Text, View } from "react-native";

type ExplanationViewProps = {
  what: string;
  where: string;
  how: string;
  when: string;
  darkColor: string;
};

export default function ExplanationView({
  what,
  where,
  how,
  when,
  darkColor,
}: ExplanationViewProps) {
  return (
    <View style={styles.container}>
      <View style={styles.row}>
        <Section title="WHAT" content={what} darkColor={darkColor} />
        <Section title="WHERE" content={where} darkColor={darkColor} />
      </View>
      <View style={styles.row}>
        <Section title="HOW" content={how} darkColor={darkColor} />
        <Section title="WHEN" content={when} darkColor={darkColor} />
      </View>
    </View>
  );
}

const Section = ({
  title,
  content,
  darkColor,
}: {
  title: string;
  content: string;
  darkColor: string;
}) => (
  <View style={[styles.section, { borderColor: darkColor }]}>
    <Text style={[styles.label, { color: darkColor }]}>{title}</Text>
    <Text style={styles.text}>{content}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    marginVertical: 10,
    gap: 8,
  },
  row: {
    flexDirection: "row",
    gap: 8,
  },
  section: {
    flex: 1,
    backgroundColor: "rgba(255,255,255,0.7)",
    borderRadius: 8,
    padding: 8,
    borderWidth: 1,
    minHeight: 80,
  },
  label: {
    fontSize: 12,
    fontWeight: "900",
    marginBottom: 4,
    opacity: 0.8,
  },
  text: {
    fontSize: 14,
    color: "#333",
    lineHeight: 18,
  },
});
