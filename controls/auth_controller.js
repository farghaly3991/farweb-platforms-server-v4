const bcrypt = require('bcryptjs');
const Users = require('../models/users');
const AdminData = require('../models/adminData');
const Exams = require('../models/unit-exams/exams');
const Sections = require('../models/sections');
const Tasks = require('../models/tasks');
const Lessons = require('../models/lessons');
const SolutionModels = require('../models/unit-exams/solutionModels');
const Solutions = require('../models/unit-exams/solutions');
const Visitors = require('../models/visitors');
const databases = {Exams, Tasks, Sections, Lessons, SolutionModels, Solutions, Visitors, AdminDatas: AdminData, Users}
const jwt = require('jsonwebtoken');
var nodemailer = require('nodemailer');
const fs = require('fs');
const Codes = require("../models/codes");
const LessonsCodes = require("../models/lessons-codes");
const {generateRandomString} = require("../helper-funcs");
const { adjustExams } = require('./adjustments');

function generatePassword() {
    const length = 24;
    let _id = "";
    const chars = ["1","2","3","4","5","6","7","8","9","0","Q","W","E","R","T","Y","U","I","O","P","A","S","D","F","G","H","J","K","L","Z","X","C","V","B","N","M","_","-"]
      for(let i=0; i<length; i++) {
        const index = Math.floor(Math.random() * chars.length);
        _id += chars[index];
      }
      return _id;
    } 

exports.signin = async(req, res) => {
    try {
        const body = req.body;
        const user = await Users.findOne({email: body.email});
        if(user) {
            const matched = bcrypt.compareSync(body.password, user.password);
            if(matched) {
                const adminData = await AdminData.find();
                let activateStudentOneRegistration;
                let deactiveStudentConfirmation;
                if(adminData.length == 0) {
                    activateStudentOneRegistration = false;
                    deactiveStudentConfirmation = true;
                } else {
                    activateStudentOneRegistration = adminData[0].activateStudentOneRegistration;
                    deactiveStudentConfirmation = adminData[0].deactiveStudentConfirmation;
                }
                if(user.registered && user.role == 0 && activateStudentOneRegistration) throw("لقد قمت بالتسجيل مسبقا استخدم نفس المتصفح والجهاز أو تواصل مع المدرس");
                let CONFIG_SECRET = "mohammadFarghalyAliSaadawy";
                if(user.role === 1) CONFIG_SECRET = 'mohammadFarghalyAliSaadawyAdmin';
                const updated = await Users.updateOne({_id: user._id}, {registered: true});

                const token = jwt.sign({email: user.email}, CONFIG_SECRET, {expiresIn: 8000000000000});
                const confirmed = deactiveStudentConfirmation? 1: user.confirmed;
                res.status(200).json({
                    done: true, 
                    token, 
                    email: user.email, 
                    role: user.role, 
                    userId: user._id, 
                    stage: user.stage, 
                    username: user.fullname, 
                    phone: user.phone, 
                    confirmed, 
                    type: user.type
                });
            } else {
                throw('password is incorrect...');
            }
        } else {
            throw('Email is incorrecttt...');
        }
    } catch(err) {
        console.log(err)
        res.json({err: err.message?err.message: err});
    }
}

exports.signup = async(req, res) => {
    try {
        const body = req.body;
        const hashed = bcrypt.hashSync(body.password, 10);
        body.password = hashed
        const newUser = await new Users(body).save();
        const adminData = await AdminData.find();
        let deactiveStudentConfirmation;
        if(adminData.length == 0) {
            deactiveStudentConfirmation = true;
        } else {
            deactiveStudentConfirmation = adminData[0].deactiveStudentConfirmation;
        }
        const token = jwt.sign({email: newUser.email}, 'mohammadFarghalyAliSaadawy', {expiresIn: 80000});
        const confirmed = deactiveStudentConfirmation? 1: newUser.confirmed;
        if(newUser) {res.status(200).json({
            done: true, 
            token, 
            email: newUser.email, 
            role: newUser.role, 
            userId: newUser._id, 
            stage: newUser.stage, 
            username: newUser.fullname, 
            confirmed, 
            type: newUser.type
        })}
        else {throw('sign up failed...')};
    } catch(err) {
        err = err.driver?'this email is already exist': err.message;
        res.json({err: err.message?err.message: err});
    }
}

