'use client';

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useTranslation } from '@xgen/i18n';
import { useAuth } from '@xgen/auth-provider';
import { useToast, ChatPanel, ChatEmptyState } from '@xgen/ui';
import type { ChatPanelMessage } from '@xgen/ui';
import {
  FiTrash2, FiChevronRight, FiChevronDown, FiRefreshCw, FiUpload,
} from '@xgen/icons';
import {
  getDeployStatus, updateDeploySettings, uploadDeployImage,
  getDeployImage, deleteDeployChat, executeAgentflowStream,
} from '@xgen/api-client';
import type { DeployStatus, DeployUpdateData } from '@xgen/api-client';
import { config } from '@xgen/config';
import { DEFAULT_ERROR_MESSAGES, ERROR_CATEGORIES } from './constants';
import './locales';

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────

export interface DeploySettingsAgentflow {
  id: string;
  name: string;
  userId?: number | string;
}

export interface DeploySettingsProps {
  workflow: DeploySettingsAgentflow;
  onBack: () => void;
}

type SettingsTab = 'style' | 'embed' | 'startMsg' | 'errorMsg';
type TesterTab = 'chat' | 'embed';
type Alignment = 'left' | 'center' | 'right';

interface ChatMsg {
  id: string;
  sender: 'user' | 'assistant' | 'system';
  content: string;
  createdAt: string;
  status: 'pending' | 'sent' | 'error' | 'streaming';
  errorMessage?: string;
}

