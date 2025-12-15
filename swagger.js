const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Linkcode LMS API',
      version: '1.0.0',
      description: 'API documentation for Linkcode Learning Management System',
    },
    servers: [
      {
        url: 'http://localhost:4000/api',
        description: 'Development server',
      },
    ],
    components: {
      securitySchemes: {
        BearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
      schemas: {
        User: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            firstName: { type: 'string' },
            lastName: { type: 'string' },
            email: { type: 'string' },
            role: { type: 'string', enum: ['student', 'instructor', 'admin'] },
            status: { type: 'string', enum: ['pending', 'approved', 'rejected'] },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },
        Lesson: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            title: { type: 'string' },
            description: { type: 'string' },
            durationSec: { type: 'number' },
            videoKey: { type: 'string' }
          }
        },
        Module: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            title: { type: 'string' },
            lessons: { type: 'array', items: { $ref: '#/components/schemas/Lesson' } }
          }
        },
        Course: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            instructor: { type: 'string' },
            title: { type: 'string' },
            description: { type: 'string' },
            price: { type: 'number' },
            currency: { type: 'string' },
            thumbnailKey: { type: 'string' },
            modules: { type: 'array', items: { $ref: '#/components/schemas/Module' } },
            status: { type: 'string', enum: ['draft', 'submitted', 'approved', 'rejected'] },
            isPublished: { type: 'boolean' },
            createdAt: { type: 'string', format: 'date-time' }
          }
        },
        CourseCreatePayload: {
          type: 'object',
          properties: {
            title: { type: 'string', example: 'Mastering DSA' },
            description: { type: 'string', example: 'In-depth DSA course' },
            price: { type: 'number', example: 999 },
            currency: { type: 'string', example: 'INR' },
            thumbnailKey: { type: 'string', example: 'thumbnails/123.png' },
            modules: { type: 'array', items: { $ref: '#/components/schemas/Module' } }
          },
          required: ['title']
        },
        Enrollment: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            user: { type: 'string' },
            course: { $ref: '#/components/schemas/Course' },
            progress: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  lessonId: { type: 'string' },
                  watchedSec: { type: 'number' },
                  completed: { type: 'boolean' }
                }
              }
            }
          }
        },
        Order: {
          type: 'object',
          properties: {
            _id: { type: 'string' },
            user: { type: 'string' },
            course: { type: 'string' },
            orderId: { type: 'string' },
            amount: { type: 'number' },
            currency: { type: 'string' },
            status: { type: 'string', enum: ['created', 'paid', 'failed'] }
          }
        },
        UploadPutUrlResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: {
              type: 'object',
              properties: { key: { type: 'string' }, url: { type: 'string' } }
            },
            error: { type: 'string', nullable: true }
          }
        },
        UploadInitiateResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: {
              type: 'object',
              properties: { key: { type: 'string' }, uploadId: { type: 'string' } }
            },
            error: { type: 'string', nullable: true }
          }
        },
        UploadPartUrlResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: { type: 'object', properties: { url: { type: 'string' } } },
            error: { type: 'string', nullable: true }
          }
        },
        UploadPart: {
          type: 'object',
          properties: { ETag: { type: 'string' }, PartNumber: { type: 'integer' } }
        },
        UploadCompleteResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: { type: 'object', properties: { location: { type: 'string' }, key: { type: 'string' } } },
            error: { type: 'string', nullable: true }
          }
        },
        Error: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: { type: 'null' },
            error: { type: 'string' },
          },
        },
      },
    },
  },
  apis: ['./src/routes/*.js'],
};

const swaggerSpec = swaggerJsdoc(options);
module.exports = swaggerSpec;
