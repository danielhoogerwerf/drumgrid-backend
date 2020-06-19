const express = require("express");
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const router = express.Router();

// Models
const User = require("../models/User");
const Profile = require("../models/Profile");

// Routes

// POST - updateprofile
router.post("/updateprofile", (req, res) => {
  if (!req.isAuthenticated()) {
    return res.status(403).json({ message: "Please authenticate" });
  }

  if (!req.body.email) {
    return res.status(400).json({ message: "Email cannot be blank" });
  }

  if (req.user.email === req.body.email) {
    return res.status(200).json({ message: "Email address is the same" });
  }

  const email = req.body.email.toLowerCase().replace(/[^A-Za-z0-9_\-@\.!]+/g, "");
  const password = req.body.password;

  User.findOne({ email }).then((exists) => {
    if (exists) {
      return res.status(200).json({ message: "Email address already exists" });
    } else {
      if (password) {
        bcrypt
          .hash(password, 10)
          .then((hash) => {
            User.updateOne({ _id: req.user.id }, { email, password: hash })
              .then(() => {
                res.status(200).json({ message: "Profile updated" });
              })
              .catch((e) => res.status(500).json({ error: `an error occured: ${e}` }));
          })
          .catch((e) => res.status(500).json({ error: `an error occured: ${e}` }));
      } else {
        User.updateOne({ _id: req.user.id }, { email })
          .then(() => {
            res.status(200).json({ message: "Email updated" });
          })
          .catch((e) => res.status(500).json({ error: `an error occured: ${e}` }));
      }
    }
  });
});

// PUT - updatepattern
router.put("/updatepattern/:id", (req, res) => {
  if (!req.isAuthenticated()) {
    res.status(403).json({ message: "please authenticate" });
    return;
  }
  // const patternData = req.body.data.replace(/^\s+/g, "").replace(/[^A-Za-z0-9_\-!\s]+/g, "_");
  const patternData = req.body.data;
  Profile.updateOne({ _id: req.params.id }, { $set: { data: patternData } })
    .then(() => res.status(200).json({ message: "OK" }))
    .catch((e) => res.status(500).json({ error: `an error occured: ${e}` }));
});

// POST - savepattern
router.post("/savepattern", (req, res) => {
  if (!req.isAuthenticated()) {
    res.status(403).json({ message: "please authenticate" });
    return;
  }

  const patternName = req.body.name.replace(/^\s+/g, "").replace(/[^A-Za-z0-9_\-!\s]+/g, "_");
  const patternData = req.body.data;

  const o_id = mongoose.Types.ObjectId(req.user.id);

  // Check if more than 5 patterns exists and if so refuse to save
  User.aggregate([
    [
      {
        $match: {
          _id: o_id,
        },
      },
      {
        $unwind: {
          path: "$patterns",
        },
      },
      {
        $count: "patterns",
      },
    ],
  ]).then((amount) => {
    if (amount.length > 0 && amount[0].patterns >= 5) {
      res.status(409).json({ error: "too many patterns already stored" });
    } else {
      Profile.create({
        name: patternName,
        data: patternData,
      })
        .then((result) => {
          User.updateOne({ _id: req.user.id }, { $push: { patterns: result._id } })
            .then(() => res.status(200).json({ message: "OK" }))
            .catch((e) => console.log(e));
        })
        .catch((e) => res.status(500).json({ error: `an error occured: ${e}` }));
    }
  });
});

// GET - getpatterns
router.get("/getpatterns", (req, res) => {
  if (!req.isAuthenticated()) {
    res.status(403).json({ message: "please authenticate" });
    return;
  }
  User.findOne({ _id: req.user.id })
    .populate("patterns")
    .then((result) => {
      if (result.patterns) {
        const [...sendData] = result.patterns.map((element) => {
          return { name: element.name, id: element._id };
        });
        res.status(200).json(sendData);
      } else {
        res.status(200).json();
      }
    })
    .catch((e) => res.status(500).json({ error: `an error occured: ${e}` }));
});

// GET - loadpattern
router.get("/loadpattern/:id", (req, res) => {
  if (!req.isAuthenticated()) {
    res.status(403).json({ message: "please authenticate" });
    return;
  }

  User.findOne({ _id: req.user.id })
    .populate("patterns")
    .then((result) => {
      const data = result.patterns.map((element) => {
        return element._id == req.params.id ? element : null;
      });
      const dataIndex = data.findIndex((find) => find);
      dataIndex >= 0 ? res.status(200).json(data[dataIndex]) : res.status(200).json({ error: "No data found" });
    })
    .catch((e) => res.status(500).json({ error: `an error occured: ${e}` }));
});

// POST - delpattern
router.post("/delpattern/:id", (req, res) => {
  if (!req.isAuthenticated()) {
    res.status(403).json({ message: "please authenticate" });
    return;
  }

  Profile.deleteOne({ _id: req.params.id })
    .then(() => {
      User.updateOne({ _id: req.user.id }, { $pull: { patterns: req.params.id } })
        .then(() => res.status(200).json({ message: "OK" }))
        .catch((e) => res.status(500).json({ error: `an error occured: ${e}` }));
    })
    .catch((e) => res.status(500).json({ error: `an error occured: ${e}` }));
});

module.exports = router;