exports.updateUserData = async(req, res) => {
    try {
        const body = req.body.data;
        const user = await Users.findOne({_id: req.body.id});
        if(!user) throw("المستخدم غير موجود");
        const matched = bcrypt.compareSync(body.oldPassword, user.password);
        if(!matched) throw("كلمة السر غير صحيحة");
        if(body.password) body['password'] = bcrypt.hashSync(body.password, 10);
        const updateuser = await Users.update({_id: req.body.id}, body);
        if(updateuser.n == 0) throw("لم يتم التحديث");
        res.json({updated: true});
    }
    catch(err) {
        res.json({err: err.message? err.message: err});
    }
}

exports.updateUserDataAdmin = async(req, res) => {
    try {
        const data = req.body.data;
        const id = req.body.id;
        if(data.password) {
            data['password'] = bcrypt.hashSync(data.password, 10);
        }
        const updateuser = await Users.updateOne({_id: id}, data);
        if(updateuser.nModified == 0) throw("لم يتم التحديث");
        res.json({updated: true});
    }
    catch(err) {
        res.json({updated: false, err});
    }
}

exports.getuserdata = async(req, res) => {
    const userDatas = await Users.find(req.body);
    const userData = userDatas[0];
    // userData['image1'] = userData.image1.replace("http://", "https://");
    res.status(200).json({userdata: userData});
}

exports.getYoutubeSecret = async(req, res) => {
    const userdata = await AdminData.find();
    res.status(200).json({youtubeSecret: userdata[0].youtubeSecret});
}

// exports.getmessages = async(req, res) => {
//     const messages = await Messages.find({userEmail: req.params.userEmail});
//     res.json({messages});
// }

exports.getUsers = async(req, res) => {
    try {
        let filter = req.body;
        if(filter.units == "") delete filter['units'];
        if(filter.registered == "") delete filter['registered'];
       if(filter.query != "" ) {
        const regex = new RegExp(req.body.query, 'i');
        filter = {...filter, $and: [{$or: [{email: regex}, {fullname: regex}, {phone: regex}, {parentPhone: regex}, {address: regex}]}]}
       }
       delete filter['query'];
        const users = await Users.find(filter).skip(+req.params.skip).limit(+req.params.limit);
        const count = await Users.find(filter).count();
        res.json({users, count});
} catch(err) {
    console.log(err);
    res.json({err, message: ''});
    }
}

exports.getStudentsCount = async(req, res) => {
    try {
        const count = await Users.find({role: 0}).count();
        res.json({count});
} catch(err) {
    res.json({err, message: ''});
    }
}

exports.getStageUsers = async(req, res) => {
    try {
        const users = await Users.find({stage: req.params.stage, role: 0});
        res.json({users});
} catch(err) {
    res.json({message: ''});
    }
}

exports.deleteUser = async(req, res) => {
    try {
        const id = req.params.id;
        const deluser = await Users.deleteOne({_id: id});
        if(deluser.n == 0) throw("user didn't deleted");
        const del = await Solutions.deleteMany({userId: id});
        if(del.n == 0) throw("User's solutions didn't deleted ");
        
} catch(err) {
    res.json({err: err.message?err.message: err});
    }
}

exports.toggleUserRole = async(req, res) => {
    try {
        const id = req.params.id;
        const updateUserRole = await Users.update({_id: id}, {$bit: {role: {xor: 1}}});
        let users = [];
        if(updateUserRole.nModified===1) {
            user = await Users.findOne({_id: id});
        }
        res.json({user});;
} catch(err) {
    res.json({message: 'Ad data problem...'});
    }
}


exports.confirmUser = async(req, res) => {
    try {
        const id = req.params.id;
        const updateUserRole = await Users.update({_id: id}, {$bit: {confirmed: {xor: 1}}});
        let users = [];
        if(updateUserRole.nModified===1) {
             const user = await Users.findOne({_id: id});
             res.json({user});;
        }
} catch(err) {
    res.json({message: 'Ad data problem...'});
    }
}

