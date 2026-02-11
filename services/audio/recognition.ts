import Voice, {
  SpeechErrorEvent,
  SpeechResultsEvent,
} from "@react-native-voice/voice";
import { PermissionsAndroid, Platform } from "react-native";

export const Recognition = {
  requestPermission: async (): Promise<boolean> => {
    if (Platform.OS !== "android") return true;
    try {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
        {
          title: "Microphone Permission",
          message: "App needs access to your microphone for speech games.",
          buttonNeutral: "Ask Me Later",
          buttonNegative: "Cancel",
          buttonPositive: "OK",
        }
      );
      return granted === PermissionsAndroid.RESULTS.GRANTED;
    } catch (err) {
      console.warn(err);
      return false;
    }
  },

  start: async (
    onResult: (text: string) => void,
    onError: (error: any) => void
  ) => {
    try {
      await Voice.stop();
      Voice.onSpeechResults = (e: SpeechResultsEvent) => {
        const text = e.value?.[0] || "";
        onResult(text);
      };
      Voice.onSpeechError = (e: SpeechErrorEvent) => {
        onError(e);
      };
      await Voice.start("en-US");
    } catch (e) {
      onError(e);
    }
  },

  stop: async () => {
    try {
      await Voice.stop();
      Voice.removeAllListeners();
    } catch (e) {
      console.error(e);
    }
  },

  destroy: async () => {
    try {
      await Voice.destroy();
      Voice.removeAllListeners();
    } catch (e) {
      console.error(e);
    }
  },
};
