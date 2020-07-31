const mongoose = require('mongoose');

let dbURI = 'mongodb+srv://Leon:*********************@codesolver-hgkoy.mongodb.net/codeManager?retryWrites=true&w=majority';
if (process.env.NODE_ENV === 'production') {
  dbURI = process.env.MONGODB_URI;
}

mongoose.Promise = global.Promise;
mongoose.connect(dbURI, {useNewUrlParser: true,
useUnifiedTopology: true
}).then(() =>{
console.log("Connected to MongoDB! :)");
}).catch((e)=>{
    console.log("Error connecting to MongoDB :(");
    console.log(e);
});

mongoose.set('useCreateIndex', true);
mongoose.set('useFindAndModify', false);


module.exports = {
    mongoose
};
    
