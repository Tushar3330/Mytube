import multer from "multer";

//we have used disk storage for storing the file on the disk
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, "./public/temp");
    },
    filename: function (req, file, cb) {
        cb(null, file.originalname);
    },
    });

    //upload is the multer object which will be used in the route to upload the file on the disk storage
const upload = multer({ storage: storage });

export { upload };




