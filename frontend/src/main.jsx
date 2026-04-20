import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

// StrictMode removed intentionally — it causes double socket init which breaks WebRTC
ReactDOM.createRoot(document.getElementById('root')).render(<App />);
