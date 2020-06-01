'use strict';

const express = require('express');
const mongo = require('mongodb');
const mongoose = require('mongoose');
const cors = require('cors');
const app = express();
const bodyParser = require('body-parser');

mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true }); 
var db = mongoose.connection;
db.on("error", console.error.bind(console, "connection error:"));
db.once("open", function() {
  console.log("Connection Successful!");
});
app.use(cors());

// bodyParser
app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());

app.use(express.static('public'));
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});

/**** My solution ****/
// Database
  // Create a schema and a model
  const Schema = mongoose.Schema;
  const userSchema = new Schema({
    username:  String,
    count: {type: Number, default: 0},
    log: [{description: String, duration: Number, date: String}]
  });
  const User  = mongoose.model('User', userSchema);

  // routes
  // create a new user
  app.post("/api/exercise/new-user", function(req, res) {
    if (mongoose.connection.readyState === 1) {
      const entry = new User({username: req.body.username});
      entry.save(function(error, data){});
      res.json({
        username: req.body.username,
        _id: entry._id
      });
    }
  });

  // get an array of all users
  app.get("/api/exercise/users", function(req, res) {
     User.find({}).then(function (users) {
     res.send([users]);
   });
  });

  // add an exercise
  app.post("/api/exercise/add", function(req, res) {
    let date = req.body.date;
    if (!date) {
      const currentDay = new Date();
      const dd = String(currentDay.getDate());
      const mm = String(currentDay.getMonth() + 1);
      const yyyy = currentDay.getFullYear();
      date = yyyy + '-' + mm + '-' + dd;
      if (dd < 10) {
        date = yyyy + '-' + mm + '-' + '0' + dd;
      } else if (mm < 10) {
        date = yyyy + '-' + '0' + mm + '-' + dd;
      } else if (dd <10 && mm < 10) {
        date = yyyy + '-' + '0' + mm + '-' + '0' + dd;
      }
    }
    let formattedDate = new Date(date.split("-")[0], date.split("-")[1]-1, date.split("-")[2]);
   
    User.findOneAndUpdate({ _id: req.body.userId }, 
       { $inc: { count: 1 } },
       {new: true },
        function (error, success) {
          if (error) {
              console.log(error);
          } else {
              console.log(success);
          }
      });
    
     User.findOneAndUpdate({ _id: req.body.userId }, 
       { $push: { log: {description: req.body.description, duration: req.body.duration, date: formattedDate} } },
        function (error, success) {
          if (error) {
              console.log(error);
          } else {
            res.json({
               _id: success._id,
              description: req.body.description,
              duration: parseInt(req.body.duration),
              date: formattedDate.toDateString(),
              username: success.username
            });
          }
      });
    
   // res.redirect("/api/exercise/users");
  });

  //get user's log
  app.get("/api/exercise/log", function(req, res) {
    // api/exercise/log?userId=...&from=...&to=...&limit...
    User.findById({ _id: req.query.userId }).then(function (user) {
      let log = user.log;
      
      if (req.query.from && req.query.to) {
        let fromDate = new Date(req.query.from.split("-")[0], req.query.from.split("-")[1]-1, req.query.from.split("-")[2]);
        let toDate = new Date(req.query.to.split("-")[0], req.query.to.split("-")[1]-1, req.query.to.split("-")[2]);
        const selectedLogs = [];
        for (let i = 0; i < log.length; i++) {
          if (log[i].date >= fromDate && log.date <= toDate) {
            selectedLogs.push(log[i]);
          }
        }
        log = selectedLogs;
        
        if (req.query.limit) {
          log = selectedLogs.slice(0, parseInt(req.query.limit)+1)
        }
      }
      
      
      res.json({
        _id: user._id,
        username: user.username,
        count: user.count,
        log: log
      });
      
      
      
   });
  });


/*********************/

app.listen(process.env.PORT || 3000, () => {
  console.log('Node.js listening ...');
});
