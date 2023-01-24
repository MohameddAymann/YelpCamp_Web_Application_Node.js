const express = require('express');
const router = express.Router({mergeParams:true});
const User = require('../models/user');
const flash = require('connect-flash');
const catchAsync = require('../utility/catchAsync');
const ExpressError = require('../utility/ExpressError');
const passport = require('passport');



router.use(flash());


router.use((req,res,next)=> {
    res.locals.currentUser = req.user;
    res.locals.success = req.flash('success'),
    res.locals.error = req.flash('error');
    next()
});

router.use(express.urlencoded({extended:true}));




router.get('/register' , (req,res) => {
    res.render('users/register.ejs');
});


router.post('/register',catchAsync(async(req,res,next)=> {
    try{
        const {username,email,password} = req.body;
    const user = new User({email,username});
    const registerUser = await User.register(user,password);
    req.login(registerUser,(err)=>{
        if(err){
            next(err)
        }else{
            req.flash('success','Welcome to YelpCamp');
            res.redirect('/campgrounds');
        }
    })
    } catch(e){
        req.flash('error',e.message);
        res.redirect('/register');
    }
}));


router.get('/login' , (req,res)=> {
    res.render('users/login.ejs');
});

router.post('/login' , passport.authenticate('local' , {failureFlash:true , failureRedirect:'/login'}) , async(req,res)=> {
    req.flash('success','Welcome back');
    const redirectUrl = req.session.returnTo || '/campgrounds' ;
    delete req.session.returnTo ;
    res.redirect(redirectUrl);
});

router.get('/logout',(req,res)=> {
    req.logout();
    req.flash('success','Successfully logged out');
    res.redirect('/campgrounds');
})



module.exports = router;

