const mongoose = require('mongoose');
const Campground = require('../models/campground');
const cities = require('./cities');
const seedHelpers = require('./seedHelpers');

mongoose.connect('mongodb://localhost:27017/yelp-camp')
.then(()=>{
    console.log('MONGOOSE CONNECTION OPEN')
})
.catch((err)=> {
    console.log('MONGOOSE CONNECTION ERROR')
    Console.log(err)
})

const sample = array => array[Math.floor(Math.random() * array.length)]


async function seedDB() {
    await Campground.deleteMany({});
    for (let i = 0; i < 200; i++) {
        const random1000 = Math.floor(Math.random() * 1000);
        const price = Math.floor(Math.random()*20)+10;
        const camp = new Campground({
            author : '6250f3734944916b70f96549',
            title: `${sample(seedHelpers.descriptors)} ${sample(seedHelpers.places)}`,
            geometry: {
                type: 'Point',
                coordinates: [
                    cities[random1000].longitude,
                    cities[random1000].latitude,
                ]
            },
            location: `${cities[random1000].city} - ${cities[random1000].state}`,
            description :  '    Lorem ipsum dolor sit amet consectetur adipisicing elit. Tempora aliquam quas aspernatur velit repellendus quia quis cupiditate sequi unde, adipisci necessitatibus. Debitis minima aspernatur non corrupti enim accusantium, temporibus laborum!' ,
            price : price,
            images :  [
                {
                  url: 'https://res.cloudinary.com/dpuy14vfu/image/upload/v1649818716/yelpCamp/rgf0qvjn7b5hxw05fvxf.jpg',
                  filename: 'yelpCamp/rgf0qvjn7b5hxw05fvxf',
                },
                {
                  url: 'https://res.cloudinary.com/dpuy14vfu/image/upload/v1649818747/yelpCamp/unjxlwaxdemw9upgchog.jpg',
                  filename: 'yelpCamp/unjxlwaxdemw9upgchog',
                }
              ]  
        });
        await camp.save();
    }
}

seedDB()
.then(()=>{
    mongoose.connection.close()
})