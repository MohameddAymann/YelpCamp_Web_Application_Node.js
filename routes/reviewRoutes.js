const express = require('express');
const router = express.Router({mergeParams:true});
const ExpressError = require('../utility/ExpressError');
const catchAsync = require('../utility/catchAsync');
const Review = require('../models/review');
const Campground = require('../models/campground');
const {reviewSchema} = require('../joiSchema');
const methodOverride = require('method-override');
const joi = require('joi');
const flash = require('connect-flash');
const {isLoggedIn,isReviewAuthor} = require('../middleware');



router.use(flash());

router.use(methodOverride('_method'));
router.use(express.urlencoded({extended:true}));


router.use((req,res,next)=> {
    res.locals.currentUser = req.user;
    res.locals.success = req.flash('success'),
    res.locals.error = req.flash('error');
    next()
});



const validateReview = (req,res,next) => {
    const {error} = reviewSchema.validate(req.body)
    console.log(error)
    if(error){
        const mss = error.details.map(el => el.message).join(',')
        throw new ExpressError(mss,400)

    }else{
        next()
    }
};




router.post('/', isLoggedIn, validateReview, catchAsync(async (req,res,next) => {
    const {id} = req.params;
    const {body,rating} = req.body.review;
    const review = new Review({body,rating});
    const campground = await Campground.findById(id);
    review.author = req.user.id;
    await campground.reviews.push(review);
    await review.save();
    await campground.save();
    req.flash('success','Successfully Made New Review!');
    res.redirect(`/campgrounds/${id}`);
}));

router.delete('/:reviewId' , isLoggedIn, isReviewAuthor, catchAsync( async (req,res,next) => {
    const {id,reviewId} = req.params;
    await Review.findByIdAndDelete(reviewId);
    await Campground.findByIdAndUpdate(id, { $pull : { reviews : reviewId } });
    req.flash('success','Successfully Deleted Review');
    res.redirect(`/campgrounds/${id}`);
}));



module.exports = router;