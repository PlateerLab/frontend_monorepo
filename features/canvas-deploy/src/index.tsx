'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from '@xgen/i18n';
import { useAuth } from '@xgen/auth-provider';
import {
  LuX,
  LuExternalLink,
  LuCode,
  LuTerminal,
  LuShare2,
  LuCopy,
  LuPlus,
  LuCheck,
  LuLoader,
} from '@xgen/icons';
import {
  getDeployStatus,
  updateWorkflow,
  generateEmbedJs,
} from '@xgen/api-client';
import { config } from '@xgen/config';
import styles from './styles/deploy-modal.module.scss';

// Side-effect: register translations
import './locales';

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

export interface DeploymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  workflow: { id: string; name: string; user_id?: string | number };
  workflowDetail?: { nodes?: any[]; edges?: any[] };
  onDeployStatusChange?: (workflowName: string, isDeployed: boolean) => void;
}

// ─────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────

const parseAdditionalParams = (workflowData: any) => {
  if (!workflowData?.nodes || !workflowData?.edges) return null;
  const result: Record<string, Record<string, unknown>> = {};
  const schemaNodes = workflowData.nodes.filter(
    (n: any) =>
      n.data?.nodeName === 'Schema Provider(Input)' ||
      n.data?.id === 'input_schema_provider',
  );
  if (schemaNodes.length === 0) return null;
  schemaNodes.forEach((node: any) => {
    const connected = workflowData.edges.filter(
      (e: any) =>
        e.source?.nodeId === node.id &&
        e.source?.portId === 'args_schema' &&
        e.source?.portType === 'output',
    );
    connected.forEach((edge: any) => {
      const handleIdParams: Record<string, unknown> = {};
      (node.data?.parameters || []).forEach((p: any) => {
        if (p.handle_id === true) handleIdParams[p.id] = p.value;
      });
      if (Object.keys(handleIdParams).length > 0) {
        result[edge.target.nodeId] = handleIdParams;
      }
    });
  });
  return Object.keys(result).length > 0 ? result : null;
};

const OutputSchemaProviderParse = (workflowData: any) => {
  if (!workflowData?.nodes || !workflowData?.edges) return null;
  const nodes = workflowData.nodes.filter(
    (n: any) =>
      n.data?.nodeName === 'Schema Provider(output)' ||
      n.data?.id === 'output_schema_provider',
  );
  if (nodes.length === 0) return null;
  const schema: Record<string, unknown> = {};
  (nodes[0].data?.parameters || []).forEach((p: any) => {
    if (p.handle_id === true) schema[p.id] = p.value;
  });
  return Object.keys(schema).length > 0 ? schema : null;
};

const formatParams = (params: any, indent = 4): string => {
  if (!params) return 'None';
  return JSON.stringify(params, null, indent);
};

async function copyToClipboard(text: string): Promise<boolean> {
  if (navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch { /* fallback */ }
  }
  try {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.setAttribute('readonly', '');
    ta.style.position = 'absolute';
    ta.style.left = '-9999px';
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand('copy');
    document.body.removeChild(ta);
    return ok;
  } catch {
    return false;
  }
}

// ─────────────────────────────────────────────────────────────
// CodeBlock
// ─────────────────────────────────────────────────────────────

