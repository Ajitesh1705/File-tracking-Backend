const express = require('express');
const {ensureAuthenticated} = require('../utils/auth')
const { registerUser, loginUser, getUsers, registerFile,updateFileStatus, getFileNamesAndIds,getFilesByCurrDept, rework, getFileTimeline, getFilesSentFromDepartment, approveFile, GetFilesSentForRework,  getFileReworkTimeline, getPresidentApprovedFiles,getReworkFilesByDept} = require('../userController');
const { userRegisterValidate, userLoginValidate,getApprovedFiles } = require('../utils/userValiadation');
const { verify } = require('jsonwebtoken');
const routes = express.Router();



routes.post('/register', userRegisterValidate ,registerUser);

routes.post('/login', userLoginValidate, loginUser);

routes.get('/users', getUsers);

routes.post('/registerfile', ensureAuthenticated,registerFile);

routes.post('/directorateregister' , ensureAuthenticated, registerFile)

routes.get('/getname', getFileNamesAndIds);

routes.get('/files/:CurrDept', getFilesByCurrDept);

routes.post("/reworkfile" ,rework)

routes.post('/updatefilestatus',  updateFileStatus);

routes.get('/filetimeline/:uniqueId' , getFileTimeline)

routes.get('/sent-files/:department',  getFilesSentFromDepartment);

routes.get('/getApproved', getApprovedFiles);

routes.post('/approveFile',  approveFile);

routes.get('/getRework/:department',  GetFilesSentForRework)

routes.get('/rework-timeline/:uniqueId', getFileReworkTimeline);

routes.get('/president-approved', getPresidentApprovedFiles);

routes.get('/get-rework/:department', getReworkFilesByDept);



module.exports = routes