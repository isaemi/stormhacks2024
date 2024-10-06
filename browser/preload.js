const axios = require('axios');
require('dotenv').config();
const OpenAI = require('openai');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  dangerouslyAllowBrowser: true,
});

let recorderContext = null;

window.onload = function () {
  console.log('preload.js loaded');

  // Request access to the user's microphone
  try {
    navigator.mediaDevices.getUserMedia({ audio: true })
      .then(stream => {
        const audioContext = new AudioContext();
        const source = audioContext.createMediaStreamSource(stream);

        const bandpassFilter = audioContext.createBiquadFilter();
        bandpassFilter.type = 'bandpass';
        bandpassFilter.frequency.value = 1000;
        bandpassFilter.Q.value = 1.0;

        source.connect(bandpassFilter);

        const destination = audioContext.createMediaStreamDestination();
        bandpassFilter.connect(destination);


        const mediaRecorder = new MediaRecorder(destination.stream);
        recorderContext = mediaRecorder;
        let audioChunks = [];

        mediaRecorder.ondataavailable = event => {
          audioChunks.push(event.data);
        };

        mediaRecorder.onstop = () => {
          if (audioChunks.length > 0) {
            processAudio(audioChunks);  // Process the 5-second audio chunk
            audioChunks = [];  // Reset the chunks array for the next interval
          }

          // Restart recording immediately after stopping
          mediaRecorder.start();
          console.log('Restarted recording');
        };

        // Start recording audio
        mediaRecorder.start();

        // Stop and process the recording after 5 seconds (or adjust as necessary)
        setInterval(() => {
          if (mediaRecorder.state !== 'inactive') {
            mediaRecorder.stop(); console.log('Stopped recording');
          }
        }, 5000); // Adjust the interval based on your needs
      })
      .catch(error => {
        console.error('Error accessing the microphone:', error);
      });
  } catch (error) {
    console.error('Error accessing the microphone:', error);
    recorderContext.start();
  }
};

async function processAudio(audioChunks) {
  // Convert audio chunks into a Blob and then into a format OpenAI Whisper can handle
  const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
  const audioFile = new File([audioBlob], 'audio.wav', { type: 'audio/wav' });


  try {
    const transcription = await openai.audio.transcriptions.create({
      file: audioFile,
      model: 'whisper-1',
      response_format: "text",
      prompt: "BestBuy"
    });

    console.log('Transcript:', transcription);

    handleVoiceCommand(transcription);
  } catch (error) {
    console.error('Error transcribing audio:', error);
  }
}

function handleVoiceCommand(command) {
  command = command.toLowerCase()
  
  console.log("Handle voice command")
  command = command?.toLowerCase();

  if (command.includes('scroll down')) {
    window.scrollBy(0, 100);
    return;
  } else if (command.includes('scroll up')) {
    window.scrollBy(0, -100);
    return;
  } else if (command.includes('back')) {
    window.history.back();
    return;
  } else if (command.includes('forward')) {
    window.history.forward();
    return;
  } else if (command.includes('scroll left')) {
    window.scrollBy(-100, 0);
    return;
  } else if (command.includes('scroll right')) {
    window.scrollBy(100, 0);
    return;
  } else if (command.includes('start')) {
    const webview = document.getElementById('webview');
    if (webview.src === "https://isaemi-app--80.prod1b.defang.dev/") {
        webview.src = 'https://google.com'
    } else {
        console.log('URL does not match.');
    }
    
  } else {
    // chunk the command into smaller pieces
    let command_chunks = command.split(' ');

    // multichunk commands
    for (let i = 0; i < command_chunks.length; i++) {
      const chunk = command_chunks[i];
      if (chunk === 'type') {
        // type in everything after the word 'type' stopping if there is a period.
        let string_to_type = "";
        for (let j = i + 1; j < command_chunks.length; j++) {
          if (command_chunks[j].includes('.')) {
            string_to_type += command_chunks[j].replace('.', '');
            break;
          }
          string_to_type += command_chunks[j] + " ";
        }

        // assume we are clicked on an input field
        const focused_element = document.activeElement;
        focused_element.value = string_to_type;
        return;
      }

      if (chunk === 'go' && command_chunks[i + 1] === 'to') {
        // go to the url in the next chunk
        let url = command_chunks[i + 2];

        const urlInput = document.getElementById('url');

        if (url.startsWith('http') && url.endsWith('.com')) {
          // find document by id and enter the url
          urlInput.value = url;
          urlInput.dispatchEvent(new KeyboardEvent('keypress', { key: 'Enter' }));
          return;
        }

        if (url.includes('www') && url.endsWith('.com')) {
          urlInput.value = `https://${url}`;
          urlInput.dispatchEvent(new KeyboardEvent('keypress', { key: 'Enter' }));
          return;
        }

        // remove any symbols from the url
        url = url.replace(/[^a-zA-Z0-9]/g, '');

        urlInput.value = `https://${url}.com`;
        urlInput.dispatchEvent(new KeyboardEvent('keypress', { key: 'Enter' }));
        console.log(`https://${url}.com`);
        return;
      }

      if (chunk === 'search' && command_chunks[i + 1] === 'for' ||
        chunk === 'look' && command_chunks[i + 1] === 'up') {
        // search for everything after the word 'search' or 'look up'
        let search_query = "";
        for (let j = i + 2; j < command_chunks.length; j++) {
          // if the chunk has a period, we have reached the end of the search query
          if (command_chunks[j].includes('.')) {
            search_query += command_chunks[j].replace('.', '');
            break;
          }

          search_query += command_chunks[j] + " ";
        }

        // go google query
        const urlInput = document.getElementById('url');
        urlInput.value = `https://www.google.com/search?q=${search_query}`;
        urlInput.dispatchEvent(new KeyboardEvent('keypress', { key: 'Enter' }));
        return;
      }
    }
  }

  const webview = document.getElementById('webview');

  webview.executeJavaScript('document.documentElement.outerHTML')
    .then(html => {
      console.log('HTML content from webview:', html);
      // Call the localhost API and send the HTML
      const headers = {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      };

      const body = {
        html: html,
        prompt: JSON.stringify(command),
      };

      console.log('Sending voice command:', body);

      let css_selector = null;

      axios.post('https://jrang188-server--8000.prod1.defang.dev/prompt', body, { headers })
        .then(response => {
          console.log(response.data);
          const css_selector = response.data;

          // Check if the selector is valid and perform the click
          if (css_selector !== 1) {
            const element = document.querySelector(css_selector);
            if (element) {
              element.click();
              console.log(`Clicked element: ${css_selector}`);
            } else {
              console.error(`No element found for selector: ${css_selector}`);
            }
          } else {
            console.error('Invalid CSS selector');
          }
        })
        .catch(error => {
          console.error('Error sending voice command:', error);
        });

    })
    .catch(err => {
      console.error('Error fetching HTML from webview:', err);
    });

}
