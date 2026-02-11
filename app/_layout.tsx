import { Stack, usePathname } from "expo-router";
import { ThemeProvider, DefaultTheme, DarkTheme } from "@react-navigation/native";
import { useColorScheme } from "@/hooks/use-color-scheme";
import * as Speech from "expo-speech";
import { useEffect } from "react";

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const pathname = usePathname();

  useEffect(() => {
    // Global audio cleanup on navigation
    Speech.stop();
  }, [pathname]);

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
      </Stack>
    </ThemeProvider>
  );
}
