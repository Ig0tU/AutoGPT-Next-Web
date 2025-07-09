// API Configuration
const BASE_URL = process.env.OPENAI_API_BASE_URL || "https://api.pawan.krd/v1"
const DEFAULT_MODEL = "gpt-3.5-turbo"

// Ollama Configuration
const OLLAMA_API_BASE_URL = process.env.OLLAMA_API_BASE_URL || "http://localhost:11434";
const DEFAULT_OLLAMA_MODEL = "llama3"; // Or any other default model

// Gemini Configuration
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || "";
const DEFAULT_GEMINI_MODEL = "gemini-pro";

// HuggingFace Configuration
const HUGGINGFACE_API_KEY = process.env.HUGGINGFACE_API_KEY || "";
const DEFAULT_HUGGINGFACE_MODEL = "gpt2"; // Or any other default model
const HUGGINGFACE_API_BASE_URL = process.env.HUGGINGFACE_API_BASE_URL; // For self-hosted inference endpoints
