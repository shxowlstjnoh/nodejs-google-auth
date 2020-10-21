var db = require('../lib/db');
const bcrypt = require('bcrypt');
const { request, response } = require('express');
const shortid = require('shortid');
const saltRounds = 10;

module.exports = function (app) {
    var passport = require('passport');
    var LocalStrategy = require('passport-local').Strategy;
    var GoogleStrategy = require('passport-google-oauth').OAuth2Strategy;

    app.use(passport.initialize());
    app.use(passport.session());
    passport.serializeUser(function (user, done) {
        // 로그인에 성공한 것을 session store에 저장하는 역할
        // 로그인함수에서도 콜이 됨
        // console.log('serializeUser', user);
        done(null, user.id); //사용자 식별자
    });

    passport.deserializeUser(function (id, done) {
        //브라우저 refresh할때마다 호출됨
        var user = db.get('users').find({ id: id }).value();
        // console.log('deserializeUser', id, user);
        done(null, user);
    });

    passport.use(
        new LocalStrategy(
            {
                usernameField: 'email',
                passwordField: 'pwd',
            },
            function (email, password, done) {
                console.log('LocalStrategy', email, password);
                var user = db.get('users').find({ email: email }).value();
                if (user) {
                    bcrypt.compare(password, user.password, function (err, result) {
                        if (result) {
                            return done(null, user, { message: 'Welcome' });
                        } else {
                            return done(null, false, { message: 'Incorrect Password.' });
                        }
                    });
                } else {
                    return done(null, false, { message: 'Incorrect Email.' });
                }
            }
        )
    );

    var googleCredentials = require('../config/google.json');
    passport.use(
        new GoogleStrategy(
            {
                clientID: googleCredentials.web.client_id,
                clientSecret: googleCredentials.web.client_secret,
                callbackURL: googleCredentials.web.redirect_uris[0],
            },
            function (accessToken, refreshToken, profile, done) {
                // console.log('GoogleStrategy', accessToken, refreshToken, profile);
                var email = profile.emails[0].value;
                var user = db.get('users').find({ email: email }).value();
                if (user) {
                    user.googleId = profile.id;
                    db.get('users').find({ id: user.id }).assign(user).write();
                } else {
                    user = {
                        id: shortid.generate(),
                        email: email,
                        displayName: profile.displayName,
                        googleId: profile.id,
                    };
                    db.get('users').push(user).write();
                }
                return done(null, user);
            }
        )
    );

    app.get(
        '/auth/google',
        passport.authenticate('google', {
            scope: ['https://www.googleapis.com/auth/plus.login', 'email'],
        })
    );

    app.get(
        '/auth/google/callback',
        passport.authenticate('google', {
            failureRedirect: '/auth/login',
        }),
        function (req, res) {
            res.redirect('/');
        }
    );

    return passport;
};
