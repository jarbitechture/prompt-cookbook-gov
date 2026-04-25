#!/bin/bash
# Foreground smoke test for SGLang. Ctrl-C to stop.
# Bind to 127.0.0.1 only — no network exposure during smoke test.

set -e

cd /opt/sglang

sudo -u sglang -H \
  HF_HOME=/model/.cache/huggingface \
  TRANSFORMERS_CACHE=/model/.cache/huggingface \
  CUDA_HOME=/usr/local/cuda-13.2 \
  PATH=/opt/sglang/venv/bin:/usr/local/cuda-13.2/bin:/usr/bin:/bin \
  /opt/sglang/venv/bin/python -m sglang.launch_server \
    --model-path /model/qwen2.5-7b-fp8 \
    --served-model-name qwen2.5-7b \
    --host 127.0.0.1 \
    --port 30000 \
    --mem-fraction-static 0.80 \
    --max-running-requests 4 \
    --context-length 16384 \
    --enable-mixed-chunk \
    --attention-backend triton \
    --log-level info
