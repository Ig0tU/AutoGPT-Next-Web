import { OpenAI } from "langchain/llms/openai"; // Assuming this path is still valid from 'langchain' package
import { Ollama } from "@langchain/community/llms/ollama";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { HuggingFaceHub } from "@langchain/community/llms/hf";
import { PromptTemplate } from "langchain/prompts"; // Assuming this path is still valid
import type { ModelSettings } from "./types";
import { GPT_35_TURBO } from "./constants";
import {
  OLLAMA_API_BASE_URL,
  DEFAULT_OLLAMA_MODEL,
  GEMINI_API_KEY,
  DEFAULT_GEMINI_MODEL,
  HUGGINGFACE_API_KEY,
  DEFAULT_HUGGINGFACE_MODEL,
  HUGGINGFACE_API_BASE_URL
} from "./config"; // Import new configs

const getOpenAIServerSideKey = (): string => {
  const keys: string[] = (process.env.OPENAI_API_KEY || "")
    .split(",")
    .map((key) => key.trim())
    .filter((key) => key.length);

  return keys[Math.floor(Math.random() * keys.length)] || "";
};

export const createModel = (settings: ModelSettings) => {
  const provider = settings.provider || "openai"; // Default to openai if no provider is set
  const temperature = settings.customTemperature || 0.9;
  const maxTokens = settings.customMaxTokens || 400;

  switch (provider) {
    case "ollama":
      return new Ollama({
        baseUrl: settings.customEndPoint || OLLAMA_API_BASE_URL,
        model: settings.customModelName || DEFAULT_OLLAMA_MODEL,
        temperature,
        // Ollama doesn't directly support maxTokens in the same way,
        // it's often controlled by the model's parameters or a different setting.
        // We can pass it if the Langchain Ollama class supports it, or omit it.
        // For now, let's assume it might be part of model specific parameters or context window.
      });
    case "gemini":
      if (!settings.customApiKey && !GEMINI_API_KEY) {
        throw new Error("Gemini API Key not found. Please set it in the settings or environment variables.");
      }
      return new ChatGoogleGenerativeAI({
        apiKey: settings.customApiKey || GEMINI_API_KEY,
        modelName: settings.customModelName || DEFAULT_GEMINI_MODEL,
        temperature,
        maxOutputTokens: maxTokens,
      });
    case "huggingface":
      if (!settings.customApiKey && !HUGGINGFACE_API_KEY) {
        // Allow anonymous usage if no API key is provided, depending on HuggingFaceHub's behavior
        // Or throw an error if a key is strictly required for the desired models.
        // For now, we'll proceed, but this might need adjustment based on testing.
      }
      return new HuggingFaceHub({
        apiKey: settings.customApiKey || HUGGINGFACE_API_KEY,
        model: settings.customModelName || DEFAULT_HUGGINGFACE_MODEL,
        // HuggingFaceHub parameters can vary; temperature and maxTokens are common.
        // The endpoint parameter can be used for self-hosted inference endpoints.
        endpoint: settings.customEndPoint || HUGGINGFACE_API_BASE_URL,
        temperature,
        maxTokens,
      });
    case "openai":
    default:
      let _settings: ModelSettings | undefined = settings;
      if (!settings.customApiKey) {
        _settings = undefined;
      }
      const options = {
        openAIApiKey: _settings?.customApiKey || getOpenAIServerSideKey(),
        temperature: temperature,
        modelName: _settings?.customModelName || GPT_35_TURBO,
        maxTokens: maxTokens,
      };
      const baseOptions = {
        basePath: _settings?.customEndPoint || undefined,
      };
      return new OpenAI(options, baseOptions);
  }
};

export const startGoalPrompt = new PromptTemplate({
  template: `You are a task creation AI called AgentGPT. You must answer the "{customLanguage}" language. You are not a part of any system or device. You have the following objective "{goal}". Create a list of zero to three tasks to be completed by your AI system such that this goal is more closely, or completely reached. You have access to google search for tasks that require current events or small searches. Return the response as a formatted ARRAY of strings that can be used in JSON.parse(). Example: ["{{TASK-1}}", "{{TASK-2}}"].`,
  inputVariables: ["goal", "customLanguage"],
});

export const analyzeTaskPrompt = new PromptTemplate({
  template: `You have the following higher level objective "{goal}". You currently are focusing on the following task: "{task}". Based on this information, evaluate what the best action to take is strictly from the list of actions: {actions}. You should use 'search' only for research about current events where "arg" is a simple clear search query based on the task only. Use "reason" for all other actions. Return the response as an object of the form {{ "action": "string", "arg": "string" }} that can be used in JSON.parse() and NOTHING ELSE.`,
  inputVariables: ["goal", "actions", "task"],
});

export const executeTaskPrompt = new PromptTemplate({
  template:
    'Answer in the "{customLanguage}" language. Given the following overall objective `{goal}` and the following sub-task, `{task}`. Perform the task in a detailed manner. If coding is required, provide code in markdown',
  inputVariables: ["goal", "task", "customLanguage"],
});

export const createTasksPrompt = new PromptTemplate({
  template:
    'You are an AI task creation agent. You must answer in the "{customLanguage}" language. You have the following objective `{goal}`. You have the following incomplete tasks `{tasks}` and have just executed the following task `{lastTask}` and received the following result `{result}`. Based on this, create a new task to be completed by your AI system ONLY IF NEEDED such that your goal is more closely reached or completely reached. Return the response as an array of strings that can be used in JSON.parse() and NOTHING ELSE.',
  inputVariables: ["goal", "tasks", "lastTask", "result", "customLanguage"],
});

export const summarizeSearchSnippets = new PromptTemplate({
  template: `Summarize the following snippets "{snippets}" from google search results filling in information where necessary. This summary should answer the following query: "{query}" with the following goal "{goal}" in mind. Return the summary as a string. Do not show you are summarizing.`,
  inputVariables: ["goal", "query", "snippets"],
});