function CodeBlock({ code, onCopy }: { code: string; onCopy: (text: string) => void }) {
  return (
    <div className={styles.codeBlock}>
      <button className={styles.copyButton} onClick={() => onCopy(code)} type="button">
        <LuCopy /> Copy
      </button>
      <pre><code>{code}</code></pre>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// DeploymentModal
// ─────────────────────────────────────────────────────────────

export const DeploymentModal: React.FC<DeploymentModalProps> = ({
  isOpen,
  onClose,
  workflow,
  workflowDetail,
  onDeployStatusChange,
}) => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const closeRef = useRef<HTMLButtonElement>(null);

  const userId = workflow.user_id
    ? String(workflow.user_id)
    : user?.user_id
    ? String(user.user_id)
    : '';

  const [baseUrl, setBaseUrl] = useState('');
  const [activeTab, setActiveTab] = useState('website');
  const [activeApiLang, setActiveApiLang] = useState('python');
  const [curlPayload, setCurlPayload] = useState('');
  const [toggleDeploy, setToggleDeploy] = useState(false);
  const [loading, setLoading] = useState(false);

  // Embed states
  const [embedMode, setEmbedMode] = useState<'basic' | 'custom'>('basic');
  const [embedType, setEmbedType] = useState<'popup' | 'full'>('popup');
  const [customEmbedParams, setCustomEmbedParams] = useState({
    workflowId: '',
    userId: '',
    apiHost: '',
    backendApiHost: '',
    workflowName: '',
    uriPrefix: 'embed',
  });
  const [generatedEmbedUrl, setGeneratedEmbedUrl] = useState<string | null>(null);
  const [generatingEmbed, setGeneratingEmbed] = useState(false);
  const [copyFeedback, setCopyFeedback] = useState('');

  useEffect(() => {
    if (typeof window !== 'undefined') setBaseUrl(window.location.origin);
  }, []);

  // Fetch deploy status on open
  useEffect(() => {
    if (!isOpen || !workflow?.id || workflow.id === 'None' || !userId) {
      setToggleDeploy(false);
      return;
    }
    if (workflow.name === 'default_mode') {
      setToggleDeploy(false);
      return;
    }
    (async () => {
      try {
        const status = await getDeployStatus(workflow.id, userId);
        setToggleDeploy(status.is_deployed);
      } catch {
        setToggleDeploy(false);
      }
    })();
  }, [isOpen, workflow?.id, workflow?.name, userId]);

  // Reset state on open
  useEffect(() => {
    if (!isOpen) return;
    setActiveTab('website');
    setActiveApiLang('python');
    setCurlPayload(
      JSON.stringify(
        {
          workflow_name: workflow.name,
          workflow_id: workflow.id,
          input_data: '안녕하세요',
          interaction_id: 'deploy_example',
          user_id: userId,
        },
        null,
        2,
      ),
    );
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    setCustomEmbedParams({
      workflowId: workflow.id,
      userId,
      apiHost: origin,
      backendApiHost: config.API_BASE_URL,
      workflowName: workflow.name,
      uriPrefix: 'embed',
    });
    setGeneratedEmbedUrl(null);
    setEmbedMode('basic');
    setEmbedType('popup');
    setTimeout(() => closeRef.current?.focus(), 100);
  }, [isOpen, workflow?.id, workflow?.name, userId]);

  const handleCopy = useCallback(
    async (text: string) => {
      const ok = await copyToClipboard(text);
      setCopyFeedback(ok ? t('canvas.deploy.copySuccess') : t('canvas.deploy.copyError'));
      setTimeout(() => setCopyFeedback(''), 2000);
    },
    [t],
  );

  const handleToggleDeploy = useCallback(async () => {
    const newStatus = !toggleDeploy;
    setLoading(true);
    try {
      setToggleDeploy(newStatus);
      await updateWorkflow(workflow.id, { enable_deploy: newStatus });
      onDeployStatusChange?.(workflow.name, newStatus);
    } catch {
      setToggleDeploy(!newStatus);
    } finally {
      setLoading(false);
    }
  }, [toggleDeploy, workflow.id, workflow.name, onDeployStatusChange]);

  const handleGenerateEmbed = useCallback(async () => {
    setGeneratingEmbed(true);
    try {
      const result = await generateEmbedJs({ ...customEmbedParams, embedType });
      setGeneratedEmbedUrl(`${baseUrl}${result.url}`);
    } catch (err) {
      console.error('Failed to generate embed JS:', err);
    } finally {
      setGeneratingEmbed(false);
    }
  }, [customEmbedParams, embedType, baseUrl]);

  if (!isOpen) return null;

  // Derived values
  const apiEndpoint = `${baseUrl}/api/workflow/execute/deploy/stream`;
  const webPageUrl = `${baseUrl}/chatbot/${workflow.id}?userId=${encodeURIComponent(userId)}`;
  const additionalParams = parseAdditionalParams(workflowDetail);
  const outputSchema = OutputSchemaProviderParse(workflowDetail);

  const pythonCode = `import requests

API_URL = "${apiEndpoint}"

response = requests.post(API_URL, json={
    "workflow_name": "${workflow.name}",
    "workflow_id": "${workflow.id}",
    "input_data": "안녕하세요",
    "interaction_id": "deploy_example",
    "additional_params": ${formatParams(additionalParams)},
    "user_id": "${userId}",
    "include_tool_events": True
})

result = response.json()
print("Response:", result['content'])
${outputSchema ? `\n# Output Schema:\n# ${formatParams(outputSchema)}` : ''}`;

  const jsCode = `const url = "${apiEndpoint}";

const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
        workflow_name: "${workflow.name}",
        workflow_id: "${workflow.id}",
        input_data: "안녕하세요",
        interaction_id: "deploy_example",
        additional_params: ${formatParams(additionalParams, 8)},
        user_id: "${userId}",
        include_tool_events: true
    })
});

const result = await response.json();
console.log("Response:", result.content);
${outputSchema ? `\n// Output Schema:\n// ${formatParams(outputSchema)}` : ''}`;

  const curlCode = `curl -X 'POST' \\
    '${apiEndpoint}' \\
    -H 'Content-Type: application/json' \\
    -d '${curlPayload.replace(/'/g, "'\\''")}' | jq .`;

  const popupHtml = `<script type="module">
    import {Chatbot} from "${baseUrl}/chatbot-embed.js"
    Chatbot.init({
        workflowId: "${workflow.id}",
        userId: "${userId}",
        apiHost: "${baseUrl}",
        backendApiHost: "${config.API_BASE_URL}",
        workflowName: "${workflow.name}"
    })
</script>`;

  const fullPageHtml = `<fullchatbot style="width: 100%; height: 100%;"></fullchatbot>
<script type="module">
    import {Chatbot} from "${baseUrl}/chatbot-embed.js"
    Chatbot.initFull({
        workflowId: "${workflow.id}",
        userId: "${userId}",
        apiHost: "${baseUrl}",
        backendApiHost: "${config.API_BASE_URL}",
        workflowName: "${workflow.name}"
    })
</script>`;

  const modalContent = (
    <div className={styles.backdrop} onClick={onClose} role="presentation">
      <div
        className={styles.container}
        role="dialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className={styles.header}>
          <h3>{t('canvas.deploy.title', { workflowName: workflow.name })}</h3>
          <button ref={closeRef} onClick={onClose} className={styles.closeButton} type="button" aria-label="Close">
            <LuX />
          </button>
        </div>

        {/* Copy feedback */}
        {copyFeedback && (
          <div style={{ padding: '4px 24px', fontSize: '0.75rem', color: '#16a34a' }}>
            {copyFeedback}
          </div>
        )}

        {/* Tabs */}
        <div className={styles.tabContainer}>
          {(['website', 'api', 'curl', 'embed'] as const).map((tab) => {
            const icons = { website: LuExternalLink, api: LuCode, curl: LuTerminal, embed: LuShare2 };
            const labels = {
              website: t('canvas.deploy.tabWebpage'),
              api: t('canvas.deploy.tabApi'),
              curl: t('canvas.deploy.tabCurl'),
              embed: t('canvas.deploy.tabEmbed'),
            };
            const Icon = icons[tab];
            return (
              <button
                key={tab}
                className={`${styles.tabButton} ${activeTab === tab ? styles.active : ''}`}
                onClick={() => setActiveTab(tab)}
                type="button"
              >
                <Icon /> {labels[tab]}
              </button>
            );
          })}
        </div>

        {/* Content */}
        <div className={styles.content}>
          {/* ── Website Tab ── */}
          {activeTab === 'website' && (
            <div className={styles.tabPanel}>
              <div className={styles.deployInfo}>
                <p>{t('canvas.deploy.webpageDesc')}</p>
                {workflow.name !== 'default_mode' ? (
                  <button
                    type="button"
                    className={`${styles.toggleButton} ${toggleDeploy ? styles.active : ''}`}
                    onClick={handleToggleDeploy}
                    disabled={loading}
                  >
                    {loading
                      ? t('canvas.deploy.processing')
                      : toggleDeploy
                      ? t('canvas.deploy.deploying')
                      : t('canvas.deploy.private')}
                  </button>
                ) : (
                  <div className={styles.defaultModeInfo}>
                    <p>{t('canvas.deploy.defaultModeNotDeployable')}</p>
                  </div>
                )}
              </div>
              <div className={styles.webPageUrl}>
                <a href={baseUrl ? webPageUrl : '#'} target="_blank" rel="noopener noreferrer">
                  {baseUrl ? webPageUrl : 'URL 생성 중...'}
                </a>
                <button type="button" onClick={() => handleCopy(webPageUrl)} disabled={!baseUrl}>
                  Copy
                </button>
              </div>
            </div>
          )}

          {/* ── API Tab ── */}
          {activeTab === 'api' && (
            <div className={styles.tabPanel}>
              <p>{t('canvas.deploy.apiDesc')}</p>
              <div className={styles.nestedTabContainer}>
                <button
                  type="button"
                  className={`${styles.langTabButton} ${activeApiLang === 'python' ? styles.active : ''}`}
                  onClick={() => setActiveApiLang('python')}
                >
                  Python
                </button>
                <button
                  type="button"
                  className={`${styles.langTabButton} ${activeApiLang === 'javascript' ? styles.active : ''}`}
                  onClick={() => setActiveApiLang('javascript')}
                >
                  JavaScript
                </button>
              </div>
              {activeApiLang === 'python' && (
                <CodeBlock code={baseUrl ? pythonCode : t('canvas.deploy.codeGenerating')} onCopy={handleCopy} />
              )}
              {activeApiLang === 'javascript' && (
                <CodeBlock code={baseUrl ? jsCode : t('canvas.deploy.codeGenerating')} onCopy={handleCopy} />
              )}
            </div>
          )}

          {/* ── cURL Tab ── */}
          {activeTab === 'curl' && (
            <div className={styles.tabPanel}>
              <p>{t('canvas.deploy.curlDesc')}</p>
              <textarea
                className={styles.payloadTextarea}
                value={curlPayload}
                onChange={(e) => setCurlPayload(e.target.value)}
                rows={10}
                spellCheck={false}
              />
              <h5 className={styles.sectionTitle}>{t('canvas.deploy.generatedCurl')}</h5>
              <CodeBlock code={baseUrl ? curlCode : t('canvas.deploy.codeGenerating')} onCopy={handleCopy} />
            </div>
          )}

          {/* ── Embed Tab ── */}
          {activeTab === 'embed' && (
            <div className={styles.tabPanel}>
              <div className={styles.nestedTabContainer}>
                <button
                  type="button"
                  className={`${styles.langTabButton} ${embedMode === 'basic' ? styles.active : ''}`}
                  onClick={() => setEmbedMode('basic')}
                >
                  {t('canvas.deploy.basicEmbedCode')}
                </button>
                <button
                  type="button"
                  className={`${styles.langTabButton} ${embedMode === 'custom' ? styles.active : ''}`}
                  onClick={() => setEmbedMode('custom')}
                >
                  <LuPlus /> {t('canvas.deploy.customJsGenerate')}
                </button>
              </div>

              {embedMode === 'basic' && (
                <>
                  <p>{t('canvas.deploy.embedDesc')}</p>
                  <h5 className={styles.sectionTitle}>{t('canvas.deploy.embedPopup')}</h5>
                  <CodeBlock code={baseUrl ? popupHtml : t('canvas.deploy.codeGenerating')} onCopy={handleCopy} />
                  <h5 className={styles.sectionTitle}>{t('canvas.deploy.embedFullPage')}</h5>
                  <CodeBlock code={baseUrl ? fullPageHtml : t('canvas.deploy.codeGenerating')} onCopy={handleCopy} />
                </>
              )}

              {embedMode === 'custom' && (
                <>
                  <p>{t('canvas.deploy.editParams')}</p>

                  <div className={styles.embedTypeSelector}>
                    <label>{t('canvas.deploy.embedType')}</label>
                    <div className={styles.radioGroup}>
                      <label className={styles.radioLabel}>
                        <input type="radio" name="embedType" value="popup" checked={embedType === 'popup'} onChange={() => setEmbedType('popup')} />
                        <span>{t('canvas.deploy.embedPopup')}</span>
                      </label>
                      <label className={styles.radioLabel}>
                        <input type="radio" name="embedType" value="full" checked={embedType === 'full'} onChange={() => setEmbedType('full')} />
                        <span>{t('canvas.deploy.embedFullPage')}</span>
                      </label>
                    </div>
                  </div>

                  <div className={styles.embedParamsForm}>
                    {([
                      ['workflowId', 'Workflow ID', 'workflow_xxxxx'],
                      ['userId', 'User ID', 'user_id'],
                      ['apiHost', 'API Host', 'https://example.com'],
                      ['backendApiHost', 'Backend API Host', 'https://backend.example.com'],
                      ['workflowName', 'Workflow Name', 'My Chatbot'],
                    ] as const).map(([key, label, placeholder]) => (
                      <div key={key} className={styles.formGroup}>
                        <label htmlFor={`embed-${key}`}>{label}</label>
                        <input
                          id={`embed-${key}`}
                          type="text"
                          value={(customEmbedParams as any)[key]}
                          onChange={(e) => setCustomEmbedParams((prev) => ({ ...prev, [key]: e.target.value }))}
                          placeholder={placeholder}
                        />
                      </div>
                    ))}
                    <div className={styles.formGroup}>
                      <label htmlFor="embed-uriPrefix">URI Prefix</label>
                      <input
                        id="embed-uriPrefix"
                        type="text"
                        value={customEmbedParams.uriPrefix}
                        onChange={(e) => {
                          const filtered = e.target.value.replace(/[^a-zA-Z_-]/g, '').slice(0, 50);
                          setCustomEmbedParams((prev) => ({ ...prev, uriPrefix: filtered }));
                        }}
                        placeholder="embed"
                      />
                    </div>
                  </div>

                  <button
                    type="button"
                    className={styles.generateButton}
                    onClick={handleGenerateEmbed}
                    disabled={generatingEmbed || !customEmbedParams.workflowId || !customEmbedParams.userId || !customEmbedParams.apiHost || !customEmbedParams.workflowName}
                  >
                    {generatingEmbed ? (
                      <><LuLoader /> {t('canvas.deploy.generating')}</>
                    ) : (
                      <><LuPlus /> {t('canvas.deploy.generateJs')}</>
                    )}
                  </button>

                  {generatedEmbedUrl && (
                    <div className={styles.generatedUrl}>
                      <p><LuCheck /> {t('canvas.deploy.generatedUrl')}</p>
                      <a href={generatedEmbedUrl} target="_blank" rel="noopener noreferrer">
                        {generatedEmbedUrl}
                      </a>
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};

export default DeploymentModal;
