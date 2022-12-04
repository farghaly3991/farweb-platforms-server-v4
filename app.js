const express= require('express');
const path = require('path');
const mongoose= require('mongoose');
const Users = require('./models/users');
const bodyParser = require("body-parser")
const app= express();
const fs = require("fs-extra")
const authRouter = require('./routes/auth_router');
const unitsExamsRouter = require('./routes/units_exams_router');
const lessonsRouter = require('./routes/lessons_router');
const publicRouter = require('./routes/public_router');
const chatRouter = require('./routes/chat');
const studentFileRouter = require('./routes/student-file');
const adjustmentsRouter = require('./routes/adjustments');
const server = require('http').createServer(app);
const io = require('socket.io')(server);
const upload = require('express-fileupload')
const {chatSocket} = require("./controls/chat_controller.js");
const adminData = require('./models/adminData');
const { insertFirstData } = require('./first-data');

if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config();
}
// const db = "mongodb://localhost:27017/platform_1";
// mongoose.connect("mongodb+srv://farghaly:farghaly_93@cluster0-i8la2.mongodb.net/E-shop",{ useNewUrlParser: true,  useUnifiedTopology: true  })
mongoose.connect(process.env.database,{ useNewUrlParser: true,  useUnifiedTopology: true  })
.then(() => {
  console.log('Connected successfully to database.............');
}
).catch(()=>{
  console.log('Connection failed ... !');
});

///////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////
insertFirstData();

///////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////


let live = false;
let current_room = "";
let seconds = 0;
var interval;
io.on('connection', function(socket) {
  console.log('connected');


  socket.on('add_boradcaster', (room) => {
    console.log('start Broadcasting in room '+room);
    live = true;
    socket.join(room);
    current_room = room;

    interval = setInterval(() => {
      if(!live) clearInterval(interval);
      else {
        seconds++;
        io.in(room).emit('live', {current_room, seconds});
      }
    }, 1000);
  });


  
  socket.on('register_as_user', data => {
    console.log('68', data)
    // if(data.stage != current_room) return socket.emit("not_allowed");
    socket.join(data.stage);
    io.in(data.stage).emit('new_user', data);
  })

  socket.on('stop', () => {
    live = false;
    io.emit('finish');
    io.of("/").in(current_room).clients((err, clients) => {
      clients.forEach(client_id => {
        io.sockets.sockets[client_id].leave();
      })
    })
    current_room = "";
    seconds = 0;
  })


  socket.on('quit', (userId) => {
    io.to(current_room).emit('quited', userId);
    socket.leave();
  })
  
  socket.on("do_comment", function (comm) {
    io.in(current_room).emit("comment", comm);
  });


  //////////////////////////////////////////////////////////////////////////////////
  //////////////////////////////////////////////////////////////////////////////////
  //////////////////////////////////////////////////////////////////////////////////


  socket.on("mouse-down", data => {
    console.log(data)
    io.in(current_room).emit("mouse-down", data);
  });

  socket.on("mouse-up", data => {
    io.in(data.stage).emit("mouse-up", data);
  });

  socket.on("erease", data => {
    io.in(data.stage).emit("erease", data);
  });

  socket.on("mouse-move", data => {
    io.in(data.stage).emit("mouse-move", data);
  });

  socket.on("user-to-draw", data => {
    io.in(data.stage).emit("user-to-draw", data.userId);
  });

  //////////////////////////////////////////////////////////////////////////////////
  //////////////////////////////////////////////////////////////////////////////////
  //////////////////////////////////////////////////////////////////////////////////

  chatSocket(io, socket);

});




app.use(upload({useTempFiles: true, preserveExtension: 4}));
express.json({limit: '50mb', extended: true});
express.urlencoded({limit:'50mb', extended: true});

app.use(bodyParser.urlencoded({limit: '50mb', extended: true}));
app.use(bodyParser.json({limit: '50mb', extended: true}));
app.use('/images', express.static(path.join(__dirname,'images')));


app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader(
    "Access-Control-Allow-Headers",
   "Origin, X-Requested-With, Content-Type, Accept, Authorization"
  );
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET, POST, PATCH, PUT, DELETE, OPTIONS"
  );
  next();
}); 
app.use(unitsExamsRouter);
app.use(authRouter);
app.use(lessonsRouter);
app.use(publicRouter);
app.use(studentFileRouter);
app.use(chatRouter);
app.use(adjustmentsRouter);

app.use('/', express.static(path.join(__dirname, 'dist')));


 app.use(async(req, res, next) => {
   const siteData = await adminData.findOne({admin: true});
   const title = siteData? siteData.siteName: "farweb";
   const mobileTitle = siteData?siteData.siteName.split(" ").join("-"): 'farweb';
   const image = siteData?siteData.image1.replace("http://", "https://"): '';
   const description = `منصة  (${siteData?siteData.siteName: 'farweb'}) لتدريس المادة ورفع الدروس والفيديوهات والواجبات وحل المسائل والاختبارات`;
  justifyIndexFile({title, mobileTitle, image, description});
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
 });



 function justifyIndexFile({title, mobileTitle, image, description}) {
      const indexFile = fs.readFileSync("dist/index.html", "utf8");
      let str = indexFile.toString();
      //////////////////////////////////////////////////////
      const replaceable = str.split(`<meta charset=UTF-8>`)[1].split(`<meta charset=UTF-8>`)[0];
      const replacement = `
        <title>${title}</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <meta property=og:title content="${title}">
        <meta property=og:image content="${image}">
        <meta name=apple-mobile-web-app-title content=${mobileTitle}>
        <link rel=icon type=image/png sizes=32x32 href=${image}>
        <link rel=icon type=image/png sizes=16x16 href=${image}>
        <link rel=apple-touch-icon href=${image}>
        <link rel=mask-icon href=${image}>
        <meta name=msapplication-TileImage content=${image}>
        <meta name='Description' CONTENT='${description}'>
        `;

      const modified = str.replace(replaceable, replacement);
      const newData = fs.writeFileSync("dist/index.html", modified, "utf8");
      console.log("DONE...");
}




// app.use('/.*/', serveStatic(path.join(__dirname, '/dist')))

// this * route is to serve project on different page routes except root `/`
// app.get(/.*/, function (req, res) {
// 	res.sendFile(path.join(__dirname, '/dist/index.html'))
// })



exports.server = server;
exports.app = app;
// exports.cloudinary = cloudinary;