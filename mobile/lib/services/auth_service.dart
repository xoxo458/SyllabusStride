import 'package:flutter/foundation.dart';
import 'appwrite_service.dart';

/// Authentication Service
/// Handles user authentication with Clerk or Appwrite Auth
class AuthService extends ChangeNotifier {
  final AppwriteService _appwriteService = AppwriteService();

  bool _isAuthenticated = false;
  String? _userId;
  String? _userEmail;
  String? _userName;

  // Getters
  bool get isAuthenticated => _isAuthenticated;
  String? get userId => _userId;
  String? get userEmail => _userEmail;
  String? get userName => _userName;

  /// Check if user is already logged in
  Future<void> checkAuthStatus() async {
    try {
      final user = await _appwriteService.getCurrentUser();
      _userId = user.$id;
      _userEmail = user.email;
      _userName = user.name;
      _isAuthenticated = true;
      notifyListeners();
    } catch (e) {
      _isAuthenticated = false;
      _userId = null;
      _userEmail = null;
      _userName = null;
      notifyListeners();
    }
  }

  /// Login user (placeholder - integrate with Clerk)
  Future<bool> login(String email, String password) async {
    try {
      // TODO: Integrate with Clerk authentication
      if (kDebugMode) {
        debugPrint('🔐 Login attempt for: $email');
      }
      return false;
    } catch (e) {
      if (kDebugMode) {
        debugPrint('❌ Login failed: $e');
      }
      return false;
    }
  }

  /// Register new user (placeholder - integrate with Clerk)
  Future<bool> register({
    required String email,
    required String password,
    required String name,
  }) async {
    try {
      // TODO: Integrate with Clerk registration
      if (kDebugMode) {
        debugPrint('📝 Registration attempt for: $email');
      }
      return false;
    } catch (e) {
      if (kDebugMode) {
        debugPrint('❌ Registration failed: $e');
      }
      return false;
    }
  }

  /// Logout user
  Future<void> logout() async {
    try {
      await _appwriteService.logout();
      _isAuthenticated = false;
      _userId = null;
      _userEmail = null;
      _userName = null;
      notifyListeners();
      if (kDebugMode) {
        debugPrint('✅ User logged out');
      }
    } catch (e) {
      if (kDebugMode) {
        debugPrint('❌ Logout failed: $e');
      }
    }
  }

  /// Reset password (placeholder)
  Future<bool> resetPassword(String email) async {
    try {
      // TODO: Integrate with Clerk password reset
      if (kDebugMode) {
        debugPrint('🔑 Password reset requested for: $email');
      }
      return false;
    } catch (e) {
      if (kDebugMode) {
        debugPrint('❌ Password reset failed: $e');
      }
      return false;
    }
  }
}
