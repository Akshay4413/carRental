//load module
const express=require('express');
const exphbs=require('express-handlebars');
const mongoose=require('mongoose');
const bodyParser=require('body-parser')
const session=require('express-session');
const cookieParser=require('cookie-parser');
const passport=require('passport');
const bcrypt=require('bcryptjs');
require("dotenv").config();
const Handlebars = require('handlebars');
const {allowInsecurePrototypeAccess} = require('@handlebars/allow-prototype-access');
//init app
const app=express();
//Setup BodyParser Middleware

app.use(bodyParser.urlencoded({extended:false}));
app.use(bodyParser.json());

//Configuration for Authentication
app.use(cookieParser());
app.use(session({
    secret:'mysecret',
    resave:true,
    saveUninitialized:true
}));
app.use(passport.initialize());
app.use(passport.session());
//load Helpers
const{requireLogin,ensureGuest}=require('./helpers/authHelper')

//load passports
require('./passport/local');
require('./passport/facebook');

//Make user as a global object
app.use((req,res,next)=>{
    res.locals.user=req.user || null;
    next();
});

//load files
const keys=require('./config/keys');

//user collection
const User= require('./models/user');
const user = require('./models/user');

const Contact=require('./models/contact');
const div = require('./config/div');


//connect to Database
setTimeout(function(){
    mongoose.connect(div.mongoDB,{
        useNewUrlParser:true, 
        useUnifiedTopology:true, 
        serverSelectionTimeoutMS:5000
})
 
}, 60000);
    console.log('mongoDB is connect...');

 

//Setup view Engine
app.engine('handlebars',exphbs({
    defaultLayout:'main',
    handlebars:allowInsecurePrototypeAccess(Handlebars)
}));
app.set('view engine','handlebars');

//connect client side to server css and js file

app.use(express.static('public'));

// create port

const port = process.env.PORT|| 1995;

//handle home route

app.get('/',ensureGuest,(req,res)=>{
    res.render('home');
});

app.get('/about',ensureGuest,(req,res)=>{
    res.render('about',{
        title:'About'
    });
});


app.get('/contact',requireLogin,(req,res)=>{
    res.render('contact',{
        title:'Contact us'
    });
});

//Save contact form data
app.post('/contact',requireLogin,(req,res)=>{
    console.log(req.body);
    const newContact = {
        // email: req.body.email,
        name:req.user._id,
        message:req.body.message
    }
    new Contact(newContact).save((err,user)=>{
        if(err){
            throw err
        }
        else{
            console.log('We Received your Message',user);
        }
    });

});

app.get('/signup',ensureGuest,(req,res)=>{
    res.render('signupForm',{
        title:'Register'
    });
});
app.post('/signup',ensureGuest,(req,res)=>{
    console.log(req.body);
    let errors=[];
    if(req.body.password !==req.body.password2)
    {
        errors.push({text:'password does not match'});
    }
    if(req.body.password.length < 5)
    {
        errors.push({text:'password must be at least 5 characters'});
    }
    if(errors.length>0)
    {
        res.render('signupForm',{
            errors:errors,
            firstname:req.body.firstname,
            lastname:req.body.lastname,
            email:req.body.email,
            password:req.body.password,
            password2:req.body.password2
        })
    }
    else{
          User.findOne({email:req.body.email})
        .then((user)=>{
            if(user){
                let errors = [];
                errors.push({text:'Email already exist !'});
                res.render('signupForm',{
                    errors:errors,
                    firstname:req.body.firstname,
            lastname:req.body.lastname,
            email:req.body.email,
            password:req.body.password,
            password2:req.body.password2
                });
        }
            else {

                //encrypt password

                let salt=bcrypt.genSaltSync(10);
                let hash=bcrypt.hashSync(req.body.password,salt);
                
                const newUser = {
                    firstname:req.body.firstname,
                    lastname:req.body.lastname,
                    email:req.body.email,
                    password:hash
                }

                new User(newUser).save((err,user)=>{
                    if(err){
                        throw err;
                    }
                    if(user){
                        let success=[];
                        success.push({text:'Account Created Successfully! You Can Login now'});
                        res.render('loginForm',{
                            success:success
                        })
                    }
                })
            }
        }).catch((err)=>{
            console.log(err);
        });
    }
});
app.get('/displayLoginForm',ensureGuest,(req,res)=>{
    res.render('loginForm',{
        title:'Login'
    });
});

//passport authentication
app.post('/login',passport.authenticate('local',{
    successRedirect:'/profile',
    failureRedirect:'/loginErrors'
}));

app.get('/auth/facebook',passport.authenticate('facebook',{
    scope:['email']
}));
app.get('/auth/facebook/callback',passport.authenticate('facebook',{
    successRedirect:'/profile',
    failureRedirect:'/'
}));

//Display Profile
app.get('/profile',requireLogin,(req,res)=>{
    User.findById({_id:req.user._id})
    .then((user)=>{
       user.online=true;
       user.save((err,user)=>{
           if(err){
               throw err;
               if(user){
                res.render('profile',{
                    user:user,
                    title:'Profile'
                });
               }
           }
       })
    });
});
app.get('/loginErrors',(req,res)=>{
    let errors=[];
    errors.push({text:'User Not found or password incorrect'});
    res.render('loginForm',{
        errors:errors,
        title:'Error'
    });
});
//log user out
app.get('/logout',(req,res)=>{
    User.findById({_id:req.user._id})
    .then((user)=>{
        user.online=false;
        user.save((err,user)=>{
            if(err){
                throw err
            }
            if(user){
                req.logout();
                res.redirect('/');
            }
        });
    });
});
app.listen(port,()=>{
    console.log(`Server is running on port ${port}`)
});