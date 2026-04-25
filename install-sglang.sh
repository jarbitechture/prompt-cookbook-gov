#!/bin/bash
set -e

echo "=== 1. System deps (Python 3.12, build tools) ==="
dnf install -y python3.12 python3.12-devel gcc gcc-c++ make curl

echo "=== 2. Service user + directories ==="
id sglang &>/dev/null || useradd --system --shell /usr/sbin/nologin --home-dir /opt/sglang sglang
mkdir -p /opt/sglang/models /opt/sglang/.cache /opt/sglang/.local
chown -R sglang:sglang /opt/sglang

# Move to a dir sglang can read — uv walks CWD ancestors looking for uv.toml,
# and ejarbeadm's AD home (mode 700) is unreadable by the sglang service user.
cd /opt/sglang

echo "=== 3. Install uv (Astral fast pip replacement) ==="
if [ ! -x /opt/sglang/.local/bin/uv ]; then
  sudo -u sglang -H bash -c 'curl -LsSf https://astral.sh/uv/install.sh | sh'
fi
sudo -u sglang -H /opt/sglang/.local/bin/uv --version

echo "=== 4. Create venv with Python 3.12 via uv ==="
sudo -u sglang -H /opt/sglang/.local/bin/uv venv /opt/sglang/venv --python 3.12 --clear

echo "=== 5. Install sglang[all] into venv (this downloads ~5GB of torch/vllm/etc, takes 3-8 min) ==="
sudo -u sglang -H /opt/sglang/.local/bin/uv pip install \
  --python /opt/sglang/venv/bin/python \
  'sglang[all]>=0.4'

echo "=== 6. Verify SGLang imports ==="
sudo -u sglang /opt/sglang/venv/bin/python -c "import sglang; print(f'SGLang {sglang.__version__} OK')"

echo "=== done ==="
echo "Next: download model (large) + create systemd unit"
