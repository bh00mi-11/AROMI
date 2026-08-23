import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../features/auth/login_screen.dart';
import '../features/dashboard/dashboard_screen.dart';
import '../features/voice/voice_screen.dart';
import '../features/growth/growth_screen.dart';

final router = GoRouter(
  initialLocation: '/login',
  routes: [
    GoRoute(path: '/login', builder: (context, state) => const LoginScreen()),
    GoRoute(path: '/dashboard', builder: (context, state) => const DashboardScreen()),
    GoRoute(path: '/voice', builder: (context, state) => const VoiceScreen()),
    GoRoute(path: '/growth', builder: (context, state) => const GrowthTrackerScreen()),
  ],
);
