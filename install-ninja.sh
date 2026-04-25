#!/bin/bash
set -e
cd /opt/sglang
sudo -u sglang env VIRTUAL_ENV=/opt/sglang/venv /opt/sglang/.local/bin/uv pip install ninja
sudo -u sglang /opt/sglang/venv/bin/python -c "import ninja; print('ninja OK', ninja.__file__)"
