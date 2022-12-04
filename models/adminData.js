const mongoose = require('mongoose');

const adminData = new mongoose.Schema({
  admin: {
    type: Number,
    default: 1,
  },
  instructions: {
    type: String,
    default: `الألتزام بمواعيد الامتحان, لكل امتحان تاريخ لانتهائه, متابعة الدروسالدروس محمية ويوحد علامة مائية ببيانات الطالب في حالة تسريبه`
  },
  siteName: {
    type: String,
    default: 'Site name'
  },
  name: {
    type: String,
    default: 'Teacher Nname'
  },
  phone: {
    type: String,
    default: 'Phone'
  },
  address: {
    type: String,
    default: 'Location'
  },
  career: {
    type: String,
    default: 'Career'
  },
  facebook: {
    type: String,
    default: ''
  },
  email: {
    type: String,
    default: ''
  },
  whatsapp: {
    type: String,
    default: ''
  },
  telegram: {
    type: String,
    default: ''
  },
  youtubeSecret: {
    type: String,
    default: ''
  },
  cashNumber: {
    type: String,
    default: '0100000000'
  },
  color: {
    type: String,
    default: 'linear-gradient(to bottom right, #072687b3, #69A00Fd1)'
  },
  language: {
    type: String,
    default: 'arabic'
  },
  nextExamInstructions: {
    type: String,
    default: ''
  },
  payMethod: {
    type: String,
  },
  image1: {
    type: String,
    default: 'https://education.ec.europa.eu/sites/default/files/styles/eac_ratio_16_9_xl/public/2021-12/Planning%20your%20studies.jpg?h=140710cd&itok=EDqz50YE'
  },
  ad: {
    type: String,
    default: ''
  },
  // image2: {
  //   type: String,
  //   default: ''
  // },
  // image3: {
  //   type: String,
  //   default: ''
  // },
  showStudentsCount: {
    type: Boolean,
    default: true
  },
  activateStudentOneRegistration: {
    type: Boolean,
    default: false,
  },
  deactiveStudentConfirmation: {
    type: Boolean,
    default: true,
  },
  watermark: {
    type: Boolean,
    default: false,
  },
  manual: {
    type: Boolean,
    default: false,
  },
  lessonCodes: {
    type: Boolean,
    default: false,
  },
  allLessonsCode: {
    type: Boolean,
    default: true,
  },
  randomQuestions: {
    type: Boolean,
    default: true,
  },
  renewHost: {
    type: Boolean,
    default: false,
  },
  videoStorage: {
    type: Boolean,
    default: false,
  },
  preventBrowserForStudents: {
    type: Boolean,
    default: false,
  },
  gotoAppText: {
    type: String,
    default: "",
  },
  chat: {
    type: Boolean,
    default: false,
  },
  multiVideos: {
    type: Boolean,
    default: false,
  },
  autoFinishExam: {
    type: Boolean,
    default: false,
  },
  adjust: {
    type: Boolean,
    default: false,
  }
});

module.exports = mongoose.model('adminData',adminData);