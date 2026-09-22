import type { Question } from "@/lib/types";

export const devopsQuestions: Question[] = [
  {
    id: "devops-docker-production",
    topic: "devops",
    category: "Docker",
    difficulty: "medium",
    question:
      "Explain Docker image layers, then describe a production Dockerfile for a Node.js service and why each choice matters.",
    idealAnswer:
      "Each Dockerfile instruction creates a layer, and layers are cached and content-addressed; because a layer invalidates every layer after it, copying package.json and installing dependencies before copying the source keeps the dependency layer reusable on code-only changes. A production Node image is multi-stage: a builder stage with dev dependencies runs the build, and a slim runtime stage contains only production dependencies and compiled output, which shrinks the image and the attack surface. Pin the base tag or digest for reproducibility, run as a non-root user, use exec-form CMD so the process receives SIGTERM for graceful shutdown, and keep the context small with .dockerignore. Set NODE_ENV=production and add a HEALTHCHECK.",
    explanation:
      "Layering is the basis of both speed and reproducibility: identical layers are pulled from the registry instead of rebuilt, and a pinned digest means the same bytes in every environment. Multi-stage builds stop build tooling from leaking into production — compilers and test runners should not be in the runtime image. Signals matter more than people expect: with shell-form CMD the container runs under /bin/sh, which does not forward SIGTERM, so an orchestrated rolling update ends in SIGKILL after the grace period and in-flight requests drop; use exec form, or an init such as tini when you need PID 1 duties. Running as non-root limits what a compromised process can reach. Image size affects cold starts and scanning cost, so prefer slim variants while remembering musl-based alpine can behave differently for native modules.",
    code: `# syntax=docker/dockerfile:1
FROM node:22-slim AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci                       # cached while the lockfile is unchanged
COPY . .
RUN npm run build && npm prune --omit=dev

FROM node:22-slim AS runtime
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY package.json ./
USER node                        # not root
EXPOSE 3000
HEALTHCHECK CMD node -e "fetch('http://127.0.0.1:3000/health').then(r=>process.exit(r.ok?0:1))"
CMD ["node", "dist/server.js"]   # exec form -> receives SIGTERM`,
    tags: ["docker", "layers", "multi-stage", "signals", "security"],
    followUps: [
      "Why does shell-form CMD break graceful shutdown in Kubernetes?",
      "How would you keep image builds reproducible across environments?",
    ],
    interviewTip:
      "Walk through the Dockerfile top to bottom and justify each line with its consequence: cache reuse, attack surface, signal handling. That reads as production experience rather than a recipe.",
    concepts: ["layer caching", "multi-stage builds", "PID 1 signals"],
  },
  {
    id: "devops-cicd-pipeline",
    topic: "devops",
    category: "CI/CD",
    difficulty: "medium",
    question:
      "Design a CI/CD pipeline for a web application. Where do tests, database migrations and rollbacks fit, and how do you keep deploys safe?",
    idealAnswer:
      "Order stages by feedback speed: lint, typecheck and unit tests first, then build the artifact once and promote that same artifact through environments, then integration tests, staging, and a gated production deploy. Database migrations must be backward compatible and run separately from the code deploy using an expand/contract pattern: add the new column, deploy code that writes both, backfill, then remove the old column in a later release. Rollback is a redeploy of the previous artifact plus a migration strategy that never needs a destructive downgrade. Safety comes from progressive delivery — canary or blue/green with health checks and automatic rollback on error-rate or latency regressions — plus immutable artifacts and runtime-injected configuration.",
    explanation:
      "Build once and promote prevents 'works on staging' drift, because rebuilding per environment changes the artifact you tested. Backward-compatible migrations exist because old and new code run simultaneously during a rolling deploy: a NOT NULL column without a default, or a renamed field, breaks the instances still serving traffic. Secrets belong in the platform's secret store, never baked into the image or committed. Rollback expectations depend on what is reversible: containers reverse instantly, schema changes usually do not, so treat migrations as forward-only with a deliberate cleanup release. Instrument the pipeline itself too — deploy markers on dashboards let you correlate a spike with a release instead of guessing.",
    code: `# Pipeline stages, in feedback order
# verify  -> lint, typecheck, unit tests
# build   -> one image tagged with the commit sha
# staging -> forward-only migration job, deploy, smoke tests
# prod    -> canary rollout, watch error rate, auto-rollback, then full rollout

# Expand/contract migration (safe during a rolling deploy)
# 1. add nullable column
# 2. deploy code that writes both old and new
# 3. backfill existing rows
# 4. drop the old column in a later release`,
    tags: ["ci/cd", "migrations", "canary", "rollback", "artifacts"],
    followUps: [
      "How do you roll back a deploy that shipped a destructive migration?",
      "What signals would trigger an automatic rollback, and what are the risks of automating it?",
    ],
    interviewTip:
      "Order stages by feedback speed, then spend your time on migrations and rollback — that is where interviewers find out whether you have actually shipped to production.",
    concepts: ["build once promote", "expand/contract", "progressive delivery"],
  },
  {
    id: "devops-kubernetes-objects",
    topic: "devops",
    category: "Kubernetes",
    difficulty: "medium",
    question:
      "Explain the core Kubernetes objects you need to run a web service: Pod, Deployment, Service, Ingress, ConfigMap/Secret. What does a rolling update actually do?",
    idealAnswer:
      "A Pod is the smallest schedulable unit (one or more containers sharing network/storage) but is never managed directly. A Deployment declares a desired ReplicaSet state — image, replica count, resource limits — and the controller reconciles toward it. A Service gives the ephemeral pods a stable virtual IP and DNS name, load-balancing across ready pods via label selectors. An Ingress (or Gateway API) routes external HTTP traffic by host/path to Services, typically terminating TLS. ConfigMaps and Secrets inject configuration; Secrets are only base64 by default, so real protection needs encryption at rest or an external secrets operator. A rolling update is the Deployment controller scaling up a new ReplicaSet while scaling down the old one, gated by maxSurge/maxUnavailable and readiness probes, so traffic only shifts to pods that report ready.",
    explanation:
      "The reconciler model is the mental shift: you declare desired state and controllers continuously converge on it, which is why kubectl apply is idempotent. Readiness vs liveness probes are the update-safety hinge: a pod without a readiness probe joins the Service before it can serve, causing 502s during deploys; a liveness probe that checks a dependency can restart-loop a healthy pod during a downstream outage — liveness should reflect the process itself. Graceful shutdown completes the story: on SIGTERM the pod should stop accepting new connections, finish in-flight ones, and only then exit; a preStop sleep covers the gap between endpoint removal propagation and SIGTERM delivery. Resource requests/limits drive scheduling and QoS: requests without limits are usually the right default for services, since CPU limits cause throttling latency. HorizontalPodAutoscaler scales replicas on metrics; if pods start slowly (big images, slow readiness), HPA reacts late — that is where faster images and aggressive startup probes pay off.",
    code: `apiVersion: apps/v1
kind: Deployment
metadata: { name: api }
spec:
  replicas: 3
  strategy:
    rollingUpdate: { maxSurge: 1, maxUnavailable: 0 }  # zero-downtime default
  template:
    spec:
      containers:
        - name: api
          image: registry/api:1.4.2        # immutable tag, never :latest
          ports: [{ containerPort: 3000 }]
          readinessProbe:                  # traffic gate during rollouts
            httpGet: { path: /healthz, port: 3000 }
            initialDelaySeconds: 2
          livenessProbe:                   # process health only
            httpGet: { path: /livez, port: 3000 }
          resources:
            requests: { cpu: 250m, memory: 256Mi }
---
# Service + Ingress: stable DNS -> pods, host/path routing from outside`,
    tags: ["kubernetes", "deployment", "probes", "rolling update"],
    followUps: [
      "Why can a bad liveness probe cause a cascading outage?",
      "What happens to in-flight requests during a rolling update without graceful shutdown?",
    ],
    interviewTip:
      "Name each object with its one-line job, then spend time on probes and graceful shutdown — that is where real operational experience shows. Saying 'controllers reconcile toward declared state' frames you as understanding the model.",
    concepts: ["reconciliation", "readiness probes", "rolling updates", "service discovery"],
  },
  {
    id: "devops-linux-networking-debug",
    topic: "devops",
    category: "Linux",
    difficulty: "medium",
    question:
      "A service in production returns timeouts but CPU and memory look normal. Which Linux commands and checks do you run first, and what are the common culprits?",
    idealAnswer:
      "Work the request path from outside in: is the process up (systemctl status / docker ps), is it listening (ss -tlnp for the port), are connections saturating (ss -s state counts, accept queue overflow via netstat -s / netstat -tan with SYN_RECV), and does DNS resolve correctly (dig +trace)? Then disk and I/O: df -h for space and inode exhaustion (df -i — 'disk full' with free space), iostat for saturated I/O, dmesg for OOM kills or NFS hangs. Inside the process: file descriptor limits (ulimit -n, ls /proc/PID/fd | wc -l — socket leaks exhaust FDs and every new connection fails), thread counts, and strace on a hung request to see which syscall blocks. Common culprits: connection pool exhaustion, FD leaks, ephemeral port exhaustion under high connection churn, DNS resolver timeouts, SYN flood or conntrack table full on the host, and GC pauses that look like network timeouts.",
    explanation:
      "The layered checks exist because each level produces a distinct timeout signature: DNS timeouts are ~5s and intermittent; accept-queue overflow shows as SYNs dropped and connection resets under load; FD exhaustion gives 'EMFILE: too many open files' right after the service runs for a while; ephemeral port exhaustion (local range ~28k ports, TIME_WAIT accumulation) hits services making many short-lived outbound calls. conntrack saturation on NAT'd hosts silently drops new connections — check dmesg for 'nf_conntrack: table full'. The process side matters too: a blocked D-state process (cat /proc/PID/status) on NFS or io will look alive to the balancer but serve nothing — which is why health checks should exercise a real dependency. Capture-then-analyze beats live-guessing: tcpdump -w for the incident window, then Wireshark; ss -tanp snapshots every few seconds to watch queues grow. And check the boring layer first: a recent cert expiry, a firewall/route change, or an autoscaler event often explains 'nobody deployed anything'.",
    code: `ss -tlnp                       # is the port actually listening?
ss -s                          # summary: connection states
netstat -s | grep -i listen    # listen queue overflows
ls /proc/$(pgrep -f server)/fd | wc -l; cat /proc/sys/fs/file-max
ulimit -n                      # FD limit vs used
df -h; df -i                   # space AND inodes
iostat -x 2 3                  # disk saturation

dig +trace api.example.com     # DNS path
sudo tcpdump -i eth0 -w /tmp/inc.pcap port 443

dmesg -T | grep -Ei 'oom|conntrack|nfs'

cat /proc/PID/status | grep State   # D state = uninterruptible io`,
    tags: ["linux", "networking", "troubleshooting", "sockets", "file descriptors"],
    followUps: [
      "What does TIME_WAIT accumulation tell you about your outbound HTTP configuration?",
      "How would you distinguish DNS timeouts from accept-queue overflow from their signatures?",
    ],
    interviewTip:
      "Present it as a layered check from outside in, with one signature per layer. Naming FD limits and conntrack — the two least-glamorous real causes — signals genuine on-call experience.",
    concepts: ["socket states", "file descriptor limits", "conntrack", "DNS resolution"],
  },
  {
    id: "devops-monitoring-alerting",
    topic: "devops",
    category: "Monitoring",
    difficulty: "medium",
    question:
      "What is the difference between monitoring and observability, and how do you design alerts that page a human for the right reasons?",
    idealAnswer:
      "Monitoring answers pre-defined questions on known failure modes (dashboards of known metrics); observability is the property that lets you ask new questions about arbitrary system state from the outside, built on the three pillars: metrics (cheap, aggregated), logs (discrete events with context), traces (request journeys across services). Alert design follows SLOs: define a user-facing reliability target (e.g. 99.9% of requests < 300ms), measure the error budget burn rate, and page only on fast burns (a significant fraction of the monthly budget at risk within hours); warn on slow burns. Everything else — CPU at 80%, disk at 70% — is a ticket or a trend, not a page. Every page must be actionable, and if an alert fires repeatedly without action, delete it: alert fatigue is how real incidents get missed.",
    explanation:
      "The alerting hierarchy that works: symptom-based paging on what users experience (error rate, latency SLO burn, queue depth affecting delivery) rather than causes (CPU, memory) — causes go to dashboards for investigation once paged. Multi-window multi-burn-rate alerts are the standard implementation (e.g. page if 5% of budget burns in 1h, or 10% in 6h), which catches both fast outages and slow leaks without flapping. Cardinality is the operational constraint on metrics: high-cardinality labels (user_id, request_id) explode time-series databases — that detail belongs in logs/traces with sampling, not metrics. Logs need structure and correlation ids from day one; traces need propagation through every hop including queues. Logs/metrics/traces should share ids so an alert links to a dashboard links to the exact traces. Capacity alerts deserve a different channel (ticket) because they degrade over days; paging is for now-problems. Review after every incident: did the page fire when it should, and only when it should?",
    code: `# Prometheus: multi-window burn-rate alert (SLO 99.9%)
# budget 0.001; page if 5% of monthly budget burns in 1h
- alert: HighErrorBudgetBurn
  expr: |
    (
      sum(rate(http_requests_total{code=~"5.."}[5m]))
      / sum(rate(http_requests_total[5m]))
    ) > (14.4 * 0.001)   # 5% budget in 1h
  for: 2m
  labels: { severity: page }
  annotations:
    summary: "Error budget burning fast — page on-call"
    runbook: https://runbooks.example.com/error-budget`,
    tags: ["observability", "slo", "alerting", "metrics", "tracing"],
    followUps: [
      "Why are cause-based alerts (CPU 90%) worse than symptom-based ones?",
      "How do multi-window burn-rate alerts reduce alert noise versus static thresholds?",
    ],
    interviewTip:
      "Give the pillars one sentence each, then spend your time on the alerting discipline: symptom pages, burn rates, actionable-or-delete. That shows you have been paged before and thought about it.",
    concepts: ["three pillars", "SLO burn rate", "actionable alerts", "cardinality"],
  },
  {
    id: "devops-iac-cloud-cost",
    topic: "devops",
    category: "Infrastructure",
    difficulty: "medium",
    question:
      "What is Infrastructure as Code, why does it matter beyond reproducibility, and how do you manage environments without copy-pasting Terraform between dev and prod?",
    idealAnswer:
      "IaC declares infrastructure in versioned code (Terraform, Pulumi, CloudFormation) so the platform is reviewed, tested, and reproducible like application code — the deeper value is that the code is the source of truth: no snowflake servers, drift is detectable (plan shows what differs), disaster recovery is a pipeline run, and every change has review, history and an owner. Environment management: factor the shared shape into reusable modules (a module for 'a web service with LB, autoscaling and alarms') and compose per environment with variables and tfvars files — never copy-paste whole stacks, because fixes then land in one environment and not the others. State files are per-environment, remote, locked, and never shared; secrets come from a secret manager, not tfvars in git. Distinguish declarative provisioning (Terraform) from configuration management (Ansible) and from immutable patterns (bake AMIs/images; servers are replaced, not patched).",
    explanation:
      "The operational wins compound: a new environment is a plan/apply against an existing module graph; a Postmortem fix is a PR; audit is git log. The failure modes to know: state drift when someone changes the console (import or re-apply to converge), state file loss or corruption (remote backends with locking and versioning are non-negotiable), and the plan/apply trust boundary (CI should plan on PR and apply on merge to keep humans out of the loop for routine changes but still gate the apply). Cost management is part of the discipline: tagging enforced in modules, budgets with alerts, and review of the plan output which shows new/destroyed resources — 'destroy' lines in a plan deserve the same scrutiny as a prod migration. Application delivery completes the picture: IaC provisions, but deploys usually flow through a CD system (Argo CD, Spinnaker) watching the declared state — the GitOps pattern where git is the interface to both infrastructure and app versions.",
    code: `# modules/web-service/main.tf — reused by every environment
module "api_prod" {
  source        = "./modules/web-service"
  name          = "api"
  environment   = "prod"
  instance_type = "t3.large"
  min_size      = 3
  max_size      = 12
  alarm_email   = var.oncall_email
}

# Per-env composition, not copy-paste:
# envs/dev/main.tf    -> module "api" { instance_type = "t3.small" ... }
# envs/prod/main.tf   -> module "api_prod" { ... }
#
# Remote state with locking
terraform {
  backend "s3" {
    bucket = "tf-state-prod"
    key    = "prod/terraform.tfstate"
    dynamodb_table = "tf-locks"   # prevents concurrent applies
  }
}`,
    tags: ["iac", "terraform", "modules", "gitops", "state management"],
    followUps: [
      "How do you handle drift when someone changes infrastructure in the console?",
      "Why should state files never be shared between environments?",
    ],
    interviewTip:
      "Lead with 'the code is the source of truth' and its consequences (review, drift detection, DR), then show the module-composition pattern for environments. Mentioning state locking and drift shows hands-on Terraform experience.",
    concepts: ["declarative infrastructure", "modules", "state and locking", "gitops"],
  },
  {
    id: "devops-deployment-strategies",
    topic: "devops",
    category: "Deployment",
    difficulty: "medium",
    question:
      "Compare rolling, blue/green, and canary deployments. How do you choose, and what database-state constraints does each impose?",
    idealAnswer:
      "Rolling replaces instances batch by batch (cheap, built into Kubernetes, but old and new versions serve traffic simultaneously and rollback means another rollout). Blue/green keeps two full environments and switches traffic atomically (instant rollback, no version mixing, but 2x infrastructure cost and a shared database that both sides hit). Canary shifts a small traffic slice to the new version and expands as metrics stay healthy (statistically meaningful feedback with real users, requires traffic splitting and good observability). Database constraints are the same for all: the schema must be compatible with both versions during the transition — additive changes with defaults, expand/contract for anything destructive — because you cannot atomically update code and schema together.",
    explanation:
      "The choice follows blast radius and reversibility: stateless services with good tests are fine rolling; a risky or high-traffic release deserves canary because it limits exposure in percentage terms; blue/green suits cases needing instant all-or-nothing cutover or where you must run load tests against the real new stack first. The database is the real constraint in every model: two versions of code run against one schema, so during any deploy the schema must accept both — NOT NULL columns need defaults, renames need a dual-write window, and a rollback must not require reverting a destructive migration. That is why migrations are forward-only and ship in expand/contract pairs. Operational details that decide success: session affinity (a canary user must keep hitting the canary or their experience flips mid-session — sticky by user id, not by IP alone), metrics sliced by version so canary evaluation is real, and webhook/queue consumers needing schema tolerance since messages produced by the new version get consumed by the old. Feature flags complement all three by decoupling deploy from release: ship dark, enable gradually, kill without redeploying.",
    code: `# Kubernetes rolling (default)
strategy:
  type: RollingUpdate
  rollingUpdate: { maxSurge: 25%, maxUnavailable: 25% }

# Canary via traffic split (Istio/NGINX style)
# virtualservice:
#   http:
#     - route:
#         - destination: { host: api, subset: stable }  weight: 95
#         - destination: { host: api, subset: canary }  weight: 5
#   -> expand 5 -> 25 -> 50 -> 100 as error rate/latency hold
#
# Schema rule for every strategy: both versions must work simultaneously
ALTER TABLE orders ADD COLUMN fulfillment_status TEXT DEFAULT 'pending'; -- additive
-- destructive change waits 1-2 releases (expand/contract)`,
    tags: ["deployment strategies", "canary", "blue/green", "schema compatibility"],
    followUps: [
      "Why must database migrations always be backward compatible during a canary?",
      "How do feature flags change the deploy-vs-release relationship?",
    ],
    interviewTip:
      "Compare on three axes (cost, rollback speed, exposure control), then land on the shared database constraint — that is the insight that ties deployment strategy to schema design and shows system-level thinking.",
    concepts: ["rolling update", "traffic splitting", "expand/contract schema", "feature flags"],
  },
];
