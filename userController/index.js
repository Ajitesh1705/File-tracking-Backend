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
            
            const { fileName, CurrDept, fileDescription, cost, ForDepartment, Department, uniqueId, comment,fileUrl, BudgetfileUrl } = req.body;;
            const newComment = {
                CurrDept: CurrDept,
                comment: comment,
                fileUrl: fileUrl,
                budgetFileUrl: BudgetfileUrl,
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
    
            const departmentSequence = ['Directorate', 'Purchase', 'Finance', 'Registrar', 'Propresident', 'President'];
            const currentDeptIndex = departmentSequence.indexOf(file.CurrDept);
    
            if (currentDeptIndex === -1 || (file.cost < 100000 && currentDeptIndex === 3)) {
                return res.status(400).json({ message: 'Invalid department or file cannot proceed further' });
            }
    
            const nextDept = (file.cost < 100000 && currentDeptIndex === 2)
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
                status: 'sent',
                comment
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
                        transitions: newTransition,
                        sentHistory: {
                            department: file.CurrDept,
                            timestamp: new Date()
                        }
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
            const registeredFiles = await FileTrackModel.find();
    
            const departmentSequence = ['Directorate', 'Purchase', 'Finance', 'Registrar', 'Propresident', 'President'];
            const financeIndex = departmentSequence.indexOf('Finance');
    
            const filteredFiles = registeredFiles.filter(file => {
                const currentDeptIndex = departmentSequence.indexOf(file.CurrDept);
                return currentDeptIndex < financeIndex;
            });
    
            return res.status(200).json({ message: 'Registered files retrieved successfully', data: filteredFiles });
        } catch (error) {
            console.error('Error fetching registered files:', error);
            return res.status(500).json({ message: 'Error fetching registered files', error });
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
    
            const departmentSequence = ['Directorate', 'Purchase', 'Finance', 'Registrar', 'Propresident', 'President'];
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
                status: 'rework',
                comment 
            };
    
            // Update the file with the new department, comment, and transition
            const updatedFile = await FileTrackModel.findOneAndUpdate(
                { uniqueId },
                {
                    $set: {
                        CurrDept: previousDept,
                        Department: departmentSequence[currentDeptIndex - 2] // Move to the department before previous
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
        const moment = require('moment-timezone');

        if (!file) {
            return res.status(404).json({ message: 'File not found' });
        }

        const timeline = file.transitions.map(transition => ({
            from: transition.FromDept,
            to: transition.ToDept,
            date: moment(transition.date).tz('Asia/Kolkata').format('DD-MM-YYYY HH:mm:ss'),
            status: transition.status,
            comment: transition.comment 
        }));

        return res.status(200).json({ message: 'File timeline retrieved successfully', timeline });
    } catch (error) {
        console.error('Error fetching file timeline: ', error);
        return res.status(500).json({ message: 'Error fetching file timeline', error });
    }
},
   getFilesSentFromDepartment : async (req, res) => {
    try {
        const { department } = req.params;
        const sentFiles = await FileTrackModel.find({
            'sentHistory.department': department
        });

        if (!sentFiles.length) {
            return res.status(404).json({ message: 'No files sent from this department' });
        }

        return res.status(200).json({ message: 'Sent files retrieved successfully', data: sentFiles });
    } catch (error) {
        console.error('Error fetching sent files:', error);
        return res.status(500).json({ message: 'Error fetching sent files', error });
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
    
            const isEligibleForApproval = (file.cost < 100000 && file.CurrDept === 'Registrar') || (file.CurrDept === 'President');
            if (!isEligibleForApproval) {
                return res.status(400).json({ message: 'File is not eligible for approval at this department' });
            }
    
            if (!fileUrl) {
                fileUrl = file.fileUrl;
            }
    
            const newComment = {
                CurrDept: file.CurrDept,
                comment,
                fileUrl : file.fileUrl 
            };
    
            const newTransition = {
                FromDept: file.CurrDept,
                ToDept: 'approved', 
                date: file.date,
                status: 'approved',
                comment: comment
            };
    
            const updatedFile = await FileTrackModel.findOneAndUpdate(
                { uniqueId },
                {
                    $addToSet: {
                        comments: newComment,
                        transitions: newTransition
                    },
                    CurrDept: 'approved', 
                    Department: file.CurrDept,
                    approved: true 
                },
                { new: true }
            );
    
            return res.status(200).json({ message: 'File approved successfully', data: updatedFile });
        } catch (error) {
            console.error('Error approving file:', error);
            return res.status(500).json({ message: 'Error approving file', error: error.message });
        }

     },
     GetFilesSentForRework : async (req , res)=> {

        try {
            const { department } = req.params; // Get department from route params
    
            if (!department) {
                return res.status(400).json({ message: 'Department is required' });
            }
    
            // Find files with rework status in transitions and the specified current department
            const reworkFiles = await FileTrackModel.find({
                CurrDept: department,
                'transitions.status': 'rework'
            }).select('fileName uniqueId CurrDept Department transitions comments'); // Select specific fields if needed
    
            if (!reworkFiles.length) {
                return res.status(404).json({ message: 'No files sent for rework found in this department' });
            }
    
            return res.status(200).json({ message: 'Files sent for rework retrieved successfully', data: reworkFiles });
        } catch (error) {
            console.error('Error fetching files sent for rework:', error);
            return res.status(500).json({ message: 'Error fetching files sent for rework', error: error.message });
        }

        
        
     },


    
  
    

    

}