const msgId = () => `msg_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;

// ─────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────

export const DeploySettings: React.FC<DeploySettingsProps> = ({ workflow, onBack }) => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { toast } = useToast();

  // Settings tab
  const [settingsTab, setSettingsTab] = useState<SettingsTab>('style');

  // Customization state
  const [profileImage, setProfileImage] = useState('');
  const [profileImageBlobUrl, setProfileImageBlobUrl] = useState('');
  const [botName, setBotName] = useState(workflow.name || 'Agentflow');
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [primaryColor, setPrimaryColor] = useState('#2563eb');
  const [botMessageColor, setBotMessageColor] = useState('#ffffff');
  const [embedWidth, setEmbedWidth] = useState('400');
  const [embedHeight, setEmbedHeight] = useState('600');
  const [defaultExpanded, setDefaultExpanded] = useState(false);
  const [enableAudio, setEnableAudio] = useState(false);
  const [enableFile, setEnableFile] = useState(false);
  const [enableToolList, setEnableToolList] = useState(false);
  const [enableAgentList, setEnableAgentList] = useState(false);
  const [welcomeMsg, setWelcomeMsg] = useState('안녕하세요!');
  const [suggestedReplies, setSuggestedReplies] = useState<string[]>(['']);
  const [suggestedRepliesAlignment, setSuggestedRepliesAlignment] = useState<Alignment>('left');
  const [errorMessages, setErrorMessages] = useState<Record<string, string>>({});
  const [collapsedCategories, setCollapsedCategories] = useState<Record<string, boolean>>({});

  // Loading / saving
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const isInitialLoad = useRef(true);

  // Tester
  const [testerTab, setTesterTab] = useState<TesterTab>('chat');
  const [chatMessages, setChatMessages] = useState<ChatMsg[]>([]);
  const [isExecuting, setIsExecuting] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [chatKey, setChatKey] = useState(0);
  const [isEmbedCollapsed, setIsEmbedCollapsed] = useState(true);
  const abortRef = useRef<AbortController | null>(null);
  const interactionIdRef = useRef('');
  const embedContainerRef = useRef<HTMLDivElement>(null);
  const [embedScale, setEmbedScale] = useState(1);

  const baseUrl = useMemo(() => {
    if (typeof window !== 'undefined') return window.location.origin;
    return '';
  }, []);

  // ── Compute embed scale to fit container ────────────────

  useEffect(() => {
    if (testerTab !== 'embed' || isEmbedCollapsed) return;
    const container = embedContainerRef.current;
    if (!container) return;

    const computeScale = () => {
      const rect = container.getBoundingClientRect();
      // Leave space for helper bar (52px) + padding
      const availW = rect.width - 40;
      const availH = rect.height - 80;
      const iframeW = parseInt(embedWidth) || 400;
      const iframeH = parseInt(embedHeight) || 600;
      const scaleX = availW / iframeW;
      const scaleY = availH / iframeH;
      setEmbedScale(Math.min(scaleX, scaleY, 1));
    };

    computeScale();
    const observer = new ResizeObserver(computeScale);
    observer.observe(container);
    return () => observer.disconnect();
  }, [testerTab, isEmbedCollapsed, embedWidth, embedHeight]);

  // ── Build welcome messages for tester ───────────────────

  const welcomeMessages: ChatMsg[] = useMemo(() => {
    const msgs: ChatMsg[] = [];
    if (welcomeMsg) {
      msgs.push({
        id: 'welcome_msg', sender: 'assistant', content: welcomeMsg,
        createdAt: new Date().toISOString(), status: 'sent',
      });
    }
    return msgs;
  }, [welcomeMsg]);

  // Whether user has sent any messages (to control suggestion visibility)
  const hasUserChatMessages = useMemo(
    () => chatMessages.some((m: ChatMsg) => m.sender === 'user'),
    [chatMessages],
  );

  // ── Load deploy settings ────────────────────────────────

  useEffect(() => {
    if (!user) return;
    let cancelled = false;

    (async () => {
      try {
        setLoading(true);
        const status = await getDeployStatus(workflow.id, user.id);

        if (cancelled) return;

        if (status.deploy_name) setBotName(status.deploy_name);
        if (status.deploy_start_msg) setWelcomeMsg(status.deploy_start_msg);
        if (status.deploy_msg_selection?.length) {
          setSuggestedReplies(status.deploy_msg_selection);
        }

        const style = status.deploy_style;
        if (style) {
          if (style.theme) setTheme(style.theme);
          if (style.primaryColor) setPrimaryColor(style.primaryColor);
          if (style.botMessageColor) setBotMessageColor(style.botMessageColor);
          if (style.embedWidth) setEmbedWidth(style.embedWidth);
          if (style.embedHeight) setEmbedHeight(style.embedHeight);
          if (style.defaultExpanded !== undefined) setDefaultExpanded(style.defaultExpanded);
          if (style.enableAudio !== undefined) setEnableAudio(style.enableAudio);
          if (style.enableFile !== undefined) setEnableFile(style.enableFile);
          if (style.enableToolList !== undefined) setEnableToolList(style.enableToolList);
          if (style.enableAgentList !== undefined) setEnableAgentList(style.enableAgentList);
          if (style.suggestedRepliesAlignment) setSuggestedRepliesAlignment(style.suggestedRepliesAlignment);
        }

        // Load profile image
        if (status.deploy_img) {
          try {
            const imgUrl = await getDeployImage(workflow.id, true);
            if (!cancelled) {
              setProfileImageBlobUrl(imgUrl);
              setProfileImage(imgUrl);
            }
          } catch {
            // No image available
          }
        }

        // Generate interaction ID for bot tester
        interactionIdRef.current = `deploy_setting_${workflow.id}_${user.id}`;
      } catch (err) {
        console.error('Failed to load deploy settings:', err);
      } finally {
        if (!cancelled) {
          setLoading(false);
          setTimeout(() => { isInitialLoad.current = false; }, 600);
        }
      }
    })();

    return () => { cancelled = true; };
  }, [workflow.id, user]);

  // ── Auto-save with debounce ─────────────────────────────

  useEffect(() => {
    if (isInitialLoad.current || loading) return;

    const timer = setTimeout(async () => {
      setIsSaving(true);
      try {
        const updateData: DeployUpdateData = {
          deploy_name: botName,
          deploy_start_msg: welcomeMsg,
          deploy_msg_selection: suggestedReplies.filter((r: string) => r.trim() !== ''),
          deploy_style: {
            theme,
            primaryColor,
            botMessageColor,
            embedWidth,
            embedHeight,
            defaultExpanded,
            enableAudio,
            enableFile,
            enableToolList,
            enableAgentList,
            suggestedRepliesAlignment,
          },
          deploy_error_msg: Object.keys(errorMessages).length > 0 ? errorMessages : undefined,
        };
        await updateDeploySettings(workflow.id, updateData);
      } catch (err) {
        console.error('Auto-save failed:', err);
      } finally {
        setIsSaving(false);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [
    botName, theme, primaryColor, botMessageColor,
    embedWidth, embedHeight, defaultExpanded,
    enableAudio, enableFile, enableToolList, enableAgentList,
    welcomeMsg, suggestedReplies, suggestedRepliesAlignment,
    errorMessages, workflow.id, loading,
  ]);

  // ── Reset to defaults ───────────────────────────────────

  const handleResetDefaults = useCallback(() => {
    setBotName(workflow.name || 'Agentflow');
    setTheme('light');
    setPrimaryColor('#2563eb');
    setBotMessageColor('#ffffff');
    setEnableAudio(false);
    setEnableFile(false);
    setEnableToolList(false);
    setEnableAgentList(false);
    setEmbedWidth('400');
    setEmbedHeight('600');
    setDefaultExpanded(false);
    setWelcomeMsg('안녕하세요!');
    setSuggestedReplies(['']);
    setErrorMessages({});
  }, [workflow.name]);

  // ── Image handlers ──────────────────────────────────────

  const handleImageUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file || !user) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error(t('deploySettings.profile.maxSize'));
      return;
    }

    try {
      await uploadDeployImage(workflow.id, file, user.id, false);
      if (profileImageBlobUrl) URL.revokeObjectURL(profileImageBlobUrl);
      await new Promise((r) => setTimeout(r, 200));
      const newUrl = await getDeployImage(workflow.id, true);
      setProfileImageBlobUrl(newUrl);
      setProfileImage(newUrl);
      toast.success(t('deploySettings.profile.uploadSuccess'));
    } catch {
      toast.error(t('deploySettings.profile.uploadFailed'));
    }
  }, [workflow.id, user, profileImageBlobUrl, toast, t]);

  const handleImageDelete = useCallback(async () => {
    if (!user) return;
    try {
      await uploadDeployImage(workflow.id, null, user.id, true);
      if (profileImageBlobUrl) URL.revokeObjectURL(profileImageBlobUrl);
      await new Promise((r) => setTimeout(r, 200));
      const newUrl = await getDeployImage(workflow.id, true);
      setProfileImageBlobUrl(newUrl);
      setProfileImage(newUrl);
      toast.success(t('deploySettings.profile.defaultSuccess'));
    } catch {
      toast.error(t('deploySettings.profile.defaultFailed'));
    }
  }, [workflow.id, user, profileImageBlobUrl, toast, t]);

  // ── Bot tester chat ─────────────────────────────────────

  const handleSend = useCallback(async (text: string) => {
    if (!user) return;

    setIsExecuting(true);
    setIsStreaming(true);

    const userMsg: ChatMsg = {
      id: msgId(), sender: 'user', content: text,
      createdAt: new Date().toISOString(), status: 'sent',
    };
    const asstId = msgId();
    const asstMsg: ChatMsg = {
      id: asstId, sender: 'assistant', content: '',
      createdAt: new Date().toISOString(), status: 'streaming',
    };

    setChatMessages((prev: ChatMsg[]) => [...prev, userMsg, asstMsg]);

    abortRef.current = new AbortController();
    let accumulated = '';

    try {
      await executeAgentflowStream({
        workflowName: workflow.name,
        workflowId: workflow.id,
        inputData: text,
        interactionId: interactionIdRef.current,
        user_id: String(user.id),
        signal: abortRef.current.signal,
        onData: (content: unknown) => {
          const t = typeof content === 'string' ? content : JSON.stringify(content);
          accumulated += t;
          setChatMessages((prev: ChatMsg[]) =>
            prev.map((m: ChatMsg) => m.id === asstId ? { ...m, content: accumulated } : m),
          );
        },
        onEnd: () => {
          setChatMessages((prev: ChatMsg[]) =>
            prev.map((m: ChatMsg) => m.id === asstId ? { ...m, status: 'sent' as const } : m),
          );
        },
        onError: (err: unknown) => {
          setChatMessages((prev: ChatMsg[]) =>
            prev.map((m: ChatMsg) => m.id === asstId
              ? { ...m, status: 'error' as const, content: String(err) }
              : m),
          );
        },
      });
    } catch (err) {
      setChatMessages((prev: ChatMsg[]) =>
        prev.map((m: ChatMsg) => m.id === asstId
          ? { ...m, status: 'error' as const, content: (err as Error).message }
          : m),
      );
    } finally {
      setIsExecuting(false);
      setIsStreaming(false);
      abortRef.current = null;
    }
  }, [workflow.id, workflow.name, user]);

  const handleStop = useCallback(() => {
    abortRef.current?.abort();
  }, []);

  const handleRetry = useCallback((messageId: string) => {
    const idx = chatMessages.findIndex((m: ChatMsg) => m.id === messageId);
    if (idx < 0) return;
    const msg = chatMessages[idx];
    if (msg.sender === 'user') {
      setChatMessages((prev: ChatMsg[]) => prev.slice(0, idx));
      handleSend(msg.content);
    } else if (msg.sender === 'assistant' && idx > 0) {
      const prevMsg = chatMessages[idx - 1];
      if (prevMsg.sender === 'user') {
        setChatMessages((prev: ChatMsg[]) => prev.slice(0, idx - 1));
        handleSend(prevMsg.content);
      }
    }
  }, [chatMessages, handleSend]);

  const handleResetChat = useCallback(async () => {
    if (!interactionIdRef.current) return;
    try {
      await deleteDeployChat(interactionIdRef.current);
      setChatMessages([]);
      setChatKey((k: number) => k + 1);
      toast.success(t('deploySettings.tester.resetSuccess'));
    } catch {
      toast.error(t('deploySettings.tester.resetFailed'));
    }
  }, [toast, t]);

  // Convert for ChatPanel (prepend welcome messages)
  const panelMessages: ChatPanelMessage[] = useMemo(
    () => [...welcomeMessages, ...chatMessages].map((m: ChatMsg) => ({
      id: m.id, sender: m.sender, content: m.content,
      createdAt: m.createdAt, status: m.status, errorMessage: m.errorMessage,
    })),
    [welcomeMessages, chatMessages],
  );

  // Cleanup blob URLs
  useEffect(() => {
    return () => {
      if (profileImageBlobUrl) URL.revokeObjectURL(profileImageBlobUrl);
    };
  }, [profileImageBlobUrl]);

  // ── Tab buttons config ──────────────────────────────────

  const settingsTabs: { key: SettingsTab; label: string }[] = [
    { key: 'style', label: t('deploySettings.tabs.style') },
    { key: 'embed', label: t('deploySettings.tabs.embed') },
    { key: 'startMsg', label: t('deploySettings.tabs.startMsg') },
    { key: 'errorMsg', label: t('deploySettings.tabs.errorMsg') },
  ];

  // ── Toggle component (inline) ───────────────────────────

  const Toggle: React.FC<{ checked: boolean; onChange: (v: boolean) => void; label: string }> = ({ checked, onChange, label }) => (
    <div
      className="flex items-center gap-3 p-3 bg-gray-50 border border-gray-200 rounded-lg cursor-pointer hover:border-gray-300 hover:bg-gray-100 transition-all"
      onClick={() => onChange(!checked)}
    >
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={(e: React.MouseEvent) => { e.stopPropagation(); onChange(!checked); }}
        className={`relative inline-flex h-6 w-11 shrink-0 rounded-full border-2 border-transparent transition-colors ${checked ? 'bg-blue-500' : 'bg-gray-300'}`}
      >
        <span className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow-md transform transition-transform ${checked ? 'translate-x-5' : 'translate-x-0'}`} />
      </button>
      <span className="text-sm font-medium text-gray-700">{label}</span>
    </div>
  );

  // ── Loading state ───────────────────────────────────────

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-gray-200 border-t-blue-500 rounded-full animate-spin" />
          <p className="text-sm text-gray-500">{t('deploySettings.tester.loading')}</p>
        </div>
      </div>
    );
  }

  // ── Render ──────────────────────────────────────────────

  return (
    <div className="flex flex-col h-full w-full p-6">
      {/* Content: Left settings + Right tester */}
      <div className="flex gap-4 flex-1 min-h-0 overflow-hidden">
        {/* ─── Left Panel: Settings ─── */}
        <div className="flex flex-col w-[380px] shrink-0 bg-white rounded-lg border border-gray-200 p-5 overflow-y-auto">
          {/* Tab Buttons */}
          <div className="mb-4">
            <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-lg">
              {settingsTabs.map((tab) => (
                <button
                  key={tab.key}
                  className={`flex-1 px-2 py-2 text-[13px] font-medium rounded-md transition-all whitespace-nowrap ${
                    settingsTab === tab.key
                      ? 'bg-white text-blue-500 shadow-sm'
                      : 'text-gray-600 hover:bg-white hover:text-gray-800'
                  } ${tab.key === 'startMsg' ? 'flex-[1.3]' : ''}`}
                  onClick={() => setSettingsTab(tab.key)}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Settings Content */}
          <div className="flex flex-col gap-5">
            {/* ── Style Tab ── */}
            {settingsTab === 'style' && (
              <>
                {/* Reset to defaults */}
                <div>
                  <button
                    onClick={handleResetDefaults}
                    className="w-full px-4 py-2.5 border border-gray-200 bg-white text-gray-700 text-sm font-medium rounded-md hover:bg-gray-50 hover:border-blue-500 hover:text-blue-500 transition-all"
                  >
                    {t('deploySettings.resetDefaults')}
                  </button>
                </div>

                {/* Profile Image */}
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-medium text-gray-800">
                    {t('deploySettings.profile.label')}{' '}
                    <span className="text-gray-400 font-normal">{t('deploySettings.profile.optional')}</span>
                  </label>
                  <div className="flex items-center gap-3">
                    <div className="w-16 h-16 rounded-full bg-gray-50 border-2 border-gray-200 flex items-center justify-center overflow-hidden shrink-0">
                      {profileImage ? (
                        <img src={profileImage} alt="Profile" className="w-full h-full object-cover rounded-full" />
                      ) : (
                        <div className="text-2xl">🤖</div>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <label className="px-3 py-2 border border-gray-200 bg-white text-gray-700 text-sm font-medium rounded-md cursor-pointer hover:bg-gray-50 hover:border-blue-500 transition-all">
                        {t('deploySettings.profile.upload')}
                        <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                      </label>
                      <button
                        className="p-2 border border-gray-200 bg-white text-gray-400 rounded-md hover:bg-red-50 hover:border-red-400 hover:text-red-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        onClick={handleImageDelete}
                        disabled={!profileImage}
                        title={t('deploySettings.profile.deleteTitle')}
                      >
                        <FiTrash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Bot Name */}
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-medium text-gray-800">{t('deploySettings.botName')}</label>
                  <input
                    type="text"
                    value={botName}
                    onChange={(e) => setBotName(e.target.value)}
                    className="px-3 py-2.5 border border-gray-200 rounded-md text-sm bg-white text-gray-800 focus:outline-none focus:border-blue-500 transition-colors"
                  />
                </div>

                {/* Toggles */}
                <Toggle checked={enableAudio} onChange={setEnableAudio} label={t('deploySettings.enableAudio')} />
                <Toggle checked={enableFile} onChange={setEnableFile} label={t('deploySettings.enableFile')} />
                <Toggle checked={enableToolList} onChange={setEnableToolList} label={t('deploySettings.enableToolList')} />
                <Toggle checked={enableAgentList} onChange={setEnableAgentList} label={t('deploySettings.enableAgentList')} />

                {/* Style Section */}
                <div className="flex flex-col gap-3">
                  <h3 className="text-base font-semibold text-gray-800">{t('deploySettings.style.title')}</h3>

                  {/* Theme */}
                  <label className="text-sm font-medium text-gray-800">{t('deploySettings.style.theme')}</label>
                  <div className="flex gap-2">
                    <button
                      className={`flex-1 px-4 py-2.5 border text-sm font-medium rounded-md transition-all ${
                        theme === 'light'
                          ? 'bg-blue-500 text-white border-blue-500'
                          : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50 hover:border-blue-500'
                      }`}
                      onClick={() => {
                        setTheme('light');
                        if (botMessageColor.toLowerCase() === '#262626') setBotMessageColor('#ffffff');
                      }}
                    >
                      {t('deploySettings.style.light')}
                    </button>
                    <button
                      className={`flex-1 px-4 py-2.5 border text-sm font-medium rounded-md transition-all ${
                        theme === 'dark'
                          ? 'bg-blue-500 text-white border-blue-500'
                          : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50 hover:border-blue-500'
                      }`}
                      onClick={() => {
                        setTheme('dark');
                        if (botMessageColor.toLowerCase() === '#ffffff' || botMessageColor.toLowerCase() === '#fff') {
                          setBotMessageColor('#262626');
                        }
                      }}
                    >
                      {t('deploySettings.style.dark')}
                    </button>
                  </div>
                </div>

                {/* Primary Color */}
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-medium text-gray-800">{t('deploySettings.style.primaryColor')}</label>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={primaryColor}
                      onChange={(e) => setPrimaryColor(e.target.value)}
                      className="w-9 h-9 rounded-md border-2 border-gray-200 cursor-pointer hover:scale-110 transition-transform"
                    />
                    <input
                      type="text"
                      value={primaryColor}
                      onChange={(e) => setPrimaryColor(e.target.value)}
                      className="flex-1 px-3 py-2.5 border border-gray-200 rounded-md text-sm bg-white text-gray-800 focus:outline-none focus:border-blue-500 transition-colors"
                    />
                  </div>
                </div>

                {/* Bot Message Color */}
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-medium text-gray-800">{t('deploySettings.style.botMessageColor')}</label>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={botMessageColor}
                      onChange={(e) => setBotMessageColor(e.target.value)}
                      className="w-9 h-9 rounded-md border-2 border-gray-200 cursor-pointer hover:scale-110 transition-transform"
                    />
                    <input
                      type="text"
                      value={botMessageColor}
                      onChange={(e) => setBotMessageColor(e.target.value)}
                      className="flex-1 px-3 py-2.5 border border-gray-200 rounded-md text-sm bg-white text-gray-800 focus:outline-none focus:border-blue-500 transition-colors"
                    />
                  </div>
                </div>
              </>
            )}

            {/* ── Embed Tab ── */}
            {settingsTab === 'embed' && (
              <>
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-medium text-gray-800">{t('deploySettings.embed.width')}</label>
                  <input
                    type="number"
                    value={embedWidth}
                    onChange={(e) => setEmbedWidth(e.target.value)}
                    placeholder="400"
                    min={200}
                    max={1920}
                    className="px-3 py-2.5 border border-gray-200 rounded-md text-sm bg-white text-gray-800 focus:outline-none focus:border-blue-500 transition-colors"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-medium text-gray-800">{t('deploySettings.embed.height')}</label>
                  <input
                    type="number"
                    value={embedHeight}
                    onChange={(e) => setEmbedHeight(e.target.value)}
                    placeholder="600"
                    min={300}
                    max={1080}
                    className="px-3 py-2.5 border border-gray-200 rounded-md text-sm bg-white text-gray-800 focus:outline-none focus:border-blue-500 transition-colors"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-medium text-gray-800">{t('deploySettings.embed.defaultExpansion')}</label>
                  <div className="flex gap-2">
                    <button
                      className={`flex-1 px-4 py-2.5 border text-sm font-medium rounded-md transition-all ${
                        defaultExpanded
                          ? 'bg-blue-500 text-white border-blue-500'
                          : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50 hover:border-blue-500'
                      }`}
                      onClick={() => setDefaultExpanded(true)}
                    >
                      {t('deploySettings.embed.expanded')}
                    </button>
                    <button
                      className={`flex-1 px-4 py-2.5 border text-sm font-medium rounded-md transition-all ${
                        !defaultExpanded
                          ? 'bg-blue-500 text-white border-blue-500'
                          : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50 hover:border-blue-500'
                      }`}
                      onClick={() => setDefaultExpanded(false)}
                    >
                      {t('deploySettings.embed.collapsed')}
                    </button>
                  </div>
                </div>
              </>
            )}

            {/* ── Start Message Tab ── */}
            {settingsTab === 'startMsg' && (
              <>
                <div className="mb-2">
                  <h3 className="text-lg font-semibold text-gray-800 mb-1">{t('deploySettings.startMsg.title')}</h3>
                  <p className="text-sm text-gray-500">{t('deploySettings.startMsg.subtitle')}</p>
                </div>

                {/* Welcome Message */}
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-medium text-gray-800">
                    {t('deploySettings.startMsg.welcomeLabel')}{' '}
                    <span className="text-gray-400 font-normal">{t('deploySettings.startMsg.optional')}</span>
                  </label>
                  <textarea
                    value={welcomeMsg}
                    onChange={(e) => setWelcomeMsg(e.target.value)}
                    placeholder="안녕하세요!"
                    rows={3}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-md text-sm bg-white text-gray-800 resize-y min-h-[60px] focus:outline-none focus:border-blue-500 transition-colors font-[inherit]"
                  />
                </div>

                {/* Suggested Replies */}
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-medium text-gray-800">
                    {t('deploySettings.startMsg.suggestedReply')}{' '}
                    <span className="text-gray-400 font-normal">{t('deploySettings.startMsg.optional')}</span>
                  </label>
                  <div className="flex flex-col gap-2">
                    {suggestedReplies.map((reply, idx) => (
                      <div key={idx} className="relative">
                        <textarea
                          value={reply}
                          onChange={(e) => {
                            const updated = [...suggestedReplies];
                            updated[idx] = e.target.value;
                            setSuggestedReplies(updated);
                          }}
                          placeholder="안녕하세요!"
                          rows={2}
                          className="w-full px-3 py-2.5 pr-8 border border-gray-200 rounded-md text-sm bg-white text-gray-800 resize-none min-h-[40px] focus:outline-none focus:border-blue-500 transition-colors font-[inherit]"
                        />
                        <button
                          className="absolute right-2 bottom-3 w-6 h-6 flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded transition-all"
                          onClick={() => {
                            const updated = suggestedReplies.filter((_, i) => i !== idx);
                            setSuggestedReplies(updated.length > 0 ? updated : ['']);
                          }}
                        >
                          ⊗
                        </button>
                      </div>
                    ))}
                  </div>
                  <button
                    className="self-start text-blue-500 text-sm font-medium hover:opacity-80 transition-opacity"
                    onClick={() => setSuggestedReplies([...suggestedReplies, ''])}
                  >
                    {t('deploySettings.startMsg.add')}
                  </button>
                </div>

                {/* Alignment */}
                <div className="flex flex-col gap-2">
                  <label className="text-sm font-medium text-gray-800">
                    {t('deploySettings.startMsg.replyAlignment')}{' '}
                    <span className="text-gray-400 font-normal">{t('deploySettings.startMsg.optional')}</span>
                  </label>
                  <div className="flex gap-2">
                    {(['left', 'center', 'right'] as Alignment[]).map((align) => (
                      <button
                        key={align}
                        className={`flex-1 flex flex-col items-center gap-1 px-3 py-2.5 border text-xs font-medium rounded-md transition-all ${
                          suggestedRepliesAlignment === align
                            ? 'bg-blue-500 text-white border-blue-500'
                            : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50 hover:border-blue-500 hover:text-gray-700'
                        }`}
                        onClick={() => setSuggestedRepliesAlignment(align)}
                      >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <line x1={align === 'right' ? 3 : 3} y1="6" x2="21" y2="6" />
                          <line
                            x1={align === 'center' ? 6 : align === 'right' ? 9 : 3}
                            y1="12"
                            x2={align === 'center' ? 18 : align === 'left' ? 15 : 21}
                            y2="12"
                          />
                          <line
                            x1={align === 'center' ? 4 : align === 'right' ? 6 : 3}
                            y1="18"
                            x2={align === 'center' ? 20 : align === 'left' ? 18 : 21}
                            y2="18"
                          />
                        </svg>
                        <span>{t(`deploySettings.startMsg.${align}`)}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}

            {/* ── Error Message Tab ── */}
            {settingsTab === 'errorMsg' && (
              <>
                <div className="mb-2">
                  <h3 className="text-lg font-semibold text-gray-800 mb-1">{t('deploySettings.errorMsg.title')}</h3>
                  <p className="text-sm text-gray-500">{t('deploySettings.errorMsg.subtitle')}</p>
                </div>

                <button
                  className="w-full px-4 py-2.5 border border-gray-200 bg-white text-gray-700 text-sm font-medium rounded-md hover:bg-gray-50 hover:border-blue-500 hover:text-blue-500 transition-all"
                  onClick={() => setErrorMessages({})}
                >
                  {t('deploySettings.errorMsg.resetAll')}
                </button>

                {ERROR_CATEGORIES.map((category) => (
                  <div key={category.title} className="flex flex-col gap-2 p-3 bg-gray-50 border border-gray-200 rounded-lg">
                    <div
                      className="flex items-center justify-between cursor-pointer select-none pb-2 border-b border-gray-200 hover:text-blue-500 transition-colors"
                      onClick={() => setCollapsedCategories((prev) => ({
                        ...prev, [category.title]: !prev[category.title],
                      }))}
                    >
                      <h4 className="text-sm font-semibold text-gray-600">{category.title}</h4>
                      <button className="flex items-center justify-center w-7 h-7 border border-gray-200 rounded-md bg-white text-gray-400 hover:bg-blue-500 hover:border-blue-500 hover:text-white transition-all">
                        {collapsedCategories[category.title] ? <FiChevronRight className="w-4 h-4" /> : <FiChevronDown className="w-4 h-4" />}
                      </button>
                    </div>

                    {!collapsedCategories[category.title] && (
                      <div className="flex flex-col gap-2">
                        {category.codes.map((code) => (
                          <div key={code} className="flex flex-col gap-1.5 p-2.5 bg-white border border-gray-200 rounded-md focus-within:border-blue-500 transition-colors">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-semibold text-gray-400 font-mono bg-gray-100 px-2 py-0.5 rounded">
                                {code}
                              </span>
                              {errorMessages[code] && errorMessages[code] !== DEFAULT_ERROR_MESSAGES[code] && (
                                <span className="text-[10px] font-medium text-white bg-blue-500 px-1.5 py-0.5 rounded">
                                  {t('deploySettings.errorMsg.custom')}
                                </span>
                              )}
                            </div>
                            <textarea
                              value={errorMessages[code] ?? ''}
                              onChange={(e) => setErrorMessages((prev) => ({ ...prev, [code]: e.target.value }))}
                              placeholder={DEFAULT_ERROR_MESSAGES[code]}
                              rows={2}
                              className="w-full px-2 py-1.5 border border-gray-200 rounded text-[13px] bg-white text-gray-800 resize-y min-h-[48px] focus:outline-none focus:border-blue-500 transition-colors font-[inherit] leading-relaxed placeholder:text-gray-400 placeholder:text-xs"
                            />
                            {errorMessages[code] && errorMessages[code] !== DEFAULT_ERROR_MESSAGES[code] && (
                              <button
                                className="self-start px-2 py-1 border border-gray-200 text-gray-400 text-[11px] font-medium rounded hover:bg-gray-50 hover:border-blue-500 hover:text-blue-500 transition-all"
                                onClick={() => setErrorMessages((prev) => {
                                  const next = { ...prev };
                                  delete next[code];
                                  return next;
                                })}
                              >
                                {t('deploySettings.errorMsg.resetCode')}
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </>
            )}
          </div>
        </div>

        {/* ─── Right Panel: Bot Tester ─── */}
        <div className="flex flex-col flex-[3] min-w-0 bg-white rounded-lg border border-gray-200 overflow-hidden">
          {/* Tester Header */}
          <div className="flex items-center justify-between px-5 py-3 border-b border-gray-200 shrink-0">
            <h2 className="text-lg font-semibold text-gray-800">{t('deploySettings.tester.title')}</h2>
            <div className="flex items-center gap-1">
              <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-lg">
                <button
                  className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all ${
                    testerTab === 'chat'
                      ? 'bg-white text-blue-500 shadow-sm'
                      : 'text-gray-600 hover:bg-white hover:text-gray-800'
                  }`}
                  onClick={() => { setTesterTab('chat'); setChatKey((k: number) => k + 1); }}
                >
                  {t('deploySettings.tester.chat')}
                </button>
                <button
                  className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all ${
                    testerTab === 'embed'
                      ? 'bg-white text-blue-500 shadow-sm'
                      : 'text-gray-600 hover:bg-white hover:text-gray-800'
                  }`}
                  onClick={() => { setTesterTab('embed'); setIsEmbedCollapsed(!defaultExpanded); }}
                >
                  {t('deploySettings.tester.embed')}
                </button>
              </div>
              {testerTab === 'chat' && chatMessages.length > 0 && (
                <button
                  onClick={handleResetChat}
                  className="ml-2 px-3 py-1.5 text-xs font-medium border border-gray-200 bg-white text-gray-500 rounded-md hover:bg-red-50 hover:border-red-400 hover:text-red-500 transition-all"
                >
                  {t('deploySettings.tester.resetChat')}
                </button>
              )}
            </div>
          </div>

          {/* Tester Content */}
          {testerTab === 'chat' ? (
            /* ─── Chat Tab: Full chatbot preview ─── */
            <div
              className="flex flex-col flex-1 min-h-0"
              style={{
                backgroundColor: theme === 'dark' ? '#1a1a2e' : '#ffffff',
              }}
              key={`chat_${chatKey}`}
            >
              {/* Chat Header (mimics deployed chatbot) */}
              <div
                className="flex items-center gap-3 px-5 py-3 border-b shrink-0"
                style={{ borderColor: theme === 'dark' ? '#333' : '#e5e7eb' }}
              >
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0 overflow-hidden"
                  style={{ backgroundColor: primaryColor }}
                >
                  {profileImage ? (
                    <img src={profileImage} alt="" className="w-full h-full object-cover" />
                  ) : (
                    botName.charAt(0).toUpperCase()
                  )}
                </div>
                <span
                  className="font-semibold text-sm"
                  style={{ color: theme === 'dark' ? '#e5e7eb' : '#1f2937' }}
                >
                  {botName}
                </span>
              </div>

              {/* ChatPanel — variant="full" for proper avatars, timestamps, bubbles */}
              <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
                <ChatPanel
                  variant="full"
                  messages={panelMessages}
                  onSend={handleSend}
                  onStop={handleStop}
                  onRetry={handleRetry}
                  isExecuting={isExecuting}
                  isStreaming={isStreaming}
                  placeholder="Type your message..."
                  emptyState={
                    <ChatEmptyState
                      variant="full"
                      title={botName}
                      description={welcomeMsg || 'How can I help you?'}
                      suggestions={suggestedReplies
                        .filter((r: string) => r.trim())
                        .map((r: string) => ({ key: r, label: r }))}
                      onSuggestionClick={handleSend}
                    />
                  }
                />
                {/* Suggested replies — shown after welcome message, before user sends */}
                {!hasUserChatMessages && welcomeMsg && suggestedReplies.some((r: string) => r.trim()) && (
                  <div
                    className="flex flex-wrap gap-2 px-6 pb-2 -mt-1"
                    style={{ justifyContent: suggestedRepliesAlignment === 'center' ? 'center' : suggestedRepliesAlignment === 'right' ? 'flex-end' : 'flex-start' }}
                  >
                    {suggestedReplies.filter((r: string) => r.trim()).map((r: string, i: number) => (
                      <button
                        key={i}
                        className="px-4 py-2 text-sm font-medium border rounded-full cursor-pointer transition-all hover:shadow-sm"
                        style={{
                          color: primaryColor,
                          borderColor: `${primaryColor}4d`,
                          backgroundColor: 'white',
                        }}
                        onMouseEnter={(e) => {
                          (e.target as HTMLButtonElement).style.backgroundColor = primaryColor;
                          (e.target as HTMLButtonElement).style.color = 'white';
                          (e.target as HTMLButtonElement).style.borderColor = primaryColor;
                        }}
                        onMouseLeave={(e) => {
                          (e.target as HTMLButtonElement).style.backgroundColor = 'white';
                          (e.target as HTMLButtonElement).style.color = primaryColor;
                          (e.target as HTMLButtonElement).style.borderColor = `${primaryColor}4d`;
                        }}
                        onClick={() => handleSend(r)}
                      >
                        {r}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* ─── Embed Tab: Scaled iframe preview ─── */
            <div
              ref={embedContainerRef}
              className="flex-1 min-h-0 relative bg-gray-100 overflow-hidden"
            >
              {/* Helper bar */}
              <div className="absolute top-3 left-3 right-3 px-4 py-2 bg-blue-50 border border-blue-200 rounded-lg z-10 flex items-center justify-between gap-3">
                <p className="text-sm text-blue-600 leading-relaxed">{t('deploySettings.tester.embedHelper')}</p>
                <button
                  onClick={() => { setChatKey((k: number) => k + 1); setIsEmbedCollapsed(!defaultExpanded); }}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white text-[13px] font-medium rounded-md hover:bg-blue-700 transition-all whitespace-nowrap shrink-0"
                >
                  <FiRefreshCw className="w-3.5 h-3.5" />
                  {t('deploySettings.tester.refresh')}
                </button>
              </div>

              {/* Embed simulation area */}
              <div className="absolute inset-0 top-14 flex items-center justify-center p-5">
                {isEmbedCollapsed ? (
                  /* Collapsed bubble */
                  <div className="absolute bottom-5 right-5">
                    <button
                      onClick={() => setIsEmbedCollapsed(false)}
                      className="w-[60px] h-[60px] rounded-full shadow-lg flex items-center justify-center text-white text-xl font-bold hover:scale-110 transition-transform"
                      style={{ backgroundColor: primaryColor }}
                    >
                      {profileImage ? (
                        <img src={profileImage} alt="" className="w-full h-full object-cover rounded-full" />
                      ) : (
                        botName.charAt(0).toUpperCase()
                      )}
                    </button>
                  </div>
                ) : (
                  /* Expanded embed — scaled iframe */
                  <div className="absolute bottom-5 right-5 origin-bottom-right" style={{
                    transform: `scale(${embedScale})`,
                  }}>
                    <div
                      className="relative rounded-xl shadow-2xl overflow-hidden border border-gray-200"
                      style={{
                        width: `${parseInt(embedWidth) || 400}px`,
                        height: `${parseInt(embedHeight) || 600}px`,
                      }}
                    >
                      {/* Close button overlay */}
                      <button
                        onClick={() => setIsEmbedCollapsed(true)}
                        className="absolute top-2 right-2 z-20 w-6 h-6 rounded-full bg-gray-200 hover:bg-gray-300 flex items-center justify-center text-gray-600 text-xs transition-colors"
                      >
                        ✕
                      </button>
                      <iframe
                        key={`embed_${chatKey}_${embedWidth}_${embedHeight}`}
                        src={`${baseUrl}/chatbot/${workflow.id}?userId=${user?.id || ''}`}
                        title="Embed Preview"
                        className="w-full h-full border-none"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DeploySettings;
