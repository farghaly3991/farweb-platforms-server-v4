const mongoose = require("mongoose");
const fs = require('fs-extra');
const bcrypt = require('bcryptjs');
const path = require("path")

const Exams = require('./models/unit-exams/exams');
const Users = require('./models/users');
const Tasks = require('./models/tasks');
const Sections = require('./models/sections');
const Lessons = require('./models/lessons');
const SolutionModels = require('./models/unit-exams/solutionModels');
const databases = {Exams, Tasks, Sections, Lessons, SolutionModels}

const firstUsers = [
    {
        email: "mr.teacher@gmail.com",
        fullname: "Mr Teacher",
        stage: "6",
        phone: "01012343746",
        parentPhone: "01012343746",
        address: "teacher",
        role: 1,
        confirmed: 1,
        admin: true,
        password: bcrypt.hashSync('teacher_2202', 10)
    },
    {
        email: "miserable.farghaly93@gmail.com",
        fullname: "Mohamamd Farghaly",
        stage: "6",
        phone: "01012343746",
        parentPhone: "01012343746",
        address: "teacher",
        role: 1,
        confirmed: 1,
        admin: true,
        password: bcrypt.hashSync('farghaly_3991', 10)
    },
    {
        email: "mohamed.sameer@gmail.com",
        fullname: "Mohamed Sameer",
        stage: "6",
        phone: "01012343746",
        parentPhone: "01012343746",
        address: "cairo",
        role: 0,
        confirmed: 0,
        admin: false,
        password: bcrypt.hashSync('123456', 10)
    },
  ];
  ///////////////////////////////////////////////////////////////////////////////////////////////
  ///////////////////////////////////////////////////////////////////////////////////////////////
  
  exports.insertFirstData = async() => {
    mongoose.connection.once("open", () =>
  {
    mongoose.connection.db.listCollections().toArray(async function (err, collections) {
      if (err) {
        console.log(err);
        return;
      }
      let usersColl = collections.find(data => data.name === 'users');
      if (usersColl === undefined || usersColl.length === 0) {
        let newUsers = await Users.insertMany(firstUsers);
      }
      ///////////////////////////////////
      let sectionsColl = collections.find(data => data.name === 'sections');
      if (sectionsColl === undefined || sectionsColl.length === 0) {
        await restoreData('Sections');
      }
      ///////////////////////////////////
      let lessonsColl = collections.find(data => data.name === 'lessons');
      if (lessonsColl === undefined || lessonsColl.length === 0) {
        await restoreData('Lessons');
      }
      ///////////////////////////////////
      let examsColl = collections.find(data => data.name === 'unit_exams');
      if (examsColl === undefined || examsColl.length === 0) {
        await  restoreData('Exams');
      }
      ///////////////////////////////////
      let tasksColl = collections.find(data => data.name === 'tasks');
      if (tasksColl === undefined || tasksColl.length === 0) {
        await restoreData('Tasks');
      }
      ///////////////////////////////////
      let modelsColl = collections.find(data => data.name === 'unit_solutionmodels');
      if (modelsColl === undefined || modelsColl.length === 0) {
       await restoreData('SolutionModels');
      }
    });
  }).on("error", (err) => console.warn(err));
}









async function restoreData(collection) {
  const filePath = path.join(__dirname, `databases/${collection}.json`);
  if(!fs.existsSync(filePath)) return;
  const jsonFileData = fs.readFileSync(filePath, "utf8");
  const jsonData = JSON.parse(jsonFileData).map(sm => {
    return sm;
  });
  // const deleted =  awaited
  const added = await databases[collection].insertMany(jsonData);
  if(!added) return;
}