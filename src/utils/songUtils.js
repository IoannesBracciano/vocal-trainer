// Song data management and audio analysis utilities

import { getNoteName } from './noteUtils.js';

// Song data structure for practice
export class SongData {
  constructor(title, artist, audioFile = null) {
    this.id = `${artist}-${title}`.toLowerCase().replace(/[^a-z0-9]/g, '-');
    this.title = title;
    this.artist = artist;
    this.audioFile = audioFile;
    this.melody = []; // Array of { note, frequency, startTime, duration, lyrics }
    this.isAnalyzed = false;
    this.createdAt = new Date().toISOString();
  }

  addNote(note, frequency, startTime, duration, lyrics = '') {
    this.melody.push({
      note,
      frequency,
      startTime,
      duration,
      lyrics,
      id: `${this.id}-${this.melody.length}`
    });
  }

  getDuration() {
    if (this.melody.length === 0) return 0;
    const lastNote = this.melody[this.melody.length - 1];
    return lastNote.startTime + lastNote.duration;
  }

  getNoteCount() {
    return this.melody.length;
  }
}

// Audio analysis class for extracting melody from audio files
export class AudioMelodyAnalyzer {
  constructor() {
    this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
    this.sampleRate = this.audioContext.sampleRate;
  }

  async analyzeAudioFile(audioFile, progressCallback = null) {
    try {
      // Convert file to array buffer
      const arrayBuffer = await audioFile.arrayBuffer();
      
      // Decode audio data
      const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
      
      // Get mono channel data (mix channels if stereo)
      const channelData = this.getMixedChannelData(audioBuffer);
      
      // Analyze pitch over time
      const melody = await this.extractMelody(channelData, audioBuffer.sampleRate, progressCallback);
      
      return melody;
    } catch (error) {
      console.error('Error analyzing audio file:', error);
      throw new Error(`Failed to analyze audio: ${error.message}`);
    }
  }

  getMixedChannelData(audioBuffer) {
    const length = audioBuffer.length;
    const mixedData = new Float32Array(length);
    
    // Mix all channels to mono
    for (let channel = 0; channel < audioBuffer.numberOfChannels; channel++) {
      const channelData = audioBuffer.getChannelData(channel);
      for (let i = 0; i < length; i++) {
        mixedData[i] += channelData[i];
      }
    }
    
    // Average the channels
    const numChannels = audioBuffer.numberOfChannels;
    for (let i = 0; i < length; i++) {
      mixedData[i] /= numChannels;
    }
    
    return mixedData;
  }

  async extractMelody(audioData, sampleRate, progressCallback = null) {
    const melody = [];
    
    // Analysis parameters
    const windowSize = 4096; // Size of analysis window
    const hopSize = 1024; // How much to advance between analyses
    const minNoteDuration = 0.1; // Minimum note duration in seconds
    const confidenceThreshold = 0.3; // Minimum confidence for pitch detection
    
    let currentNote = null;
    let noteStartTime = 0;
    let lastPitch = null;
    
    const totalWindows = Math.floor((audioData.length - windowSize) / hopSize);
    
    for (let i = 0; i < audioData.length - windowSize; i += hopSize) {
      const windowIndex = Math.floor(i / hopSize);
      const currentTime = i / sampleRate;
      
      // Extract window
      const window = audioData.slice(i, i + windowSize);
      
      // Apply window function (Hamming window)
      const windowedData = this.applyHammingWindow(window);
      
      // Detect pitch
      const pitchData = this.detectPitch(windowedData, sampleRate);
      
      // Update progress
      if (progressCallback && windowIndex % 100 === 0) {
        progressCallback((windowIndex / totalWindows) * 100);
      }
      
      // Process pitch data
      if (pitchData.confidence > confidenceThreshold && pitchData.frequency > 80 && pitchData.frequency < 2000) {
        const noteName = getNoteName(pitchData.frequency);
        
        // Check if this is a continuation of the current note or a new note
        if (currentNote && 
            Math.abs(pitchData.frequency - currentNote.frequency) < 20 && // Within 20 Hz
            currentTime - noteStartTime < 5.0) { // Not too long
          
          // Continue current note
          currentNote.duration = currentTime - noteStartTime;
          currentNote.frequency = (currentNote.frequency + pitchData.frequency) / 2; // Average frequency
          
        } else {
          // Finish previous note if it's long enough
          if (currentNote && currentNote.duration >= minNoteDuration) {
            melody.push({ ...currentNote });
          }
          
          // Start new note
          currentNote = {
            note: noteName,
            frequency: pitchData.frequency,
            startTime: currentTime,
            duration: 0,
            confidence: pitchData.confidence
          };
          noteStartTime = currentTime;
        }
        
        lastPitch = pitchData.frequency;
      } else {
        // No clear pitch detected, finish current note if any
        if (currentNote && currentNote.duration >= minNoteDuration) {
          melody.push({ ...currentNote });
          currentNote = null;
        }
      }
    }
    
    // Add final note if any
    if (currentNote && currentNote.duration >= minNoteDuration) {
      melody.push({ ...currentNote });
    }
    
    // Clean up melody (remove very short notes, merge similar adjacent notes)
    return this.cleanupMelody(melody);
  }

