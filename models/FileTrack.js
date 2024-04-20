
const mongoose = require('mongoose');
const Schema = mongoose.Schema;


const fileTransferSchema = new Schema({
    fileName: {
        type: String,
        required: true
    },
    fromDepartment: {
        type: String,
        required: true
    },
    toDepartment: {
        type: String,
        required: true
    },
    uniqueId:{
    type: String,
    required: true
    },
    transferDate: {
        type: Date,
        default: Date.now
    }

});

const FileTransferModel = mongoose.model('FileTransfer', fileTransferSchema);

module.exports = FileTransferModel;
