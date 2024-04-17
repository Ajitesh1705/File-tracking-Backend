const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const UserSchema = new Schema({
    
    email:{
        type: String,
        required: true,
        unique: true
    },
    department:{
        type: String,
        required: true
    },
    password:{
        type: String,
        required: true
    },
    
});

const UserModel = mongoose.model('Login', UserSchema);
module.exports = UserModel;