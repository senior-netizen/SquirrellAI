import { createApiClient, type ApiClient } from './api/client';
import type {
  AgentSummary,
  AiEngineExecutionListResponse,
  AppConfig,
  BillingSnapshot,
  ExecutionDetail,
  ExecutionSummary,
  ToolSummary,
} from './types/models';

declare global {
  interface Window {
    __SQUIRRELLAI_CONFIG__?: Partial<AppConfig>;
  }
}

interface Session {
  subject: string;
  accessToken: string;
}

type Route =
  | { kind: 'login' }
  | { kind: 'executions' }
  | { kind: 'execution-detail'; executionId: string }
  | { kind: 'registry' }
  | { kind: 'billing' };

const appRootElement = document.querySelector<HTMLDivElement>('#app');
const sessionStorageKey = 'squirrellai.console.session';

if (!appRootElement) {
  throw new Error('Missing #app container');
}

const appRoot = appRootElement;

const config: AppConfig = {
  coreBaseUrl: window.__SQUIRRELLAI_CONFIG__?.coreBaseUrl ?? 'http://localhost:3000',
  aiEngineBaseUrl: window.__SQUIRRELLAI_CONFIG__?.aiEngineBaseUrl ?? 'http://localhost:8000',
};

const apiClient = createApiClient(config);
let session = readSession();

window.addEventListener('hashchange', () => {
  void renderApp();
});

void renderApp();

function readSession(): Session | null {
  const raw = window.localStorage.getItem(sessionStorageKey);

  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as Session;
  } catch {
    window.localStorage.removeItem(sessionStorageKey);
    return null;
  }
}

function writeSession(nextSession: Session | null): void {
  session = nextSession;

  if (!nextSession) {
    window.localStorage.removeItem(sessionStorageKey);
    return;
  }

  window.localStorage.setItem(sessionStorageKey, JSON.stringify(nextSession));
}

function navigate(hash: string): void {
  if (window.location.hash === hash) {
    void renderApp();
    return;
  }

  window.location.hash = hash;
}

