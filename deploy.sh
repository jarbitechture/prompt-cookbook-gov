#!/bin/bash
# Build the cookbook on Mac and ship to bcc-ap-llm01 via GitHub release.
# Run from the repo root: ./deploy.sh
#
# Uploads/clobbers asset on the v0.1.0 release (single rolling release for the POC).
# Bump RELEASE_TAG below to cut a new release instead.

set -e

RELEASE_TAG="v0.1.0"
TARBALL="cookbook-dist-${RELEASE_TAG}.tgz"

echo "=== 1. Build (vite + esbuild) ==="
pnpm run build

echo "=== 2. Bundle release tarball ==="
rm -f "$TARBALL"
tar -czf "$TARBALL" dist package.json pnpm-lock.yaml patches start.ps1
ls -lh "$TARBALL"

echo "=== 3. Upload to GitHub release $RELEASE_TAG (clobber) ==="
gh release upload "$RELEASE_TAG" "$TARBALL" --clobber

echo "=== 4. Done ==="
echo ""
echo "On llm01 (Admin PowerShell, in C:\\cookbook), paste:"
echo ""
echo "  iwr https://github.com/jarbitechture/prompt-cookbook-gov/releases/download/$RELEASE_TAG/$TARBALL -OutFile cookbook.tgz"
echo "  tar -xzf cookbook.tgz"
echo "  .\\iis-setup.ps1"
echo "  nssm restart cookbook-node"
echo ""
echo "Then verify in browser: http://bcc-ap-llm01.bcc.ad.mymanatee.org/"
