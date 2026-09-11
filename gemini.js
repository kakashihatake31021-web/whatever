/**
 * TriGuide AI - Google Gemini API Client & Engine
 * Supports gemini-1.5-flash, gemini-2.0-flash, gemini-1.5-pro,
 * with secure client-side storage and seamless zero-key fallback.
 */

import { MOCK_DATA } from './mockData.js';

class GeminiService {
  constructor() {
    this.storageKey = 'triguide_gemini_api_key';
    this.modelKey = 'triguide_selected_model';
    this.demoKey = 'triguide_demo_mode';
    this.tempKey = 'triguide_temperature';

    this.apiKey = localStorage.getItem(this.storageKey) || '';
    let storedModel = localStorage.getItem(this.modelKey) || 'gemini-3.5-flash-lite';
    if (storedModel.includes('pro') || storedModel.includes('1.5')) {
      storedModel = 'gemini-3.5-flash-lite';
    }
    this.model = storedModel;
    localStorage.setItem(this.modelKey, this.model);

    this.isDemoMode = localStorage.getItem(this.demoKey) !== 'false' && !this.apiKey;
    this.temperature = parseFloat(localStorage.getItem(this.tempKey) || '0.7');

    this.conversationHistory = [];
  }

  async loadLocalConfig() {
    try {
      const mod = await import('../config.local.js');
      if (mod.CONFIG?.GEMINI_API_KEY) {
        if (!localStorage.getItem(this.storageKey)) {
          this.apiKey = mod.CONFIG.GEMINI_API_KEY;
          this.isDemoMode = false;
        }
        if (mod.CONFIG.DEFAULT_MODEL) {
          this.model = mod.CONFIG.DEFAULT_MODEL;
          localStorage.setItem(this.modelKey, this.model);
        }
        return true;
      }
    } catch (e) {
      // config.local.js is optional (gitignored)
    }
    return false;
  }

  setApiKey(key) {
    this.apiKey = (key || '').trim();
    if (this.apiKey) {
      localStorage.setItem(this.storageKey, this.apiKey);
      this.isDemoMode = false;
      localStorage.setItem(this.demoKey, 'false');
    } else {
      localStorage.removeItem(this.storageKey);
      this.isDemoMode = true;
      localStorage.setItem(this.demoKey, 'true');
    }
  }

  setModel(model) {
    this.model = model;
    localStorage.setItem(this.modelKey, model);
  }

  setTemperature(temp) {
    this.temperature = temp;
    localStorage.setItem(this.tempKey, temp.toString());
  }

  setDemoMode(enabled) {
    this.isDemoMode = !!enabled;
    localStorage.setItem(this.demoKey, this.isDemoMode ? 'true' : 'false');
  }

  clearHistory() {
    this.conversationHistory = [];
  }

