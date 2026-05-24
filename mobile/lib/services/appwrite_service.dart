import 'package:appwrite/appwrite.dart';
import 'package:flutter/foundation.dart';

/// Appwrite Service Configuration
/// Manages database, storage, and authentication through Appwrite backend
class AppwriteService {
  static final AppwriteService _instance = AppwriteService._internal();

  late Client _client;
  late Databases _databases;
  late Storage _storage;
  late Account _account;

  String get databaseId => const String.fromEnvironment('APPWRITE_DATABASE_ID',
      defaultValue: 'syllabustride_db');

  final Collections = {
    'users': const String.fromEnvironment('APPWRITE_USERS_COLLECTION',
        defaultValue: 'users'),
    'courses': const String.fromEnvironment('APPWRITE_COURSES_COLLECTION',
        defaultValue: 'courses'),
    'assignments': const String.fromEnvironment(
        'APPWRITE_ASSIGNMENTS_COLLECTION',
        defaultValue: 'assignments'),
    'submissions': const String.fromEnvironment(
        'APPWRITE_SUBMISSIONS_COLLECTION',
        defaultValue: 'submissions'),
  };

  final Buckets = {
    'syllabus': const String.fromEnvironment('APPWRITE_STORAGE_BUCKET_SYLLABUS',
        defaultValue: 'syllabi'),
    'uploads': const String.fromEnvironment('APPWRITE_STORAGE_BUCKET_UPLOADS',
        defaultValue: 'user_uploads'),
  };

  factory AppwriteService() {
    return _instance;
  }

  AppwriteService._internal() {
    _initializeClient();
  }

  /// Initialize Appwrite client
  void _initializeClient() {
    _client = Client();

    _client
        .setEndpoint(const String.fromEnvironment('APPWRITE_ENDPOINT',
            defaultValue: 'https://cloud.appwrite.io/v1'))
        .setProject(const String.fromEnvironment('APPWRITE_PROJECT_ID',
            defaultValue: 'your_project_id'))
        .setSelfSigned(
            adopt: kDebugMode); // Only for development self-signed certificates

    _databases = Databases(_client);
    _storage = Storage(_client);
    _account = Account(_client);

    if (kDebugMode) {
      debugPrint('✅ Appwrite client initialized');
    }
  }

  /// Create a new document in a collection
  Future<Document> createDocument({
    required String collectionName,
    required Map<String, dynamic> data,
  }) async {
    try {
      final collectionId = Collections[collectionName];
      if (collectionId == null) {
        throw Exception('Collection $collectionName not configured');
      }

      final doc = await _databases.createDocument(
        databaseId: databaseId,
        collectionId: collectionId,
        documentId: ID.unique(),
        data: data,
      );

      if (kDebugMode) {
        debugPrint('✅ Document created in $collectionName: ${doc.$id}');
      }
      return doc;
    } catch (e) {
      if (kDebugMode) {
        debugPrint('❌ Error creating document in $collectionName: $e');
      }
      rethrow;
    }
  }

  /// Get a document by ID
  Future<Document> getDocument({
    required String collectionName,
    required String documentId,
  }) async {
    try {
      final collectionId = Collections[collectionName];
      if (collectionId == null) {
        throw Exception('Collection $collectionName not configured');
      }

      final doc = await _databases.getDocument(
        databaseId: databaseId,
        collectionId: collectionId,
        documentId: documentId,
      );

      return doc;
    } catch (e) {
      if (kDebugMode) {
        debugPrint(
            '❌ Error fetching document from $collectionName: $e');
      }
      rethrow;
    }
  }

  /// List documents with filters and pagination
  Future<DocumentList> listDocuments({
    required String collectionName,
    List<String>? queries,
    int limit = 25,
    int offset = 0,
  }) async {
    try {
      final collectionId = Collections[collectionName];
      if (collectionId == null) {
        throw Exception('Collection $collectionName not configured');
      }

      final docs = await _databases.listDocuments(
        databaseId: databaseId,
        collectionId: collectionId,
        queries: queries ?? [],
        limit: limit,
        offset: offset,
      );

      return docs;
    } catch (e) {
      if (kDebugMode) {
        debugPrint('❌ Error listing documents from $collectionName: $e');
      }
      rethrow;
    }
  }

