const Layout = require("../models/layout")
const catchAsyncErrors = require("../middleware/catchAsyncErrors")
const ErrorHandler = require("../utils/ErrorHandler")
const cloudinary = require("cloudinary")

// create layout
const createLayout = catchAsyncErrors(async(req, res, next) => {
    try {
        const {type} = req.body;
       
        const isTypeExist = await Layout.findOne({type})
        if(isTypeExist){
            return next(new ErrorHandler(`${type} already exist`, 400))
        }
        if(type === "Banner"){
           const {image,title, subTitle} = req.body;
       
           const myCloud = await cloudinary.v2.uploader.upload(image, {
            folder : "layout"
           })
           const banner = {
            type: "Banner",
            banner: {
                image: {
                    public_id: myCloud.public_id,
                    url: myCloud.secure_url
                },
                title,
                subTitle
            }
        };
        await Layout.create(banner);
       
        }
        if(type === "FAQ"){
            const {faq} = req.body;
           
            const faqItems = await Promise.all(
                faq.map(async(item) => {
                    return {
                        question : item.question,
                        answer : item.answer
                    }
                })
            )
            await Layout.create({type : "FAQ", faq : faqItems})
        }
        if(type === "Categories"){
           const {categories} = req.body;
           const categoriesItem = await Promise.all(
            categories.map(async(item) => {
                return {
                    title : item.title,
                    
                }
            })
        )
           await Layout.create({type : "Categories", categories : categoriesItem})
        }
        res.status(200).json({
            success : true,
            message : "Layout created successfully",
           
        })
    } catch (error) {
        console.error("Error:", error);
        return next (new ErrorHandler(error.message, 500))
    }
})

// Edit Layout

const editLayout = catchAsyncErrors(async(req, res, next) => {
    try {
        const {type} = req.body;
        
        if(type === "Banner"){
            const bannerData = await Layout.findOne({type : "Banner"})
           const {image,title, subTitle} = req.body;
           const data = image.startsWith("https") ? bannerData : await cloudinary.v2.uploader.upload(image, {
            folder : "layout"
           })

           const banner = {
            type : "Banner",
            image :{
                public_id : image.startsWith("https") ?
                bannerData.banner.image.public_id : data?.public_id,
                url : image.startsWith("https") ?
                bannerData.banner.image.url : data?.secure_url
            },
            title, 
            subTitle
           }
           await Layout.findByIdAndUpdate(bannerData?._id, {banner})
           console.log(await Layout.findByIdAndUpdate(bannerData?._id, {banner}))
        }
        if(type === "FAQ"){
            const {faq} = req.body;
           const faqItem = await Layout.findOne({type : "FAQ"})
            const faqItems = await Promise.all(
                faq.map(async(item) => {
                    return {
                        question : item.question,
                        answer : item.answer
                    }
                })
            )
            await Layout.findByIdAndUpdate(faqItem?._id, {type : "FAQ", faq : faqItems})
        }
        if(type === "Categories"){
           const {categories} = req.body;
           const categoryItem = await Layout.findOne({type : "Categories"})
           const categoriesItem = await Promise.all(
            categories.map(async(item) => {
                return {
                    title : item.title,
                    
                }
            })
        )
           await Layout.findByIdAndUpdate(categoryItem?._id, {type : "Categories", categories : categoriesItem})
        }
        res.status(200).json({
            success : true,
            message : "Layout updated successfully"
        })
    } catch (error) {
        return next (new ErrorHandler(error.message, 500))
    }
})

// get Layout for Type
const getLayoutByType = catchAsyncErrors(async(req, res, next) => {
    try {
       const {type}  = req.params; 
        const layout = await Layout.findOne({type})
        res.status(200).json({
            success : true,
            layout
        })
    } catch (error) {
        return next (new ErrorHandler(error.message, 500)) 
    }
})
module.exports = {createLayout, editLayout, getLayoutByType}



// {
//     "question" : "Will I recieve a notification for each course?",
//     "answer" : "Yes - each student who complete any course will recieve a certifcate of completion to ackowledge their proficiency. We encourage students to include these  on their LinkedIn profiles and in their job application"
// },
// {
//     "question" : "Can I get source code of each course?",
//     "answer" : "Yes - You will get source code of all courses when you will watch the course vedio"
// },
// {
//     "question" : "Can I ask about anything related course or if my code doesn't work?",
//     "answer" : "Yes - You can comment on every part of the vedios in the course. We'll always try to reply to your comment and fix any issue you may have."
// },
//   {
//     "question" : "Can I download course vedios?",
//     "answer" : "For security reasons, course vedios can not be downloaded, However you may lifetime access to each purchased course and can watch anytime, anywhere with your account."
// }