  /**
   * Generates a response from either Google Gemini API or Smart Demo Simulator
   */
  async generateResponse({ prompt, domain = 'learn', level = 'beginner', language = 'Python', systemPrompt = '' }) {
    // Check if we should use Demo Mode (no API key or demo explicitly active)
    if (this.isDemoMode || !this.apiKey) {
      return this.handleDemoResponse(prompt, domain, language);
    }

    // Candidate FREE-TIER models to try in sequence (NO pro models, which have 0 limit on free tier)
    const modelsToTry = Array.from(new Set([
      this.model,
      'gemini-3.5-flash-lite',
      'gemini-flash-latest',
      'gemini-3.6-flash'
    ])).filter(m => !m.includes('pro'));

    let lastError = null;

    for (const currentModel of modelsToTry) {
      try {
        const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${currentModel}:generateContent?key=${this.apiKey}`;
        
        const payload = {
          contents: [
            ...this.conversationHistory.slice(-6),
            {
              role: 'user',
              parts: [{ text: prompt }]
            }
          ],
          systemInstruction: {
            parts: [{ text: systemPrompt }]
          },
          generationConfig: {
            temperature: this.temperature,
            maxOutputTokens: 2048,
            topP: 0.95
          }
        };

        const response = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          const message = errorData?.error?.message || `API Error HTTP ${response.status}`;
          console.warn(`Model ${currentModel} returned:`, message);

          // If 404 (model not supported) or 503 (temporary high demand spike), try next candidate
          if (response.status === 404 || response.status === 503) {
            lastError = new Error(message);
            continue;
          }

          if (response.status === 400 || response.status === 403) {
            throw new Error(`Google Gemini API returned: "${message}". Please check your API Key in Settings or switch to Smart Demo Mode.`);
          }
          throw new Error(message);
        }

        const data = await response.json();
        const generatedText = data?.candidates?.[0]?.content?.parts?.[0]?.text;

        if (!generatedText) {
          throw new Error('No content returned from Gemini model.');
        }

        // Successfully generated! Update current model if it fell back to a working one
        if (this.model !== currentModel) {
          this.setModel(currentModel);
        }

        // Record in conversation history
        this.conversationHistory.push({ role: 'user', parts: [{ text: prompt }] });
        this.conversationHistory.push({ role: 'model', parts: [{ text: generatedText }] });

        return {
          text: generatedText,
          source: 'live',
          model: currentModel
        };

      } catch (err) {
        lastError = err;
        if (err.message.includes('API Key') || err.message.includes('quota')) {
          break; // Don't loop through all models if key itself is wrong
        }
      }
    }

    // If all candidates failed, gracefully fall back to rich demo mode with alert
    console.warn('All candidate models failed. Falling back to demo mode:', lastError?.message);
    const fallback = await this.handleDemoResponse(prompt, domain, language);
    return {
      text: `> ⚠️ **Notice**: *${lastError?.message || 'Model service unavailable'}*\n> Showing simulated response for testing:\n\n` + fallback.text,
      source: 'fallback',
      model: 'Simulated Engine'
    };
  }

  /**
   * Smart Demo Simulator: Returns comprehensive responses for demo prompts
   */
  async handleDemoResponse(query, domain, language) {
    // Artificial small delay to simulate network streaming
    await new Promise(r => setTimeout(r, 600));

    const q = (query || '').toLowerCase();

    // Domain 1 Check
    if (domain === 'learn' || q.includes('recur') || q.includes('event loop') || q.includes('pointer')) {
      if (q.includes('recur')) {
        return { text: MOCK_DATA.learn.recursion.content, source: 'demo' };
      }
      if (q.includes('event loop') || q.includes('microtask')) {
        return { text: MOCK_DATA.learn['event loop'].content, source: 'demo' };
      }
      if (q.includes('pointer') || q.includes('reference') || q.includes('memory in c++')) {
        return { text: MOCK_DATA.learn.pointers.content, source: 'demo' };
      }
    }

    // Domain 2 Check
    if (domain === 'debug' || q.includes('typeerror') || q.includes('indexerror') || q.includes('memory_leak') || q.includes('debug')) {
      if (q.includes('indexerror') || q.includes('index')) {
        const item = MOCK_DATA.debug.indexerror;
        return {
          text: `### 🛠️ TriGuide AI Bug Diagnosis\n\n${item.diagnosis}\n\n#### 🟢 Corrected Code:\n\`\`\`python\n${item.fixedCode}\n\`\`\``,
          source: 'demo'
        };
      }
      if (q.includes('memory') || q.includes('leak') || q.includes('pointer')) {
        const item = MOCK_DATA.debug.memory_leak;
        return {
          text: `### 🛠️ TriGuide AI Bug Diagnosis\n\n${item.diagnosis}\n\n#### 🟢 Corrected Code:\n\`\`\`cpp\n${item.fixedCode}\n\`\`\``,
          source: 'demo'
        };
      }
      // Default typeerror
      const item = MOCK_DATA.debug.typeerror;
      return {
        text: `### 🛠️ TriGuide AI Bug Diagnosis\n\n${item.diagnosis}\n\n#### 🟢 Corrected Code:\n\`\`\`javascript\n${item.fixedCode}\n\`\`\``,
        source: 'demo'
      };
    }

    // Domain 3 Check
    if (domain === 'build' || q.includes('api') || q.includes('express') || q.includes('two sum') || q.includes('challenge')) {
      if (q.includes('two sum') || q.includes('algorithm') || q.includes('leetcode')) {
        return { text: MOCK_DATA.build.twosum.content, source: 'demo' };
      }
      return { text: MOCK_DATA.build.rest_api.content, source: 'demo' };
    }

    // Generate genuine language-specific snippet
    const snippet = this.getLanguageSnippet(language, domain, query);

