const Users = require("../models/users.js");
const Messages = require("../models/messages");
const {server} = require("../app.js");
const { uploadFile, uploadImage } = require("../middlewares/file_upload");
const cloudinary = require('cloudinary').v2;
require("dotenv").config();

exports.sendMessage = async(req, res) => {
    try {
        const newMess = await Messages(req.body).save();
        if(newMess) {
            res.json({sent: true});
        } else throw("الرسالة لم ترسل حاول مرة اخرى");
    }
    catch(err) {
        console.log(err);
        res.json({err});
    }
}

exports.getMessages = async(req, res) => {
    try {
        const room = req.params.userId;
        const messages = await Messages.find({room}).sort({date: -1}).skip(+req.params.skip).limit(+req.params.limit);
        res.json({messages});
    }
    catch(err) {
        console.log(err);
        res.json({err});
    }
}

exports.getUnseenMessagesNumber = async(req, res) => {
    try {
        const room = req.params.userId;
        const user = await Users.findOne({_id: room});
        const lastSeen = user.lastSeen;
        const messages = await Messages.find({room, date: {$gt: lastSeen}}).count();
        res.json({messages});
    }
    catch(err) {
        console.log(err);
        res.json({err});
    }
}

exports.getUnseenUsersMessagesNumber = async(req, res) => {
    try {
        const users = await Users.find();
        const msgs = users.filter(user => new Date(user.lastSeen).getTime() < new Date(user.sent).getTime());
        res.json({messages: msgs.length});
    }
    catch(err) {
        console.log(err);
        res.json({err});
    }
}

// exports.getUnseenMessagesNumberForAdmin = async(req, res) => {
//     try {
//         const room = req.params.userId;
//         const user = await Users.findOne({_id: room});
//         const lastSeen = user.lastSeenAdmin;
//         const messages = await Messages.find({room, date: {$gte: lastSeen}}).count();
//         res.json({messages});
//     }
//     catch(err) {
//         console.log(err);
//         res.json({err});
//     }
// }

exports.uploadChatFile = async(req, res) => {
    try {
        const message = req.body;
        // console.log(message);
        // return;
        if(req.files) {
            const file = req.files.file;
            const url = await uploadFile(file, file.name);
            if(!url) throw("الصورة لم ترفع حاول مرة أخرى");
            message["message"] = url;
        }
        // const newMessage = await new Messages({...message}).save();
        res.json({message});
        
    }
    catch(err) {
        console.log(err);
        res.json({err});
    }
}

exports.isSeen = async(req, res) => {
    try {
        const peer = req.params.peer;
        const user = await Users.findOne({_id: req.params.userId});
        let seen = false;
        if(peer == "user") {
            seen = user.lastSeenAdmin < new Date().getTime();
        }
        else if(peer == "admin") {
            seen = user.lastSeen < new Date().getTime();
        }
        res.json({seen});
    }
    catch(err) {
        console.log(err);
        res.json({err});
    }
}
/////////////////////////////////////////////////////
exports.chatSocket = async(io, socket) => {
    socket.on("joinAdminRoom", () => {
        socket.join("admin");
    });
    ////////////////////////
    socket.on("joinRoom", (room) => {
        socket.join(room);
    });
    ////////////////////////
    socket.on("sendMessageAdmin", async(message) => {
        io.to("admin").to(message.room).emit("receiveMessage", message);
        await new Messages({...message}).save();
        await Users.updateOne({_id: message.room}, {received: new Date()});
    });
    /////////////////////
    socket.on("sendMessage", async(message) => {
        io.to(message.room).to("admin").emit("receiveMessage", message);
        await Messages({...message}).save();
        await Users.updateOne({_id: message.room}, {sent: new Date()});
    });
    ////////////////////
    socket.on("getOnline", () => {
        const rooms = Object.keys(io.sockets.adapter.rooms).filter(room => !room.includes("AAA"));
        socket.emit("onlineUsers", rooms);
    });
    ////////////////////
    socket.on("getAdminOnline", () => {
        const online = Object.keys(io.sockets.adapter.rooms).includes("admin");
        socket.emit("adminOnline", online);
    });
    //////////////////////
    socket.on("lastSeen", async(userId) => {
        io.to("admin").emit("seen", userId);
        await Users.updateOne({_id: userId}, {lastSeen: new Date()});
    });
    //////////////////////
    socket.on("lastSeenAdmin", async(userId) => {
        io.to(userId).emit("seen", userId);
        await Users.updateOne({_id: userId}, {lastSeenAdmin: new Date()});
    });
    //////////////////////
    socket.on("deleteMsg", async(data) => {
        io.emit("msgDeleted", data.code);
        await Messages.deleteOne({code: data.code});
        if(data.mess.includes("imageId_")) {
            const id = 'imageId_' + data.mess.split("imageId_")[1];
            cloudinary.uploader.destroy(id, (err, result) => {
                if(err) reject(err);
            });
        }
    });
    socket.on("disconnect", (err) => {
        setTimeout(() => socket.emit("reconnect"), 4000);
    });
}