import express from 'express';
import passport from 'passport';
import {Strategy as GitHubStrategy} from 'passport-github2';
import {AppConfig} from "./app.config";
import {enrichUserSessionData, StinkySocksUserProfile} from "./enrichUserSessionData";

const app = express();
const PORT = process.env.PORT || 3000;

const clientId = AppConfig.GITHUB_APP_CLIENT_ID!;
const clientSecret = AppConfig.GITHUB_APP_CLIENT_SECRET!;

passport.use(new GitHubStrategy({
    clientID: clientId,
    clientSecret: clientSecret,
    callbackURL: "http://localhost:3000/auth/github/callback"
}, enrichUserSessionData));

passport.serializeUser((githubProfile: StinkySocksUserProfile, done: Function) => {
    done(null, githubProfile);
});

passport.deserializeUser((githubProfile: StinkySocksUserProfile, done: Function) => {
    done(null, githubProfile);
});

app.use(require('express-session')({secret: AppConfig.SESSION_SECRET, resave: true, saveUninitialized: true}));
app.use(passport.initialize());
app.use(passport.session());

app.get('/auth/github',
    passport.authenticate('github', {scope: ['user:email', 'read:org', 'repo']})
);

app.get('/auth/github/callback',
    passport.authenticate('github', {failureRedirect: '/'}),
    (req, res) => {
        res.redirect('/');
    }
);

app.get('/', (req, res) => {
    if (req.isAuthenticated()) {
        res.send(`Hello ${req.user.username}. You belong to ${req.user.organizations.length} organizations and have ${req.user.repositories.length} repositories.`);
    } else {
        res.send('<a href="/auth/github">Login with GitHub</a>');
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});