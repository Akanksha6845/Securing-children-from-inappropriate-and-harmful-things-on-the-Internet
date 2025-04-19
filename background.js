const HUGGING_FACE_API_KEY = "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"; // MUST REPLACE WITH YOUR KEY
const MODEL = "facebook/roberta-hate-speech-dynabench-r4-target";
const PROXY_ENDPOINT = "http://localhost:3000/api/filter"; // Remove or configure if unused

let isExtensionEnabled = true;

// Load state
chrome.storage.sync.get(['isEnabled'], result => {
  if (chrome.runtime.lastError) {
    console.error("Storage error:", chrome.runtime.lastError);
    return;
  }
  isExtensionEnabled = result.isEnabled !== undefined ? result.isEnabled : true;
});

// Message listener
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "checkContent") {
    if (!isExtensionEnabled) {
      sendResponse({ isSafe: true });
      return;
    }
    analyzeText(request.text)
      .then(result => sendResponse({ isSafe: !isHateSpeech(result) }))
      .catch(error => {
        console.error("API error:", error);
        sendResponse({ isSafe: false }); // Block on errors
      });
    return true;
  } else if (request.action === "setEnabled") {
    isExtensionEnabled = request.value;
    chrome.storage.sync.set({ isEnabled: request.value }, () => {
      if (chrome.runtime.lastError) console.error("Storage set error:", chrome.runtime.lastError);
      chrome.tabs.query({}, tabs => {
        tabs.forEach(tab => {
          chrome.tabs.sendMessage(tab.id, { action: "updateEnabledState", value: request.value }, () => {
            if (chrome.runtime.lastError) console.warn("Tab message failed:", chrome.runtime.lastError);
          });
        });
      });
    });
  } else if (request.action === "getEnabled") {
    sendResponse({ isEnabled: isExtensionEnabled });
  }
});

async function analyzeText(text) {
  if (!text || text.trim().length === 0) return [];

  // Cache check
  const textHash = btoa(text.substring(0, 100));
  const cached = await new Promise(resolve => {
    chrome.storage.local.get(textHash, result => resolve(result[textHash]));
  });
  if (cached) return cached;

  // API call with retries
  for (let i = 0; i < 3; i++) {
    try {
      const response = await fetch(`https://api-inference.huggingface.co/models/${MODEL}`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${HUGGING_FACE_API_KEY}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ inputs: text })
      });
      if (!response.ok) throw new Error(`Status ${response.status}`);
      const result = await response.json();

      // Cache result
      chrome.storage.local.set({ [textHash]: result }, () => {
        if (chrome.runtime.lastError) console.warn("Cache error:", chrome.runtime.lastError);
      });
      return result;
    } catch (error) {
      if (i === 2) throw error;
      await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
    }
  }
}

function isHateSpeech(result) {
  if (!result || !Array.isArray(result) || result.length === 0) return false;
  const hateSpeechLabel = result.find(item => item?.label === "hate" && typeof item?.score === "number");
  return hateSpeechLabel && hateSpeechLabel.score > 0.85;
}