#!/usr/bin/env bash
# stack-up.sh — bring the Prompt Builder LLM stack live, in order, with health gates.
# Chain: Ollama (11434, gemma3:4b) -> civic-ai governed proxy (8100) -> cookbook-node (3030)
#
# Handles the known failure: OLLAMA_MODELS defaults to an external NVMe
# (/Volumes/NVME_FAST/...) that is usually NOT mounted. We force the local
# fallback so Ollama is never dependent on the external drive.
set -uo pipefail

CIVIC_AI_DIR="$HOME/Projects/manatee-civic-ai"
COOKBOOK_DIR="$HOME/Projects/prompt-cookbook-gov-mvp"
CIVIC_AI_API_KEY="${CIVIC_AI_API_KEY:-devkey-cookbook-mvp}"
LOCAL_MODELS="$HOME/.ollama/models-local"
LOG_DIR="$HOME/.cache/prompt-cookbook-stack"
mkdir -p "$LOG_DIR"

say() { printf '\n=== %s ===\n' "$1"; }
wait_http() { # url, name, tries
  local url="$1" name="$2" tries="${3:-30}"
  for i in $(seq 1 "$tries"); do
    if curl -fs -m 3 "$url" >/dev/null 2>&1; then echo "$name UP ($url)"; return 0; fi
    sleep 1
  done
  echo "$name FAILED to come up after ${tries}s ($url)"; return 1
}

# 1. Ollama --------------------------------------------------------------
say "1/3 Ollama"
if [ -d /Volumes/NVME_FAST ]; then
  export OLLAMA_MODELS="/Volumes/NVME_FAST/ai/models/ollama"
  echo "external NVMe mounted — using $OLLAMA_MODELS"
else
  export OLLAMA_MODELS="$LOCAL_MODELS"
  echo "external NVMe NOT mounted — using local fallback $OLLAMA_MODELS"
fi
if curl -fs -m 2 http://127.0.0.1:11434/api/tags >/dev/null 2>&1; then
  echo "Ollama already running"
else
  pkill -f "ollama serve" 2>/dev/null; sleep 1
  nohup /opt/homebrew/bin/ollama serve >"$LOG_DIR/ollama.log" 2>&1 &
  echo "started ollama (pid $!) log=$LOG_DIR/ollama.log"
fi
wait_http "http://127.0.0.1:11434/api/tags" "Ollama" 30 || exit 1
if ! /opt/homebrew/bin/ollama list 2>/dev/null | grep -qi 'gemma3'; then
  echo "gemma3 not found in $OLLAMA_MODELS — pulling gemma3:4b"
  /opt/homebrew/bin/ollama pull gemma3:4b
fi

# 2. civic-ai governed proxy --------------------------------------------
say "2/3 civic-ai proxy :8100"
if curl -fs -m 2 http://127.0.0.1:8100/health >/dev/null 2>&1; then
  echo "civic-ai already running"
else
  ( cd "$CIVIC_AI_DIR" && CIVIC_AI_API_KEY="$CIVIC_AI_API_KEY" \
      nohup uvicorn api_server:app --port 8100 >"$LOG_DIR/civic-ai.log" 2>&1 & )
  echo "started civic-ai log=$LOG_DIR/civic-ai.log"
fi
wait_http "http://127.0.0.1:8100/health" "civic-ai" 30 || exit 1

# 3. cookbook-node ------------------------------------------------------
say "3/3 cookbook-node :3030"
if curl -fs -m 2 http://127.0.0.1:3030/api/health >/dev/null 2>&1; then
  echo "cookbook-node already running"
else
  # BREAKER_TIMEOUT_MS=60000: dev gemma3:4b structured gen can take 30-50s;
  # prod (Qwen2.5-7B-FP8/SGLang) leaves this unset → default 10s.
  ( cd "$COOKBOOK_DIR" && PORT=3030 \
      CIVIC_AI_API_KEY="$CIVIC_AI_API_KEY" \
      CIVIC_AI_BASE_URL="http://127.0.0.1:8100/v1" \
      CIVIC_AI_DEFAULT_MODEL="gemma3:4b" \
      BREAKER_TIMEOUT_MS=60000 \
      nohup npm run start >"$LOG_DIR/cookbook-node.log" 2>&1 & )
  echo "started cookbook-node log=$LOG_DIR/cookbook-node.log"
fi
wait_http "http://127.0.0.1:3030/api/health" "cookbook-node" 30 || exit 1

say "STACK UP"
echo "Ollama    http://127.0.0.1:11434  (models: $OLLAMA_MODELS)"
echo "civic-ai  http://127.0.0.1:8100/health"
echo "cookbook  http://127.0.0.1:3030/api/health"
echo "Builder Critique/Refine/Preview now functional. Logs in $LOG_DIR"
