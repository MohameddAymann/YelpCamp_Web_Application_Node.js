const mongoose = require('mongoose');
const Review = require('./review');




const ImageSchema = new mongoose.Schema({
    url: String,
    filename: String
});

ImageSchema.virtual('thumbnail').get(function () {
    return this.url.replace('/upload', '/upload/w_200');
});

const opts = {toJSON : {virtuals : true} };


const campgroundSchema = new mongoose.Schema({
    geometry : {
       type :  {
           type : String,
           enum : ['Point'],
           required : true,
        },
        coordinates : {
            type : [Number],
            required : true,
        },
    },
    title : String,
    images : [ImageSchema],
    price : Number,
    description : String,
    location : String,
    author : {
        type : mongoose.Schema.Types.ObjectId,
        ref : 'User'

    },
    reviews : [
        {
            type : mongoose.Schema.Types.ObjectId ,
            ref : 'Review'
        }
    ]
},opts);



campgroundSchema.virtual('properties.popUpMarkup').get(function () {
    return `
    <strong><a href="/campgrounds/${this.id}" >${this.title}</a></strong>
    <p>${this.description.substring(0,60)}...</p>
    
    ` ;
});

campgroundSchema.post('findOneAndDelete', async (campground) =>{
    if(campground.reviews.length){
        await Review.deleteMany({_id : {$in: campground.reviews}})
    }
})

const Campground = mongoose.model('Campground' , campgroundSchema);

module.exports = Campground ; 