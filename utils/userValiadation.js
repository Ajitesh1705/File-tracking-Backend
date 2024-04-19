
const Joi = require('joi');

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
module.exports = {
    userRegisterValidate,
    userLoginValidate,
    fileRegistrationValidate
}