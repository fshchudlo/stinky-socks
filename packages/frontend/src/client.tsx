import React from 'react';
import { hydrateRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import HomePage from './components/HomePage';

const root = document.getElementById('root');
if (root) {
    hydrateRoot(
        root,
        <BrowserRouter>
            <HomePage />
        </BrowserRouter>
    );
} 