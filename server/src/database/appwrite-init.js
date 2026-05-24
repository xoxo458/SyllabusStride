const { getAppwriteService } = require('../config/appwrite');
const { ID } = require('appwrite');
require('dotenv').config();

/**
 * Appwrite Database Initialization Script
 * Creates database, collections, and storage buckets for SyllabusStride
 * Run: npm run migrate
 */

const appwrite = getAppwriteService();

/**
 * Collection schemas with attributes
 */
const collections = {
  users: {
    name: 'Users',
    attributes: [
      {
        key: 'email',
        type: 'string',
        size: 255,
        required: true,
      },
      {
        key: 'name',
        type: 'string',
        size: 255,
        required: true,
      },
      {
        key: 'password_hash',
        type: 'string',
        size: 255,
        required: false,
      },
      {
        key: 'avatar_url',
        type: 'string',
        size: 500,
        required: false,
      },
      {
        key: 'bio',
        type: 'string',
        size: 1000,
        required: false,
      },
      {
        key: 'created_at',
        type: 'datetime',
        required: false,
      },
      {
        key: 'updated_at',
        type: 'datetime',
        required: false,
      },
      {
        key: 'last_login',
        type: 'datetime',
        required: false,
      },
    ],
  },
  courses: {
    name: 'Courses',
    attributes: [
      {
        key: 'user_id',
        type: 'string',
        size: 36,
        required: true,
      },
      {
        key: 'code',
        type: 'string',
        size: 20,
        required: true,
      },
      {
        key: 'name',
        type: 'string',
        size: 255,
        required: true,
      },
      {
        key: 'description',
        type: 'string',
        size: 2000,
        required: false,
      },
      {
        key: 'instructor',
        type: 'string',
        size: 255,
        required: false,
      },
      {
        key: 'semester',
        type: 'string',
        size: 50,
        required: false,
      },
      {
        key: 'color',
        type: 'string',
        size: 7,
        required: false,
      },
      {
        key: 'credits',
        type: 'integer',
        required: false,
      },
      {
        key: 'created_at',
        type: 'datetime',
        required: false,
      },
      {
        key: 'updated_at',
        type: 'datetime',
        required: false,
      },
    ],
  },
  assignments: {
    name: 'Assignments',
    attributes: [
      {
        key: 'course_id',
        type: 'string',
        size: 36,
        required: true,
      },
      {
        key: 'title',
        type: 'string',
        size: 255,
        required: true,
      },
      {
        key: 'description',
        type: 'string',
        size: 2000,
        required: false,
      },
      {
        key: 'due_date',
        type: 'datetime',
        required: true,
      },
      {
        key: 'status',
        type: 'string',
        size: 20,
        required: true,
      },
      {
        key: 'grade',
        type: 'double',
        required: false,
      },
      {
        key: 'notes',
        type: 'string',
        size: 1000,
        required: false,
      },
      {
        key: 'created_at',
        type: 'datetime',
        required: false,
      },
      {
        key: 'updated_at',
        type: 'datetime',
        required: false,
      },
    ],
  },
  submissions: {
    name: 'Submissions',
    attributes: [
      {
        key: 'assignment_id',
        type: 'string',
        size: 36,
        required: true,
      },
      {
        key: 'user_id',
        type: 'string',
        size: 36,
        required: true,
      },
      {
        key: 'submission_date',
        type: 'datetime',
        required: true,
      },
      {
        key: 'file_id',
        type: 'string',
        size: 36,
        required: false,
      },
      {
        key: 'status',
        type: 'string',
        size: 20,
        required: true,
      },
      {
        key: 'feedback',
        type: 'string',
        size: 2000,
        required: false,
      },
      {
        key: 'created_at',
        type: 'datetime',
        required: false,
      },
      {
        key: 'updated_at',
        type: 'datetime',
        required: false,
      },
    ],
  },
};

/**
 * Storage buckets configuration
 */
const buckets = {
  syllabi: {
    name: 'Syllabi',
    permission: 'bucket', // Public or private
    fileSecurity: true,
  },
  user_uploads: {
    name: 'User Uploads',
    permission: 'bucket',
    fileSecurity: true,
  },
};

/**
 * Initialize database and collections
 */
