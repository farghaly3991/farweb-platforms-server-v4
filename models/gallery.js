const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');


const gallery = new mongoose.Schema({
    url: {
        type: String,
        required: true,
    },
    number: {
        type: Number,
        required: true
    },
});



const Users = new mongoose.model('gallery', gallery);
// Users.find().then(async (users) => {
//     if(users.length == 0 ) {
//         await Users.insertMany(firstUsers);
//     }
// })
module.exports = Users;