# Release process

## Versioning

[Semantic versioning](https://semver.org/). Breaking changes bump the major. Each major has a moving tag (`v1`, `v2`, ...) that users pin to.

```yaml
- uses: highlyavailable/github-readme-actions@v2   # tracks latest v2.x
- uses: highlyavailable/github-readme-actions@v2.1.0  # pin exact
```

## Cutting a release

1. **Verify green main**
   ```bash
   make release-check
   ```
2. **Bump version**
   ```bash
   make version-patch   # or version-minor / version-major
   ```
3. **Commit and push**
   ```bash
   git add package.json package-lock.json dist/
   git commit -m "release v$(node -p "require('./package.json').version")"
   git push origin main
   ```
4. **Tag**

   Either:
   - Trigger the **Release** workflow from the Actions tab and supply the tag (e.g. `v2.1.0`), or
   - Tag manually:
     ```bash
     git tag v2.1.0
     git push origin v2.1.0
     ```

The Release workflow creates the GitHub release, publishes to the GitHub Actions Marketplace, and re-points the major-version tag.

## Pre-release checklist

- [ ] `make ci` green locally
- [ ] `dist/` committed and reflects current `src/`
- [ ] `package.json` version bumped
- [ ] Section docs updated for any new inputs

## Hotfix

1. Branch from the latest release tag.
2. Apply the minimal fix; rebuild `dist/`.
3. `make version-patch`, commit, push.
4. Tag and release as above.
5. Cherry-pick or forward-port the fix to `main` if needed.

## Release notes

Generated from commit subjects between tags. Use [conventional commits](https://www.conventionalcommits.org/) so the changelog reads well.
