
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
const validateTransferredBy = async (req, res, next) => {
    try {
        const transferredById = req.user._id; // Get the transferredBy ID from the authenticated user
        if (!mongoose.Types.ObjectId.isValid(transferredById)) {
            return res.status(400).json({ message: 'Invalid transferredBy ID' });
        }

        const user = await UserModel.findById(transferredById);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // If everything is valid, proceed to the next middleware
        next();
    } catch (error) {
        return res.status(500).json({ message: 'Error validating transferredBy ID', error });
    }
}

module.exports = {
    userRegisterValidate,
    userLoginValidate,
    fileRegistrationValidate,
    validateTransferredBy
}