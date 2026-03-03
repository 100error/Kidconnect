// Deprecated: Replaced by services/speechService.ts
// This file is kept for reference but should not be used.
// The @react-native-voice/voice dependency has been removed.


export const Recognition = {
  requestPermission: async (): Promise<boolean> => {
    console.warn("Recognition.requestPermission is deprecated. Use speechService instead.");
    return false;
  },

  start: async (
    onResult: (text: string) => void,
    onError: (error: any) => void
  ) => {
    console.warn("Recognition.start is deprecated. Use speechService instead.");
    onError(new Error("Deprecated"));
  },

  stop: async () => {
    console.warn("Recognition.stop is deprecated. Use speechService instead.");
  },

  destroy: async () => {
    console.warn("Recognition.destroy is deprecated. Use speechService instead.");
  },
};
