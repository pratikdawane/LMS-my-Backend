const { S3Client } = require('@aws-sdk/client-s3')

const region = process.env.AWS_REGION || 'ap-south-1'
const s3 = new S3Client({
  region,
  credentials: process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY ? {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
  } : undefined
})

const bucket = process.env.S3_BUCKET_NAME

module.exports = { s3, bucket }