function getRoute(): Route {
  const hash = window.location.hash.replace(/^#/, '') || '/executions';

  if (!session) {
    return { kind: 'login' };
  }

  if (hash === '/login') {
    return { kind: 'login' };
  }

  if (hash === '/executions' || hash === '/') {
    return { kind: 'executions' };
  }

  if (hash.startsWith('/executions/')) {
    const executionId = hash.split('/')[2];
    return { kind: 'execution-detail', executionId };
  }

  if (hash === '/registry') {
    return { kind: 'registry' };
  }

  if (hash === '/account/billing') {
    return { kind: 'billing' };
  }

  return { kind: 'executions' };
}

async function renderApp(): Promise<void> {
  const route = getRoute();

  if (!session && route.kind !== 'login') {
    navigate('#/login');
    return;
  }

  setHtml('<div class="panel panel--centered">Loading…</div>');

  try {
    if (route.kind === 'login') {
      renderLoginPage();
      return;
    }

    const pageContent = await renderProtectedPage(route);
    setHtml(layout(pageContent, route.kind));
    bindSharedInteractions();
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unexpected failure';
    setHtml(layout(renderErrorState(message), route.kind));
    bindSharedInteractions();
  }
}

async function renderProtectedPage(route: Exclude<Route, { kind: 'login' }>): Promise<string> {
  if (!session) {
    return renderLoginPage();
  }

  switch (route.kind) {
    case 'executions': {
      const executions = await apiClient.getExecutions(session.accessToken);
      return renderExecutionHistory(executions);
    }
    case 'execution-detail': {
      const detail = await apiClient.getExecution(route.executionId, session.accessToken);
      return renderExecutionDetail(detail);
    }
    case 'registry': {
      const [agents, tools, readiness] = await Promise.all([
        apiClient.getAgents(session.accessToken),
        apiClient.getTools(session.accessToken),
        apiClient.getReadiness(session.accessToken),
      ]);
      return renderRegistryPage(agents, tools, readiness.ready, readiness.checks);
    }
    case 'billing': {
      const [billing, aiHealth, aiExecutions] = await Promise.all([
        apiClient.getBilling(session.accessToken),
        apiClient.getAiEngineHealth(session.accessToken),
        apiClient.getAiEngineExecutions(session.accessToken),
      ]);
      return renderBillingPage(billing, aiHealth.status, aiExecutions);
    }
  }
}

function layout(content: string, activeRoute: Route['kind']): string {
  return `
    <div class="shell">
      <aside class="sidebar">
        <div>
          <p class="eyebrow">SquirrellAI</p>
          <h1 class="sidebar__title">Operator Console</h1>
          <p class="muted">Authenticated control-plane and execution-plane visibility.</p>
          <nav class="sidebar__nav">
            ${navItem('#/executions', 'Executions', activeRoute === 'executions' || activeRoute === 'execution-detail')}
            ${navItem('#/registry', 'Registry', activeRoute === 'registry')}
            ${navItem('#/account/billing', 'Billing', activeRoute === 'billing')}
          </nav>
        </div>
        <div class="sidebar__footer stack-sm">
          <div>
            <p class="eyebrow">Signed in as</p>
            <strong>${escapeHtml(session?.subject ?? 'unknown')}</strong>
          </div>
          <button class="button button--secondary" data-action="logout" type="button">Sign out</button>
        </div>
      </aside>
      <main class="content">${content}</main>
    </div>
  `;
}

function navItem(href: string, label: string, active: boolean): string {
  return `<a class="nav-link${active ? ' nav-link--active' : ''}" href="${href}">${label}</a>`;
}

function renderLoginPage(): string {
  setHtml(`
    <div class="auth-page">
      <form class="auth-card stack-md" id="login-form">
        <div class="stack-sm">
          <p class="eyebrow">SquirrellAI Console</p>
          <h1>Sign in to the operator console</h1>
          <p class="muted">Uses the development token issuer exposed at <code>/v1/auth/token</code>.</p>
        </div>
        <label class="field stack-xs">
          <span>Subject</span>
          <input class="input" id="subject" name="subject" placeholder="operator@squirrellai.local" value="operator@squirrellai.local" />
        </label>
        <p class="muted text-xs">Core API: ${escapeHtml(config.coreBaseUrl)} · AI Engine: ${escapeHtml(config.aiEngineBaseUrl)}</p>
        <button class="button" type="submit">Sign in</button>
        <p class="text-danger text-xs" id="login-error"></p>
      </form>
    </div>
  `);

  bindLoginForm();
  return '';
}

function renderExecutionHistory(executions: ExecutionSummary[]): string {
  return `
    <section class="stack-lg">
      <header class="page-header">
        <div>
          <p class="eyebrow">Execution history</p>
          <h2>Control-plane execution ledger</h2>
          <p class="muted">Browse execution state, then drill into detailed logs and artifacts.</p>
        </div>
      </header>
      <div class="table-card">
        <table class="table">
          <thead>
            <tr>
              <th>Execution</th>
              <th>Agent</th>
              <th>Status</th>
              <th>Requested</th>
              <th>Finished</th>
              <th>Summary</th>
            </tr>
          </thead>
          <tbody>
            ${executions
              .map(
                (execution) => `
                  <tr>
                    <td>
                      <a class="table-link" href="#/executions/${escapeHtml(execution.id)}">${escapeHtml(execution.id)}</a>
                      <div class="muted text-xs">${escapeHtml(execution.correlationId)}</div>
                    </td>
                    <td>${escapeHtml(execution.agentId)}</td>
                    <td>${statusBadge(execution.state)}</td>
                    <td>${formatDate(execution.requestedAt)}</td>
                    <td>${formatDate(execution.finishedAt)}</td>
                    <td>${escapeHtml(execution.summary)}</td>
                  </tr>
                `,
              )
              .join('')}
          </tbody>
        </table>
      </div>
    </section>
  `;
}

function renderExecutionDetail(detail: ExecutionDetail): string {
  return `
    <section class="stack-lg">
      <header class="page-header page-header--split">
        <div>
          <p class="eyebrow">Execution detail</p>
          <h2>${escapeHtml(detail.id)}</h2>
          <p class="muted">${escapeHtml(detail.summary)}</p>
        </div>
        <a class="button button--secondary" href="#/executions">Back to history</a>
      </header>
      <div class="grid grid--metrics">
        <article class="panel stack-sm">
          <span class="eyebrow">State</span>
          ${statusBadge(detail.state)}
          <p class="muted">Agent ${escapeHtml(detail.agentId)}</p>
        </article>
        <article class="panel stack-sm">
          <span class="eyebrow">Requested</span>
          <strong>${formatDate(detail.requestedAt)}</strong>
          <p class="muted">Started ${formatDate(detail.startedAt)}</p>
        </article>
        <article class="panel stack-sm">
          <span class="eyebrow">Artifacts</span>
          <strong>${detail.artifacts.length}</strong>
          <p class="muted">Published outputs</p>
        </article>
        <article class="panel stack-sm">
          <span class="eyebrow">Logs</span>
          <strong>${detail.logs.length}</strong>
          <p class="muted">Structured events</p>
        </article>
      </div>
      <article class="panel stack-sm">
        <h3>Execution contract</h3>
        <dl class="definition-list">
          <div>
            <dt>Prompt</dt>
            <dd>${escapeHtml(detail.prompt)}</dd>
          </div>
          <div>
            <dt>Correlation ID</dt>
            <dd>${escapeHtml(detail.correlationId)}</dd>
          </div>
          <div>
            <dt>Runtime endpoint</dt>
            <dd>${escapeHtml(detail.runtimeEndpoint ?? 'Unavailable')}</dd>
          </div>
          <div>
            <dt>Finished at</dt>
            <dd>${formatDate(detail.finishedAt)}</dd>
          </div>
        </dl>
      </article>
      <div class="grid grid--two-columns">
        <article class="panel stack-sm">
          <h3>Execution steps</h3>
          <ul class="list-reset stack-sm">
            ${detail.steps
              .map(
                (step) => `
                  <li class="list-card">
                    <div class="list-card__row">
                      <strong>${escapeHtml(step.title)}</strong>
                      ${statusBadge(step.status)}
                    </div>
                    <p class="muted">Owned by ${escapeHtml(step.owner)}</p>
                    <p class="muted text-xs">${formatDate(step.startedAt)} → ${formatDate(step.finishedAt)}</p>
                  </li>
                `,
              )
              .join('')}
          </ul>
        </article>
        <article class="panel stack-sm">
          <h3>Artifacts</h3>
          <ul class="list-reset stack-sm">
            ${detail.artifacts
              .map(
                (artifact) => `
                  <li class="list-card">
                    <div class="list-card__row">
                      <strong>${escapeHtml(artifact.label)}</strong>
                      ${statusBadge(artifact.kind.toUpperCase(), 'neutral')}
                    </div>
                    <p class="muted text-xs">${escapeHtml(artifact.uri)}</p>
                    <p class="muted text-xs">${formatFileSize(artifact.sizeBytes)} · published ${formatDate(artifact.createdAt)}</p>
                  </li>
                `,
              )
              .join('')}
          </ul>
        </article>
      </div>
      <article class="panel stack-sm">
        <h3>Logs</h3>
        <div class="log-list">
          ${detail.logs
            .map(
              (log) => `
                <div class="log-row">
                  <span class="log-row__timestamp">${formatDate(log.emittedAt)}</span>
                  ${statusBadge(log.level, log.level === 'ERROR' ? 'danger' : log.level === 'WARN' ? 'warning' : 'info')}
                  <strong>${escapeHtml(log.component)}</strong>
                  <span>${escapeHtml(log.message)}</span>
                </div>
              `,
            )
            .join('')}
        </div>
      </article>
    </section>
  `;
}

function renderRegistryPage(
  agents: AgentSummary[],
  tools: ToolSummary[],
  ready: boolean,
  checks: string[],
): string {
  return `
    <section class="stack-lg">
      <header class="page-header page-header--split">
        <div>
          <p class="eyebrow">Registry</p>
          <h2>Agents, tools, and control-plane readiness</h2>
          <p class="muted">Backed by the existing control-plane APIs under <code>/v1</code>.</p>
        </div>
        ${statusBadge(ready ? 'READY' : 'NOT READY', ready ? 'success' : 'danger')}
      </header>
      <article class="panel stack-sm">
        <h3>Readiness checks</h3>
        <div class="chip-row">${checks.map((check) => statusBadge(check, 'neutral')).join('')}</div>
      </article>
      <div class="grid grid--two-columns">
        <article class="panel stack-sm">
          <h3>Agent registry</h3>
          <ul class="list-reset stack-sm">
            ${agents
              .map(
                (agent) => `
                  <li class="list-card stack-sm">
                    <div class="list-card__row">
                      <strong>${escapeHtml(agent.name)}</strong>
                      ${statusBadge(agent.status, agent.status === 'available' ? 'success' : agent.status === 'degraded' ? 'warning' : 'danger')}
                    </div>
                    <p>${escapeHtml(agent.description)}</p>
                    <p class="muted text-xs">ID ${escapeHtml(agent.id)} · Version ${escapeHtml(agent.version)} · Concurrency ${agent.concurrencyLimit}</p>
                    <div class="chip-row">${agent.capabilities.map((capability) => statusBadge(capability, 'info')).join('')}</div>
                  </li>
                `,
              )
              .join('')}
          </ul>
        </article>
        <article class="panel stack-sm">
          <h3>Tool registry</h3>
          <ul class="list-reset stack-sm">
            ${tools
              .map(
                (tool) => `
                  <li class="list-card stack-sm">
                    <div class="list-card__row">
                      <strong>${escapeHtml(tool.name)}</strong>
                      ${statusBadge(
                        `${tool.riskLevel} risk`,
                        tool.riskLevel === 'high' ? 'danger' : tool.riskLevel === 'moderate' ? 'warning' : 'success',
                      )}
                    </div>
                    <p>${escapeHtml(tool.description)}</p>
                    <p class="muted text-xs">Owner ${escapeHtml(tool.owner)} · Category ${escapeHtml(tool.category)} · Input ${escapeHtml(tool.inputMode)} · Version ${escapeHtml(tool.version)}</p>
                  </li>
                `,
              )
              .join('')}
          </ul>
        </article>
      </div>
    </section>
  `;
}

function renderBillingPage(
  billing: BillingSnapshot,
  aiEngineStatus: string,
  aiExecutions: AiEngineExecutionListResponse,
): string {
  const executionUtilization = percentage(billing.usage.executionCount, billing.usage.executionQuota);
  const tokenUtilization = percentage(billing.usage.tokenCount, billing.usage.tokenQuota);

  return `
    <section class="stack-lg">
      <header class="page-header page-header--split">
        <div>
          <p class="eyebrow">Account and billing</p>
          <h2>${escapeHtml(billing.plan.name)} plan</h2>
          <p class="muted">Initial mocked billing backend models pricing, quota, and account state early in the product lifecycle.</p>
        </div>
        ${statusBadge(`AI ENGINE ${aiEngineStatus.toUpperCase()}`, aiEngineStatus === 'ok' ? 'success' : 'danger')}
      </header>
      <div class="grid grid--metrics">
        <article class="panel stack-sm">
          <span class="eyebrow">Monthly price</span>
          <strong>$${billing.plan.monthlyPriceUsd}</strong>
          <p class="muted">Account ${escapeHtml(billing.accountId)}</p>
        </article>
        <article class="panel stack-sm">
          <span class="eyebrow">Execution quota</span>
          <strong>${formatNumber(billing.usage.executionCount)}</strong>
          <p class="muted">of ${formatNumber(billing.usage.executionQuota)} consumed</p>
        </article>
        <article class="panel stack-sm">
          <span class="eyebrow">Token quota</span>
          <strong>${formatNumber(billing.usage.tokenCount)}</strong>
          <p class="muted">of ${formatNumber(billing.usage.tokenQuota)} consumed</p>
        </article>
        <article class="panel stack-sm">
          <span class="eyebrow">Payment method</span>
          <strong>${escapeHtml(billing.paymentMethod.brand)}</strong>
          <p class="muted">•••• ${escapeHtml(billing.paymentMethod.last4)}</p>
        </article>
      </div>
      <div class="grid grid--two-columns">
        <article class="panel stack-sm">
          <h3>Usage this billing period</h3>
          <div class="stack-md">
            <div>
              <div class="list-card__row">
                <span>Executions</span>
                <strong>${executionUtilization}%</strong>
              </div>
              <div class="progress-bar"><div class="progress-bar__fill" style="width: ${executionUtilization}%"></div></div>
            </div>
            <div>
              <div class="list-card__row">
                <span>Tokens</span>
                <strong>${tokenUtilization}%</strong>
              </div>
              <div class="progress-bar"><div class="progress-bar__fill progress-bar__fill--secondary" style="width: ${tokenUtilization}%"></div></div>
            </div>
          </div>
          <p class="muted text-xs">Period ${formatDate(billing.usage.periodStart)} – ${formatDate(billing.usage.periodEnd)} · Overage $${billing.usage.overageUsd}</p>
        </article>
        <article class="panel stack-sm">
          <h3>AI-engine execution pulse</h3>
          <p class="muted">Uses the AI-engine status endpoints so pricing can be evaluated alongside execution-plane activity.</p>
          <ul class="list-reset stack-sm">
            ${aiExecutions.items
              .map(
                (execution) => `
                  <li class="list-card stack-sm">
                    <div class="list-card__row">
                      <strong>${escapeHtml(execution.execution_id)}</strong>
                      ${statusBadge(execution.state, execution.state === 'SUCCEEDED' ? 'success' : execution.state === 'PENDING' ? 'warning' : 'info')}
                    </div>
                    <p>${escapeHtml(execution.summary)}</p>
                  </li>
                `,
              )
              .join('')}
          </ul>
        </article>
      </div>
    </section>
  `;
}

function renderErrorState(message: string): string {
  return `
    <section class="stack-lg">
      <div class="panel stack-sm">
        <p class="text-danger">${escapeHtml(message)}</p>
        <button class="button button--secondary" data-action="rerender" type="button">Retry</button>
      </div>
    </section>
  `;
}

function bindSharedInteractions(): void {
  document.querySelector<HTMLButtonElement>('[data-action="logout"]')?.addEventListener('click', () => {
    writeSession(null);
    navigate('#/login');
  });

  document.querySelector<HTMLButtonElement>('[data-action="rerender"]')?.addEventListener('click', () => {
    void renderApp();
  });
}

function bindLoginForm(): void {
  const form = document.querySelector<HTMLFormElement>('#login-form');
  const subjectInput = document.querySelector<HTMLInputElement>('#subject');
  const errorNode = document.querySelector<HTMLParagraphElement>('#login-error');

  form?.addEventListener('submit', async (event) => {
    event.preventDefault();

    const subject = subjectInput?.value.trim() ?? '';
    if (!subject) {
      if (errorNode) {
        errorNode.textContent = 'Subject is required.';
      }
      return;
    }

    if (errorNode) {
      errorNode.textContent = '';
    }

    try {
      const result = await apiClient.login(subject);
      writeSession({ subject, accessToken: result.accessToken });
      navigate('#/executions');
    } catch (error) {
      if (errorNode) {
        errorNode.textContent = error instanceof Error ? error.message : 'Unable to sign in.';
      }
    }
  });
}

function setHtml(content: string): void {
  appRoot.innerHTML = content;
}

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function formatDate(value: string | null): string {
  return value ? new Date(value).toLocaleString() : '—';
}

function formatNumber(value: number): string {
  return new Intl.NumberFormat().format(value);
}

function formatFileSize(sizeBytes: number): string {
  return `${(sizeBytes / 1024).toFixed(1)} KB`;
}

function percentage(consumed: number, quota: number): number {
  if (quota <= 0) {
    return 0;
  }

  return Math.min(100, Math.round((consumed / quota) * 100));
}

function statusBadge(label: string, tone?: 'neutral' | 'success' | 'warning' | 'danger' | 'info'): string {
  const resolvedTone = tone ?? toneForState(label);
  return `<span class="status-badge status-badge--${resolvedTone}">${escapeHtml(label)}</span>`;
}

function toneForState(state: string): 'neutral' | 'success' | 'warning' | 'danger' | 'info' {
  switch (state) {
    case 'SUCCEEDED':
    case 'available':
      return 'success';
    case 'FAILED':
    case 'ERROR':
    case 'CANCELLED':
    case 'TIMED_OUT':
    case 'offline':
      return 'danger';
    case 'WARN':
    case 'PENDING':
    case 'SCHEDULED':
    case 'degraded':
      return 'warning';
    case 'RUNNING':
    case 'INFO':
      return 'info';
    default:
      return 'neutral';
  }
}
