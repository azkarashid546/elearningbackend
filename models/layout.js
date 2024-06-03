const mongoose = require("mongoose");
const { Schema } = mongoose;

const FaqSchema = new Schema({
    question: {
        type: String,
        required: true
    },
    answer: {
        type: String,
        required: true
    },
});

const CategorySchema = new Schema({
    title: {
        type: String,
        required: true
    }
});

const bannerImgSchema = new Schema({
    public_id: {
        type: String,
    },
    url: {
        type: String
    }
});

const LayoutSchema = new Schema({
    type: {
        type: String,
        required: true
    },
    faq: [FaqSchema],
    categories: [CategorySchema],
    banner: {
        image: bannerImgSchema,
        title: { type: String },
        subTitle: { type: String }
    }
});

const Layout = mongoose.model("Layout", LayoutSchema);
module.exports = Layout;
