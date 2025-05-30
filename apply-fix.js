// Apply the TypeScript fixes for Poppy Idea Engine

// Read the file
const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src/components/chat/ChatInterface.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// Fix 1: Line 161 - The line already has safe navigation, but we need to ensure it's consistent
// The error says the line is: if (lastConv?.conversation_messages?.length > 0) {
// But from your terminal, it looks like it might have been changed. Let's fix it properly:
content = content.replace(
  /if \(lastConv[\?\.]conversation_messages[\?\.]length > 0\) \{/,
  'if (lastConv && lastConv.conversation_messages && Array.isArray(lastConv.conversation_messages) && lastConv.conversation_messages.length > 0) {'
);

// Fix 2: Line 554 - Add check for conversation.ideas before accessing its properties
// Find the setCurrentIdeaContext call and wrap it with a check
const pattern = /(\s+)setCurrentIdeaContext\(\{[\s\S]*?id: conversation\.ideas\.id,[\s\S]*?\}\);/;
const replacement = `$1if (conversation.ideas) {
$1  setCurrentIdeaContext({
$1    id: conversation.ideas.id,
$1    title: conversation.ideas.title,
$1    content: conversation.ideas.content,
$1    category: conversation.ideas.category
$1  });
$1}`;

content = content.replace(pattern, replacement);

// Write the fixed content back
fs.writeFileSync(filePath, content);

console.log('✅ TypeScript fixes applied successfully!');
console.log('Now run: npm run build');
