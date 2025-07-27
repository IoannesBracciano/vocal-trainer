import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  Button,
  Slider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  CircularProgress,
} from '@mui/material';
import { PlayArrow, SkipNext, SkipPrevious, MusicNote } from '@mui/icons-material';
import PianoKeyboard from './PianoKeyboard';
import AudioRecorder from './AudioRecorder';
import PitchAnalyzer from './PitchAnalyzer';
import { noteFrequencies, getNoteName } from '../utils/noteUtils';

const VocalTrainer = ({ selectedSong, practiceRandomNotes = false }) => {
  const [octaveRange, setOctaveRange] = useState([4, 5]); // C4 to B5 (2 octaves)
  const [currentNote, setCurrentNote] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [score, setScore] = useState(0);
  const [totalAttempts, setTotalAttempts] = useState(0);
  const [audioContext, setAudioContext] = useState(null);
  
  // Song practice specific state
  const [currentNoteIndex, setCurrentNoteIndex] = useState(0);
  const [songProgress, setSongProgress] = useState([]);
  const [practiceMode, setPracticeMode] = useState(practiceRandomNotes ? 'random' : 'song'); // 'random' or 'song'

  useEffect(() => {
    // Initialize Web Audio API
    const initAudio = async () => {
      try {
        const context = new (window.AudioContext || window.webkitAudioContext)();
        setAudioContext(context);
      } catch (error) {
        console.error('Failed to initialize audio context:', error);
      }
    };
    initAudio();
  }, []);

  // Set practice mode based on props and selected song
  useEffect(() => {
    if (practiceRandomNotes) {
      setPracticeMode('random');
    } else if (selectedSong && selectedSong.melody && selectedSong.melody.length > 0) {
      setPracticeMode('song');
      setCurrentNoteIndex(0);
      setSongProgress(selectedSong.melody.map(() => ({ completed: false, accuracy: null })));
    } else {
      setPracticeMode('random');
    }
  }, [selectedSong, practiceRandomNotes]);

  const generateRandomNote = () => {
    const notes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
    const octaves = [];
    for (let i = octaveRange[0]; i <= octaveRange[1]; i++) {
      octaves.push(i);
    }
    
    const randomNote = notes[Math.floor(Math.random() * notes.length)];
    const randomOctave = octaves[Math.floor(Math.random() * octaves.length)];
    const noteKey = `${randomNote}${randomOctave}`;
    
    return {
      note: randomNote,
      octave: randomOctave,
      frequency: noteFrequencies[noteKey],
      key: noteKey
    };
  };

  const createRealisticPianoSound = (frequency, startTime, duration) => {
    if (!audioContext) return null;

    // Frequency-dependent characteristics
    const isLowNote = frequency < 200;
    const isMidNote = frequency >= 200 && frequency < 800;
    const isHighNote = frequency >= 800;
    
    // Create harmonics for realistic piano timbre
    const harmonics = [];
    const harmonicGains = [];
    
    // Piano harmonics with their relative amplitudes (varies by frequency range)
    let harmonicData;
    if (isLowNote) {
      // Low notes have stronger fundamental and fewer high harmonics
      harmonicData = [
        { ratio: 1, amplitude: 1.0, wave: 'triangle' },
        { ratio: 2, amplitude: 0.6, wave: 'sine' },
        { ratio: 3, amplitude: 0.3, wave: 'sine' },
        { ratio: 4, amplitude: 0.15, wave: 'sine' },
        { ratio: 5, amplitude: 0.08, wave: 'sine' },
        { ratio: 6, amplitude: 0.04, wave: 'sine' }
      ];
    } else if (isMidNote) {
      // Mid notes have balanced harmonics
      harmonicData = [
        { ratio: 1, amplitude: 1.0, wave: 'triangle' },
        { ratio: 2, amplitude: 0.7, wave: 'sine' },
        { ratio: 3, amplitude: 0.4, wave: 'sine' },
        { ratio: 4, amplitude: 0.25, wave: 'sine' },
        { ratio: 5, amplitude: 0.15, wave: 'sine' },
        { ratio: 6, amplitude: 0.1, wave: 'sine' },
        { ratio: 7, amplitude: 0.06, wave: 'sine' },
        { ratio: 8, amplitude: 0.04, wave: 'sine' }
      ];
    } else {
      // High notes have more harmonics but weaker fundamental
      harmonicData = [
        { ratio: 1, amplitude: 0.8, wave: 'triangle' },
        { ratio: 2, amplitude: 0.9, wave: 'sine' },
        { ratio: 3, amplitude: 0.6, wave: 'sine' },
        { ratio: 4, amplitude: 0.4, wave: 'sine' },
        { ratio: 5, amplitude: 0.25, wave: 'sine' },
        { ratio: 6, amplitude: 0.15, wave: 'sine' },
        { ratio: 7, amplitude: 0.1, wave: 'sine' },
        { ratio: 8, amplitude: 0.08, wave: 'sine' },
        { ratio: 9, amplitude: 0.05, wave: 'sine' },
        { ratio: 10, amplitude: 0.03, wave: 'sine' }
      ];
    }
    
    // Create master gain for the entire note
    const masterGain = audioContext.createGain();
    
    // Volume adjustment based on frequency (pianos are naturally louder in mid range)
    let volumeMultiplier = 0.15;
    if (isLowNote) volumeMultiplier = 0.12;
    if (isHighNote) volumeMultiplier = 0.18;
    
    harmonicData.forEach((harmonic, index) => {
      const osc = audioContext.createOscillator();
      const gain = audioContext.createGain();
      
      osc.type = harmonic.wave;
      osc.frequency.setValueAtTime(frequency * harmonic.ratio, startTime);
      
      // Apply harmonic amplitude with frequency-dependent volume
      const harmonicVolume = harmonic.amplitude * volumeMultiplier;
      gain.gain.setValueAtTime(harmonicVolume, startTime);
      
      osc.connect(gain);
      gain.connect(masterGain);
      
      harmonics.push(osc);
      harmonicGains.push(gain);
    });
    
    // Add subtle detuning for realism (piano strings are never perfectly tuned)
    harmonics.forEach((osc, index) => {
      if (index > 0) {
        const detune = (Math.random() - 0.5) * (isHighNote ? 5 : 2); // More detuning for high notes
        osc.detune.setValueAtTime(detune, startTime);
      }
    });
    
    // Frequency-dependent ADSR envelope
    let attackTime, decayTime, sustainLevel, releaseTime;
    if (isLowNote) {
      attackTime = 0.015;  // Slightly slower attack for low notes
      decayTime = 0.4;     // Longer decay
      sustainLevel = 0.4;  // Higher sustain
      releaseTime = 2.0;   // Much longer release
    } else if (isMidNote) {
      attackTime = 0.01;
      decayTime = 0.3;
      sustainLevel = 0.3;
      releaseTime = 1.5;
    } else {
      attackTime = 0.005;  // Very quick attack for high notes
      decayTime = 0.2;     // Faster decay
      sustainLevel = 0.2;  // Lower sustain
      releaseTime = 1.0;   // Shorter release
    }
    
    // Apply ADSR envelope
    masterGain.gain.setValueAtTime(0, startTime);
    masterGain.gain.linearRampToValueAtTime(1, startTime + attackTime);
    masterGain.gain.exponentialRampToValueAtTime(sustainLevel, startTime + attackTime + decayTime);
    masterGain.gain.exponentialRampToValueAtTime(0.01, startTime + duration - releaseTime);
    masterGain.gain.linearRampToValueAtTime(0, startTime + duration);
    
    // Multiple filters for more realistic tone shaping
    const lowPassFilter = audioContext.createBiquadFilter();
    lowPassFilter.type = 'lowpass';
    
    if (isLowNote) {
      lowPassFilter.frequency.setValueAtTime(frequency * 6, startTime);
      lowPassFilter.Q.setValueAtTime(0.7, startTime);
    } else if (isMidNote) {
      lowPassFilter.frequency.setValueAtTime(frequency * 8, startTime);
      lowPassFilter.Q.setValueAtTime(1.0, startTime);
    } else {
      lowPassFilter.frequency.setValueAtTime(frequency * 12, startTime);
      lowPassFilter.Q.setValueAtTime(1.5, startTime);
    }
    
    // Add a subtle high-pass filter to remove unwanted low frequencies from high notes
    const highPassFilter = audioContext.createBiquadFilter();
    highPassFilter.type = 'highpass';
    highPassFilter.frequency.setValueAtTime(isHighNote ? frequency * 0.3 : frequency * 0.1, startTime);
    highPassFilter.Q.setValueAtTime(0.5, startTime);
    
    // Create a simple reverb effect using convolution
    const createSimpleReverb = () => {
      const convolver = audioContext.createConvolver();
      const reverbGain = audioContext.createGain();
      reverbGain.gain.setValueAtTime(0.15, startTime); // Subtle reverb mix
      
      // Create impulse response for reverb (simple room simulation)
      const length = audioContext.sampleRate * 1.5; // 1.5 second reverb
      const impulse = audioContext.createBuffer(2, length, audioContext.sampleRate);
      
      for (let channel = 0; channel < impulse.numberOfChannels; channel++) {
        const channelData = impulse.getChannelData(channel);
        for (let i = 0; i < length; i++) {
          const decay = Math.pow(1 - i / length, 2); // Exponential decay
          channelData[i] = (Math.random() * 2 - 1) * decay * 0.3;
        }
      }
      
      convolver.buffer = impulse;
      return { convolver, reverbGain };
    };
    
    const { convolver, reverbGain } = createSimpleReverb();
    
    // Connect the audio chain with reverb
    masterGain.connect(highPassFilter);
    highPassFilter.connect(lowPassFilter);
    
    // Dry signal (direct)
    const dryGain = audioContext.createGain();
    dryGain.gain.setValueAtTime(0.85, startTime); // Main signal level
    lowPassFilter.connect(dryGain);
    dryGain.connect(audioContext.destination);
    
    // Wet signal (reverb)
    lowPassFilter.connect(convolver);
    convolver.connect(reverbGain);
    reverbGain.connect(audioContext.destination);
    
    // Start all oscillators
    harmonics.forEach(osc => {
      osc.start(startTime);
      osc.stop(startTime + duration);
    });
    
    return { harmonics, gains: harmonicGains, masterGain, filters: [lowPassFilter, highPassFilter] };
  };

  const playNote = async (noteData) => {
    if (!audioContext) return;
    
    setIsPlaying(true);
    const duration = 2.5; // Longer duration for piano sound
    const startTime = audioContext.currentTime;
    
    createRealisticPianoSound(noteData.frequency, startTime, duration);
    
    setTimeout(() => setIsPlaying(false), duration * 1000);
  };

  const startPractice = () => {
    if (practiceMode === 'song' && selectedSong) {
      startSongPractice();
    } else {
      const note = generateRandomNote();
      setCurrentNote(note);
      setAnalysisResult(null);
      playNote(note);
    }
  };

  const startSongPractice = () => {
    if (!selectedSong || !selectedSong.melody || selectedSong.melody.length === 0) return;
    
    const songNote = selectedSong.melody[currentNoteIndex];
    const noteData = {
      note: songNote.note.replace(/\d+$/, ''),
      octave: parseInt(songNote.note.match(/\d+$/)?.[0] || '4'),
      frequency: songNote.frequency,
      key: songNote.note,
      lyrics: songNote.lyrics || ''
    };
    
    setCurrentNote(noteData);
    setAnalysisResult(null);
    playNote(noteData);
  };

  const nextSongNote = () => {
    if (!selectedSong || !selectedSong.melody) return;
    
    const nextIndex = currentNoteIndex + 1;
    if (nextIndex < selectedSong.melody.length) {
      setCurrentNoteIndex(nextIndex);
    } else {
      // Song completed
      setCurrentNoteIndex(0);
    }
  };

  const previousSongNote = () => {
    if (currentNoteIndex > 0) {
      setCurrentNoteIndex(currentNoteIndex - 1);
    }
  };

  const handleKeyPress = (noteData) => {
    // Play the clicked note
    playNote(noteData);
    // Optionally set it as the current target note for practice
    // setCurrentNote(noteData);
    // setAnalysisResult(null);
  };

  const handleRecordingComplete = (analysisData) => {
    if (!currentNote) return;
    
    const targetFreq = currentNote.frequency;
    const detectedFreq = analysisData.frequency;
    
    // Calculate cents difference (musical interval measurement)
    const centsDifference = detectedFreq > 0 ? 
      1200 * Math.log2(detectedFreq / targetFreq) : 0;
    
    // Score based on accuracy (closer to 0 cents = higher score)
    const accuracy = Math.max(0, 100 - Math.abs(centsDifference) * 2);
    const roundedAccuracy = Math.round(accuracy);
    
    const result = {
      targetNote: currentNote.key,
      targetFrequency: targetFreq,
      detectedFrequency: detectedFreq,
      detectedNote: detectedFreq > 0 ? getNoteName(detectedFreq) : 'No pitch detected',
      centsDifference: Math.round(centsDifference),
      accuracy: roundedAccuracy,
      confidence: analysisData.confidence
    };
    
    setAnalysisResult(result);
    setScore(prev => prev + roundedAccuracy);
    setTotalAttempts(prev => prev + 1);
  };

  const getAccuracyColor = (accuracy) => {
    if (accuracy >= 80) return 'success';
    if (accuracy >= 60) return 'warning';
    return 'error';
  };

  const getAccuracyMessage = (accuracy) => {
    if (accuracy >= 90) return 'Excellent! Perfect pitch!';
    if (accuracy >= 80) return 'Great! Very close!';
    if (accuracy >= 60) return 'Good! Keep practicing!';
    if (accuracy >= 40) return 'Not bad, try again!';
    return 'Keep trying! Practice makes perfect!';
  };

  // Show different content based on mode
  if (!practiceRandomNotes && !selectedSong) {
    return (
      <Box sx={{ textAlign: 'center', py: 8 }}>
        <Typography variant="h4" gutterBottom>
          No Song Selected
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Please upload and select a song from the "Upload Songs" tab to start practicing.
        </Typography>
      </Box>
    );
  }

  return (
    <Box>

      {/* Settings Card */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Settings
          </Typography>
          
          <Box sx={{ mb: 3 }}>
            <Typography gutterBottom>
              Octave Range: {octaveRange[0]} - {octaveRange[1]}
            </Typography>
            <Slider
              value={octaveRange}
              onChange={(e, newValue) => setOctaveRange(newValue)}
              valueLabelDisplay="auto"
              min={2}
              max={6}
              marks={[
                { value: 2, label: '2' },
                { value: 3, label: '3' },
                { value: 4, label: '4' },
                { value: 5, label: '5' },
                { value: 6, label: '6' },
              ]}
            />
          </Box>
        </CardContent>
      </Card>

      {/* Piano Keyboard */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Piano Keyboard
          </Typography>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Click any key to hear its note. The highlighted key shows the current target note.
          </Typography>
          <PianoKeyboard 
            octaveRange={octaveRange}
            highlightedNote={currentNote?.key}
            onKeyPress={handleKeyPress}
          />
        </CardContent>
      </Card>

      {/* Practice Controls */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            {practiceMode === 'song' ? `Practice: ${selectedSong?.title}` : 'Practice'}
          </Typography>
          
          {practiceMode === 'song' && selectedSong && (
            <Box sx={{ mb: 2, p: 2, backgroundColor: 'background.paper', borderRadius: 1 }}>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Song Progress: {currentNoteIndex + 1} / {selectedSong.melody?.length || 0}
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <Button
                  size="small"
                  startIcon={<SkipPrevious />}
                  onClick={previousSongNote}
                  disabled={currentNoteIndex === 0}
                >
                  Previous
                </Button>
                <Box sx={{ flexGrow: 1, textAlign: 'center' }}>
                  <Typography variant="h6">
                    {selectedSong.melody?.[currentNoteIndex]?.note || 'N/A'}
                  </Typography>
                  {selectedSong.melody?.[currentNoteIndex]?.lyrics && (
                    <Typography variant="body2" color="text.secondary">
                      "{selectedSong.melody[currentNoteIndex].lyrics}"
                    </Typography>
                  )}
                </Box>
                <Button
                  size="small"
                  endIcon={<SkipNext />}
                  onClick={nextSongNote}
                  disabled={currentNoteIndex >= (selectedSong.melody?.length || 0) - 1}
                >
                  Next
                </Button>
              </Box>
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                {selectedSong.melody?.slice(Math.max(0, currentNoteIndex - 2), currentNoteIndex + 3).map((note, index) => {
                  const noteIndex = Math.max(0, currentNoteIndex - 2) + index;
                  const isCurrent = noteIndex === currentNoteIndex;
                  return (
                    <Box
                      key={noteIndex}
                      sx={{
                        px: 1,
                        py: 0.5,
                        borderRadius: 1,
                        backgroundColor: isCurrent ? 'primary.main' : 'background.default',
                        color: isCurrent ? 'primary.contrastText' : 'text.secondary',
                        fontSize: '0.75rem',
                        border: isCurrent ? '2px solid' : '1px solid',
                        borderColor: isCurrent ? 'primary.main' : 'divider'
                      }}
                    >
                      {note.note}
                    </Box>
                  );
                })}
              </Box>
            </Box>
          )}
          
          <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
            <Button
              variant="contained"
              startIcon={<PlayArrow />}
              onClick={startPractice}
              disabled={isPlaying || !audioContext || (practiceMode === 'song' && !selectedSong)}
            >
              {isPlaying ? 'Playing...' : practiceMode === 'song' ? 'Play Song Note' : 'Play Random Note'}
            </Button>
            
            <AudioRecorder
              onRecordingComplete={handleRecordingComplete}
              disabled={!currentNote || isPlaying}
            />
          </Box>

          {currentNote && (
            <Alert severity="info" sx={{ mb: 2 }}>
              Target Note: <strong>{currentNote.key}</strong> ({Math.round(currentNote.frequency)} Hz)
              {currentNote.lyrics && (
                <><br />Lyrics: <em>"{currentNote.lyrics}"</em></>
              )}
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Results */}
      {analysisResult && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Analysis Results
            </Typography>
            
            <Alert 
              severity={getAccuracyColor(analysisResult.accuracy)} 
              sx={{ mb: 2 }}
            >
              {getAccuracyMessage(analysisResult.accuracy)}
            </Alert>
            
            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 2 }}>
              <Box>
                <Typography variant="body2" color="text.secondary">Target Note</Typography>
                <Typography variant="h6">{analysisResult.targetNote}</Typography>
              </Box>
              
              <Box>
                <Typography variant="body2" color="text.secondary">Your Note</Typography>
                <Typography variant="h6">{analysisResult.detectedNote}</Typography>
              </Box>
              
              <Box>
                <Typography variant="body2" color="text.secondary">Accuracy</Typography>
                <Typography variant="h6" color={getAccuracyColor(analysisResult.accuracy) + '.main'}>
                  {analysisResult.accuracy}%
                </Typography>
              </Box>
              
              <Box>
                <Typography variant="body2" color="text.secondary">Pitch Difference</Typography>
                <Typography variant="h6">
                  {analysisResult.centsDifference > 0 ? '+' : ''}{analysisResult.centsDifference} cents
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>
      )}

      {/* Score Card */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Your Progress
          </Typography>
          
          <Box sx={{ display: 'flex', gap: 4 }}>
            <Box>
              <Typography variant="body2" color="text.secondary">Total Score</Typography>
              <Typography variant="h4">{score}</Typography>
            </Box>
            
            <Box>
              <Typography variant="body2" color="text.secondary">Attempts</Typography>
              <Typography variant="h4">{totalAttempts}</Typography>
            </Box>
            
            <Box>
              <Typography variant="body2" color="text.secondary">Average</Typography>
              <Typography variant="h4">
                {totalAttempts > 0 ? Math.round(score / totalAttempts) : 0}%
              </Typography>
            </Box>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};

export default VocalTrainer;
