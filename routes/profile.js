const express = require("express");
const passport = require("passport");
const router = express.Router();

// Models
const User = require("../models/User");
const Profile = require("../models/Profile");

// Routes

// POST - changeusername
router.post("/changeusername", (req, res) => {
  if (!req.isAuthenticated()) {
    res.status(403).json({ message: "please authenticate" });
    return;
  }

  const username = req.body.username;
  User.findOne({ username }).then((user) => {
    if (user !== null) {
      return res.status(409).json({ message: "The username already exists" });
    }

    User.updateOne({ _id: req.user.id }, { username })
      .then((result) => res.status(200).json(result))
      .catch((e) => res.status(500).json({ message: `An error occured: ${e}` }));
  });
});

// POST - changepassword
router.post("/changepassword", (req, res) => {
  if (!req.isAuthenticated()) {
    return res.status(403).json({ message: "Please authenticate" });
  }

  const password = req.body.password;
  if (!password) {
    return res.status(400).json({ message: "Password cannot be blank" });
  }

  bcrypt.hash(password, 10).then((hash) => {
    User.updateOne({ _id: req.user.id }, { password: hash })
      .then(() => {
        res.status(200).json({ message: "Password updated" });
      })
      .catch((err) => {
        res.status(500).json({ message: `Something went wrong: ${err}` });
      });
  });
});

// POST - savepattern
router.post("/savepattern", (req, res) => {
  if (!req.isAuthenticated()) {
    res.status(403).json({ message: "please authenticate" });
    return;
  }

  const patternName = req.body.name.replace(/^\s+/g, "").replace(/[^A-Za-z0-9_\-!\s]+/g, "_");
  const patternData = req.body.data;
  console.log(patterName, patternData);

  Profile.create({
    name: patternName,
    data: patternData,
  })
    .then((result) => {
      User.updateOne({ _id: req.user.id }, { $addToSet: { patterns: result.id } });
    })
    .then(() => res.status(200).json({ message: "OK" }))

    // User.findOne({ _id: req.user.id })
    //   .populate("patterns")
    //   .then((user) => {
    //     res
    //       .status(200)
    //       .json(user)
    //   if (user.data.)
    //   Profile.create({
    //     name: patternname,
    //     data: patterndata,
    //     owner: user.id
    //   });
    // })
    // .then((result) => res.status(200).json(result))
    .catch((e) => res.status(500).json({ message: `An error occured: ${e}` }));
});
// });

// GET - loadpattern

// POST - delpattern
router.post("/delpattern", (req, res) => {
  if (!req.isAuthenticated()) {
    res.status(403).json({ message: "please authenticate" });
    return;
  }

  const patternname = req.body.name;
  console.log(patternname);

  User.findOne({ _id: req.user.id })
    .popupate("patterns")
    .then((result) => {
      console.log(result);
    });

  // Profile.deleteOne({ _id: req.user.id }, { name: patternname, data: patterndata, owner: req.user.id })
  //   .then((result) => res.status(200).json(result))
  //   .catch((e) => res.status(500).json({ message: `An error occured: ${e}` }));
});

module.exports = router;
