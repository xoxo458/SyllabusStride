import 'package:sentry_flutter/sentry_flutter.dart';
import 'package:flutter/foundation.dart';

/// Sentry Error Tracking Service
/// Production-grade error monitoring for mobile app
class SentryService {
  static bool _initialized = false;

  /// Initialize Sentry for error tracking
  static Future<void> initializeSentry({
    required String dsn,
    String environment = 'development',
    double tracesSampleRate = 0.1,
    double profilesSampleRate = 0.1,
  }) async {
    if (_initialized) return;

    if (dsn.isEmpty) {
      if (kDebugMode) {
        debugPrint('⏭️  Sentry DSN not configured');
      }
      return;
    }

    await SentryFlutter.init(
      (options) {
        options.dsn = dsn;
        options.environment = environment;
        options.tracesSampleRate = tracesSampleRate;
        options.profilesSampleRate = profilesSampleRate;
        options.maxBreadcrumbs = 50;
        options.attachStacktrace = true;
      },
      appRunner: () async {
        _initialized = true;
        if (kDebugMode) {
          debugPrint('✅ Sentry error tracking initialized');
        }
      },
    );
  }

  /// Capture exception with context
  static Future<SentryId> captureException(
    dynamic exception, {
    dynamic stackTrace,
    String? context,
    Map<String, dynamic>? contextData,
  }) async {
    return Sentry.captureException(
      exception,
      stackTrace: stackTrace,
      withScope: (scope) {
        if (context != null) {
          scope.setContext(context, contextData ?? {});
        }
      },
    );
  }

  /// Capture message
  static Future<SentryId> captureMessage(
    String message, {
    SentryLevel level = SentryLevel.info,
  }) async {
    return Sentry.captureMessage(
      message,
      level: level,
    );
  }

  /// Set user context for error tracking
  static void setUser({
    required String id,
    String? email,
    String? username,
  }) {
    Sentry.setUser(
      SentryUser(
        id: id,
        email: email,
        username: username,
      ),
    );
  }

  /// Clear user context
  static void clearUser() {
    Sentry.setUser(null);
  }

  /// Add breadcrumb for debugging
  static void addBreadcrumb({
    required String message,
    String category = 'info',
    Map<String, dynamic>? data,
    SentryLevel level = SentryLevel.info,
  }) {
    Sentry.addBreadcrumb(
      SentryBreadcrumb(
        message: message,
        category: category,
        level: level,
        data: data,
      ),
    );
  }

  /// Check if Sentry is initialized
  static bool get isInitialized => _initialized;
}
