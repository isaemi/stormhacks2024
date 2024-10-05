const axios = require('axios');
require('dotenv').config();
const OpenAI = require('openai');

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
    dangerouslyAllowBrowser: true,
});

window.onload = function() {
  console.log('preload.js loaded');
  
  // Request access to the user's microphone
  navigator.mediaDevices.getUserMedia({ audio: true })
    .then(stream => {
      const mediaRecorder = new MediaRecorder(stream);
      let audioChunks = [];
      
      mediaRecorder.ondataavailable = event => {
        audioChunks.push(event.data);
        
        // Only process audio once you stop recording
        if (mediaRecorder.state === 'inactive') {
          processAudio(audioChunks);
          audioChunks = [];
        }
      };
      
      // Start recording audio
      mediaRecorder.start();
      
      // Stop and process the recording after 5 seconds (or adjust as necessary)
      setInterval(() => {
        if (mediaRecorder.state !== 'inactive') {
          mediaRecorder.stop();
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
}
