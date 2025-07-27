# 🎵 Vocal Trainer

A comprehensive web application to help you learn to sing your favorite songs and practice your vocal range. Upload audio files to extract melodies, practice note-by-note, or use the built-in random note generator with an interactive piano keyboard.

![Vocal Trainer Demo](https://img.shields.io/badge/React-19.1.0-blue) ![Vite](https://img.shields.io/badge/Vite-7.0.4-purple) ![Material--UI](https://img.shields.io/badge/Material--UI-7.2.0-blue)

## ✨ Features

### 🎤 Song Learning Mode
- **Audio File Upload**: Upload MP3, WAV, OGG, or M4A files of songs you want to learn
- **Melody Extraction**: Advanced pitch detection algorithm extracts vocal melodies from audio
- **Note-by-Note Practice**: Practice each note of the song sequentially with navigation controls
- **Lyrics Support**: Display lyrics alongside notes (manual input supported)
- **Song Library**: Save and manage your analyzed songs with persistent storage
- **Progress Tracking**: Visual progress indicator showing your position in the song

### 🎹 Random Note Practice
- **Virtual Piano Keyboard**: Interactive 2-octave piano keyboard with adjustable range (2-6 octaves)
- **Random Note Generation**: Plays random notes from your selected octave range
- **Clickable Keys**: Click piano keys to hear individual notes
- **Target Note Highlighting**: Visual indication of the current target note

### 🎧 Advanced Audio Features
- **Realistic Piano Sound**: Sophisticated sound synthesis with harmonics, ADSR envelope, and reverb
- **Voice Recording**: Records your voice for 3 seconds with real-time audio level monitoring
- **Pitch Analysis**: Enhanced autocorrelation-based pitch detection with confidence scoring
- **Accuracy Scoring**: Compares your pitch to the target note and provides percentage accuracy
- **Real-time Feedback**: Visual feedback with color-coded accuracy ratings and encouraging messages

## Technologies Used

- **React**: Frontend framework
- **Vite**: Build tool and development server
- **Material-UI (MUI)**: UI component library with dark theme
- **Web Audio API**: For note playback and audio analysis
- **MediaRecorder API**: For voice recording

## Getting Started

### Prerequisites

- Node.js (version 14 or higher)
- npm or yarn package manager

### Installation

1. Navigate to the project directory:
   ```bash
   cd vocal-trainer
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

4. Open your browser and go to `http://localhost:5173`

### Build for Production

To create a production build:

```bash
npm run build
```

## How to Use

### 🎵 Song Learning Mode

1. **Upload a Song**: 
   - Go to the "Upload Songs" tab
   - Enter the song title and artist name
   - Select an audio file (MP3, WAV, OGG, or M4A)
   - Click "Analyze Song" and wait for the melody extraction to complete

2. **Practice the Song**:
   - Switch to the "Practice" tab (automatically activated after upload)
   - Use Previous/Next buttons to navigate through the song
   - Click "Play Song Note" to hear the current target note
   - Record your voice attempting to match the pitch
   - View your accuracy and move to the next note

3. **Manage Your Library**:
   - Click "Song Library" to view all analyzed songs
   - Select different songs to practice
   - Delete songs you no longer need

### 🎲 Random Note Practice

1. **Set Your Range**: Go to "Random Note Practice" tab and use the octave range slider (default: C4-B5)

2. **Start Practice**: Click "Play Random Note" to hear a random note from your selected range

3. **Record Your Voice**: After hearing the note, click "Record Voice" and sing the same note

4. **View Results**: The app will analyze your pitch and show:
   - Target note vs. your sung note
   - Accuracy percentage
   - Pitch difference in cents
   - Encouraging feedback message

5. **Track Progress**: Monitor your total score, number of attempts, and average accuracy

### 💡 Tips for Best Results

- **For Song Analysis**: Use clear recordings with prominent vocals and minimal background music
- **For Practice**: Sing in a quiet environment with good microphone positioning
- **Acapella versions** work particularly well for melody extraction

## Technical Details

### Pitch Detection Algorithm

The app uses an autocorrelation-based pitch detection algorithm that:
- Analyzes the recorded audio buffer
- Calculates correlations for different periods
- Determines the fundamental frequency of your voice
- Provides a confidence measure for the detection

### Accuracy Calculation

Accuracy is calculated based on the difference in cents (musical intervals):
- Perfect pitch (0 cents difference) = 100% accuracy
- The score decreases as the pitch difference increases
- Differences beyond 50 cents are considered 0% accuracy

### Audio Features

- **Note Playback**: Uses Web Audio API oscillators with sine waves
- **Real-time Monitoring**: Shows audio levels during recording
- **Cross-browser Support**: Compatible with modern browsers that support Web Audio API

## Browser Compatibility

This app requires a modern browser with support for:
- Web Audio API
- MediaRecorder API
- getUserMedia (for microphone access)

Recommended browsers:
- Chrome/Chromium (recommended)
- Firefox
- Safari
- Edge

## Permissions

The app requires microphone permission to record your voice. Make sure to allow microphone access when prompted by your browser.

## Troubleshooting

### Microphone Issues
- Ensure your browser has microphone permissions
- Check that your microphone is not being used by other applications
- Try refreshing the page if audio context fails to initialize

### Audio Context Issues
- Some browsers require user interaction before creating audio contexts
- Click "Play Random Note" first to initialize audio

### Pitch Detection Accuracy
- Sing clearly and at a consistent volume
- Avoid background noise
- The algorithm works best with sustained tones

## Contributing

Feel free to contribute to this project by:
- Reporting bugs
- Suggesting new features
- Improving the pitch detection algorithm
- Enhancing the UI/UX

## License

This project is open source and available under the MIT License.

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.
