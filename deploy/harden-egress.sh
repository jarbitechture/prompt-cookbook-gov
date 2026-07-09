#!/usr/bin/env bash
# harden-egress.sh — restrict bcc-ap-infer01 OUTBOUND to county-internal only, reversibly.
#
# Run ON infer01 as root:  sudo bash harden-egress.sh
#
# Applies RUNTIME-ONLY firewalld rules (gone on reboot/reload), self-tests that SGLang
# still serves and DNS still resolves, and AUTO-ROLLS-BACK if anything breaks. Nothing
# is persisted unless the self-test passes AND you run the printed persist command.
#
# Does NOT touch inbound serving (llm01 -> infer01:30000) or restart SGLang.
set -uo pipefail

SGLANG_URL="http://127.0.0.1:30000/v1/models"
RESOLVE_HOST="bcc-ap-llm01.bcc.ad.mymanatee.org"   # internal host that must still resolve

RULES=(
  "0  -o lo -j ACCEPT"
  "1  -m state --state ESTABLISHED,RELATED -j ACCEPT"
  "2  -d 10.0.0.0/8 -j ACCEPT"
  "10 -j DROP"
)

add_rules()    { for r in "${RULES[@]}"; do firewall-cmd --direct --add-rule    ipv4 filter OUTPUT $r >/dev/null; done; }
remove_rules() { for r in "${RULES[@]}"; do firewall-cmd --direct --remove-rule ipv4 filter OUTPUT $r >/dev/null 2>&1; done; }

echo "== infer01 egress hardening (runtime-only, reversible) =="

# Pre-check: don't touch the firewall if SGLang is already unhealthy.
if ! curl -fsS --max-time 8 "$SGLANG_URL" >/dev/null 2>&1; then
  echo "ABORT: SGLang is not responding at $SGLANG_URL before any change."
  echo "       Fix that first — not touching the firewall."
  exit 1
fi
echo "  pre-check: SGLang healthy."

echo "== applying RUNTIME-ONLY egress rules =="
add_rules
sleep 2

echo "== self-test =="
ok=1
if curl -fsS --max-time 8 "$SGLANG_URL" >/dev/null 2>&1; then
  echo "  [pass] SGLang still serving"
else
  echo "  [FAIL] SGLang stopped serving"; ok=0
fi
if getent hosts "$RESOLVE_HOST" >/dev/null 2>&1; then
  echo "  [pass] DNS still resolves $RESOLVE_HOST"
else
  echo "  [FAIL] DNS can no longer resolve $RESOLVE_HOST"; ok=0
fi
if curl -fsS --max-time 5 https://1.1.1.1 >/dev/null 2>&1; then
  echo "  [warn] public internet STILL reachable — DROP rule not effective"
else
  echo "  [pass] public internet is blocked"
fi

if [ "$ok" -ne 1 ]; then
  echo "!! self-test FAILED — rolling back the runtime rules ..."
  remove_rules
  echo "   rolled back. Egress is back to its prior state. Nothing persisted."
  exit 1
fi

cat <<'DONE'

== self-test PASSED ==
Rules are LIVE but NOT persisted (they revert on reboot or `firewall-cmd --reload`).
Watch the box for a bit. If everything stays healthy, persist them:

  sudo firewall-cmd --permanent --direct --add-rule ipv4 filter OUTPUT 0  -o lo -j ACCEPT
  sudo firewall-cmd --permanent --direct --add-rule ipv4 filter OUTPUT 1  -m state --state ESTABLISHED,RELATED -j ACCEPT
  sudo firewall-cmd --permanent --direct --add-rule ipv4 filter OUTPUT 2  -d 10.0.0.0/8 -j ACCEPT
  sudo firewall-cmd --permanent --direct --add-rule ipv4 filter OUTPUT 10 -j DROP
  sudo firewall-cmd --reload

To undo the live rules right now (before persisting):

  sudo firewall-cmd --reload
DONE