exports.isConfirmed = async(req, res) => {
    try {
        const user = await Users.findOne({email: req.params.email});
        res.json({confirmed: user.confirmed, stage: user.stage});;
} catch(err) {
    res.json({message: 'Ad data problem...'});
    }
}

exports.resetPassword = async(req, res) => {
    try {
        const email = req.params.email;
        const password = generatePassword();
        const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: "mohammad.farghaly1993@gmail.com",
            pass: 'ntmaxmedfyozclgr'
        }
        });

        const mailOptions = {
        from: 'miserable.farghaly93@gmail.com',
        to: email,
        subject: 'هذه كلمة المرور الجديدة الخاصة بك سجل بها الدخول لتستعيد نشاطك على المنصة ويمكنك تغييرها فيما بعد',
        html: `<h1>${password}</h1>` 
        };

        transporter.sendMail(mailOptions, async function(error, info){
            console.log(info)
        if (error) {
            console.log(error);
            res.json({done: false});
        } else {
            console.log('Email sent: ' + info.response);
            const updated = await Users.updateOne({email}, {password: bcrypt.hashSync(password, 10)});
            if(updated.nModified == 1) 
                res.json({done: true});
            else res.json({done: false});
        }
});
} catch(err) {
    res.json({message: 'Ad data problem...'});
    }
}


exports.backupDatabase = async(req, res) => {
    try {
        // console.log(databases[req.params.collection])
        const data = await databases[req.params.collection].find();
        res.json({data});;
} catch(err) {
    res.json({message: 'Ad data problem...'});
    }
}

exports.restoreDatabase = async(req, res) => {
    try {
        const collection = req.body.collection;
        const jsonFilePath = req.files.jsonFile.tempFilePath;
        const jsonFileData = fs.readFileSync(jsonFilePath, "utf8");
        let jsonData = JSON.parse(jsonFileData);
        const del = await databases[collection].deleteMany();
        if(del) {
            const adminData = await AdminData.findOne({admin: 1});
            if(collection == "Exams" && adminData.adjust) {
                jsonData = await adjustExams(jsonData);
            }
            const added = await databases[collection].insertMany(jsonData);
            if(added) res.json({done: true});
            else res.json({done: false});
        } 
} catch(err) {
    console.log(err)
    res.json({error: 'Ad data problem...'});
    }
}

exports.modifyStudents = async(req, res) => {
    try {
        const students = await Users.find();
        let ok = true;
        for(let i = 0; i < students.length; i++) {
            let newStage =  "1";
            const stage = students[i].stage;
            if(stage == "one") newStage = "4";
            else if(stage == "two") newStage = "5";
            else if(stage == "three") newStage = "6";
            const updated = await Users.updateOne({_id: students[i]._id}, {stage: newStage});
            if(updated.nModified != 1) ok = false; 
        }
        if(ok) res.send("Student are updated successfully");
        else res.send("Problem with one student not updated");
    } catch(e) {
        console.log(e);
        res.send("Probem happened")
    }
}

exports.allowRegister = async(req, res) => {
    try {
        const id = req.params.id;
        const user = await Users.findOneAndUpdate({_id: id}, {registered: false});
        if(user) {
            res.json({done: true, user})
        } else {
            res.json({done: false});
        }
    } catch(e) {
        res.json({done: false})
    }
}


exports.allowAll = async(req, res) => {
    try {
        const update = await Users.updateMany({registered: true}, {registered: false});
        if(update.nModified > 0) {
            res.json({done: true})
        } else {
            res.json({done: false});
        }
    } catch(e) {
        res.json({done: false})
    }
}


exports.unconfirmAll = async(req, res) => {
    try {
        const update = await Users.updateMany({confirmed: 1, role: 0}, {confirmed: 0});
        if(update.nModified > 0) {
            res.json({done: true})
        } else {
            res.json({done: false});
        }
    } catch(e) {
        res.json({done: false})
    }
}

/////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////



