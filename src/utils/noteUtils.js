// Note frequencies based on equal temperament tuning (A4 = 440 Hz)
export const noteFrequencies = {
  // Octave 2
  'C2': 65.41,
  'C#2': 69.30,
  'D2': 73.42,
  'D#2': 77.78,
  'E2': 82.41,
  'F2': 87.31,
  'F#2': 92.50,
  'G2': 98.00,
  'G#2': 103.83,
  'A2': 110.00,
  'A#2': 116.54,
  'B2': 123.47,
  
  // Octave 3
  'C3': 130.81,
  'C#3': 138.59,
  'D3': 146.83,
  'D#3': 155.56,
  'E3': 164.81,
  'F3': 174.61,
  'F#3': 185.00,
  'G3': 196.00,
  'G#3': 207.65,
  'A3': 220.00,
  'A#3': 233.08,
  'B3': 246.94,
  
  // Octave 4 (Middle octave)
  'C4': 261.63,
  'C#4': 277.18,
  'D4': 293.66,
  'D#4': 311.13,
  'E4': 329.63,
  'F4': 349.23,
  'F#4': 369.99,
  'G4': 392.00,
  'G#4': 415.30,
  'A4': 440.00,
  'A#4': 466.16,
  'B4': 493.88,
  
  // Octave 5
  'C5': 523.25,
  'C#5': 554.37,
  'D5': 587.33,
  'D#5': 622.25,
  'E5': 659.25,
  'F5': 698.46,
  'F#5': 739.99,
  'G5': 783.99,
  'G#5': 830.61,
  'A5': 880.00,
  'A#5': 932.33,
  'B5': 987.77,
  
  // Octave 6
  'C6': 1046.50,
  'C#6': 1108.73,
  'D6': 1174.66,
  'D#6': 1244.51,
  'E6': 1318.51,
  'F6': 1396.91,
  'F#6': 1479.98,
  'G6': 1567.98,
  'G#6': 1661.22,
  'A6': 1760.00,
  'A#6': 1864.66,
  'B6': 1975.53,
};

// Convert frequency to the closest note name
export const getNoteName = (frequency) => {
  if (frequency <= 0) return 'No pitch';
  
  let closestNote = '';
  let minDifference = Infinity;
  
  Object.entries(noteFrequencies).forEach(([note, noteFreq]) => {
    const difference = Math.abs(frequency - noteFreq);
    if (difference < minDifference) {
      minDifference = difference;
      closestNote = note;
    }
  });
  
  return closestNote;
};

// Convert frequency to cents (musical interval measurement)
export const frequencyToCents = (frequency, referenceFrequency) => {
  if (frequency <= 0 || referenceFrequency <= 0) return 0;
  return 1200 * Math.log2(frequency / referenceFrequency);
};

// Get the note name without octave (e.g., 'C4' -> 'C')
export const getNoteNameOnly = (noteName) => {
  return noteName.replace(/\d+$/, '');
};

// Get the octave number from note name (e.g., 'C4' -> 4)
export const getOctaveNumber = (noteName) => {
  const match = noteName.match(/\d+$/);
  return match ? parseInt(match[0]) : 4;
};

// Check if a note is a sharp/flat (black key)
export const isSharpFlat = (noteName) => {
  return noteName.includes('#') || noteName.includes('b');
};

// Convert note name to MIDI number (C4 = 60)
export const noteToMidi = (noteName) => {
  const noteMap = {
    'C': 0, 'C#': 1, 'D': 2, 'D#': 3, 'E': 4, 'F': 5,
    'F#': 6, 'G': 7, 'G#': 8, 'A': 9, 'A#': 10, 'B': 11
  };
  
  const note = getNoteNameOnly(noteName);
  const octave = getOctaveNumber(noteName);
  
  return (octave + 1) * 12 + noteMap[note];
};

// Convert MIDI number to frequency
export const midiToFrequency = (midiNote) => {
  return 440 * Math.pow(2, (midiNote - 69) / 12);
};

// Get all notes in a given octave range
export const getNotesInRange = (startOctave, endOctave) => {
  const notes = [];
  const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  
  for (let octave = startOctave; octave <= endOctave; octave++) {
    noteNames.forEach(note => {
      const noteName = `${note}${octave}`;
      if (noteFrequencies[noteName]) {
        notes.push({
          name: noteName,
          frequency: noteFrequencies[noteName],
          isSharp: note.includes('#')
        });
      }
    });
  }
  
  return notes;
};

// Calculate the accuracy percentage based on cents difference
export const calculateAccuracy = (centsDifference) => {
  const maxCents = 50; // Consider anything beyond 50 cents as 0% accuracy
  const accuracy = Math.max(0, 100 - (Math.abs(centsDifference) / maxCents) * 100);
  return Math.round(accuracy);
};

// Get a random note from a given range
export const getRandomNote = (startOctave, endOctave) => {
  const notes = getNotesInRange(startOctave, endOctave);
  const randomIndex = Math.floor(Math.random() * notes.length);
  return notes[randomIndex];
};
