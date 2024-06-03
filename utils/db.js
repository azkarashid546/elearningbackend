const mongoose = require("mongoose");
require("dotenv").config()

const connectToMongo = async () => {
  try{
    await mongoose.set('strictQuery', false)
    await mongoose.connect(process.env.MONGOURL, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        serverSelectionTimeoutMS: 5000,
        writeConcern: { w: 'majority' },
    })
    console.log("Connected to Mongo Successfully")

} 
catch(error){
    console.log(error)
    process.exit()
}
};
module.exports = connectToMongo;