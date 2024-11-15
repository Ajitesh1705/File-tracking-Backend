const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const commentSchema = new Schema({
    CurrDept: {
        type: String,
        required: true
    },
    comment: {
        type: String,
        required: false
    },
    fileUrl: {
        type: String,
        required: false
    },
    BudgetfileUrl: {
        type: String,
       required : false
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
        default: Date.now,
    },
    status: {
        type: String,
        enum: ['saved', 'sent', 'received', 'rework','renegotiation', 'renegotiation complete'],
        default: 'sent'
    },
    comment:{
        type: String,
        required: false
    }
});
const fileTransferSchema = new Schema({
    CurrDept: {
        type: String,
        required: true
    },
    fileDescription: {
        type: String,
        required: true
    },
    cost: {
        type: Number,
        required: true
    },
    ForDepartment: {
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
    renegotiation: { type: String, 
        enum: ['Incomplete', 'Complete'],
        default: 'Incomplete' },
    comments: [commentSchema], 
    transitions: [transitionSchema],
    approved: {
        type: Boolean,
        default: false
    },
    sentHistory: [{
        department: String,
        timestamp: { type: Date, default: Date.now }
    }]

});

const FileTrackModel = mongoose.model('FileTransfer', fileTransferSchema);

module.exports = FileTrackModel;

