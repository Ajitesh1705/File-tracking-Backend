
const Joi = require('joi');
const jwt = require('jsonwebtoken');

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
    if (!token) return res.status(401).json({ message: 'No token provided' });

    jwt.verify(token, process.env.SECRET, (err, decoded) => {
        if (err) return res.status(403).json({ message: 'Failed to authenticate token' });
        req.userId = decoded._id; // Attach user ID to the request object
        next();
    });
};


module.exports = {
    userRegisterValidate,
    userLoginValidate,
    fileRegistrationValidate,
    verifyToken
}