# Migration Guide

## Migrating from `github-pinned-pr-readme` to `github-readme-actions`

This guide helps you migrate from the old single-purpose action to the new modular platform.

## 🔄 **Required Changes**

### 1. **Update Repository Reference**
```yaml
# OLD
- uses: highlyavailable/github-pinned-pr-readme@v1

# NEW  
- uses: highlyavailable/github-readme-actions@v1
```

### 2. **Add ACTION_TYPE Parameter**
```yaml
# NEW - Required parameter
- uses: highlyavailable/github-readme-actions@v1
  with:
    ACTION_TYPE: 'pinned_prs'  # ← Add this line
    # ... your existing parameters
```

### 3. **Update README Section Comments**
```markdown
<!-- OLD -->
<!--START_SECTION:pinned-prs-->
<!--END_SECTION:pinned-prs-->

<!-- NEW -->
<!--START_SECTION:github-readme-actions-pinned_prs-->
<!--END_SECTION:github-readme-actions-pinned_prs-->
```

## 📝 **Complete Migration Example**

### Before (Old Action)
```yaml
name: Update Pinned PRs
on:
  schedule:
    - cron: '0 */6 * * *'

jobs:
  update:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: highlyavailable/github-pinned-pr-readme@v1
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
        with:
          MAX_LINES: 5
          PR_STATE: 'all'
```

### After (New Action)
```yaml
name: Update README
on:
  schedule:
    - cron: '0 */6 * * *'

jobs:
  update:
    runs-on: ubuntu-latest
    permissions:
      contents: write
    steps:
      - uses: actions/checkout@v4
      - uses: highlyavailable/github-readme-actions@v1
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
        with:
          ACTION_TYPE: 'pinned_prs'  # ← New required parameter
          MAX_LINES: 5
          PR_STATE: 'all'
```

## ✅ **Migration Checklist**

- [ ] Update workflow file with new repository name
- [ ] Add `ACTION_TYPE: 'pinned_prs'` parameter
- [ ] Update README section comments
- [ ] Test the workflow
- [ ] Verify output format

## 🆕 **New Features Available**

The new modular architecture brings:

- **Future Action Types**: Ready for `recent_commits`, `top_repos`, etc.
- **Better Error Handling**: Improved logging and error messages
- **Enhanced Filtering**: More precise control over PR selection
- **Consistent API**: Standardized input/output format

## 🐛 **Troubleshooting**

### Common Issues

1. **"Could not find section comments"**
   - Update your README section comments to the new format

2. **"Unknown action type"**
   - Make sure you added `ACTION_TYPE: 'pinned_prs'`

3. **"No PRs found"**
   - Check your filtering parameters (PR_STATE, START_DATE, etc.)

## 📞 **Support**

If you encounter issues during migration:
1. Check this migration guide
2. Review the [README](README.md) for full documentation
3. Open an issue with your workflow configuration 