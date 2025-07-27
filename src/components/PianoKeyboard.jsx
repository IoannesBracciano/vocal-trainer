import React from 'react';
import { Box } from '@mui/material';
import { noteFrequencies } from '../utils/noteUtils';

const PianoKeyboard = ({ octaveRange, highlightedNote, onKeyPress }) => {
  const whiteKeys = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];
  const blackKeys = ['C#', 'D#', '', 'F#', 'G#', 'A#', '']; // Empty strings for positions without black keys

  const generateKeys = () => {
    const keys = [];
    
    for (let octave = octaveRange[0]; octave <= octaveRange[1]; octave++) {
      // Add white keys for this octave
      whiteKeys.forEach((note, index) => {
        const keyName = `${note}${octave}`;
        keys.push({
          note: keyName,
          type: 'white',
          isHighlighted: highlightedNote === keyName,
          position: keys.filter(k => k.type === 'white').length
        });
      });
    }
    
    return keys;
  };

  const generateBlackKeys = () => {
    const blackKeysArray = [];
    
    for (let octave = octaveRange[0]; octave <= octaveRange[1]; octave++) {
      blackKeys.forEach((note, index) => {
        if (note) { // Only add if not empty string
          const keyName = `${note}${octave}`;
          blackKeysArray.push({
            note: keyName,
            type: 'black',
            isHighlighted: highlightedNote === keyName,
            position: index + (octave - octaveRange[0]) * 7
          });
        }
      });
    }
    
    return blackKeysArray;
  };

  const whiteKeysArray = generateKeys();
  const blackKeysArray = generateBlackKeys();

  const getBlackKeyPosition = (position) => {
    // Calculate position of black keys relative to white keys
    const whiteKeyWidth = 40;
    const blackKeyWidth = 24;
    const blackKeyPositions = [0.5, 1.5, 3.5, 4.5, 5.5]; // Relative positions within an octave
    
    const octaveIndex = Math.floor(position / 7);
    const positionInOctave = position % 7;
    
    const basePosition = octaveIndex * 7 * whiteKeyWidth;
    const relativePosition = blackKeyPositions[positionInOctave] * whiteKeyWidth;
    
    return basePosition + relativePosition - (blackKeyWidth / 2);
  };

  const handleKeyClick = (noteName) => {
    if (onKeyPress && noteFrequencies[noteName]) {
      const noteData = {
        note: noteName.replace(/\d+$/, ''), // Note without octave
        octave: parseInt(noteName.match(/\d+$/)[0]), // Extract octave number
        frequency: noteFrequencies[noteName],
        key: noteName
      };
      onKeyPress(noteData);
    }
  };

  return (
    <Box
      sx={{
        position: 'relative',
        height: 120,
        width: '100%',
        overflow: 'hidden',
        border: '1px solid #333',
        borderRadius: 1,
        backgroundColor: '#000'
      }}
    >
      {/* White Keys */}
      {whiteKeysArray.map((key, index) => (
        <Box
          key={key.note}
          onClick={() => handleKeyClick(key.note)}
          sx={{
            position: 'absolute',
            left: index * 40,
            top: 0,
            width: 38,
            height: 120,
            backgroundColor: key.isHighlighted ? '#4fc3f7' : '#fff',
            border: '1px solid #ccc',
            borderRadius: '0 0 4px 4px',
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'center',
            pb: 1,
            fontSize: '12px',
            fontWeight: key.isHighlighted ? 'bold' : 'normal',
            color: key.isHighlighted ? '#000' : '#666',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            '&:hover': {
              backgroundColor: key.isHighlighted ? '#29b6f6' : '#f5f5f5',
            },
            '&:active': {
              backgroundColor: key.isHighlighted ? '#0277bd' : '#e0e0e0',
              transform: 'translateY(1px)',
            },
            boxShadow: key.isHighlighted ? '0 0 10px rgba(79, 195, 247, 0.5)' : 'none',
          }}
        >
          {key.note}
        </Box>
      ))}
      
      {/* Black Keys */}
      {blackKeysArray.map((key) => {
        const leftPosition = getBlackKeyPosition(key.position);
        
        return (
          <Box
            key={key.note}
            onClick={() => handleKeyClick(key.note)}
            sx={{
              position: 'absolute',
              left: leftPosition,
              top: 0,
              width: 24,
              height: 75,
              backgroundColor: key.isHighlighted ? '#ff9800' : '#333',
              borderRadius: '0 0 4px 4px',
              display: 'flex',
              alignItems: 'flex-end',
              justifyContent: 'center',
              pb: 0.5,
              fontSize: '10px',
              fontWeight: key.isHighlighted ? 'bold' : 'normal',
              color: key.isHighlighted ? '#000' : '#fff',
              cursor: 'pointer',
              zIndex: 2,
              transition: 'all 0.2s ease',
              '&:hover': {
                backgroundColor: key.isHighlighted ? '#f57c00' : '#555',
              },
              '&:active': {
                backgroundColor: key.isHighlighted ? '#e65100' : '#222',
                transform: 'translateY(1px)',
              },
              boxShadow: key.isHighlighted ? '0 0 10px rgba(255, 152, 0, 0.5)' : 'none',
            }}
          >
            <Box sx={{ transform: 'rotate(-90deg)', whiteSpace: 'nowrap' }}>
              {key.note}
            </Box>
          </Box>
        );
      })}
    </Box>
  );
};

export default PianoKeyboard;
