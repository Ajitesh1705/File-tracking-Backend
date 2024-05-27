const express = require('express');
const {ensureAuthenticated} = require('../utils/auth')
const { registerUser, loginUser, getUsers, registerFile, getFileNamesAndIds} = require('../userController');
const { userRegisterValidate, userLoginValidate, verifyToken, upload} = require('../utils/userValiadation');
const routes = express.Router();



 routes.post('/register', userRegisterValidate ,registerUser);

routes.post('/login', userLoginValidate, loginUser);

routes.get('/users', getUsers);

routes.post('/registerfile', ensureAuthenticated, upload,registerFile);

routes.get('/getname', getFileNamesAndIds);


module.exports = routes