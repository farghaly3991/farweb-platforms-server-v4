const cloudinary = require('cloudinary').v2;
require("dotenv").config();

// cloudinary.config({
//     cloud_name: 'farghaly-developments',
//     api_key: '789929815277853',
//     api_secret: 'GRYCOy1KymmaOkGu6BuPVNH0VLc'
// });
// const folder = 'mina-learning';


cloudinary.config({
    cloud_name: process.env.cloud_name,
    api_key: process.env.api_key,
    api_secret: process.env.api_secret
})
const folder = process.env.cloud_folder;

exports.uploadFile = function(file, fileName) {
    return new Promise((resolve, reject) => {
        const type = file.mimetype.split("/")[1];
        let mimeType;
        switch (type) {
            case "pdf":
                mimeType = "pd";
            break;
            case "zip":
                mimeType = "zi";
            break;
            case "rar":
                mimeType = "ra";
            break;
            default:
                mimeType = type;
            break;
        };
        let name = fileName+'.' + (['jpg', 'jpeg', 'png'].includes(type)?"webp": type);
        // if(type == 'jpg' || type == 'jpeg' || type == 'png') {
        //     name = fileName;
        // }
        cloudinary.uploader.destroy(name, (err, result) => {
            if(err) reject(err);
            console.log(result);

        });
        cloudinary.uploader.upload_large(
            file.tempFilePath,
            
            {
                public_id : name,
                folder: folder,

            },
            (err, result) => {
                if(err) reject(err);
                if(!result) reject("there is image storage env problem");
                 resolve(result.secure_url);
            })
    })
}
///////////////////////////////////////////
exports.uploadImage = function(file, fileName) {
    return new Promise((resolve, reject) => {
        // cloudinary.uploader.destroy(fileName, (err, result) => {
        //     if(err) reject(err);
        //     console.log(result);

        // });
        cloudinary.uploader.upload(
            "image.jpg",
            
            {
                format: "jpg",
                width: 130,
            },
            (err, result) => {
                if(err) reject(err);
                 resolve(result.url);
            })
    })
}