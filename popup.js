document.addEventListener('DOMContentLoaded', () => {
  const toggle = document.getElementById('toggleExtension');
  const statusText = document.getElementById('statusText');
  const description = document.getElementById('description');
  const errorMessage = document.getElementById('errorMessage');

  chrome.runtime.sendMessage({ action: "getEnabled" }, response => {
    if (chrome.runtime.lastError) {
      console.error("getEnabled failed:", chrome.runtime.lastError);
      toggle.checked = true;
      updateUI(true);
      return;
    }
    toggle.checked = response.isEnabled;
    updateUI(response.isEnabled);
  });

  let isToggling = false;
  toggle.addEventListener('change', async function() {
    if (isToggling) return;
    isToggling = true;
    const isEnabled = this.checked;
    statusText.classList.add('loading');
    errorMessage.style.display = 'none';

    try {
      await new Promise((resolve, reject) => {
        chrome.runtime.sendMessage({ action: "setEnabled", value: isEnabled }, () => {
          if (chrome.runtime.lastError) reject(chrome.runtime.lastError);
          else resolve();
        });
      });
      updateUI(isEnabled);
    } catch (error) {
      console.error("Toggle failed:", error);
      this.checked = !isEnabled;
      updateUI(!isEnabled);
      errorMessage.textContent = "Failed to update. Try again.";
      errorMessage.style.display = 'block';
    } finally {
      statusText.classList.remove('loading');
      isToggling = false;
    }
  });

  function updateUI(isEnabled) {
    statusText.textContent = isEnabled ? "Enabled" : "Disabled";
    statusText.className = isEnabled ? "enabled" : "disabled";
    description.textContent = isEnabled
      ? "The extension is currently blocking inappropriate content."
      : "The extension is not blocking content currently.";
    toggle.setAttribute("aria-checked", isEnabled);
  }
});