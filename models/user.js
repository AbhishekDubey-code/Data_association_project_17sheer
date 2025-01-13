const mongoose = require ('mongoose');

mongoose.connect("mongodb://localhost:27017/data_association_project");

const userSchema = mongoose.Schema({
    username: String,
    email:String,
    password: String,
    posts:[{type: mongoose.Schema.Types.ObjectId, ref:"post"}]
});

module.exports = mongoose.model('user', userSchema);