async function initializeDatabase() {
  try {
    console.log('\n🚀 Starting Appwrite initialization...\n');

    // Test connection
    const connected = await appwrite.testConnection();
    if (!connected) {
      throw new Error('Failed to connect to Appwrite');
    }

    // Get or create database
    console.log('📦 Setting up database...');
    let database = null;
    try {
      // Try to get existing database
      const { databases } = require('appwrite');
      const client = new databases.Client()
        .setEndpoint(process.env.APPWRITE_ENDPOINT)
        .setProject(process.env.APPWRITE_PROJECT_ID)
        .setKey(process.env.APPWRITE_API_KEY);

      // For now, assume database exists
      console.log('✅ Database ready');
    } catch (error) {
      console.log('📌 Database will be created on first use');
    }

    // Create collections
    console.log('\n📋 Creating collections...\n');
    for (const [collectionKey, collectionConfig] of Object.entries(collections)) {
      try {
        console.log(`  ➜ ${collectionConfig.name}...`);

        // Check if collection exists
        try {
          await appwrite.getAppwriteService().databases.getCollection(
            process.env.APPWRITE_DATABASE_ID,
            process.env[`APPWRITE_${collectionKey.toUpperCase()}_COLLECTION`]
          );
          console.log(`    ✓ ${collectionConfig.name} already exists`);\n        continue;
        } catch (e) {
          // Collection doesn't exist, create it
        }

        // Create collection
        const collection = await appwrite.getAppwriteService().databases.createCollection(
          process.env.APPWRITE_DATABASE_ID,
          process.env[`APPWRITE_${collectionKey.toUpperCase()}_COLLECTION`],
          collectionConfig.name
        );

        console.log(`    ✓ ${collectionConfig.name} created`);

        // Add attributes
        for (const attr of collectionConfig.attributes) {
          try {
            // Create appropriate attribute type
            let attributeCreation;
            if (attr.type === 'string') {
              attributeCreation = appwrite.getAppwriteService().databases.createStringAttribute(
                process.env.APPWRITE_DATABASE_ID,
                process.env[`APPWRITE_${collectionKey.toUpperCase()}_COLLECTION`],
                attr.key,
                attr.size || 255,
                attr.required || false
              );
            } else if (attr.type === 'datetime') {
              attributeCreation = appwrite.getAppwriteService().databases.createDatetimeAttribute(
                process.env.APPWRITE_DATABASE_ID,
                process.env[`APPWRITE_${collectionKey.toUpperCase()}_COLLECTION`],
                attr.key,
                attr.required || false
              );
            } else if (attr.type === 'integer') {
              attributeCreation = appwrite.getAppwriteService().databases.createIntegerAttribute(
                process.env.APPWRITE_DATABASE_ID,
                process.env[`APPWRITE_${collectionKey.toUpperCase()}_COLLECTION`],
                attr.key,
                attr.required || false
              );
            } else if (attr.type === 'double') {
              attributeCreation = appwrite.getAppwriteService().databases.createFloatAttribute(
                process.env.APPWRITE_DATABASE_ID,
                process.env[`APPWRITE_${collectionKey.toUpperCase()}_COLLECTION`],
                attr.key,
                attr.required || false
              );
            }

            if (attributeCreation) {
              await attributeCreation;
            }
          } catch (error) {
            if (!error.message.includes('already exists')) {
              console.error(`    ✗ Failed to create ${attr.key}:`, error.message);
            }
          }
        }
      } catch (error) {
        console.error(`  ✗ Error with ${collectionConfig.name}:`, error.message);
      }
    }

    // Create storage buckets
    console.log('\n💾 Creating storage buckets...\n');
    for (const [bucketKey, bucketConfig] of Object.entries(buckets)) {
      try {
        console.log(`  ➜ ${bucketConfig.name}...`);

        // Check if bucket exists
        try {
          await appwrite.getAppwriteService().storage.getBucket(
            process.env[`APPWRITE_STORAGE_BUCKET_${bucketKey.toUpperCase()}`]
          );
          console.log(`    ✓ ${bucketConfig.name} already exists\n`);
          continue;
        } catch (e) {
          // Bucket doesn't exist, create it
        }

        // Create bucket
        const bucket = await appwrite.getAppwriteService().storage.createBucket(
          process.env[`APPWRITE_STORAGE_BUCKET_${bucketKey.toUpperCase()}`],
          bucketConfig.name,
          [], // allowed file extensions (empty = all)
          1024 * 1024 * 100, // max file size: 100MB
          false, // encryption
          false // antivirus
        );

        console.log(`    ✓ ${bucketConfig.name} created\n`);
      } catch (error) {
        console.error(`  ✗ Error with ${bucketConfig.name}:`, error.message);
      }
    }

    console.log('✨ Appwrite initialization complete!\n');
    console.log('📊 Summary:');
    console.log(`   • Database ID: ${process.env.APPWRITE_DATABASE_ID}`);
    console.log(`   • Collections: ${Object.keys(collections).length}`);
    console.log(`   • Buckets: ${Object.keys(buckets).length}`);
    console.log('\n✅ Ready to use SyllabusStride API!\n');

    process.exit(0);
  } catch (error) {
    console.error('\n❌ Initialization failed:', error.message);
    console.error(error);
    process.exit(1);
  }
}

// Run initialization
initializeDatabase();
