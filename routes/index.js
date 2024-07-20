const express = require('express');
const {ensureAuthenticated} = require('../utils/auth')
const { registerUser, loginUser, getUsers, registerFile,updateFileStatus, getFileNamesAndIds,getFilesByCurrDept, rework, getFileTimeline, getFilesSentFromDepartment, approveFile} = require('../userController');
const { userRegisterValidate, userLoginValidate, } = require('../utils/userValiadation');
const { verify } = require('jsonwebtoken');
const routes = express.Router();



routes.post('/register', userRegisterValidate ,registerUser);

routes.post('/login', userLoginValidate, loginUser);

routes.get('/users', getUsers);

routes.post('/registerfile', ensureAuthenticated,registerFile);

routes.get('/getname', getFileNamesAndIds);

routes.get('/files/:CurrDept', getFilesByCurrDept);

routes.post("/reworkfile" ,rework)

routes.post('/updatefilestatus',  updateFileStatus);

routes.post('/approveFile',  approveFile);

routes.get('/filetimeline/:uniqueId' , getFileTimeline)

routes.get('/sent-files/:department',  getFilesSentFromDepartment);

module.exports = routes