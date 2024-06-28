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

const transitionSchema = new Schema({
    FromDept: {
        type: String,
        required: true
    },
    ToDept: {
        type: String,
        required: true
    },
    date: {
        type: Date,
        default: Date.now
    },
    status: {
        type: String,
        enum: ['sent', 'received', 'rework'],
        default: 'sent'
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
    comments: [commentSchema], // Array of comments
    transitions: [transitionSchema]
});

const FileTrackModel = mongoose.model('FileTransfer', fileTransferSchema);

module.exports = FileTrackModel;

