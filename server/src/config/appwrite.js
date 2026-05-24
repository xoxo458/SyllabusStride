const { Client, Databases, Storage, Users } = require('appwrite');
require('dotenv').config();

/**
 * Appwrite Service Configuration
 * Initializes Appwrite client and provides helper methods for database, storage, and user operations
 */

class AppwriteService {
  constructor() {
    this.client = new Client()
      .setEndpoint(process.env.APPWRITE_ENDPOINT)
      .setProject(process.env.APPWRITE_PROJECT_ID)
      .setKey(process.env.APPWRITE_API_KEY);

    this.databases = new Databases(this.client);
    this.storage = new Storage(this.client);
    this.users = new Users(this.client);

    this.databaseId = process.env.APPWRITE_DATABASE_ID;
    this.collections = {
      users: process.env.APPWRITE_USERS_COLLECTION,
      courses: process.env.APPWRITE_COURSES_COLLECTION,
      assignments: process.env.APPWRITE_ASSIGNMENTS_COLLECTION,
      submissions: process.env.APPWRITE_SUBMISSIONS_COLLECTION,
    };
    this.buckets = {
      syllabus: process.env.APPWRITE_STORAGE_BUCKET_SYLLABUS,
      uploads: process.env.APPWRITE_STORAGE_BUCKET_UPLOADS,
    };
  }

  /**
   * Test Appwrite Connection
   */
  async testConnection() {
    try {
      await this.databases.list(this.databaseId);
      console.log('✅ Appwrite connection successful');
      return true;
    } catch (error) {
      console.error('❌ Appwrite connection failed:', error.message);
      return false;
    }
  }

  /**
   * Create a new document in a collection
   */
  async createDocument(collectionName, data) {
    try {
      const collectionId = this.collections[collectionName];
      if (!collectionId) {
        throw new Error(`Collection ${collectionName} not configured`);
      }

      const doc = await this.databases.createDocument(
        this.databaseId,
        collectionId,
        'unique()',
        data
      );
      return doc;
    } catch (error) {
      console.error(`Error creating document in ${collectionName}:`, error);
      throw error;
    }
  }

  /**
   * Get a document by ID
   */
  async getDocument(collectionName, documentId) {
    try {
      const collectionId = this.collections[collectionName];
      const doc = await this.databases.getDocument(
        this.databaseId,
        collectionId,
        documentId
      );
      return doc;
    } catch (error) {
      console.error(`Error fetching document from ${collectionName}:`, error);
      throw error;
    }
  }

  /**
   * List documents with filters and pagination
   */
  async listDocuments(collectionName, filters = [], limit = 25, offset = 0) {
    try {
      const collectionId = this.collections[collectionName];
      const docs = await this.databases.listDocuments(
        this.databaseId,
        collectionId,
        filters,
        limit,
        offset
      );
      return docs;
    } catch (error) {
      console.error(`Error listing documents from ${collectionName}:`, error);
      throw error;
    }
  }

  /**
   * Update a document
   */
  async updateDocument(collectionName, documentId, data) {
    try {
      const collectionId = this.collections[collectionName];
      const doc = await this.databases.updateDocument(
        this.databaseId,
        collectionId,
        documentId,
        data
      );
      return doc;
    } catch (error) {
      console.error(`Error updating document in ${collectionName}:`, error);
      throw error;
    }
  }

  /**
   * Delete a document
   */
  async deleteDocument(collectionName, documentId) {
    try {
      const collectionId = this.collections[collectionName];
      await this.databases.deleteDocument(
        this.databaseId,
        collectionId,
        documentId
      );
      return { success: true, documentId };
    } catch (error) {
      console.error(`Error deleting document from ${collectionName}:`, error);
      throw error;
    }
  }

  /**
   * Upload a file to storage bucket
   */
  async uploadFile(bucketName, file, fileId = 'unique()') {
    try {
      const bucketId = this.buckets[bucketName];
      if (!bucketId) {
        throw new Error(`Bucket ${bucketName} not configured`);
      }

      const uploaded = await this.storage.createFile(
        bucketId,
        fileId,
        file
      );
      return uploaded;
    } catch (error) {
      console.error(`Error uploading file to ${bucketName}:`, error);
      throw error;
    }
  }

  /**
   * Get file preview
   */
  getFilePreview(bucketName, fileId) {
    try {
      const bucketId = this.buckets[bucketName];
      const previewUrl = this.storage.getFilePreview(bucketId, fileId);
      return previewUrl;
    } catch (error) {
      console.error(`Error getting file preview from ${bucketName}:`, error);
      throw error;
    }
  }

  /**
   * Get file download URL
   */
  getFileDownload(bucketName, fileId) {
    try {
      const bucketId = this.buckets[bucketName];
      const downloadUrl = this.storage.getFileDownload(bucketId, fileId);
      return downloadUrl;
    } catch (error) {
      console.error(`Error getting file download from ${bucketName}:`, error);
      throw error;
    }
  }

  /**
   * Delete a file from storage
   */
  async deleteFile(bucketName, fileId) {
    try {
      const bucketId = this.buckets[bucketName];
      await this.storage.deleteFile(bucketId, fileId);
      return { success: true, fileId };
    } catch (error) {
      console.error(`Error deleting file from ${bucketName}:`, error);
      throw error;
    }
  }

  /**
   * Create a new user (Appwrite Auth)
   */
  async createUser(userId, email, password, name = '') {
    try {
      const user = await this.users.create(
        userId || 'unique()',
        email,
        password,
        name
      );
      return user;
    } catch (error) {
      console.error('Error creating Appwrite user:', error);
      throw error;
    }
  }

  /**
   * Get user by ID
   */
  async getUser(userId) {
    try {
      const user = await this.users.get(userId);
      return user;
    } catch (error) {
      console.error('Error fetching user:', error);
      throw error;
    }
  }

  /**
   * Query documents with advanced filters
   */
  async queryDocuments(collectionName, queries = []) {
    try {
      const collectionId = this.collections[collectionName];
      const docs = await this.databases.listDocuments(
        this.databaseId,
        collectionId,
        queries
      );
      return docs;
    } catch (error) {
      console.error(`Error querying documents from ${collectionName}:`, error);
      throw error;
    }
  }
}

// Singleton instance
let appwriteService = null;

const getAppwriteService = () => {
  if (!appwriteService) {
    appwriteService = new AppwriteService();
  }
  return appwriteService;
};

module.exports = {
  AppwriteService,
  getAppwriteService,
};
