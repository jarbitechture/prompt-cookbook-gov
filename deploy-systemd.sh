#!/bin/bash
set -e

echo "=== 1. Install unit file ==="
install -m 644 /tmp/sglang.service /etc/systemd/system/sglang.service

echo "=== 2. Reload systemd ==="
systemctl daemon-reload

echo "=== 3. Restart sglang ==="
systemctl restart sglang

echo "=== 4. Wait for ready (up to 90s) ==="
for i in $(seq 1 90); do
  if curl -s --max-time 1 http://127.0.0.1:30000/v1/models > /dev/null 2>&1; then
    echo "Ready after ${i}s"
    break
  fi
  sleep 1
done

echo "=== 5. Verify bind address ==="
ss -tlnp | grep 30000 || echo "WARN: nothing listening on 30000"

echo "=== 6. Test endpoint ==="
curl -s http://127.0.0.1:30000/v1/models

echo ""
echo "=== Done ==="
