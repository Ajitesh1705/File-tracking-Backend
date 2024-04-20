const express = require('express');
const { registerUser, loginUser, getUsers, registerFile, getFileNamesAndIds} = require('../userController');
const { userRegisterValidate, userLoginValidate, verifyToken} = require('../utils/userValiadation');

const routes = express.Router();



 routes.post('/register', userRegisterValidate ,registerUser);

routes.post('/login', userLoginValidate, loginUser);

routes.get('/users', getUsers);

routes.post('/registerfile', verifyToken, registerFile);

routes.get('/getname', getFileNamesAndIds);


module.exports = routes