exports.addMultiCodes = async(req, res) => {
    try {
        const duration = 30 * 24 * 3600 * 1000;
        const expiration = new Date(new Date().getTime() + duration).toISOString().substring(0, 10);
        const obj = {stage: req.body.stage, section: req.body.section, duration: req.body.duration, expiration, created_at: new Date()};
        const codes = [];
        for(let i = 0; i < req.body.count; i++) {
            codes.push({...obj, code: generateRandomString(8)});
        }
        const newCodes = await Codes.insertMany(codes);
        if(newCodes.length == 0) throw("لم يتم أضافة أى كود");
        res.json({codes: newCodes});
    } catch(err) {
        res.json({err: err.message?err.message: err});
    }
}

exports.getStageCodes = async(req, res) => {
    try {
        const body = req.body;
        let Collec = Codes;
        if(body.lessonId != "") Collec = LessonsCodes;
        /////////////
        const today = new Date().toISOString().substring(0, 10);
        const deleted = await Collec.deleteMany({expiration: {$lt: today}});
        /////////////
        let filter = {stage: body.stage, section: body.section};
        if(body.lessonId != "") filter = {};
        if(body.status != "all") {
            if(body.status == 1) filter['times'] = {$gt: 0};
            else if(body.status == 2) filter['times'] = 0;
        }
        if(body.duration != "0" && body.duration != "") filter['duration'] = body.duration;
        if(body.from && !body.to) filter['expiration'] = {$gte: body.from};
        if(body.to && !body.from) filter['expiration'] = {$lte: body.to};
        if(body.to && body.from) filter['expiration'] = {$lte: body.to, $gte: body.from};
        if(body.username != "") filter['username'] = { $regex: '.*' + body.username + '.*', $options: "i" };
        if(body.code != "") filter['code'] = body.code;
        if(body.section == "all") delete filter['section'];
        if(body.lessonId != "") filter['lessonId'] = body.lessonId;
        const codes = await Collec.find(filter).sort({created_at: -1}).skip(+req.params.skip).limit(+req.params.limit);
        const count = await Collec.find(filter).count();
        res.json({codes, count});
    } catch(err) {
        console.log(err)
        res.json({err: err.message?err.message: err});
    }
}



exports.deleteExpiredCodes = async(req, res) => {
    try {
        // const today = new Date().toISOString().substring(0, 10);
        const deleted = await Codes.deleteMany({_id: {$in: req.body.ids}});
        // if(!deleted || deleted.ok == 0) throw("لم يتم المسح حوال مرة اخرى");
        res.json({done: true});
    } catch(err) {
        res.json({err: err.message?err.message: err});
    }
}


exports.addMultiLessonCodes = async(req, res) => {
    try {
        const duration = 30 * 24 * 3600 * 1000;
        const expiration = new Date(new Date().getTime() + duration).toISOString().substring(0, 10);
        const obj = {lessonId: req.params.lessonId, duration: req.body.duration, expiration, created_at: new Date()};
        const codes = [];
        for(let i = 0; i < req.body.count; i++) {
            codes.push({...obj, code: generateRandomString(8)});
        }
        const newCodes = await LessonsCodes.insertMany(codes);
        if(newCodes.length == 0) throw("لم يتم أضافة أى كود");
        res.json({codes: newCodes});
    } catch(err) {
        res.json({err: err.message?err.message: err});
    }
}



exports.deleteLessonCodes = async(req, res) => {
    try {
        // const today = new Date().toISOString().substring(0, 10);
        const deleted = await LessonsCodes.deleteMany({_id: {$in: req.body.ids}});
        // if(!deleted || deleted.ok == 0) throw("لم يتم المسح حوال مرة اخرى");
        res.json({done: true});
    } catch(err) {
        res.json({err: err.message?err.message: err});
    }
}



exports.removeCode = async(req, res) => {
    try {
        const Collec = req.params.type == 'lessons'? LessonsCodes: Codes;
        const del = await Collec.deleteOne({_id: req.params.id});
        if(del.n == 0) throw("لم يتم المسح");
        res.json({done: true});
    } catch(err) {
        console.log(err)
        res.json({err: err.message?err.message: err});
    }
}


exports.generateUsers = async(req, res) => {
    try {
        const sampleUsers = await Users.deleteMany({address: "assiut", phone: "010233445678"});
        res.json({done: true});
    } catch(err) {
        console.log(err)
        res.json({err: err.message?err.message: err});
    }
}



