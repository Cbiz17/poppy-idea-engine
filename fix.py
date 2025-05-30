with open('src/components/chat/ChatInterface.tsx', 'r') as f:
    lines = f.readlines()

# Find line 554 and add the check
for i, line in enumerate(lines):
    if i == 553 and 'setCurrentIdeaContext({' in line:
        lines[i] = line.replace('setCurrentIdeaContext({', 'if (conversation.ideas) {\n        setCurrentIdeaContext({')
        lines.insert(i+6, '        }\n')
        break

with open('src/components/chat/ChatInterface.tsx', 'w') as f:
    f.writelines(lines)

print("Fix applied!")
