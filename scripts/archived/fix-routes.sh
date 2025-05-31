#!/bin/bash

# Fix visibility route
echo "Fixing visibility route..."
sed -i '' '/export async function/,/^{/ {
  /^{/a\
  const { id } = await params;
}' src/app/api/ideas/\[id\]/visibility/route.ts

sed -i '' 's/params\.id/id/g' src/app/api/ideas/\[id\]/visibility/route.ts

# Fix main route
echo "Fixing main route..."
sed -i '' '/export async function GET/,/^{/ {
  /^{/a\
  const { id } = await params;
}' src/app/api/ideas/\[id\]/route.ts

sed -i '' '/export async function PATCH/,/^{/ {
  /^{/a\
  const { id } = await params;
}' src/app/api/ideas/\[id\]/route.ts

sed -i '' '/export async function DELETE/,/^{/ {
  /^{/a\
  const { id } = await params;
}' src/app/api/ideas/\[id\]/route.ts

sed -i '' 's/params\.id/id/g' src/app/api/ideas/\[id\]/route.ts

echo "Done!"
