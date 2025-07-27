import React, { useState } from 'react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import VocalTrainer from './components/VocalTrainer';
import SongUpload from './components/SongUpload';
import './App.css';

const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#6366f1',
    },
    secondary: {
      main: '#f59e0b',
    },
    background: {
      default: '#0f172a',
      paper: '#1e293b',
    },
  },
});

function TabPanel({ children, value, index, ...other }) {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`tabpanel-${index}`}
      aria-labelledby={`tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
    </div>
  );
}

function App() {
  const [selectedSong, setSelectedSong] = useState(null);
  const [currentTab, setCurrentTab] = useState(0);

  const handleTabChange = (event, newValue) => {
    setCurrentTab(newValue);
  };

  const handleSongSelect = (song) => {
    setSelectedSong(song);
    if (song) {
      setCurrentTab(1); // Switch to practice tab when song is selected
    }
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Typography variant="h3" component="h1" align="center" gutterBottom>
          Vocal Trainer
        </Typography>
        <Typography variant="h6" align="center" color="text.secondary" gutterBottom>
          Learn to sing your favorite songs
        </Typography>

        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
          <Tabs value={currentTab} onChange={handleTabChange} centered>
            <Tab label="Upload Songs" />
            <Tab label="Practice" disabled={!selectedSong} />
            <Tab label="Random Note Practice" />
          </Tabs>
        </Box>

        <TabPanel value={currentTab} index={0}>
          <SongUpload onSongSelect={handleSongSelect} selectedSong={selectedSong} />
        </TabPanel>

        <TabPanel value={currentTab} index={1}>
          <VocalTrainer selectedSong={selectedSong} />
        </TabPanel>

        <TabPanel value={currentTab} index={2}>
          <VocalTrainer practiceRandomNotes={true} />
        </TabPanel>
      </Container>
    </ThemeProvider>
  );
}

export default App;
