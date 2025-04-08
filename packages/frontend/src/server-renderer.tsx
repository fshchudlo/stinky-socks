import React from 'react';
import { renderToString } from 'react-dom/server';
import { StaticRouter } from 'react-router-dom/server';
import HomePage from './components/HomePage';

export const renderApp = (url: string) => {
    const html = renderToString(
        <StaticRouter location={url}>
            <HomePage />
        </StaticRouter>
    );

    return `
        <!DOCTYPE html>
        <html>
            <head>
                <title>Dashboard</title>
                <meta charset="UTF-8" />
                <meta name="viewport" content="width=device-width, initial-scale=1.0" />
            </head>
            <body>
                <div id="root">${html}</div>
                <script type="module" src="/client.js"></script>
            </body>
        </html>
    `;
}; 