import express from 'express';
import passport from 'passport';
import {Strategy as GitHubStrategy} from 'passport-github2';
import {AppConfig} from "./app.config";
import {enrichUserSessionData} from "./enrichUserSessionData";
import rateLimit from 'express-rate-limit';
import session from 'express-session';
import { renderApp } from './server-renderer';
import path from 'path';
import { getProjectsHandler, getRepositoriesHandler } from './routes/projects';

const app = express();

const clientId = AppConfig.GITHUB_APP_CLIENT_ID!;
const clientSecret = AppConfig.GITHUB_APP_CLIENT_SECRET!;

passport.use(new GitHubStrategy({
    clientID: clientId,
    clientSecret: clientSecret,
    callbackURL: `http://localhost:${AppConfig.WEB_UI_PORT}/auth/github/callback`
}, enrichUserSessionData));

passport.serializeUser((githubProfile: any, done: any) => {
    done(null, githubProfile);
});

passport.deserializeUser((githubProfile: any, done: any) => {
    done(null, githubProfile);
});

app.use(rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 100
}));

app.use(session({
    secret: AppConfig.SESSION_SECRET,
    resave: true,
    saveUninitialized: true,
    cookie: {
        secure: process.env.NODE_ENV === 'production',
        httpOnly: true
    }
}));
app.use(passport.initialize());
app.use(passport.session());

// Serve static files from the public directory
app.use(express.static(path.join(__dirname, '../dist')));

app.get('/auth/github',
    passport.authenticate('github', {scope: ['user:email', 'read:org', 'repo']})
);

app.get('/auth/github/callback',
    passport.authenticate('github', {failureRedirect: '/'}),
    (req, res) => {
        res.redirect('/');
    }
);

app.get('/logout', (req, res, next) => {
    (<any>req).logout((err: any) => {
        if (err) {
            return next(err);
        }
        res.redirect('/');
    });
});

app.get('/projects', getProjectsHandler);

app.get('/repositories', getRepositoriesHandler);

app.get('/', (req, res) => {
    if (req.isAuthenticated()) {
        res.send(renderApp(req.url));
    } else {
        res.send('<a href="/auth/github">Login with GitHub</a>');
    }
});

app.listen(AppConfig.WEB_UI_PORT, () => {
    console.log(`Server is running on http://localhost:${AppConfig.WEB_UI_PORT}`);
});