#!/usr/bin/env bash
set -euo pipefail
kind="$1"
archive="$2"
[[ "$kind" =~ ^(frontend|api)$ ]]
[[ "${DEPLOY_BUCKET:-}" =~ ^[a-z0-9][a-z0-9.-]+$ ]]
[[ "${EC2_INSTANCE_ID:-}" =~ ^i-[a-f0-9]+$ ]]
[[ "${GITHUB_SHA:-}" =~ ^[a-f0-9]{40}$ ]]
key="3rcgo/$kind/$GITHUB_SHA.tar.gz"
aws s3 cp "$archive" "s3://$DEPLOY_BUCKET/$key" --only-show-errors --sse AES256
digest=$(sha256sum "$archive" | cut -d' ' -f1)
export REMOTE_COMMAND="set -eu; work=\$(mktemp -d /tmp/3rcgo-$kind.XXXXXX); aws s3 cp s3://$DEPLOY_BUCKET/$key \$work/package.tar.gz --only-show-errors; echo '$digest  '\$work/package.tar.gz | sha256sum -c -; tar -xzf \$work/package.tar.gz -C \$work; bash \$work/deploy/install.sh \$work $GITHUB_SHA"
python3 -c 'import json,os; print(json.dumps({"commands":[os.environ["REMOTE_COMMAND"]]}))' > parameters.json
command_id=$(aws ssm send-command --instance-ids "$EC2_INSTANCE_ID" --document-name AWS-RunShellScript --parameters file://parameters.json --timeout-seconds 600 --query Command.CommandId --output text)
for attempt in $(seq 1 120); do
  status=$(aws ssm get-command-invocation --command-id "$command_id" --instance-id "$EC2_INSTANCE_ID" --query Status --output text 2>/dev/null || true)
  case "$status" in
    Success) exit 0 ;;
    Failed|Cancelled|TimedOut)
      aws ssm get-command-invocation --command-id "$command_id" --instance-id "$EC2_INSTANCE_ID" --query '{Status:Status,Error:StandardErrorContent,Output:StandardOutputContent}'
      exit 1 ;;
  esac
  sleep 5
done
echo 'O comando SSM não terminou dentro do prazo. Verifique a execução na AWS.' >&2
exit 1
