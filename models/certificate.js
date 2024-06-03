const mongoose = require("mongoose");
const { Schema } = mongoose;

const CertificateSchema = new Schema({
    courseId: {
      type: Schema.Types.ObjectId,
      ref: 'course',
      required: true,
    },
    certificate: {
      type: String,
      required: true,
    },
    uploadDate: {
      type: Date,
      default: Date.now,
    },
  });

  const Certificate = mongoose.model("certificate", CertificateSchema);
  module.exports = Certificate;