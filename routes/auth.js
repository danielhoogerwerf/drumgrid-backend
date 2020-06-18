const express = require("express");
const passport = require("passport");
const router = express.Router();
const bcrypt = require("bcrypt");
const mailPassword = require("../nodemailer/mailPassword");

// Models
const User = require("../models/User");
const { createIndexes } = require("../models/User");

// Routes
router.post("/login", (req, res, next) => {
  passport.authenticate("local", (err, user, info) => {
    if (err) {
      return next(err);
    }
    if (!user) {
      return res.status(401).json({ message: "Username or password incorrect" });
    }
    req.logIn(user, function (err) {
      if (err) {
        return next(err);
      }
      return res.status(200).json(user);
    });
  })(req, res, next);
});

router.post("/signup", (req, res, next) => {
  if (!req.body.username || !req.body.password || !req.body.email) {
    return res.status(400).json({
      message: "Please provide a username, a password and an email address",
    });
  }

  const username = req.body.username.replace(/^\s+/g, "").replace(/[^A-Za-z0-9_\s]+/g, "_");
  const password = req.body.password;
  const email = req.body.email.replace(/[^A-Za-z0-9_@\.\-!]+/g, "");

  User.findOne({ email })
    .then((mail) => {
      if (mail !== null) {
        return res.status(409).json({ error: "The email address already exists" });
      }

      User.findOne({ username })
        .then((user) => {
          if (user !== null) {
            return res.status(409).json({ error: "The username already exists" });
          }

          bcrypt
            .hash(password, 10)
            .then((hash) => {
              User.create({
                username: username,
                email: email,
                password: hash,
              })
                .then((user) => {
                  res.status(200).json({ user });
                })
                .catch((e) => res.status(500).json({ error: `an error occured: ${e}` }));
            })
            .catch((e) => res.status(500).json({ error: `an error occured: ${e}` }));
        })
        .catch((e) => res.status(500).json({ error: `an error occured: ${e}` }));
    })
    .catch((e) => res.status(500).json({ error: `an error occured: ${e}` }));
});

// POST route for forgot password
router.post("/forgotpassword", (req, res, next) => {
  if (!req.body.email) {
    return res.status(400).json({
      message: "Please provide an email address",
    });
  }

  if (!req.header("user-agent").includes("Mozilla")) {
    return res.status(403).json({
      error: "Not authorised",
    });
  }

  const email = req.body.email.replace(/[^A-Za-z0-9_@\.\-!]+/g, "");

  User.findOne({ email })
    .then((user) => {
      if (user) {
        mailPassword(user._id, user.email)
          .then((result) => {
            if (!result.responseCode) {
              res.status(200).json({ message: "OK" });
            } else {
              res.status(500).json({ error: `an error occured: ${result.response}` });
            }
          })
          .catch((err) => res.status(500).json({ error: `an error occured: ${err}` }));
      } else {
        res.status(400).json({ error: "Email address not found" });
      }
    })
    .catch((e) => res.status(500).json({ error: `an error occured: ${e}` }));
});

router.get("/isloggedin", (req, res) => {
  if (!req.isAuthenticated()) {
    return res.status(200).json({ message: "Please authenticate" });
  }
  res.status(200).json(req.user);
});

router.get("/logout", (req, res) => {
  if (!req.isAuthenticated()) {
    return res.status(403).json({ message: "Please authenticate" });
  }

  req.logout();
  res.status(200).json({ message: "User logged out succesfully" });
});

module.exports = router;
