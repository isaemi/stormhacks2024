const axios = require('axios');
require('dotenv').config();
const OpenAI = require('openai');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  dangerouslyAllowBrowser: true,
});

window.onload = function () {
  console.log('preload.js loaded');

  // Request access to the user's microphone
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
    });

    console.log('Transcript:', transcription);

    handleVoiceCommand(transcription);
  } catch (error) {
    console.error('Error transcribing audio:', error);
  }
}

function handleVoiceCommand(command) {
  // Add logic to handle voice commands
  if (command.includes('go to')) {
    const site = command.replace('go to', '').trim();
    let url = site.startsWith('http') ? site : `https://www.${site}`;
    window.location.href = url;
  } else if (command.includes('scroll down')) {
    window.scrollBy(0, 100);
  } else if (command.includes('scroll up')) {
    window.scrollBy(0, -100);
  } else if (command.includes('back')) {
    window.history.back();
  } else if (command.includes('forward')) {
    window.history.forward();
  }

  // use axios to send the html content of the current site and the command to the server
  // in the body of the POST

  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
  };

  const body = {
    html: JSON.stringify(document.documentElement.outerHTML),
    prompt:JSON.stringify(command),
  };

  axios.post('https://jrang188-server--8000.prod1.defang.dev/prompt', body, { headers })
  .then(response => {
    console.log(response.data);
  }).catch(error => {
    console.error('Error sending voice command:', error);
  });
}
