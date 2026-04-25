#!/bin/bash
set -e

REPO="RedHatAI/Qwen2.5-7B-Instruct-FP8-dynamic"
DEST="/model/qwen2.5-7b-fp8"

echo "=== Pulling $REPO into $DEST ==="
sudo -u sglang -H bash -c "cd /opt/sglang && /opt/sglang/venv/bin/huggingface-cli download $REPO --local-dir $DEST"

echo "=== Done. Listing model dir: ==="
ls -lh "$DEST" | head -20
df -h /model
