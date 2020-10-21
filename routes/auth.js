var express = require('express');
var router = express.Router();
var path = require('path');
var fs = require('fs');
var sanitizeHtml = require('sanitize-html');
var template = require('../lib/template.js');
const { format } = require('path');
var db = require('../lib/db');
var shortid = require('shortid');
const bcrypt = require('bcrypt');
const saltRounds = 10;

module.exports = function (passport) {
    router.get(`/login`, function (request, response) {
        var fmsg = request.flash();
        var feedback = '';
        if (fmsg.error) {
            feedback = fmsg.error[0];
        }
        var title = 'WEB - auth';
        var list = template.list(request.list);
        var html = template.HTML(
            title,
            list,
            `
          <div style="color:red;">${feedback}</div>
          <form action="/auth/login" method="post">
            <p><input type="text" name="email" placeholder="email"></p>
            <p><input type="text" name="pwd" placeholder="password"></p>
            <p>
              <input type="submit">
            </p>
          </form>
        `,
            ''
        );
        response.send(html);
    });

    router.post(
        '/login',
        passport.authenticate('local', { failureRedirect: '/auth/login', failureFlash: true, successFlash: true }),
        function (request, response) {
            request.session.save(function () {
                response.redirect('/');
            });
        }
    );

    router.get(`/register`, function (request, response) {
        var fmsg = request.flash();
        var feedback = '';
        if (fmsg.error) {
            feedback = fmsg.error[0];
        }
        var title = 'WEB - register';
        var list = template.list(request.list);
        var html = template.HTML(
            title,
            list,
            `
          <div style="color:red;">${feedback}</div>
          <form action="/auth/register" method="post">
            <p><input type="text" name="email" placeholder="email" value="egoing777@gmail.com"></p>
            <p><input type="text" name="pwd" placeholder="password" value="111111"></p>
            <p><input type="text" name="pwd2" placeholder="password" value="111111"></p>
            <p><input type="text" name="displayName" placeholder="display name" value="egoing"></p>
            <p>
              <input type="submit" value="register">
            </p>
          </form>
        `,
            ''
        );
        response.send(html);
    });

    router.post(`/register`, function (request, response) {
        var post = request.body;
        var email = post.email;
        var pwd = post.pwd;
        var pwd2 = post.pwd2;
        var displayName = post.displayName;
        if (pwd !== pwd2) {
            request.flash('error', 'Password must same!!');
            response.redirect('/auth/register');
        } else {
            bcrypt.hash(pwd, saltRounds, function (err, hash) {
                var user = db.get('users').find({ email: email }).value();
                if (user) {
                    user.password = hash;
                    user.displayName = displayName;
                    db.get('users').find({ id: user.id }).assign(user).write();
                } else {
                    user = { id: shortid.generate(), email: email, password: hash, displayName: displayName };
                    db.get('users').push(user).write();
                }
                request.login(user, function (err) {
                    response.redirect(`/`);
                });
            });
        }
    });

    router.get(`/logout`, function (request, response) {
        request.logout();
        response.redirect('/');
    });
    return router;
};
