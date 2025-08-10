# Memory Bank - DeFi Data API

## Overview
This memory bank contains AI-optimized documentation to maintain context across development sessions. It helps AI assistants understand the project quickly and maintain consistency.

## Memory Bank Files

### Core Documentation
- **`projectbrief.md`** - High-level project overview and goals
- **`codebase-context.md`** - Architecture, patterns, and code organization
- **`active-development.md`** - Current development status and work in progress
- **`development-guidelines.md`** - Coding standards and best practices

### Maintenance Files
- **`update-memory.js`** - Auto-update script for documentation
- **`last-update.json`** - Timestamp tracking for updates
- **`last-structure.json`** - Code structure change detection

## Usage

### For AI Assistants
When starting a new session, read these files in order:
1. `projectbrief.md` - Understand the project
2. `codebase-context.md` - Learn the architecture
3. `active-development.md` - Know current status
4. `development-guidelines.md` - Follow coding standards

### For Developers
- **Manual Update**: Edit files when major changes occur
- **Auto Update**: Run `pnpm run memory:update` or `npm run memory:update` to sync with latest changes
- **Review**: Check memory bank accuracy during code reviews

## Maintenance

### When to Update
- After completing major features
- When changing architecture patterns
- Before switching development context
- During code reviews

### Auto-Update Script
```bash
npm run memory:update
```
```bash
pnpm run memory:update
```
The script automatically:
- Checks for recent git commits
- Updates current branch information
- Tracks code structure changes
- Maintains documentation accuracy

### Manual Updates
Edit files directly when:
- Project goals change
- New architectural decisions are made
- Development workflow changes
- New team members join

## Benefits

### For AI Development
- **Context Preservation**: AI understands project immediately
- **Consistency**: Maintains coding patterns across sessions
- **Efficiency**: Reduces explanation time
- **Quality**: Better adherence to project standards

### for Team Development
- **Onboarding**: New developers understand project quickly
- **Documentation**: Always up-to-date project documentation
- **Decision Tracking**: Records architectural decisions
- **Knowledge Sharing**: Centralized project knowledge

## Memory Bank Structure
```
.cursor/memory/
├── README.md                    # This file
├── projectbrief.md              # Project overview
├── codebase-context.md          # Technical architecture
├── active-development.md        # Current status
├── development-guidelines.md    # Coding standards
├── update-memory.js            # Auto-update script
├── last-update.json            # Update timestamps
└── last-structure.json         # Structure tracking
```

## Integration with Development Workflow

### Git Hooks (Optional)
Consider adding to `.git/hooks/post-commit`:
```bash
#!/bin/bash
npm run memory:update

pnpm run memory:update 
```

### CI/CD Integration
Add memory bank validation to build process:
```bash
npm run memory:update
git diff --exit-code .cursor/memory/

pnpm run memory:update 
git diff --exit-code .cursor/memory/
```

## Best Practices

### Documentation Quality
- Keep information current and accurate
- Use consistent terminology
- Include specific examples
- Reference actual code locations

### Update Frequency
- After major features: Always update
- Daily development: Weekly updates
- Code reviews: Verify accuracy
- Team meetings: Review and update

### Content Guidelines
- **Specific**: Include concrete examples and patterns
- **Actionable**: Provide clear guidance for developers
- **Current**: Reflect actual codebase state
- **Focused**: Relevant to current development phase

## Troubleshooting

### Update Script Issues
If auto-update fails:
1. Check Node.js version compatibility
2. Verify git repository status
3. Check file permissions
4. Run script manually for debugging

### Documentation Drift
If memory bank becomes outdated:
1. Run full codebase analysis
2. Update all core files manually
3. Verify against actual implementation
4. Set up regular update schedule