  /// Update a document
  Future<Document> updateDocument({
    required String collectionName,
    required String documentId,
    required Map<String, dynamic> data,
  }) async {
    try {
      final collectionId = Collections[collectionName];
      if (collectionId == null) {
        throw Exception('Collection $collectionName not configured');
      }

      final doc = await _databases.updateDocument(
        databaseId: databaseId,
        collectionId: collectionId,
        documentId: documentId,
        data: data,
      );

      if (kDebugMode) {
        debugPrint('✅ Document updated in $collectionName: ${doc.$id}');
      }
      return doc;
    } catch (e) {
      if (kDebugMode) {
        debugPrint('❌ Error updating document in $collectionName: $e');
      }
      rethrow;
    }
  }

  /// Delete a document
  Future<void> deleteDocument({
    required String collectionName,
    required String documentId,
  }) async {
    try {
      final collectionId = Collections[collectionName];
      if (collectionId == null) {
        throw Exception('Collection $collectionName not configured');
      }

      await _databases.deleteDocument(
        databaseId: databaseId,
        collectionId: collectionId,
        documentId: documentId,
      );

      if (kDebugMode) {
        debugPrint(
            '✅ Document deleted from $collectionName: $documentId');
      }
    } catch (e) {
      if (kDebugMode) {
        debugPrint('❌ Error deleting document from $collectionName: $e');
      }
      rethrow;
    }
  }

  /// Upload a file to storage bucket
  Future<File> uploadFile({
    required String bucketName,
    required String filePath,
    String? fileId,
  }) async {
    try {
      final bucketId = Buckets[bucketName];
      if (bucketId == null) {
        throw Exception('Bucket $bucketName not configured');
      }

      final file = await _storage.createFile(
        bucketId: bucketId,
        fileId: fileId ?? ID.unique(),
        file: InputFile.fromPath(path: filePath),
      );

      if (kDebugMode) {
        debugPrint('✅ File uploaded to $bucketName: ${file.$id}');
      }
      return file;
    } catch (e) {
      if (kDebugMode) {
        debugPrint('❌ Error uploading file to $bucketName: $e');
      }
      rethrow;
    }
  }

  /// Get file preview URL
  String getFilePreview({
    required String bucketName,
    required String fileId,
  }) {
    try {
      final bucketId = Buckets[bucketName];
      if (bucketId == null) {
        throw Exception('Bucket $bucketName not configured');
      }

      return _storage.getFilePreview(
        bucketId: bucketId,
        fileId: fileId,
      );
    } catch (e) {
      if (kDebugMode) {
        debugPrint('❌ Error getting file preview from $bucketName: $e');
      }
      rethrow;
    }
  }

  /// Get file download URL
  String getFileDownload({
    required String bucketName,
    required String fileId,
  }) {
    try {
      final bucketId = Buckets[bucketName];
      if (bucketId == null) {
        throw Exception('Bucket $bucketName not configured');
      }

      return _storage.getFileDownload(
        bucketId: bucketId,
        fileId: fileId,
      );
    } catch (e) {
      if (kDebugMode) {
        debugPrint('❌ Error getting file download from $bucketName: $e');
      }
      rethrow;
    }
  }

  /// Delete a file from storage
  Future<void> deleteFile({
    required String bucketName,
    required String fileId,
  }) async {
    try {
      final bucketId = Buckets[bucketName];
      if (bucketId == null) {
        throw Exception('Bucket $bucketName not configured');
      }

      await _storage.deleteFile(
        bucketId: bucketId,
        fileId: fileId,
      );

      if (kDebugMode) {
        debugPrint('✅ File deleted from $bucketName: $fileId');
      }
    } catch (e) {
      if (kDebugMode) {
        debugPrint('❌ Error deleting file from $bucketName: $e');
      }
      rethrow;
    }
  }

  /// Test connection to Appwrite
  Future<bool> testConnection() async {
    try {
      // Try to list collections as a connection test
      await _databases.list();
      if (kDebugMode) {
        debugPrint('✅ Appwrite connection successful');
      }
      return true;
    } catch (e) {
      if (kDebugMode) {
        debugPrint('❌ Appwrite connection failed: $e');
      }
      return false;
    }
  }

  /// Get current user account
  Future<User> getCurrentUser() async {
    try {
      final user = await _account.get();
      return user;
    } catch (e) {
      if (kDebugMode) {
        debugPrint('❌ Error getting current user: $e');
      }
      rethrow;
    }
  }

  /// Logout user
  Future<void> logout() async {
    try {
      await _account.deleteSession(sessionId: 'current');
      if (kDebugMode) {
        debugPrint('✅ User logged out');
      }
    } catch (e) {
      if (kDebugMode) {
        debugPrint('❌ Error logging out: $e');
      }
      rethrow;
    }
  }
}
