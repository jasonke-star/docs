# Project Structure Guidelines

## Directory Organization
```
docs/
├── .cursor/
│   └── rules/           # Cursor AI rules and guidelines
├── api-reference/       # API documentation
├── essentials/          # Core concepts and getting started
├── images/             # All documentation images
├── logo/               # Brand assets
├── snippets/           # Code snippets and examples
├── docs.json           # Mintlify configuration
├── index.mdx           # Homepage
├── quickstart.mdx      # Quick start guide
└── development.mdx     # Development setup
```

## File Naming Conventions
- Use lowercase with hyphens: `getting-started.mdx`
- Be descriptive and consistent
- Avoid special characters and spaces
- Use `.mdx` extension for all documentation files

## Content Organization
- Group related content in subdirectories
- Keep individual files focused and manageable
- Use clear, hierarchical structure
- Maintain consistent navigation patterns

## Asset Management
- Store all images in `/images` directory
- Use descriptive filenames for assets
- Optimize images for web delivery
- Include alt text for accessibility

## Configuration Files
- `docs.json` - Main Mintlify configuration
- Keep configuration files at root level
- Document any custom configurations
- Version control all configuration changes

## Maintenance
- Regular cleanup of unused files
- Consistent file organization
- Clear separation of concerns
- Easy navigation for contributors
