import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

final weightProvider = StateProvider<double?>((ref) => null);

class GrowthTrackerScreen extends ConsumerWidget {
  const GrowthTrackerScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final weight = ref.watch(weightProvider);
    return Scaffold(
      appBar: AppBar(title: const Text('Growth Tracker')),
      body: Center(
        child: Text(
          weight != null ? 'Weight: $weight kg' : 'No weight data yet',
          style: Theme.of(context).textTheme.headlineMedium,
        ),
      ),
    );
  }
}
