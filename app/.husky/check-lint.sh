#!/bin/sh
exec 2>&1
echo "Running check-lint hooks..."
diffs=$(git diff --name-only @{push} | grep -E '\.(js|jsx|ts|tsx)$')
to_lint=""
for file in $diffs; do
  if [ -f $file ]; then
    to_lint="$to_lint $file"
  fi
done
if [ -z "$to_lint" ]; then
  echo "No files to lint"
  exit 0
fi
# echo "Linting files:"
# echo $to_lint
# Change to the app directory
cd app

# Adjust file paths to be relative to the app directory
adjusted_paths=""
for file in $to_lint; do
  adjusted_paths="$adjusted_paths $(echo $file | sed 's|^app/||')"
done

echo "Linting files:"
echo $adjusted_paths

# Run eslint in the app directory
npx eslint $adjusted_paths