const mongoose = require('mongoose');

const TaskSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
        minlength: 1,
        trim: true //trims white space..
    },
    _userId: {
        type: mongoose.Types.ObjectId,
        required: true
    }
})

const Task = mongoose.model('Task', TaskSchema);

module.exports = { Task }
