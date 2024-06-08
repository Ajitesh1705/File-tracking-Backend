const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const commentSchema = new Schema({
    CurrDept: {
        type: String,
        required: true
    },
    comment: {
        type: String,
        required: true
    },
    fileUrl: {
        type: String,
        required: true
    },
    timestamp: {
        type: Date,
        default: Date.now
    }
});

const fileTransferSchema = new Schema({
    fileName: {
        type: String,
        required: true
    },
    CurrDept: {
        type: String,
        required: true
    },
    Department: {
        type: String,
        required: true
    },
    uniqueId: {
        type: String,
        required: true
    },
    transferDate: {
        type: Date,
        default: Date.now
    },
    comments: [commentSchema] // Array of comments
});

const FileTrackModel = mongoose.model('FileTransfer', fileTransferSchema);

module.exports = FileTrackModel;

