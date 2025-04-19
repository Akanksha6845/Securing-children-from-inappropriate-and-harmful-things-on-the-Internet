let fullScreenOverlay = null;
let isBlocked = false;

// Comprehensive blocked keywords (grouped by category)
const blockedKeywords = {
  sexual: [
    'sex', 'porn', 'xxx', 'nude', 'naked', 'hentai', 'fuck', 'dick', 'cock', 'pussy',
    'blowjob', 'handjob', 'cum', 'sperm', 'orgasm', 'masturbat', 'erotic', 'bdsm',
    'fetish', 'incest', 'rape', 'pedo', 'child porn', 'cp', 'nudist', 'swinger',
    'orgy', 'prostitut', 'escort', 'hooker', 'whore', 'slut', 'onlyfans', 'camgirl',
    'sexting', 'sexy', 'hot girl', 'hot mom', 'milf', 'daddy', 'sugar daddy'
  ],
  violence: [
    'kill', 'murder', 'suicide', 'terrorist', 'bomb', 'shoot', 'gun', 'weapon',
    'massacre', 'genocide', 'torture', 'abuse', 'self-harm', 'cutting'
  ],
  drugs: [
    'drug', 'heroin', 'cocaine', 'meth', 'ecstasy', 'lsd', 'weed', 'marijuana',
    'opium', 'overdose', 'inject', 'snort', 'bong', 'pipe', 'dealer'
  ]
};

// Whitelisted educational terms that might contain blocked keywords
const whitelist = [
  'sex education', 'sexual health', 'reproductive health', 'anatomy',
  'biology', 'science', 'educational', 'medical', 'research', 'study',
  'history', 'documentary', 'news', 'article', 'journal', 'textbook'
];

chrome.runtime.sendMessage({ action: "getEnabled" }, response => {
  if (chrome.runtime.lastError) {
    console.error("getEnabled failed:", chrome.runtime.lastError);
    monitorPageContent();
    return;
  }
  if (response.isEnabled) monitorPageContent();
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "updateEnabledState") {
    if (request.value) {
      monitorPageContent();
    } else {
      if (fullScreenOverlay) {
        fullScreenOverlay.remove();
        fullScreenOverlay = null;
        isBlocked = false;
      }
    }
  }
});

function monitorPageContent() {
  // Check URL first
  const currentUrl = window.location.href.toLowerCase();
  if (shouldBlock(currentUrl)) {
    blockPage();
    return;
  }

  // Then check page title and metadata
  const pageTitle = document.title.toLowerCase();
  const metaDescription = document.querySelector('meta[name="description"]')?.content.toLowerCase() || '';
  
  if (shouldBlock(pageTitle) || shouldBlock(metaDescription)) {
    blockPage();
    return;
  }

  // Finally check page content
  checkTextContent(document.body);

  const observer = new MutationObserver(mutations => {
    mutations.forEach(mutation => {
      mutation.addedNodes.forEach(node => {
        if (node.nodeType === Node.ELEMENT_NODE) checkTextContent(node);
      });
    });
  });

  observer.observe(document.body, { childList: true, subtree: true });
}

function shouldBlock(text) {
  if (!text) return false;
  
  // Check if text contains any whitelisted terms
  const isWhitelisted = whitelist.some(term => text.includes(term));
  if (isWhitelisted) return false;

  // Check for blocked keywords
  return Object.values(blockedKeywords).flat().some(keyword => {
    // Use word boundaries to avoid partial matches
    const regex = new RegExp(`\\b${keyword}\\b`, 'i');
    return regex.test(text);
  });
}

function checkTextContent(element) {
  if (isBlocked) return;
  
  const walker = document.createTreeWalker(
    element,
    NodeFilter.SHOW_TEXT,
    {
      acceptNode: node => {
        const parent = node.parentNode;
        if (['SCRIPT', 'STYLE', 'NOSCRIPT'].includes(parent.tagName)) {
          return NodeFilter.FILTER_REJECT;
        }
        
        const text = node.nodeValue.trim();
        if (!text) return NodeFilter.FILTER_REJECT;
        
        if (shouldBlock(text)) {
          return NodeFilter.FILTER_ACCEPT;
        }
        return NodeFilter.FILTER_REJECT;
      }
    }
  );

  let node;
  while (node = walker.nextNode()) {
    blockPage();
    break;
  }
}

function blockPage() {
  if (isBlocked) return;
  isBlocked = true;
  
  requestAnimationFrame(() => {
    fullScreenOverlay = document.createElement('div');
    fullScreenOverlay.id = 'child-safety-full-overlay';
    fullScreenOverlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      background: rgba(255, 0, 0, 0.95);
      color: white;
      z-index: 100000;
      display: flex;
      justify-content: center;
      align-items: center;
      flex-direction: column;
      font-family: Arial, sans-serif;
      text-align: center;
      padding: 20px;
    `;
    
    const title = document.createElement('h1');
    title.textContent = 'Content Blocked';
    title.style.fontSize = '28px';
    title.style.marginBottom = '15px';
    
    const message = document.createElement('p');
    message.textContent = 'This page contains content that may be inappropriate for children.';
    message.style.fontSize = '18px';
    message.style.marginBottom = '10px';
    
    const suggestion = document.createElement('p');
    suggestion.textContent = 'Try searching for educational resources instead.';
    suggestion.style.fontSize = '16px';
    suggestion.style.opacity = '0.9';
    
    fullScreenOverlay.append(title, message, suggestion);
    
    // Clear the page and show blocking message
    document.body.innerHTML = '';
    document.body.style.margin = '0';
    document.body.style.padding = '0';
    document.body.appendChild(fullScreenOverlay);
  });
}