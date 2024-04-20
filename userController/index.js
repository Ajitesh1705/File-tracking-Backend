const UserModel = require("../models/UserModel");
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken')
const FileTrackModel = require("../models/FileTrack")

module.exports = {

    // validate req.body - Done
    // create MongoDB UserModel - Done
    // do password encrytion - Done
    // save data to mongodb - 
    // return response to the cliein
    registerUser: async (req,res)=>{
        const userModel = new UserModel(req.body);
        userModel.password = await bcrypt.hash(req.body.password, 10);
        try{
            const response = await userModel.save();
            response.password = undefined;
            return res.status(201).json({message:'success', data: response});
        }catch(err){
            return res.status(500).json({message: 'error', err});
        }
    },

    // check user using email
    // compare password 
    // create jwt token
    // send response to client
    loginUser:async (req,res)=>{
       try{
        const user = await UserModel.findOne({email: req.body.email});
        if(!user){
            return res.status(401)
                .json({message: 'Auth failed, Invalid username/password'});
        }

        // const isPassEqual = await bcrypt.compare(req.body.password, user.password);
        // if(!isPassEqual){
        //     return res.status(401)
        //         .json({message: 'Auth failed, Invalid username/password'});
        // }
        const tokenObject = {
            _id: user._id,
            department: user.department,
            email: user.email
        }
        const jwtToken = jwt.sign(tokenObject, process.env.SECRET, {expiresIn: '4h'});
        return res.status(200)
            .json({jwtToken, tokenObject});
       }catch(err){
            return res.status(500).json({message:'error',err});
       }
    },

    getUsers : async(req,res)=>{
        try{
            const users = await UserModel.find({}, {password:0});
            return res.status(200)
                .json({data: users});
        }catch(err){
            return res.status(500)
                .json({message:'error', err});
        } 
    },
    registerFile: async (req, res) => {
        try {
            const { fileName, fromDepartment, toDepartment, uniqueId } = req.body;
            const transferredBy = req.user._id;
            const fileTransfer = new FileTrackModel({ fileName, fromDepartment, toDepartment, uniqueId });
            const savedRegistration = await fileTransfer.save();
            return res.status(201).json({ message: 'File details registered successfully', data: savedRegistration });
        } catch (error) {
            return res.status(500).json({ message: 'Error registering file details', error });
        }
    },
    getFileNamesAndIds: async (req, res) => {
        try {
            const files = await FileTrackModel.find({}, 'fileName uniqueId'); // Fetch fileName and uniqueId fields only
            return res.status(200).json({ data: files });
        } catch (error) {
            return res.status(500).json({ message: 'Error fetching file names and IDs', error });
        }
    }

    

}