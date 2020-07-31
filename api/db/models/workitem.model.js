const mongoose = require('mongoose');

const WorkItemSchema = new mongoose.Schema({
    title: {
        type: String,
        //required: true,
        minlength: 1,
        trim: true //trims white space..
    },
    _taskId: {
        type: mongoose.Types.ObjectId,
        required:true
    },
    complete: {
        type:Boolean,
        default:false
    }
})

const WorkItem = mongoose.model('WorkItem', WorkItemSchema);

module.exports = { WorkItem }