import 'dart:convert';
import 'dart:io';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:record/record.dart';
import 'package:dio/dio.dart';
import 'package:permission_handler/permission_handler.dart';
import 'package:go_router/go_router.dart';
import '../../core/providers.dart';
import '../growth/growth_screen.dart';

class VoiceScreen extends ConsumerStatefulWidget {
  const VoiceScreen({super.key});
  @override
  ConsumerState<VoiceScreen> createState() => _VoiceScreenState();
}

class _VoiceScreenState extends ConsumerState<VoiceScreen> {
  final AudioRecorder _recorder = AudioRecorder();
  bool _isRecording = false;
  String? _audioPath;

  @override
  void dispose() {
    _recorder.dispose();
    super.dispose();
  }

  Future<void> _startRecording() async {
    final status = await Permission.microphone.request();
    if (status.isGranted) {
      if (await _recorder.hasPermission()) {
        final dir = Directory.systemTemp.path;
        _audioPath = '$dir/audio.m4a';
        await _recorder.start(const RecordConfig(), path: _audioPath!);
        setState(() => _isRecording = true);
      }
    }
  }

  Future<void> _stopRecording() async {
    final path = await _recorder.stop();
    setState(() => _isRecording = false);
    if (path != null) {
      await _uploadAudio(path);
    }
  }

  Future<void> _uploadAudio(String path) async {
    final dio = ref.read(dioProvider);
    final formData = FormData.fromMap({
      'audio': await MultipartFile.fromFile(path, filename: 'audio.m4a'),
      'context': jsonEncode({'current_route': '/dashboard'}),
    });

    try {
      final response = await dio.post('/voice/process', data: formData);
      _handleVoiceResponse(response.data);
    } catch (e) {
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Error processing voice: $e')));
    }
  }

  void _handleVoiceResponse(Map<String, dynamic> data) {
    final mode = data['mode'];
    switch (mode) {
      case 'navigate':
        final route = data['route'];
        if (route != null) context.go(route);
        break;
      case 'draft_update':
        if (data['target'] == 'weight' && data['value'] != null) {
          ref.read(weightProvider.notifier).state = (data['value'] as num).toDouble();
          context.go('/growth');
        }
        break;
      case 'pending_action':
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Action pending: ${data['message']}')));
        break;
      default:
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Unknown command')));
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Voice Assistant')),
      body: Center(
        child: GestureDetector(
          onLongPressStart: (_) => _startRecording(),
          onLongPressEnd: (_) => _stopRecording(),
          child: Container(
            width: 150,
            height: 150,
            decoration: BoxDecoration(
              color: _isRecording ? Colors.red : Colors.blue,
              shape: BoxShape.circle,
            ),
            child: const Icon(Icons.mic, size: 80, color: Colors.white),
          ),
        ),
      ),
    );
  }
}