    return {
      text: `### 🚀 TriGuide AI Analysis (${domain.toUpperCase()} Domain)

Here is the concept breakdown and implementation guide in **${language}**:

\`\`\`${language.toLowerCase().replace(/[^a-z0-9]/g, '')}
${snippet}
\`\`\`

#### 💡 Key Takeaways:
- **Clean Syntax**: Formatted to adhere strictly to **${language}** idiomatic best practices.
- **Edge Cases**: Validates inputs to protect against null/undefined or boundary failures.
- **Tip**: You can enter your own **Google Gemini API Key** in **Settings ⚙️** at the top right to enable live real-time LLM inference for any custom query!`,
      source: 'demo'
    };
  }

  getLanguageSnippet(lang, domain, query) {
    const l = (lang || 'python').toLowerCase();
    
    if (l.includes('python')) {
      return `# Demonstrated in Python 3
from datetime import datetime

def solve_problem(data: str) -> dict:
    """
    1. Validate input and guard against empty/null values
    """
    if not data or not isinstance(data, str):
        return {"status": "error", "message": "Valid string data is required"}
    
    # 2. Efficient execution logic
    print("TriGuide AI: Executing optimal Pythonic pattern...")
    
    return {
        "status": "success",
        "language": "Python",
        "processed_length": len(data),
        "timestamp": datetime.now().isoformat()
    }

if __name__ == "__main__":
    result = solve_problem("TriGuide AI Demo")
    print(result)`;
    }

    if (l.includes('type')) {
      return `// Demonstrated in TypeScript
interface ServiceResponse<T> {
  status: 'success' | 'error';
  language: string;
  data: T;
  timestamp: string;
}

export function solveProblem(input: string): ServiceResponse<{ length: number }> {
  // 1. Validate inputs and handle edge cases
  if (!input || input.trim().length === 0) {
    throw new Error("Input string cannot be empty");
  }

  // 2. Efficient type-safe execution
  console.log("TriGuide AI: Executing type-safe TypeScript pattern...");
  return {
    status: "success",
    language: "TypeScript",
    data: { length: input.length },
    timestamp: new Date().toISOString()
  };
}`;
    }

    if (l.includes('cpp') || l.includes('c++')) {
      return `// Demonstrated in Modern C++ (C++17)
#include <iostream>
#include <string>

struct Result {
    bool success;
    std::string language;
    size_t length;
};

Result solveProblem(const std::string& input) {
    // 1. Validate input
    if (input.empty()) {
        return { false, "C++", 0 };
    }

    // 2. Efficient execution
    std::cout << "TriGuide AI: Executing optimal C++ pattern...\\n";
    return { true, "C++", input.length() };
}

int main() {
    Result res = solveProblem("TriGuide AI");
    std::cout << "Language: " << res.language << ", Status: " << (res.success ? "OK" : "ERR") << "\\n";
    return 0;
}`;
    }

    if (l.includes('java')) {
      return `// Demonstrated in Java 17
import java.time.Instant;
import java.util.Map;
import java.util.HashMap;

public class Solution {
    public static Map<String, Object> solveProblem(String input) {
        // 1. Guard against null or empty input
        if (input == null || input.trim().isEmpty()) {
            return Map.of("status", "error", "message", "Input cannot be empty");
        }

        // 2. Execution logic
        System.out.println("TriGuide AI: Executing optimal Java pattern...");
        Map<String, Object> response = new HashMap<>();
        response.put("status", "success");
        response.put("language", "Java");
        response.put("timestamp", Instant.now().toString());
        return response;
    }

    public static void main(String[] args) {
        System.out.println(solveProblem("TriGuide AI"));
    }
}`;
    }

    if (l.includes('rust')) {
      return `// Demonstrated in Rust
#[derive(Debug)]
pub struct ApiResponse {
    pub status: String,
    pub language: String,
}

pub fn solve_problem(input: &str) -> Result<ApiResponse, &'static str> {
    // 1. Guard against empty inputs
    if input.trim().is_empty() {
        return Err("Input cannot be empty");
    }

    // 2. Memory-safe execution
    println!("TriGuide AI: Executing zero-cost abstraction in Rust...");
    Ok(ApiResponse {
        status: "success".to_string(),
        language: "Rust".to_string(),
    })
}

fn main() {
    match solve_problem("TriGuide AI") {
        Ok(res) => println!("{:#?}", res),
        Err(e) => eprintln!("Error: {}", e),
    }
}`;
    }

    if (l.includes('go')) {
      return `// Demonstrated in Go
package main

import (
    "fmt"
    "time"
)

type Result struct {
    Status    string    \`json:"status"\`
    Language  string    \`json:"language"\`
    Timestamp time.Time \`json:"timestamp"\`
}

func SolveProblem(input string) (*Result, error) {
    if input == "" {
        return nil, fmt.Errorf("input cannot be empty")
    }

    fmt.Println("TriGuide AI: Executing idiomatic Go pattern...")
    return &Result{
        Status:    "success",
        Language:  "Go",
        Timestamp: time.Now(),
    }, nil
}

func main() {
    res, _ := SolveProblem("TriGuide AI")
    fmt.Printf("%+v\\n", res)
}`;
    }

    if (l.includes('sql')) {
      return `-- Demonstrated in Modern SQL
WITH ranked_records AS (
  SELECT 
    id,
    user_name,
    score,
    created_at,
    DENSE_RANK() OVER (ORDER BY score DESC) as rank_position
  FROM leaderboard
  WHERE score > 0
)
SELECT 
  user_name,
  score,
  rank_position
FROM ranked_records
WHERE rank_position <= 10;`;
    }

    // Default JavaScript
    return `// Demonstrated in JavaScript (ES6+)
function solveProblem(input) {
  // 1. Validate inputs and handle edge cases
  if (input === undefined || input === null) return null;
  
  // 2. Efficient execution logic
  console.log("TriGuide AI: Executing optimal pattern in JavaScript...");
  return { 
    status: "success", 
    language: "JavaScript", 
    timestamp: new Date().toISOString() 
  };
}

console.log(solveProblem("TriGuide AI"));`;
  }
}

export const geminiService = new GeminiService();