  applyHammingWindow(data) {
    const windowed = new Float32Array(data.length);
    for (let i = 0; i < data.length; i++) {
      const windowValue = 0.54 - 0.46 * Math.cos(2 * Math.PI * i / (data.length - 1));
      windowed[i] = data[i] * windowValue;
    }
    return windowed;
  }

  detectPitch(buffer, sampleRate) {
    // Enhanced autocorrelation-based pitch detection
    const minFreq = 80;   // Minimum frequency (low E2)
    const maxFreq = 2000; // Maximum frequency (high C7)
    
    const minPeriod = Math.floor(sampleRate / maxFreq);
    const maxPeriod = Math.floor(sampleRate / minFreq);
    
    let bestCorrelation = 0;
    let bestPeriod = 0;
    
    // Normalize buffer
    const normalizedBuffer = this.normalizeBuffer(buffer);
    
    // Calculate autocorrelation
    for (let period = minPeriod; period <= maxPeriod; period++) {
      let correlation = 0;
      let count = 0;
      
      for (let i = 0; i < normalizedBuffer.length - period; i++) {
        correlation += normalizedBuffer[i] * normalizedBuffer[i + period];
        count++;
      }
      
      correlation = count > 0 ? correlation / count : 0;
      
      if (correlation > bestCorrelation) {
        bestCorrelation = correlation;
        bestPeriod = period;
      }
    }
    
    const frequency = bestPeriod > 0 ? sampleRate / bestPeriod : 0;
    const confidence = Math.min(bestCorrelation * 2, 1); // Scale confidence
    
    return { frequency, confidence };
  }

  normalizeBuffer(buffer) {
    // Find RMS (Root Mean Square) for normalization
    let rms = 0;
    for (let i = 0; i < buffer.length; i++) {
      rms += buffer[i] * buffer[i];
    }
    rms = Math.sqrt(rms / buffer.length);
    
    if (rms === 0) return buffer;
    
    // Normalize
    const normalized = new Float32Array(buffer.length);
    for (let i = 0; i < buffer.length; i++) {
      normalized[i] = buffer[i] / rms;
    }
    
    return normalized;
  }

  cleanupMelody(rawMelody) {
    if (rawMelody.length === 0) return [];
    
    const cleaned = [];
    let currentNote = { ...rawMelody[0] };
    
    for (let i = 1; i < rawMelody.length; i++) {
      const note = rawMelody[i];
      
      // Merge similar adjacent notes
      if (Math.abs(note.frequency - currentNote.frequency) < 15 && // Within 15 Hz
          note.startTime - (currentNote.startTime + currentNote.duration) < 0.2) { // Less than 200ms gap
        
        // Extend current note
        currentNote.duration = (note.startTime + note.duration) - currentNote.startTime;
        currentNote.frequency = (currentNote.frequency + note.frequency) / 2;
        currentNote.confidence = Math.max(currentNote.confidence, note.confidence);
        
      } else {
        // Different note, save current and start new
        if (currentNote.duration >= 0.1) { // Only save notes longer than 100ms
          cleaned.push({ ...currentNote });
        }
        currentNote = { ...note };
      }
    }
    
    // Add final note
    if (currentNote.duration >= 0.1) {
      cleaned.push(currentNote);
    }
    
    return cleaned;
  }
}

// Storage utilities for songs
export const SongStorage = {
  STORAGE_KEY: 'vocal-trainer-songs',
  
  saveSong(songData) {
    const songs = this.getAllSongs();
    songs[songData.id] = {
      ...songData,
      audioFile: null // Don't store file in localStorage
    };
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(songs));
  },
  
  getSong(songId) {
    const songs = this.getAllSongs();
    return songs[songId] || null;
  },
  
  getAllSongs() {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      return stored ? JSON.parse(stored) : {};
    } catch (error) {
      console.error('Error loading songs from storage:', error);
      return {};
    }
  },
  
  deleteSong(songId) {
    const songs = this.getAllSongs();
    delete songs[songId];
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(songs));
  },
  
  getSongList() {
    const songs = this.getAllSongs();
    return Object.values(songs).map(song => ({
      id: song.id,
      title: song.title,
      artist: song.artist,
      noteCount: song.melody?.length || 0,
      duration: song.melody?.length > 0 ? 
        (song.melody[song.melody.length - 1].startTime + song.melody[song.melody.length - 1].duration) : 0,
      createdAt: song.createdAt
    }));
  }
};
