import React, { useEffect } from "react";
import { useTranslation, Trans } from "next-i18next";
import Button from "./Button";
import {
  FaKey,
  FaMicrochip,
  FaThermometerFull,
  FaServer,
  FaExclamationCircle,
  FaSyncAlt,
  FaCoins,
  FaCode,
  FaGlobe, // Icon for provider
} from "react-icons/fa";
import Dialog from "./Dialog";
import Input from "./Input";
import { GPT_MODEL_NAMES, GPT_4 } from "../utils/constants";
import Accordion from "./Accordion";
import type { ModelSettings, SettingModel, ModelProvider } from "../utils/types";
import { useGuestMode } from "../hooks/useGuestMode";
import clsx from "clsx";

const PROVIDER_OPTIONS: { label: string; value: ModelProvider }[] = [
  { label: "OpenAI", value: "openai" },
  { label: "Ollama", value: "ollama" },
  { label: "Gemini", value: "gemini" },
  { label: "HuggingFace", value: "huggingface" },
];

export const SettingsDialog: React.FC<{
  show: boolean;
  close: () => void;
  customSettings: SettingModel;
}> = ({ show, close, customSettings }) => {
  const [settings, setSettings] = React.useState<ModelSettings>({
    provider: "openai", // Default provider
    ...customSettings.settings,
  });
  const { isGuestMode } = useGuestMode(settings.customGuestKey);
  const { t } = useTranslation(["settings", "common"]);

  useEffect(() => {
    // Ensure provider has a default if not present in loaded settings
    setSettings({
      provider: customSettings.settings.provider || "openai",
      ...customSettings.settings,
    });
  }, [customSettings, close]);

  const updateSettings = <Key extends keyof ModelSettings>(
    key: Key,
    value: ModelSettings[Key]
  ) => {
    setSettings((prev) => {
      const newSettings = { ...prev, [key]: value };
      // If provider changes, reset model name if it was a GPT model or not suitable for new provider
      if (key === "provider") {
        if (value === "openai") {
            // If switching to OpenAI, and current model is not a known GPT model, set to default GPT model
            if (!newSettings.customModelName || !GPT_MODEL_NAMES.includes(newSettings.customModelName)) {
                 newSettings.customModelName = GPT_MODEL_NAMES[0];
            }
        } else {
            // If switching away from OpenAI and current model was a GPT model, clear it
            if (prev.customModelName && GPT_MODEL_NAMES.includes(prev.customModelName)) {
                newSettings.customModelName = ""; // Or set a default for the new provider
            }
        }
      }
      return newSettings;
    });
  };

  const keyIsValid = (key: string | undefined) => {
    if (settings.provider === "openai") {
      const pattern = /^(sk-[a-zA-Z0-9]{48}|[a-fA-F0-9]{32})$/;
      if (!(key && pattern.test(key))) return false;
    }
    // Add specific key validations for Gemini or HuggingFace if needed
    // For now, a non-empty key is considered valid for them if provided
    if ((settings.provider === "gemini" || settings.provider === "huggingface")) {
        if (!key) return false; // Or true if API key is optional for HF
    }
    return true;
  };

  const urlIsValid = (url: string | undefined) => {
    if (url && url.trim() !== "") {
      const pattern = /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([/\w .-]*)*\/?$/;
      return pattern.test(url);
    }
    return true; // Empty URL is valid (means use default)
  };

  const handleSave = () => {
    if (!isGuestMode && !keyIsValid(settings.customApiKey)) {
      let errorMsg = t("Key is invalid");
      if (settings.provider === "openai") {
        errorMsg = t("OpenAI API Key is invalid, please ensure that you have set up billing in your OpenAI account!");
      } else if (settings.provider === "gemini") {
        errorMsg = t("Gemini API Key is invalid. Please check the key.");
      } else if (settings.provider === "huggingface") {
        errorMsg = t("HuggingFace API Key is invalid. Please check the key.");
      }
      alert(errorMsg);
      return;
    }

    if (settings.customEndPoint && !urlIsValid(settings.customEndPoint)) {
      alert(
        t(
          "Endpoint URL is invalid. Please ensure that you have set a correct URL."
        )
      );
      return;
    }
    customSettings.saveSettings(settings);
    close();
    return;
  };

  const handleReset = () => {
    const defaultSettings = customSettings.resetSettings(); // Assuming resetSettings returns the default state or handles it
     setSettings({ provider: "openai", ...defaultSettings });
    close();
  };

  const showApiKeyInput = settings.provider === "openai" || settings.provider === "gemini" || settings.provider === "huggingface";
  const showEndpointInput = settings.provider === "ollama" || settings.provider === "huggingface" || settings.provider === "openai";

  const disabled = // Disable fields if API key is required for the provider and not set (excluding guest mode)
    !isGuestMode &&
    ((settings.provider === "openai" || settings.provider === "gemini") && !settings.customApiKey) ||
    (settings.provider === "huggingface" && !settings.customApiKey && !settings.customEndPoint); // HF might work with endpoint only for local models


  const apiKeyLabel = () => {
    switch (settings.provider) {
      case "gemini":
        return t("gemini-api-key", { ns: "settings" });
      case "huggingface":
        return t("huggingface-api-key", { ns: "settings" });
      case "openai":
      default:
        return t("key", { ns: "settings" }); // OpenAI Key
    }
  };

  const endpointLabel = () => {
    switch (settings.provider) {
      case "ollama":
        return t("ollama-endpoint", { ns: "settings" });
      case "huggingface":
        return t("huggingface-endpoint", { ns: "settings" });
      case "openai":
      default:
        return t("endPoint", { ns: "settings" });
    }
  };

  const endpointPlaceholder = () => {
    if (settings.provider === "ollama") return "http://localhost:11434";
    if (settings.provider === "huggingface") return "e.g., https://your-hf-inference-endpoint.com";
    return "e.g., https://api.openai.com/v1 (optional)";
  }

  const advancedSettings = (
    <div className="flex flex-col gap-2">
      {showEndpointInput && (
        <Input
          left={
            <>
              <FaServer />
              <span className="ml-2">{endpointLabel()}</span>
            </>
          }
          placeholder={endpointPlaceholder()}
          // Gemeni does not use a custom endpoint in this UI
          disabled={settings.provider === "gemini" || (disabled && settings.provider !== "ollama")}
          value={settings.customEndPoint}
          onChange={(e) => updateSettings("customEndPoint", e.target.value)}
        />
      )}
      <Input
        left={
          <>
            <FaThermometerFull />
            <span className="ml-2">{t("temp", { ns: "settings" })}</span>
          </>
        }
        value={settings.customTemperature ?? 0.9}
        onChange={(e) =>
          updateSettings("customTemperature", parseFloat(e.target.value))
        }
        type="range"
        toolTipProperties={{
          message: t("temp-tips", { ns: "settings" }) as string,
          disabled: false,
        }}
        attributes={{
          min: 0,
          max: 1,
          step: 0.01,
        }}
      />
      <Input
        left={
          <>
            <FaSyncAlt />
            <span className="ml-2">{t("loop", { ns: "settings" })}</span>
          </>
        }
        value={settings.customMaxLoops ?? 10}
        disabled={disabled}
        onChange={(e) =>
          updateSettings("customMaxLoops", parseFloat(e.target.value))
        }
        type="range"
        toolTipProperties={{
          message: t("loop-tips", { ns: "settings" }) as string,
          disabled: false,
        }}
        attributes={{
          min: 1,
          max: 100,
          step: 1,
        }}
      />
      <Input
        left={
          <>
            <FaCoins />
            <span className="ml-2">{t("tokens", { ns: "settings" })}</span>
          </>
        }
        value={settings.customMaxTokens ?? 400}
        disabled={disabled}
        onChange={(e) =>
          updateSettings("customMaxTokens", parseFloat(e.target.value))
        }
        type="range"
        toolTipProperties={{
          message: t("tokens-tips", { ns: "settings" }) as string,
          disabled: false,
        }}
        attributes={{
          min: 200,
          // Adjust max based on model if possible, providing a generous default otherwise
          max: (settings.provider === "openai" && settings.customModelName?.includes("32k")) ? 32000 :
               (settings.provider === "openai" && settings.customModelName?.includes("16k")) ? 16000 :
               (settings.provider === "openai" && settings.customModelName === GPT_4) ? 8000 :
               4000,
          step: 100,
        }}
      />
    </div>
  );

  const renderApiKeyNotice = () => {
    switch (settings.provider) {
      case "openai":
        return (
          <Trans i18nKey="api-key-notice" ns="settings">
            <strong className="mt-10 block text-sm">
              NOTE: To get an OpenAI key, sign up for an OpenAI account and visit the
              following
              <a
                href="https://platform.openai.com/account/api-keys"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-500"
              >
                link.
              </a>
              This key is only used in the current browser session.
            </strong>
          </Trans>
        );
      case "gemini":
        return (
          <p className="mt-4 text-sm">
            {t("gemini-api-key-notice-1", { ns: "settings" })}{" "}
            <a
              href="https://aistudio.google.com/app/apikey"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-500"
            >
              Google AI Studio
            </a>
            . {t("gemini-api-key-notice-2", { ns: "settings" })}
          </p>
        );
      case "huggingface":
        return (
          <p className="mt-4 text-sm">
            {t("huggingface-api-key-notice-1", { ns: "settings" })}{" "}
            <a
              href="https://huggingface.co/settings/tokens"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-500"
            >
              Hugging Face account settings
            </a>
            . {t("huggingface-api-key-notice-2", { ns: "settings" })}
          </p>
        );
      case "ollama":
        return (
          <p className="mt-4 text-sm">
            {t("ollama-notice-1", { ns: "settings" })}{" "}
            <a
              href="https://ollama.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-500"
            >
              Ollama website
            </a>
            . {t("ollama-notice-2", { ns: "settings" })}
          </p>
        );
      default:
        return null;
    }
  };

  const renderModelNameInput = () => {
    if (settings.provider === "openai") {
      return (
        <Input
          left={
            <>
              <FaMicrochip />
              <span className="ml-2">{t("model", { ns: "settings" })}</span>
            </>
          }
          type="combobox"
          value={settings.customModelName}
          onChange={() => null} // Handled by setValue
          setValue={(e) => updateSettings("customModelName", e)}
          attributes={{ options: GPT_MODEL_NAMES }}
          disabled={disabled}
        />
      );
    } else {
      // Free text input for other providers
      return (
        <Input
          left={
            <>
              <FaMicrochip />
              <span className="ml-2">{t("model-name", { ns: "settings" })}</span>
            </>
          }
          placeholder={
            settings.provider === "ollama" ? t("ollama-model-placeholder", {ns: "settings", defaultValue: "e.g., llama3, mistral"}) :
            settings.provider === "gemini" ? t("gemini-model-placeholder", {ns: "settings", defaultValue: "e.g., gemini-pro, gemini-1.5-flash"}) :
            settings.provider === "huggingface" ? t("huggingface-model-placeholder", {ns: "settings", defaultValue: "e.g., meta-llama/Meta-Llama-3-8B"}) :
            t("model-name-placeholder", { ns: "settings" })
          }
          value={settings.customModelName}
          onChange={(e) => updateSettings("customModelName", e.target.value)}
          disabled={disabled && settings.provider !== "ollama"} // Ollama model can be set without API key
        />
      );
    }
  };


  return (
    <Dialog
      header={`${t("settings", { ns: "common" })} ⚙`}
      isShown={show}
      close={close}
      footerButton={
        <>
          <Button className="bg-red-400 hover:bg-red-500" onClick={handleReset}>
            {t("reset", { ns: "common" })}
          </Button>
          <Button onClick={handleSave}>{t("save", { ns: "common" })}</Button>
        </>
      }
    >
      <p>{t("usage", { ns: "settings" })}</p>
      {settings.provider === "openai" && settings.customModelName === GPT_4 && (
        <p
          className={clsx(
            "my-2 rounded-md border-[2px] border-white/10 bg-yellow-300 p-2 text-black"
          )}
        >
          <FaExclamationCircle className="inline-block" />
          &nbsp;
          <Trans i18nKey="gpt4-notice" ns="settings">
            <b>
              To use the GPT-4 model, you need to also provide the API key for
              GPT-4. You can request for it&nbsp;
              <a
                href="https://openai.com/waitlist/gpt-4-api"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-500"
              >
                here
              </a>
              . (ChatGPT Plus subscription will not work)
            </b>
          </Trans>
        </p>
      )}

      <div className="mt-2 flex flex-col gap-2">
        <Input
          left={
            <>
              <FaGlobe />
              <span className="ml-2">{t("llm-provider", { ns: "settings" })}</span>
            </>
          }
          type="combobox"
          value={settings.provider}
          onChange={() => null}
          setValue={(e) => updateSettings("provider", e as ModelProvider)}
          attributes={{
            options: PROVIDER_OPTIONS.map(p => p.value),
            displayOptions: PROVIDER_OPTIONS.map(p => p.label)
          }}
        />

        {showApiKeyInput && (
          <Input
            left={
              <>
                <FaKey />
                <span className="ml-2">{apiKeyLabel()}</span>
              </>
            }
            placeholder={settings.provider === "openai" ? "sk-..." : t("api-key-placeholder", { ns: "settings" })}
            value={settings.customApiKey}
            onChange={(e) => updateSettings("customApiKey", e.target.value)}
            type="password"
          />
        )}

        {renderModelNameInput()}

        {isGuestMode && (
          <Input
            left={
              <>
                <FaCode />
                <span className="ml-2">{t("guest-key", { ns: "settings" })}</span>
              </>
            }
            value={settings.customGuestKey}
            onChange={(e) => updateSettings("customGuestKey", e.target.value)}
            type="password"
          />
        )}
        <Accordion
          child={advancedSettings}
          name={t("advanced-settings", { ns: "settings" })}
        ></Accordion>
      </div>
      {renderApiKeyNotice()}
    </Dialog>
  );
};
