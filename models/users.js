const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');


const usersSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true
    },
    fullname: {
        type: String,
        required: true
    },
    stage: {
        type: String,
        required: true
    },
    confirmed: {
        type: Number,
        required: true,
        default: 0
    },
    
    admin: {
        type: Boolean,
        default: false
    },
    phone: {
        type: String,
        required: true
    },
    parentPhone: {
        type: String,
        // required: true
    },
    address: {
        type: String,
        // required: true
    },
    role: {
        type: Number,
        required: true,
        default: 0
    },
    registered: {
        type: Boolean,
        default: false
    },
    lastTime: {
        type: Number,
        defualt: new Date().getTime()
    },
    units: Array,
    lastSeen: Number,
    lastSeenAdmin: Number,
    sent: Number,
    received: Number,
});



const Users = new mongoose.model('users', usersSchema);
// Users.find().then(async (users) => {
//     if(users.length == 0 ) {
//         await Users.insertMany(firstUsers);
//     }
// })
module.exports = Users;