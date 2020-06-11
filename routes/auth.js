const express = require("express");
const passport = require("passport");
const router = express.Router();
const bcrypt = require("bcrypt");

// Models
const User = require("../models/User");

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
  const username = req.body.username.replace(/^\s+/g, "").replace(/[^A-Za-z0-9_\s]+/g, "_");
  const password = req.body.password;

  console.log(username);
  console.log(password);
  if (!username || !password) {
    return res.status(400).json({ message: "Please provide a username and a password" });
  }

  User.findOne({ username })
    .then((user) => {
      if (user !== null) {
        return res.status(409).json({ message: "The username already exists" });
      }

      bcrypt
        .hash(password, 10)
        .then((hash) => {
          User.create({
            username: username,
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
