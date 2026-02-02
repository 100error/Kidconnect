import { Stack } from "expo-router";
import { ThemeProvider, DefaultTheme, DarkTheme } from "@react-navigation/native";
import { useColorScheme } from "@/hooks/use-color-scheme";

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <ThemeProvider value={colorScheme === "dark" ? DarkTheme : DefaultTheme}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="start" />
        <Stack.Screen name="greeting" />
        <Stack.Screen name="intro" />
        <Stack.Screen name="home" />
        <Stack.Screen name="vocab" />
        <Stack.Screen name="pract" />
        <Stack.Screen name="games" />
        {/*---------TABS------------*/}
        <Stack.Screen name="(tabs)" />
        {/*--------VOCAB------------*/}
        <Stack.Screen name="common" />
        <Stack.Screen name="nouns" />
        <Stack.Screen name="tenses" />
        <Stack.Screen name="irregular" />
        <Stack.Screen name="comparison" />
        <Stack.Screen name="plural" />
        <Stack.Screen name="questions" />
        <Stack.Screen name="dialogue" />
        <Stack.Screen name="context" />
        <Stack.Screen name="problemsolving" />
        <Stack.Screen name="spelled" />
        {/*--------PRACT--------------*/}  
        <Stack.Screen name="wordpronunce" />
        <Stack.Screen name="sentencebuild" />
        <Stack.Screen name="fixsentence" />
        {/*--------GAMES---------------*/}
        <Stack.Screen name="oddwordout" />
        <Stack.Screen name="rhymetime" />
      </Stack>
    </ThemeProvider>
  );
}
