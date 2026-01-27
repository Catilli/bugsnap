# Installation Instructions for Vitest and Testing Dependencies

## Issue
There appears to be an npm error preventing automatic installation. Follow these manual steps:

## Option 1: Manual Installation Steps

1. **Clear npm cache**:
   ```bash
   npm cache clean --force
   ```

2. **Delete node_modules and package-lock.json** (if they exist):
   ```bash
   # On Windows
   rmdir /s /q node_modules
   del package-lock.json
   
   # On Unix/Mac
   rm -rf node_modules package-lock.json
   ```

3. **Update npm to latest version**:
   ```bash
   npm install -g npm@latest
   ```

4. **Install dependencies**:
   ```bash
   cd apps/api
   npm install
   ```

## Option 2: Install Dependencies One by One

If Option 1 doesn't work, try installing dependencies individually:

```bash
cd apps/api

# Install vitest packages
npm install --save-dev vitest@^4.0.18
npm install --save-dev @vitest/coverage-v8@^4.0.18

# Install testing utilities
npm install --save-dev supertest@^6.3.4
npm install --save-dev @types/supertest@^6.0.2
```

## Option 3: Use Yarn Instead

If npm continues to have issues, try using yarn:

```bash
cd apps/api

# Install yarn if not already installed
npm install -g yarn

# Install dependencies
yarn install
```

## Verification

After installation, verify everything is working:

```bash
npm run test
```

## Security Note

The package.json includes an `overrides` section to fix the tar vulnerability:
```json
"overrides": {
  "tar": "^7.5.4"
}
```

This ensures the `tar` dependency is updated to a secure version, resolving the 2 high severity vulnerabilities reported by npm audit.

## Troubleshooting

If you continue to experience issues:

1. Check Node.js version (should be 18+ or 20+):
   ```bash
   node --version
   ```

2. Check npm version:
   ```bash
   npm --version
   ```

3. Try running npm with verbose logs:
   ```bash
   npm install --verbose
   ```

4. Check for any antivirus or security software that might be blocking npm operations

5. Try running your terminal as administrator (Windows) or with sudo (Unix/Mac) - though not recommended as a first option

## Contact

If none of these options work, the test files are all ready. The dependencies are:
- `vitest@^4.0.18`
- `@vitest/coverage-v8@^4.0.18`
- `supertest@^6.3.4`
- `@types/supertest@^6.0.2`

These can be installed through any package manager once the npm issues are resolved.