const UserModel = require("../models/UserModel");
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken')
const FileTrackModel = require("../models/FileTrack")

module.exports = {

    // validate req.body - Done
    // create MongoDB UserModel - Done
    // do password encrytion - Done
    // save data to mongodb - 
    // return response to the client       
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
            const {
                fileName,
                CurrDept,
                fileDescription,
                cost,
                ForDepartment,
                Department,
                uniqueId,
                comment,
                fileUrl,
                BudgetfileUrl,
                renegotiation
            } = req.body;
    
            if (!comment || !fileUrl) {
                return res.status(400).json({ message: 'Comment and fileUrl are required for registration' });
            }
    
            
            const departmentFlow = ["Directorate", "Purchase", "Finance", "Registrar", "President", "Pro President"];
            const currentIndex = departmentFlow.indexOf(CurrDept);
    
            if (currentIndex === -1 || currentIndex === departmentFlow.length - 1) {
                return res.status(400).json({ message: 'Invalid current department or no next department available' });
            }
    
            const nextDept = departmentFlow[currentIndex + 1];
    
            const newComment = {
                comment: comment,
                CurrDept: CurrDept,
                fileUrl: fileUrl,
                budgetFileUrl: BudgetfileUrl,
            };
    
            const transition = {
                FromDept: CurrDept,
                ToDept: nextDept,
                status: "sent",
                comment: comment,
            };
    
            const fileTransfer = new FileTrackModel({
                fileName,
                CurrDept: nextDept, 
                fileDescription,
                cost,
                ForDepartment,
                Department,
                uniqueId,
                fileUrl,
                renegotiation,
                comments: [newComment],
                transitions: [transition],
            });
    
            const savedRegistration = await fileTransfer.save();
    
            return res.status(201).json({
                message: 'File registered and sent to the next department successfully',
                data: savedRegistration
            });
        } catch (error) {
            console.error('Error registering file:', error);
            return res.status(500).json({ message: 'Error registering file', error });
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

            if (file.CurrDept === 'Finance' && file.renegotiation === 'Incomplete'&& file.specialApproval !== 'Yes') {
                return res.status(400).json({ message: 'negotiation is incomplete. The file cannot proceed from Finance.' });
            }

            if (file.specialApprovalStatus == 'Done'&&file.CurrDept === 'Finance' && file.renegotiation === 'Incomplete') {
                return res.status(400).json({ message: 'Negotiation in incomplete.' });
            }
    
            const departmentSequence = ['Directorate', 'Purchase', 'Finance', 'Registrar', 'Propresident', 'President'];
            const currentDeptIndex = departmentSequence.indexOf(file.CurrDept);
    
            if (currentDeptIndex === -1 || (file.cost < 100000 && currentDeptIndex === 3&& file.specialApproval!== 'Yes')) {
                return res.status(400).json({ message: 'Invalid department or file cannot proceed further' });
            }
    
            const nextDept = (file.cost <= 100000 && currentDeptIndex === 2 )
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
            }).select('fileName uniqueId CurrDept Department fileDescription cost transitions comments'); 
    
            if (!reworkFiles.length) {
                return res.status(404).json({ message: 'No files sent for rework found in this department' });
            }
    
            return res.status(200).json({ message: 'Files sent for rework retrieved successfully', data: reworkFiles });
        } catch (error) {
            console.error('Error fetching files sent for rework:', error);
            return res.status(500).json({ message: 'Error fetching files sent for rework', error: error.message });
        }

        
        
     },
     getFileReworkTimeline : async (req, res) => {
        try {
            const { uniqueId } = req.params;
            const file = await FileTrackModel.findOne({ uniqueId });
    
            if (!file) {
                return res.status(404).json({ message: 'File not found' });
            }
    
            // Find the last "rework" transition
            const lastReworkTransition = file.transitions.filter(transition => transition.status === 'rework').pop();
    
            if (!lastReworkTransition) {
                return res.status(400).json({ message: 'No rework transitions found for this file' });
            }
    
         
            const timeline = file.transitions
                .filter(transition => transition.date <= lastReworkTransition.date)
                .map(transition => ({
                    from: transition.FromDept,
                    to: transition.ToDept,
                    date: transition.date.toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata' }),
                    status: transition.status,
                    comment: transition.comment // Include comment if needed
                }));
    
            return res.status(200).json({ message: 'File rework timeline retrieved successfully', timeline });
        } catch (error) {
            console.error('Error fetching file rework timeline: ', error);
            return res.status(500).json({ message: 'Error fetching file rework timeline', error });
        }

    },
     getPresidentApprovedFiles : async (req, res) => {
        try {
            const presidentApprovedFiles = await FileTrackModel.find({
                "transitions.status": "approved",
                "transitions.FromDept": "President"
            });
    
            if (!presidentApprovedFiles.length) {
                return res.status(404).json({ message: 'No files approved by the President found' });
            }
    
            return res.status(200).json({ message: 'Files approved by the President retrieved successfully', data: presidentApprovedFiles });
        } catch (error) {
            console.error('Error fetching files approved by the President:', error);
            return res.status(500).json({ message: 'Error fetching files approved by the President', error });
        }
    },
     getReworkFilesByDept : async (req, res) => {
        try {
            const { department } = req.params;
    
            const reworkFiles = await FileTrackModel.find({
                "transitions.status": "rework",
                "transitions.FromDept": department
            });
    
            if (!reworkFiles.length) {
                return res.status(404).json({ message: `No files sent for rework by ${department} found` });
            }
    
            return res.status(200).json({ message: `Files sent for rework by ${department} retrieved successfully`, data: reworkFiles });
        } catch (error) {
            console.error(`Error fetching files sent for rework by ${department}:`, error);
            return res.status(500).json({ message: 'Error fetching files sent for rework', error });
        }
    },
     sendForRenegotiation : async (req, res) => {
        try {
            const { uniqueId, comment } = req.body;
            const file = await FileTrackModel.findOne({ uniqueId });
    
            if (!file) {
                return res.status(404).json({ message: 'File not found' });
            }
    
            if (file.CurrDept !== 'Finance') {
                return res.status(400).json({ message: 'Only Finance can send for renegotiation' });
            }
    
            const departmentSequence = ['Purchase', 'Finance'];
            const currentDeptIndex = departmentSequence.indexOf(file.CurrDept);
            const nextDept = 'Purchase';
    
            const newComment = {
                CurrDept: file.CurrDept,
                comment,
                fileUrl: file.fileUrl
            };
    
            const newTransition = {
                FromDept: file.CurrDept,
                ToDept: nextDept,
                date: new Date(),
                status: 'renegotiation'
            };
    
            const updatedFile = await FileTrackModel.findOneAndUpdate(
                { uniqueId },
                {
                    $set: { CurrDept: nextDept },
                    $addToSet: { comments: newComment, transitions: newTransition }
                },
                { new: true }
            );
    
            return res.status(200).json({ message: 'File sent for renegotiation successfully', data: updatedFile });
        } catch (error) {
            console.error('Error sending file for renegotiation:', error);
            return res.status(500).json({ message: 'Error sending file for renegotiation', error: error.message });
        }
    },
    renegotiateFile: async (req, res) => {
        try {
            const { uniqueId, comment, status } = req.body; 
            const file = await FileTrackModel.findOne({ uniqueId });
    
            if (!file || file.CurrDept !== 'Finance') {
                return res.status(400).json({ message: 'File not found or not at Finance department for verification' });
            }
    
            file.CurrDept = 'Purchase';
            file.renegotiation = status === 'Complete' ? 'Complete' : 'Incomplete';
    
            const newTransition = {
                FromDept: 'Finance',
                ToDept: 'Purchase',
                date: new Date(),
                status: 'renegotiation'
            };
    
            const newComment = {
                CurrDept: 'Finance',
                comment: comment,
                fileUrl: file.fileUrl 
            };
    
            file.comments.push(newComment);
            file.transitions.push(newTransition);
    
            await file.save();
            return res.status(200).json({ message: 'File sent for renegotiation', data: file });
        } catch (error) {
            return res.status(500).json({ message: 'Error sending file for renegotiation', error });
        }
    },
    updateRenegotiation : async(req,res) => {

        try {
            const { uniqueId } = req.body;
    
            // Validate input
            if (!uniqueId) {
                return res.status(400).json({ message: 'uniqueId is required' });
            }
    
            // Find the file based on the uniqueId
            const file = await FileTrackModel.findOne({ uniqueId });
    
            if (!file) {
                return res.status(404).json({ message: 'File not found' });
            }
    
            // Check if the current department is 'Purchase'
            if (file.CurrDept !== 'Purchase') {
                return res.status(400).json({ message: 'Renegotiation status can only be updated in the Purchase department.' });
            }
    
           
            file.renegotiation = 'Complete';

            const newTransition = {
                FromDept: "Purchase",
                ToDept: "Finance",
                date: new Date(),
                status: 'renegotiation complete'
            };
            
            file.transitions.push(newTransition);
            
            const updatedFile = await file.save();
    
            return res.status(200).json({ message: 'Renegotiation status updated to Complete', data: updatedFile });
        } catch (error) {
            console.error('Error updating renegotiation status:', error);
            return res.status(500).json({ message: 'Error updating renegotiation status', error });
        }
    
    },
    updateSpecialApproval: async (req, res) => {
        try {
            const { uniqueId } = req.body;
    
          
            if (!uniqueId) {
                return res.status(400).json({ message: 'uniqueId is required' });
            }
    
           
            const file = await FileTrackModel.findOne({ uniqueId });
    
            if (!file) {
                return res.status(404).json({ message: 'File not found' });
            }
    
           
            if (file.CurrDept !== 'President') {
                return res.status(400).json({
                    message: 'Special approval can only be updated in the President department.',
                });

            
            }
            if (file.specialApproval !== 'Yes') {
                return res.status(400).json({
                    message: 'File not eligible for special approval',
                });
            }
            
            file.specialApprovalStatus = 'Done';
    
            
            const newTransition = {
                FromDept: file.CurrDept,
                ToDept: 'Finance',
                date: new Date(),
                status: 'special approval complete',
                comment: 'Special approval completed by President and sent to Finance',
            };
    
            file.transitions.push(newTransition);
    
           
            file.CurrDept = 'Finance';
    
            
            const updatedFile = await file.save();
    
            return res.status(200).json({
                message: 'Special approval updated to Done and file sent to Finance',
                data: updatedFile,
            });
        } catch (error) {
            console.error('Error updating special approval:', error);
            return res.status(500).json({
                message: 'Error updating special approval',
                error: error.message,
            });
        }
    },
    markSpecialApprovalRequired: async (req, res) => {
        try {
            const { uniqueId } = req.body;
    
            
            if (!uniqueId) {
                return res.status(400).json({ message: 'uniqueId is required' });
            }
    
            
            const file = await FileTrackModel.findOne({ uniqueId });
    
            if (!file) {
                return res.status(404).json({ message: 'File not found' });
            }
    
            // Update specialApproval to 'Yes'
            file.specialApproval = 'Yes';
    
            // Save the changes
            const updatedFile = await file.save();
    
            return res.status(200).json({
                message: 'Special approval requirement updated to Yes',
                data: updatedFile,
            });
        } catch (error) {
            console.error('Error marking special approval as required:', error);
            return res.status(500).json({
                message: 'Error marking special approval as required',
                error: error.message,
            });
        }
    },
         
    
  

}