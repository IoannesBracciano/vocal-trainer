import React, { useState, useRef } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  TextField,
  LinearProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Chip
} from '@mui/material';
import {
  CloudUpload,
  Delete,
  PlayArrow,
  Stop,
  MusicNote,
  LibraryMusic
} from '@mui/icons-material';
import { AudioMelodyAnalyzer, SongData, SongStorage } from '../utils/songUtils';

const SongUpload = ({ onSongSelect, selectedSong }) => {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [analysisStatus, setAnalysisStatus] = useState('');
  const [showLibrary, setShowLibrary] = useState(false);
  const [songs, setSongs] = useState(SongStorage.getSongList());
  const [uploadForm, setUploadForm] = useState({
    title: '',
    artist: '',
    file: null
  });
  const [error, setError] = useState('');
  
  const fileInputRef = useRef(null);
  const analyzerRef = useRef(null);

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      // Validate file type
      const validTypes = ['audio/mp3', 'audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/m4a'];
      if (!validTypes.includes(file.type) && !file.name.match(/\.(mp3|wav|ogg|m4a)$/i)) {
        setError('Please select a valid audio file (MP3, WAV, OGG, or M4A)');
        return;
      }

      setUploadForm({ ...uploadForm, file });
      setError('');
      
      // Auto-fill title from filename if empty
      if (!uploadForm.title) {
        const filename = file.name.replace(/\.[^/.]+$/, ''); // Remove extension
        setUploadForm(prev => ({ ...prev, title: filename }));
      }
    }
  };

  const handleAnalyze = async () => {
    if (!uploadForm.file || !uploadForm.title || !uploadForm.artist) {
      setError('Please fill in all fields and select an audio file');
      return;
    }

    setIsAnalyzing(true);
    setAnalysisProgress(0);
    setError('');

    try {
      setAnalysisStatus('Initializing audio analysis...');
      
      // Create analyzer instance
      analyzerRef.current = new AudioMelodyAnalyzer();
      
      // Create song data object
      const songData = new SongData(uploadForm.title, uploadForm.artist, uploadForm.file);
      
      setAnalysisStatus('Analyzing audio for melody...');
      
      // Analyze the audio file
      const melody = await analyzerRef.current.analyzeAudioFile(
        uploadForm.file,
        (progress) => {
          setAnalysisProgress(progress);
          setAnalysisStatus(`Analyzing melody... ${Math.round(progress)}%`);
        }
      );

      setAnalysisStatus('Processing detected notes...');
      
      // Add melody to song data
      songData.melody = melody.map(note => ({
        ...note,
        lyrics: '' // Will be filled manually later
      }));
      songData.isAnalyzed = true;

      // Save to storage
      SongStorage.saveSong(songData);
      
      // Update songs list
      setSongs(SongStorage.getSongList());
      
      setAnalysisStatus(`Analysis complete! Detected ${melody.length} notes.`);
      
      // Reset form
      setUploadForm({ title: '', artist: '', file: null });
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      
      // Auto-select the newly analyzed song
      onSongSelect(songData);
      
    } catch (error) {
      console.error('Analysis error:', error);
      setError(`Analysis failed: ${error.message}`);
      setAnalysisStatus('');
    } finally {
      setIsAnalyzing(false);
      setAnalysisProgress(0);
    }
  };

  const handleDeleteSong = (songId) => {
    SongStorage.deleteSong(songId);
    setSongs(SongStorage.getSongList());
    
    // If the deleted song was selected, clear selection
    if (selectedSong && selectedSong.id === songId) {
      onSongSelect(null);
    }
  };

  const handleSongSelect = (songId) => {
    const songData = SongStorage.getSong(songId);
    if (songData) {
      onSongSelect(songData);
      setShowLibrary(false);
    }
  };

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <Box>
      {/* Current Song Display */}
      {selectedSong && (
        <Card sx={{ mb: 2, backgroundColor: 'primary.dark' }}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <MusicNote color="primary" />
              <Box sx={{ flexGrow: 1 }}>
                <Typography variant="h6">{selectedSong.title}</Typography>
                <Typography variant="body2" color="text.secondary">
                  by {selectedSong.artist} • {selectedSong.melody?.length || 0} notes
                </Typography>
              </Box>
              <Button
                variant="outlined"
                size="small"
                onClick={() => onSongSelect(null)}
              >
                Clear
              </Button>
            </Box>
          </CardContent>
        </Card>
      )}

      {/* Upload Form */}
      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Upload New Song
          </Typography>
          
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mb: 2 }}>
            <TextField
              label="Song Title"
              value={uploadForm.title}
              onChange={(e) => setUploadForm({ ...uploadForm, title: e.target.value })}
              fullWidth
              disabled={isAnalyzing}
            />
            
            <TextField
              label="Artist"
              value={uploadForm.artist}
              onChange={(e) => setUploadForm({ ...uploadForm, artist: e.target.value })}
              fullWidth
              disabled={isAnalyzing}
            />
            
            <Box>
              <input
                type="file"
                accept="audio/*"
                style={{ display: 'none' }}
                ref={fileInputRef}
                onChange={handleFileSelect}
                disabled={isAnalyzing}
              />
              <Button
                variant="outlined"
                startIcon={<CloudUpload />}
                onClick={() => fileInputRef.current?.click()}
                disabled={isAnalyzing}
                fullWidth
              >
                {uploadForm.file ? `Selected: ${uploadForm.file.name}` : 'Select Audio File'}
              </Button>
            </Box>
          </Box>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          {isAnalyzing && (
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" gutterBottom>
                {analysisStatus}
              </Typography>
              <LinearProgress 
                variant="determinate" 
                value={analysisProgress} 
                sx={{ mb: 1 }}
              />
              <Typography variant="caption" color="text.secondary">
                This may take a few minutes depending on the song length...
              </Typography>
            </Box>
          )}

          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button
              variant="contained"
              onClick={handleAnalyze}
              disabled={isAnalyzing || !uploadForm.file || !uploadForm.title || !uploadForm.artist}
              startIcon={<MusicNote />}
            >
              {isAnalyzing ? 'Analyzing...' : 'Analyze Song'}
            </Button>
            
            <Button
              variant="outlined"
              onClick={() => setShowLibrary(true)}
              startIcon={<LibraryMusic />}
            >
              Song Library ({songs.length})
            </Button>
          </Box>
        </CardContent>
      </Card>

      {/* Instructions */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            How to Use
          </Typography>
          <Typography variant="body2" color="text.secondary" paragraph>
            1. Upload an audio file of the song you want to learn
          </Typography>
          <Typography variant="body2" color="text.secondary" paragraph>
            2. The app will analyze the audio and extract the melody
          </Typography>
          <Typography variant="body2" color="text.secondary" paragraph>
            3. Practice singing along with each detected note
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
            Tips: For best results, use songs with clear vocals and minimal background music. 
            Acapella versions work particularly well.
          </Typography>
        </CardContent>
      </Card>

      {/* Song Library Dialog */}
      <Dialog
        open={showLibrary}
        onClose={() => setShowLibrary(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Song Library</DialogTitle>
        <DialogContent>
          {songs.length === 0 ? (
            <Typography color="text.secondary" align="center" sx={{ py: 4 }}>
              No songs uploaded yet. Upload your first song to get started!
            </Typography>
          ) : (
            <List>
              {songs.map((song) => (
                <ListItem
                  key={song.id}
                  button
                  onClick={() => handleSongSelect(song.id)}
                  selected={selectedSong?.id === song.id}
                >
                  <ListItemText
                    primary={song.title}
                    secondary={
                      <Box>
                        <Typography variant="body2" color="text.secondary">
                          by {song.artist}
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 1, mt: 0.5 }}>
                          <Chip
                            label={`${song.noteCount} notes`}
                            size="small"
                            variant="outlined"
                          />
                          <Chip
                            label={formatDuration(song.duration)}
                            size="small"
                            variant="outlined"
                          />
                        </Box>
                      </Box>
                    }
                  />
                  <ListItemSecondaryAction>
                    <IconButton
                      edge="end"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteSong(song.id);
                      }}
                    >
                      <Delete />
                    </IconButton>
                  </ListItemSecondaryAction>
                </ListItem>
              ))}
            </List>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowLibrary(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default SongUpload;
