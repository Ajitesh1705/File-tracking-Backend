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
        const jwtToken = jwt.sign(tokenObject, 'my-secret-key', {expiresIn: '4h'});
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
            
            const { fileName, CurrDept, fileDescription, cost, ForDepartment, Department, uniqueId, comment,fileUrl } = req.body;;
            const newComment = {
                CurrDept: CurrDept,
                comment: comment,
                fileUrl: fileUrl,
            };
            const fileTransfer = new FileTrackModel({ fileName, CurrDept, fileDescription, cost, ForDepartment,Department, uniqueId,fileUrl, comments: [newComment],});
            const savedRegistration = await fileTransfer.save();
            return res.status(201).json({ message: 'File details registered successfully', data: savedRegistration });
        } catch (error) {
            return res.status(500).json({ message: 'Error registering file details', error });
        }
    },
   

    updateFileStatus: async (req, res) => {
        try {
            const { uniqueId, comment } = req.body;
            let fileUrl = req.body.fileUrl;
    
            if (!uniqueId || !comment) {
                return res.status(400).json({ message: 'uniqueId and comment are required' });
            }
    
            const file = await FileTrackModel.findOne({ uniqueId });
            if (!file) {
                return res.status(404).json({ message: 'File not found' });
            }
    
            const departmentSequence = ['Purchase', 'Finance', 'Registrar', 'Propresident', 'President'];
            const currentDeptIndex = departmentSequence.indexOf(file.CurrDept);
    
            if (currentDeptIndex === -1 || (file.cost < 100000 && currentDeptIndex === 2)) {
                return res.status(400).json({ message: 'Invalid department or file cannot proceed further' });
            }
    
            const nextDept = (file.cost < 100000 && currentDeptIndex === 1)
                ? 'Registrar'
                : departmentSequence[currentDeptIndex + 1];
    
            if (!fileUrl) {
                fileUrl = file.fileUrl;
            }
    
            const newComment = {
                CurrDept: file.CurrDept,
                comment,
                fileUrl: fileUrl
            };
    
            const newTransition = {
                FromDept: file.CurrDept,
                ToDept: nextDept,
                date: new Date(),
                status: 'sent'
            };
    
            const nextDeptIndex = departmentSequence.indexOf(nextDept);
    
            const updatedFile = await FileTrackModel.findOneAndUpdate(
                { uniqueId },
                {
                    $set: {
                        CurrDept: nextDept,
                        Department: nextDeptIndex + 1 < departmentSequence.length
                            ? departmentSequence[nextDeptIndex + 1]
                            : nextDept
                    },
                    $addToSet: {
                        comments: newComment,
                        transitions: newTransition
                    }
                },
                { new: true }
            );
    
            return res.status(200).json({ message: 'File status updated successfully', data: updatedFile });
        } catch (error) {
            console.error('Error updating file status:', error);
            return res.status(500).json({ message: 'Error updating file status', error: error.message });
        }
    },
     getFileNamesAndIds: async (req, res) => {
        try {
            const files = await FileTrackModel.find({}); // Fetch fileName and uniqueId fields only
            return res.status(200).json({ data: files });
        } catch (error) {
            return res.status(500).json({ message: 'Error fetching file names and IDs', error });
        }
    },
    getFilesByCurrDept: async (req, res) => {
        try {
            const { CurrDept } = req.params;

            const files = await FileTrackModel.find({ CurrDept });

            return res.status(200).json({ data: files });
        } catch (error) {
            return res.status(500).json({ message: 'Error fetching files by current department', error });
        }
    },
    rework: async (req, res) => {
        try {
            const { uniqueId, comment } = req.body;
            const file = await FileTrackModel.findOne({ uniqueId });
            
            if (!file) {
                return res.status(404).json({ message: 'File not found' });
            }
    
            const departmentSequence = ['Purchase', 'Finance', 'Registrar' ,'Propresident', 'President',];
            const currentDeptIndex = departmentSequence.indexOf(file.CurrDept);
    
            if (currentDeptIndex <= 0) {
                return res.status(400).json({ message: 'File is already at the first department or invalid department' });
            }
    
            const previousDept = departmentSequence[currentDeptIndex - 1];
            const fileUrl = file.comments.map(comment => comment.fileUrl).pop() || file.fileUrl;
    
            const newComment = {
                CurrDept: file.CurrDept,
                comment,
                fileUrl
            };
    
            const newTransition = {
                FromDept: file.CurrDept,
                ToDept: previousDept,
                date: new Date(),
                status: 'rework'
            };
    
            // Update the file with the new department, comment, and transition
            const updatedFile = await FileTrackModel.findOneAndUpdate(
                { uniqueId },
                {
                    $set: {
                        CurrDept: previousDept,
                        Department: departmentSequence[currentDeptIndex - 2]
                    },
                    $addToSet: {
                        comments: newComment,
                        transitions: newTransition
                    }
                },
                { new: true }
            );
    
            return res.status(200).json({ message: 'File sent for rework successfully', data: updatedFile });
        } catch (error) {
            console.error('Error sending file for rework:', error);
            return res.status(500).json({ message: 'Error sending file for rework', error: error.message });
        }
    },
     getFileTimeline : async (req, res) => {
        try {
            const { uniqueId } = req.params;
            const file = await FileTrackModel.findOne({ uniqueId });
    
            if (!file) {
                return res.status(404).json({ message: 'File not found' });
            }
    
            const timeline = file.transitions.map(transition => ({
                from: transition.FromDept,
                to: transition.ToDept,
                date: transition.date.toLocaleDateString('en-IN'),
                status: transition.status
            }));
    
            return res.status(200).json({ message: 'File timeline retrieved successfully', timeline });
        } catch (error) {
            console.error('Error fetching file timeline: ', error);
            return res.status(500).json({ message: 'Error fetching file timeline', error });
        }
    },
   getFilesSentFromDepartment : async (req, res) => {
     const departmentSequence = ['Purchase', 'Finance', 'Registrar', 'Propresident', 'President'];

    const getNextDepartment = (currentDepartment) => {
        const currentIndex = departmentSequence.indexOf(currentDepartment);
        if (currentIndex === -1 || currentIndex === departmentSequence.length - 1) {
            return null;
        }
        return departmentSequence[currentIndex + 1];
    };

        try {
            const { department } = req.params;
            const nextDepartment = getNextDepartment(department);
    
            if (!nextDepartment) {
                return res.status(400).json({ message: 'Invalid department or no next department in sequence' });
            }
    
            const files = await FileTrackModel.find({ CurrDept: nextDepartment });
    
            if (!files.length) {
                return res.status(404).json({ message: `No files found sent from department: ${department}` });
            }
    
            return res.status(200).json({ message: 'Files retrieved successfully', data: files });
        } catch (error) {
            return res.status(500).json({ message: 'Error retrieving files sent from department', error });
        }
    },
     approveFile : async (req, res) => {
        try {
            const { uniqueId, comment } = req.body;
            let fileUrl = req.body.fileUrl;
    
            if (!uniqueId || !comment) {
                return res.status(400).json({ message: 'uniqueId and comment are required' });
            }
    
            const file = await FileTrackModel.findOne({ uniqueId });
            if (!file) {
                return res.status(404).json({ message: 'File not found' });
            }
    
            const isEligibleForApproval = (file.cost < 100000 && file.CurrDept === 'Registrar') || (file.CurrDept === 'Propresident');
    
            if (!isEligibleForApproval) {
                return res.status(400).json({ message: 'File is not eligible for approval at this department' });
            }
    
            if (!fileUrl) {
                fileUrl = file.fileUrl;
            }
    
            const newComment = {
                CurrDept: file.CurrDept,
                comment,
                fileUrl: fileUrl
            };
    
            const newTransition = {
                FromDept: file.CurrDept,
                ToDept: file.CurrDept,  // No department change on approval
                date: new Date(),
                status: 'approved'
            };
    
            const updatedFile = await FileTrackModel.findOneAndUpdate(
                { uniqueId },
                {
                    $addToSet: {
                        comments: newComment,
                        transitions: newTransition
                    }
                },
                { new: true }
            );
    
            return res.status(200).json({ message: 'File approved successfully', data: updatedFile });
        } catch (error) {
            console.error('Error approving file:', error);
            return res.status(500).json({ message: 'Error approving file', error: error.message });
        }
    }
    
    
  
    

    

}