exports.updateCode = async(req, res) => {
    try {
        const Collec = req.params.type == 'lessons'? LessonsCodes: Codes;
        const updated = await Collec.updateOne({_id: req.params.id}, req.body);
        if(updated.n == 0) throw("لم يتم التحديث");
        res.json({done: true});
    } catch(err) {
        console.log(err)
        res.json({err: err.message?err.message: err});
    }
}



exports.updateCodesExpirationDate = async(req, res) => {
    try {
        const Collec = req.params.type == 'lessons'? LessonsCodes: Codes;
        const updated = await Collec.updateMany({_id: {$in: req.body.ids}}, {expiration: req.body.expiration});
        if(updated.n == 0) throw("لم يتم التحديث");
        res.json({done: true});
    } catch(err) {
        console.log(err)
        res.json({err: err.message?err.message: err});
    }
}




















// exports.authGeneralCode = async(req, res) => {
//     try {
//         const code = req.body.code;
//         const userId = req.body.userId;
//         const username = req.body.username;
//         const stage = req.body.stage;
//         const section = req.body.section;
//         const codeObj = await Codes.findOne({code, stage});
//         if(!codeObj) throw("هذا الكود خاطئ");
//         if(codeObj.section != "0") {
//             if(codeObj.section != section) throw("هذا الكود لا يخص هذه الوحدة");
//         }
//         if(new Date().getTime() > codeObj.expiration) throw("تاريخ صلاحية الكود انتهت");
//         if(!codeObj.userId || codeObj.userId == "") {
//             const duration = codeObj.duration * 24 * 3600 * 1000;
//             const expiration = new Date(new Date().getTime() + duration).toISOString().substring(0, 10);
//             const startDate = new Date().toISOString().substring(0, 10);
//             const update = await Codes.updateOne({code}, {userId, username, startDate, expiration, times: 1});
//             if(update.nModified == 0) throw("حاول مرة أخرى");
//         }
//         else {
//             const update = await Codes.updateOne({code}, {$inc: {times: 1}});
//             if(codeObj.userId != userId) throw("تم أستعمال هذا الكود بواسطة طالب اخر بالفعل");
//         }
//         /////////////////////////////////////////

//         res.status(200).json({authorized: true});
//     } catch(err) {
//         console.log(err);
//         res.json({err: err.message?err.message: err});
//     }
// }


// exports.generateUsers = async(req, res) => {
//     try {
//         const users = [];
//         for(let i = 0; i < 2000; i++) {
//             const user = {
//                 email: `user${i}@gmail.com`,
//                 fullname: `user${i}`,
//                 password: "123456",
//                 stage: "6",
//                 address: "assiut",
//                 phone: "010233445678"
//             }
//             users.push(user);
//         }
//         console.log(users)
//         const sampleUsers = await Users.insertMany(users);
//         res.json({done: true});
//     } catch(err) {
//         console.log(err)
//         res.json({err: err.message?err.message: err});
//     }
// }

// exports.generateCode = async(req, res) => {
//     try {
//         const code = generateRandomString(8);
//         const duration = 30 * 24 * 3600 * 1000;
//         const expiration = new Date(new Date().getTime() + duration).toISOString().substring(0, 10);
//         const newCode = await new Codes({...req.body, code, expiration}).save();
//         if(!newCode.code) throw("حاول مرة أخرى");
//         res.json({code: newCode});
//     } catch(err) {
//         res.json({err: err.message?err.message: err});
//     }
// }

/////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////
/////////////////////////////////////////////////////////////

// exports.getLessonCodes = async(req, res) => {
//     try {
//         const today = new Date().toISOString().substring(0, 10);
//         const deleted = await LessonsCodes.deleteMany({expiration: {$lt: today}});
//         const codes = await LessonsCodes.find({lessonId: req.params.lessonId});
//         res.json({codes});
//     } catch(err) {
//         res.json({err: err.message?err.message: err});
//     }
// }


// exports.getCodeById = async(req, res) => {
//     try {
//         const code = await Codes.findOne({_id: req.params.id});
//         if(!code) throw("Not found");
//         res.json({code});
//     } catch(err) {
//         res.json({err: err.message?err.message: err});
//     }
// }