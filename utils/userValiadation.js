
const Joi = require('joi');
const jwt = require('jsonwebtoken');
require('dotenv').config();
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');

const userRegisterValidate = (req, res, next)=>{
    const schema = Joi.object({
        fullName: Joi.string().min(3).max(100).required(),
        email: Joi.string().email().required(),
        password: Joi.string().min(4).alphanum().required()
    });
    const {error, value} = schema.validate(req.body);
    if(error){
        return res.status(400).json({message:"Bad Request", error})
    }
    next();
}

const userLoginValidate = (req,res,next)=>{
    const schema = Joi.object({
        email: Joi.string().email().required(),
        password: Joi.string().min(4).alphanum().required()
    });
    const {error, value} = schema.validate(req.body);
    if(error){
        return res.status(400).json({message:"Bad Request", error})
    }
    
    next();
}
const fileRegistrationValidate = (req, res, next) => {
    const schema = Joi.object({
        fileName: Joi.string().required(),
        fromDepartment:Joi.string().required(),
        toDepartment:Joi.string().required(),
        uniqueId: Joi.string().required(),
        comment: Joi.string()
    });
    const { error, value } = schema.validate(req.body);
    if (error) {
        return res.status(400).json({ message: "Bad Request", error })
    }
    next();
}
const verifyToken = (req, res, next) => {
    
    const token = req.headers.authorization;

    //  token exists
    if (!token) {
        return res.status(401).json({ message: 'No token provided' });
    }

    try {
        console.log(token)

       const token_new = token.slice(7)

        const decoded = jwt.verify(token_new, process.env.SECRET);

        req.user = decoded;

        
        console.log(decoded)

        next();
    } catch (error) {
        
        console.error('Error verifying token:', error.message);
        return res.status(403).json({ message: 'Failed to authenticate token' });
    }
};
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: 'file_transfers',
        format: async (req, file) => 'pdf', 
        public_id: (req, file) => file.originalname,
    },
});




module.exports = {
    userRegisterValidate,
    userLoginValidate,
    fileRegistrationValidate,
    verifyToken,

}