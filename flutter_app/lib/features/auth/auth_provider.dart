import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:dio/dio.dart';
import '../../core/providers.dart';

final authProvider = StateNotifierProvider<AuthNotifier, bool>((ref) {
  final storage = ref.watch(secureStorageProvider);
  final dio = ref.watch(dioProvider);
  return AuthNotifier(storage, dio);
});

class AuthNotifier extends StateNotifier<bool> {
  final FlutterSecureStorage storage;
  final Dio dio;

  AuthNotifier(this.storage, this.dio) : super(false) {
    _checkToken();
  }

  Future<void> _checkToken() async {
    final token = await storage.read(key: 'jwt_token');
    state = token != null;
  }

  Future<bool> login(String username, String password) async {
    try {
      final response = await dio.post('/auth/login', data: {
        'username': username,
        'password': password,
      });
      final token = response.data['token'];
      if (token != null) {
        await storage.write(key: 'jwt_token', value: token);
        state = true;
        return true;
      }
    } catch (e) {
      // Handle error implicitly by returning false
    }
    return false;
  }

  Future<void> logout() async {
    await storage.delete(key: 'jwt_token');
    state = false;
  }
}
