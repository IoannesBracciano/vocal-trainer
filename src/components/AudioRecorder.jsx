import React, { useState, useRef, useEffect } from 'react';
import { Button, Box, LinearProgress, Typography } from '@mui/material';
import { Mic, MicOff } from '@mui/icons-material';

const AudioRecorder = ({ onRecordingComplete, disabled }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioLevel, setAudioLevel] = useState(0);
  
  const mediaRecorderRef = useRef(null);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const streamRef = useRef(null);
  const recordingTimerRef = useRef(null);
  const audioLevelTimerRef = useRef(null);

  useEffect(() => {
    return () => {
      stopRecording();
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          sampleRate: 44100,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
        } 
      });
      
      streamRef.current = stream;
      
      // Set up audio context for real-time analysis
      audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
      analyserRef.current = audioContextRef.current.createAnalyser();
      const source = audioContextRef.current.createMediaStreamSource(stream);
      
      analyserRef.current.fftSize = 4096;
      source.connect(analyserRef.current);
      
      // Set up MediaRecorder for recording
      mediaRecorderRef.current = new MediaRecorder(stream);
      const audioChunks = [];
      
      mediaRecorderRef.current.ondataavailable = (event) => {
        audioChunks.push(event.data);
      };
      
      mediaRecorderRef.current.onstop = async () => {
        const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
        await analyzePitch(audioBlob);
      };
      
      mediaRecorderRef.current.start();
      setIsRecording(true);
      setRecordingTime(0);
      
      // Start recording timer
      recordingTimerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 0.1);
      }, 100);
      
      // Start audio level monitoring
      monitorAudioLevel();
      
      // Auto-stop after 3 seconds
      setTimeout(() => {
        if (isRecording) {
          stopRecording();
        }
      }, 3000);
      
    } catch (error) {
      console.error('Error accessing microphone:', error);
      alert('Unable to access microphone. Please check your permissions.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
    
    if (audioContextRef.current) {
      audioContextRef.current.close();
    }
    
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
    }
    
    if (audioLevelTimerRef.current) {
      clearInterval(audioLevelTimerRef.current);
    }
    
    setIsRecording(false);
    setRecordingTime(0);
    setAudioLevel(0);
  };

  const monitorAudioLevel = () => {
    if (!analyserRef.current) return;
    
    const bufferLength = analyserRef.current.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    
    const updateLevel = () => {
      if (!analyserRef.current || !isRecording) return;
      
      analyserRef.current.getByteFrequencyData(dataArray);
      const average = dataArray.reduce((a, b) => a + b) / bufferLength;
      setAudioLevel(average / 255 * 100);
    };
    
    audioLevelTimerRef.current = setInterval(updateLevel, 50);
  };

  const analyzePitch = async (audioBlob) => {
    try {
      const arrayBuffer = await audioBlob.arrayBuffer();
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
      
      const channelData = audioBuffer.getChannelData(0);
      const sampleRate = audioBuffer.sampleRate;
      
      // Simple pitch detection using autocorrelation
      const pitch = detectPitch(channelData, sampleRate);
      const confidence = pitch.confidence;
      
      onRecordingComplete({
        frequency: pitch.frequency,
        confidence: confidence,
        audioBlob: audioBlob
      });
      
    } catch (error) {
      console.error('Error analyzing pitch:', error);
      onRecordingComplete({
        frequency: 0,
        confidence: 0,
        audioBlob: audioBlob
      });
    }
  };

  const detectPitch = (buffer, sampleRate) => {
    // Autocorrelation-based pitch detection
    const minFreq = 80;  // Minimum frequency to detect (Hz)
    const maxFreq = 1000; // Maximum frequency to detect (Hz)
    
    const minPeriod = Math.floor(sampleRate / maxFreq);
    const maxPeriod = Math.floor(sampleRate / minFreq);
    
    let bestCorrelation = 0;
    let bestPeriod = 0;
    
    // Calculate autocorrelation for different periods
    for (let period = minPeriod; period <= maxPeriod; period++) {
      let correlation = 0;
      let count = 0;
      
      for (let i = 0; i < buffer.length - period; i++) {
        correlation += buffer[i] * buffer[i + period];
        count++;
      }
      
      correlation = count > 0 ? correlation / count : 0;
      
      if (correlation > bestCorrelation) {
        bestCorrelation = correlation;
        bestPeriod = period;
      }
    }
    
    const frequency = bestPeriod > 0 ? sampleRate / bestPeriod : 0;
    const confidence = Math.min(bestCorrelation * 10, 1); // Normalize confidence
    
    return {
      frequency: frequency,
      confidence: confidence
    };
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
        <Button
          variant={isRecording ? 'outlined' : 'contained'}
          color={isRecording ? 'error' : 'primary'}
          startIcon={isRecording ? <MicOff /> : <Mic />}
          onClick={isRecording ? stopRecording : startRecording}
          disabled={disabled}
        >
          {isRecording ? 'Stop Recording' : 'Record Voice'}
        </Button>
        
        {isRecording && (
          <Typography variant="body2" color="text.secondary">
            {recordingTime.toFixed(1)}s / 3.0s
          </Typography>
        )}
      </Box>
      
      {isRecording && (
        <Box sx={{ width: '100%' }}>
          <Typography variant="body2" gutterBottom>
            Recording Progress
          </Typography>
          <LinearProgress 
            variant="determinate" 
            value={(recordingTime / 3) * 100} 
            sx={{ mb: 1 }}
          />
          
          <Typography variant="body2" gutterBottom>
            Audio Level
          </Typography>
          <LinearProgress 
            variant="determinate" 
            value={audioLevel} 
            color="secondary"
          />
        </Box>
      )}
    </Box>
  );
};

export default AudioRecorder;
