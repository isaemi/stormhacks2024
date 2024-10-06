const webview = document.getElementById('webview');
const backButton = document.getElementById('back');
const forwardButton = document.getElementById('forward');
const refreshButton = document.getElementById('refresh');
const homeButton = document.getElementById('home');
const urlInput = document.getElementById('url');
const loadingStreak = document.getElementById('loading-streak');

const body = document.querySelector('body');

function updateButtonStates() {
    if (webview.canGoForward()) {
      forwardButton.disabled = false;
    } else {
      forwardButton.disabled = true;
    }

    if (webview.canGoBack()) {
        backButton.disabled = false;
    } else {
        backButton.disabled = true;
    }
  }

  // Initial check on load
  window.onload = () => {
    updateButtonStates();
  };

  webview.addEventListener('did-navigate', () => {
    updateButtonStates();
  });
  

// Show the loading streak and change the cursor when navigation starts
webview.addEventListener('did-start-loading', () => {
  loadingStreak.style.display = 'block';
  body.classList.add('loading-cursor');
  webview.classList.add('loading-cursor');
});

// Hide the loading streak and reset the cursor when navigation finishes
webview.addEventListener('did-stop-loading', () => {
  loadingStreak.style.display = 'none';
  body.classList.remove('loading-cursor');
    webview.classList.remove('loading-cursor');
});

// Go back in the webview's history
backButton.addEventListener('click', () => {
  if (webview.canGoBack()) {
    backButton.disabled = false;
    webview.goBack();
  } else {
    backButton.disabled = true;
  }
});

// Go forward in the webview's history
forwardButton.addEventListener('click', () => {
  if (webview.canGoForward()) {
    forwardButton.disabled = false;
    webview.goForward();
  } else {
    forwardButton.disabled = true;
  }
});

// Refresh the current page
refreshButton.addEventListener('click', () => {
  webview.reload();
});

// Go to home page
homeButton.addEventListener('click', () => {
  webview.src = 'https://isaemi-app--80.prod1b.defang.dev/';
  urlInput.value = webview.src;
});

// Navigate to the entered URL
urlInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') {
    let url = urlInput.value.trim();
    if (!url.startsWith('http')) {
      url = 'https://' + url;
    }
    webview.src = url;
  }
});

// Update URL input when the page changes
webview.addEventListener('did-navigate', () => {
  urlInput.value = webview.getURL();
});


webview.addEventListener('did-fail-load', (event) => {
    // Check if the load failed due to a bad URL
    if (event.errorCode !== -3) {  // -3 means 'aborted', which is not an error
      const failedUrl = urlInput.value;
      
      // Redirect to Google search
      const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(failedUrl)}`;
      webview.src = searchUrl;
      urlInput.value = searchUrl;
    }
  });