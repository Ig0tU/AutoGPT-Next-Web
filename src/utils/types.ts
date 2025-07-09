export type ModelProvider = "openai" | "ollama" | "gemini" | "huggingface";

export type ModelSettings = {
  provider?: ModelProvider;
  customApiKey?: string;
  customModelName?: string;
  customTemperature?: number;
  customMaxLoops?: number;
  customEndPoint?: string;
  customMaxTokens?: number;
  customGuestKey?: string;
};

export type GuestSettings = {
  isValidGuest: boolean;
  isGuestMode: boolean;
};

export type SettingModel = {
  settings: ModelSettings;
  saveSettings: (settings: ModelSettings) => void;
  resetSettings: () => void;
};
