const express = require("express");
const mongoose = require("mongoose");
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
      .catch((e) => res.status(500).json({ error: `an error occured: ${e}` }));
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

  bcrypt
    .hash(password, 10)
    .then((hash) => {
      User.updateOne({ _id: req.user.id }, { password: hash })
        .then(() => {
          res.status(200).json({ message: "Password updated" });
        })
        .catch((e) => res.status(500).json({ error: `an error occured: ${e}` }));
    })
    .catch((e) => res.status(500).json({ error: `an error occured: ${e}` }));
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
