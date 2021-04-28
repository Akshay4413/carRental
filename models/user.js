const mongoose=require('mongoose');
const Schema=mongoose.Schema;


const userSchema = new Schema({
    facebook:{
        type:String
    },

    google:{
        type:String
    },

    firstname:{
        type:String,
       
    },

    lastname:{
        type:String
    },
    image:{
        type:String,
        default:'/image/Userlogo.png'
    },
    email:{
        type:String
    },
    password:{
        type:String
    },
    date:{
        type:Date,
        default:Date.now
    },
    online:{
        type:Boolean,
        default:false
    },
    bufferCommands:false,
    autoCreate:false
});

module.exports=mongoose.model('User',userSchema);