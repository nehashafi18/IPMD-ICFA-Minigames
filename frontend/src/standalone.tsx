import React from 'react';
import ReactDOM from 'react-dom/client';
import MiniGame from './components/miniGames/src/MiniGames';
import './components/miniGames/src/index.css';
import './components/miniGames/src/minigame.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <MiniGame />
  </React.StrictMode>
);
