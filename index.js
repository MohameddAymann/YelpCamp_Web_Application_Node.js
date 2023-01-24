if(process.env.NODE_ENV !== 'production'){
    require('dotenv').config()
}
const express = require('express');
const app = express();
const mongoose = require('mongoose');
const path = require('path');
const ejsMate = require('ejs-mate');
const ExpressError = require('./utility/ExpressError');
const campgroundRoutes = require('./routes/campgroundRoutes');
const reviewRoutes = require('./routes/reviewRoutes');
const session = require('express-session');
const flash = require('connect-flash');
const passport = require('passport');
const localStrategy = require('passport-local');
// the passport local moongoose in model only
const User = require('./models/user');
const userRoutes = require('./routes/userRoutes');
const mongoSanitize = require('express-mongo-sanitize');
const helmet = require('helmet');
const MongoDBStore = require('connect-mongo');


const dbUrl = process.env.DB_URL || 'mongodb://localhost:27017/yelp-camp'
mongoose.connect(dbUrl)
.then(()=>{
    console.log('MONGOOSE CONNECTION OPEN')
})
.catch((err)=> {
    console.log('MONGOOSE CONNECTION ERROR')
    Console.log(err)
})


app.set('view engine','ejs');
app.set('views',path.join(__dirname,'/views'));
app.engine('ejs',ejsMate);



const secret = process.env.SECRET || 'thisIsTheSecret'
 
const store = MongoDBStore.create({
    mongoUrl : dbUrl,
    secret: secret,
    touchAfter: 24 * 60 * 60,
});

store.on('error',function(e){
    console.log('SESSION STORE ERROR',e);
});


const sessionConfigure = {
    store : store,
    secret : secret,
    resave : false,
    saveUninitialized : true,
    cookie : {
        httpOnly : true,
        expires : Date.now() + 1000 * 60 * 60 * 24 * 7 ,
        maxAge : 1000 * 60 * 60 * 24 * 7 ,
    }
}

app.use(session(sessionConfigure));
app.use(flash());
// those must below the use of session and flash
app.use(passport.initialize());
app.use(passport.session());
passport.use(new localStrategy(User.authenticate()));

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());
//
app.use('/campgrounds',campgroundRoutes);
app.use('/campgrounds/:id/reviews',reviewRoutes);
app.use('/',userRoutes);
app.use(express.urlencoded({extended:true}));
app.use(express.static(path.join(__dirname,'public')));
app.use(mongoSanitize({
    replaceWith: '-'
}));
app.use(helmet());
app.use((req,res,next)=> {
    res.locals.currentUser = req.user;
    res.locals.success = req.flash('success');
    res.locals.error = req.flash('error');
    next()
});




const scriptSrcUrls = [
    "https://cdn.jsdelivr.net/npm/bootstrap@5.1.3/dist/js/bootstrap.min.js",
    "https://api.tiles.mapbox.com/",
    "https://api.mapbox.com/",
    "https://kit.fontawesome.com/",
    "https://cdnjs.cloudflare.com/",
    "https://cdn.jsdelivr.net",
];
const styleSrcUrls = [
    "https://kit-free.fontawesome.com/",
    "https://cdn.jsdelivr.net/npm/bootstrap@5.1.3/dist/css/bootstrap.min.css",
    "https://api.mapbox.com/",
    "https://api.tiles.mapbox.com/",
    "https://fonts.googleapis.com/",
    "https://use.fontawesome.com/",
];
const connectSrcUrls = [
    "https://api.mapbox.com/",
    "https://a.tiles.mapbox.com/",
    "https://b.tiles.mapbox.com/",
    "https://events.mapbox.com/",
];
const fontSrcUrls = [];
app.use(
    helmet.contentSecurityPolicy({
        directives: {
            defaultSrc: [],
            connectSrc: ["'self'", ...connectSrcUrls],
            scriptSrc: ["'unsafe-inline'", "'self'", ...scriptSrcUrls],
            styleSrc: ["'self'", "'unsafe-inline'", ...styleSrcUrls],
            workerSrc: ["'self'", "blob:"],
            objectSrc: [],
            imgSrc: [
                "'self'",
                "blob:",
                "data:",
                "https://res.cloudinary.com/dpuy14vfu/", //SHOULD MATCH YOUR CLOUDINARY ACCOUNT! 
                "https://images.unsplash.com/",
            ],
            fontSrc: ["'self'", ...fontSrcUrls],
        },
    })
);



 


app.get('/' , (req,res) => {
    res.render('home.ejs');
});

app.all('*',(req,res,next)=>{
    throw new ExpressError('PAGE NOT FOUND',404);
    next(e);
});

app.use((err,req,res,next)=>{
   const {status=500} = err;
   if(!err.message){
       err.message = 'SOMETHING WENT WRONG'
   }
   res.status(status).render('error.ejs',{err});
});

const port = process.env.PORT || 3000
app.listen(port , (req,res)=> {
    console.log(`START SERVING ON PORT ${port}`);
});