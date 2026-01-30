#!/bin/bash

echo "🧪 Running comprehensive test suite..."

echo "🔧 Running type checking..."
bun run typecheck
if [ $? -ne 0 ]; then
  echo "❌ Type checking failed"
  exit 1
fi

echo "🧪 Running API tests..."
cd apps/api && bun test
if [ $? -ne 0 ]; then
  echo "❌ API tests failed"
  exit 1
fi

echo "🧪 Running web tests..."
cd apps/web && bun test
if [ $? -ne 0 ]; then
  echo "❌ Web tests failed"
  exit 1
fi

echo "🏗 Running build check..."
bun run build
if [ $? -ne 0 ]; then
  echo "❌ Build failed"
  exit 1
fi

echo "✅ All tests passed!"
echo "📊 Running test coverage report..."
cd apps/api && bun test --coverage
cd apps/web && bun test --coverage

echo "🎉 Testing complete!"