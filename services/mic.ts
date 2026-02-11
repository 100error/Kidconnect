import { Alert, PermissionsAndroid, Platform } from "react-native";

export async function ensureMicPermission(): Promise<boolean> {
  if (Platform.OS !== "android") return true;
  const granted = await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.RECORD_AUDIO);
  if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
    Alert.alert("Permission Required", "Microphone permission is needed for voice features.");
    return false;
  }
  return true;
}
