const express = require('express');
const router = express.Router({mergeParams:true});
const catchAsync = require('../utility/catchAsync');
const ExpressError = require('../utility/ExpressError');
const Campground = require('../models/campground');
const {campgroundSchema} = require('../joiSchema');
const methodOverride = require('method-override');
const joi = require('joi');
const flash = require('connect-flash');
const {isLoggedIn,isAuthor } = require('../middleware');
const passport = require('passport');
const multer = require('multer');
const {storage} = require('../cloudinary');
const upload = multer({storage});
const {cloudinary} = require('../cloudinary');
const mbxGeocoding = require('@mapbox/mapbox-sdk/services/geocoding');
const mapBosToken = process.env.MAPBOX_TOKEN;
const geocoder = mbxGeocoding({accessToken:mapBosToken});




router.use(flash());

router.use(methodOverride('_method'));
router.use(express.urlencoded({extended:true}));

router.use((req,res,next)=> {
    res.locals.currentUser = req.user;
    res.locals.success = req.flash('success'),
    res.locals.error = req.flash('error');
    next()
});


const validateCampground = (req,res,next)=>{
    const {error} = campgroundSchema.validate(req.body)
    if(error){
        const mss = error.details.map(el => el.message).join(',')
        throw new ExpressError(mss,400)
    }else{
        next()
    }
};



router.get('/' , catchAsync (async (req,res)=> {
    const campgrounds = await Campground.find({});
    res.render('campgrounds/index.ejs' , {campgrounds});
}));

router.get('/new', isLoggedIn, (req,res)=> {
    res.render('campgrounds/new.ejs');
});

router.post('/', isLoggedIn, upload.array('image'), catchAsync (async(req,res,next)=> {
    const geoData = await geocoder.forwardGeocode({
        query : req.body.campground.location,
        limit : 1,
    }).send()
    const campground = new Campground(req.body.campground);
    campground.geometry = geoData.body.features[0].geometry;
    campground.images = req.files.map(file => ({ url : file.path , filename : file.filename }));
    campground.author = req.user.id;
    await campground.save();
    req.flash('success','Successfuly Made New Campground!');
    res.redirect(`/campgrounds/${campground.id}`);
    console.log(campground)
}));

router.get('/:id/edit' ,isLoggedIn, isAuthor, catchAsync (async (req,res)=> {
    const {id} = req.params;
    const campground = await Campground.findById(id);
    if(!campground){
        req.flash('error','Cannot Find That Campground!');
        return res.redirect('/campgrounds');
    }
    res.render('campgrounds/edit.ejs',{campground});
    
}));

router.patch('/:id', isLoggedIn, isAuthor, upload.array('image'), catchAsync (async (req,res,next)=> {
        const {id} = req.params;
        const {title,location} = req.body.campground;
        const campground = await Campground.findByIdAndUpdate(id , { ...req.body.campground });
        const imgs = req.files.map(file => ({ url : file.path , filename : file.filename }));
        campground.images.push(...imgs);
        if(req.body.deleteImages){
            for(let filename of req.body.deleteImages){
                await cloudinary.uploader.destroy(filename);
            }
            await campground.updateOne({$pull: {images: {filename: {$in: req.body.deleteImages }}}});
        }
        await campground.save();
        req.flash('success','Successfully Udpated Campground!');
        res.redirect(`/campgrounds/${campground.id}`);
        console.log(req.body)
        
}));

router.delete('/:id',isLoggedIn, isAuthor, catchAsync (async (req,res)=> {
    const {id} = req.params;
    const campground = await Campground.findById(id);
    await Campground.findByIdAndDelete(id);
    req.flash('success','Successfully Deleted Campground');
    res.redirect('/campgrounds');
    
}));

router.get('/:id' , catchAsync (async (req,res)=> {
    const {id} = req.params;
    const campground =  await Campground.findById(id).populate({
        path : 'reviews',
         populate : { 
             path : 'author'
            }
        }).populate('author')
    if(!campground){
        req.flash('error','Cannot Find That Campground!');
        return res.redirect('/campgrounds');
    }
    res.render('campgrounds/show.ejs' , {campground});
}));




module.exports = router;