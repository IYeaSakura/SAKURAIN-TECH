'use client';

/**
 * 自助友链申请表单。
 *
 * 提交到 sakurain-api 的 /api/friends/applications，审核结果由站主在
 * api.sakurain.net/admin 处理；通过后会邮件通知申请人。
 *
 * 两种模式：
 * - create：新站点入链
 * - update：修改已经在友链里的站点信息（按网站地址匹配）
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { ChangeEvent, FormEvent, ReactNode } from 'react';
import Link from 'next/link';
import { ArrowLeft, CheckCircle2, AlertCircle, Send, Loader2, Info } from 'lucide-react';
import { useTranslation } from '@/hooks';

const DEFAULT_API = 'https://api.sakurain.net';

export type ApplyMode = 'create' | 'update';

const COPY = {
  zh: {
    createTitle: '新增站点',
    createSubtitle: '填好下面几项就行，站主会人工看一遍，通过后邮件通知你。',
    updateTitle: '修改站点',
    updateSubtitle: '填的是已经在友链里的站点，审核通过后会按下面的内容覆盖原信息。',
    updateHint: '网站地址必须和友链里现有的那条一致，否则认不出来。',
    back: '返回友链页',
    name: '网站名称',
    namePlaceholder: '你的站点叫什么',
    url: '网站地址',
    urlPlaceholder: 'https://example.com',
    icon: '网站图标链接',
    iconPlaceholder: 'https://example.com/favicon.ico',
    iconKeepPlaceholder: '留空则沿用友链里现有的图标',
    iconHint: '建议 32×32 以上的 png / ico / svg',
    description: '网站描述',
    descriptionPlaceholder: '一句话介绍你的站点，最多 200 字',
    feed: 'Feed 地址',
    feedPlaceholder: 'https://example.com/feed',
    email: '联系邮箱',
    emailPlaceholder: 'you@example.com',
    emailHint: '审核结果会发到这里，请填常用的邮箱',
    optional: '选填',
    required: '必填',
    submitCreate: '提交申请',
    submitUpdate: '提交修改',
    submitting: '提交中…',
    agree: '我确认站点内容健康、无广告推广，且在站内添加了本站友链',
    successTitle: '申请已收到',
    successBody: '站主看到后会尽快审核，结果会发到你的邮箱。',
    successUpdate: '修改申请已收到，审核通过后会更新友链信息，并邮件通知你。',
    again: '再提交一个',
    failed: '提交失败',
    tooFast: '填写得太快了，请确认信息后再提交',
    network: '网络不太顺畅，请稍后重试',
    requirements: [
      '站点对国内用户有良好的访问体验',
      '内容原创、健康，且持续更新',
      '站内已添加本站友链',
    ],
    notice: '提交后会进入人工审核，通常一两天内处理。',
  },
  en: {
    createTitle: 'Add a site',
    createSubtitle: 'Fill in the fields below. Applications are reviewed manually and you will get an email once approved.',
    updateTitle: 'Update a site',
    updateSubtitle: 'For a site that is already listed. Once approved, these details replace the current ones.',
    updateHint: 'The URL must match the entry that is already listed.',
    back: 'Back to friends',
    name: 'Site name',
    namePlaceholder: 'What is your site called',
    url: 'Site URL',
    urlPlaceholder: 'https://example.com',
    icon: 'Icon URL',
    iconPlaceholder: 'https://example.com/favicon.ico',
    iconKeepPlaceholder: 'Leave empty to keep the current icon',
    iconHint: 'A png / ico / svg of at least 32×32 works best',
    description: 'Description',
    descriptionPlaceholder: 'One sentence about your site, up to 200 characters',
    feed: 'Feed URL',
    feedPlaceholder: 'https://example.com/feed',
    email: 'Contact email',
    emailPlaceholder: 'you@example.com',
    emailHint: 'The review result goes here, use one you check often',
    optional: 'optional',
    required: 'required',
    submitCreate: 'Submit',
    submitUpdate: 'Submit update',
    submitting: 'Submitting…',
    agree: 'I confirm my site is legal, ad-free, and already links back to this site',
    successTitle: 'Application received',
    successBody: 'It will be reviewed shortly and the result will be emailed to you.',
    successUpdate: 'Update received. Once approved, the listing will be refreshed and you will get an email.',
    again: 'Submit another',
    failed: 'Submission failed',
    tooFast: 'That was too quick — please check your details and try again',
    network: 'Network issue, please try again later',
    requirements: [
      'Loads well for visitors in China',
      'Original, healthy content that is regularly updated',
      'Already links back to this site',
    ],
    notice: 'Applications are reviewed manually, usually within a day or two.',
  },
};

interface SubmitState {
  status: 'idle' | 'submitting' | 'success' | 'error';
  message?: string;
}

const EMPTY_FORM = {
  name: '',
  url: '',
  icon: '',
  description: '',
  feed: '',
  email: '',
  website: '',
};

export default function FriendApplyForm({
  mode = 'create',
  embedded = false,
  onSuccess,
}: {
  mode?: ApplyMode;
  embedded?: boolean;
  onSuccess?: () => void;
}) {
  const { locale } = useTranslation();
  const copy = COPY[locale === 'en' ? 'en' : 'zh'];
  const isUpdate = mode === 'update';

  const [apiBase, setApiBase] = useState(DEFAULT_API);
  const [form, setForm] = useState(EMPTY_FORM);
  const [agree, setAgree] = useState(false);
  const [state, setState] = useState<SubmitState>({ status: 'idle' });
  const openedAt = useRef(Date.now());

  // 切换「新增 / 修改」时清空，避免把另一种模式的输入带过去。
  useEffect(() => {
    setForm(EMPTY_FORM);
    setAgree(false);
    setState({ status: 'idle' });
    openedAt.current = Date.now();
  }, [mode]);

  useEffect(() => {
    let cancelled = false;
    fetch('/config/friends.json')
      .then((res) => (res.ok ? res.json() : null))
      .then((config) => {
        const base = config?.api?.baseUrl;
        if (!cancelled && typeof base === 'string' && base) {
          setApiBase(base.replace(/\/$/, ''));
        }
      })
      .catch(() => null);
    return () => {
      cancelled = true;
    };
  }, []);

  const update = useCallback(
    (key: keyof typeof form) => (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setForm((prev) => ({ ...prev, [key]: event.target.value }));
    },
    []
  );

  // 联系邮箱必填，审核结果全靠它回信；修改站点时图标可以留空沿用原来的。
  const canSubmit = useMemo(
    () =>
      Boolean(
        form.name.trim() &&
          form.url.trim() &&
          (isUpdate || form.icon.trim()) &&
          form.description.trim() &&
          form.email.trim() &&
          agree
      ),
    [form, agree, isUpdate]
  );

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!canSubmit || state.status === 'submitting') return;
    setState({ status: 'submitting' });

    try {
      const response = await fetch(`${apiBase}/api/friends/applications`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          kind: mode,
          name: form.name.trim(),
          url: form.url.trim(),
          icon: form.icon.trim(),
          description: form.description.trim(),
          feed: form.feed.trim() || null,
          email: form.email.trim(),
          website: form.website,
          elapsedMs: Date.now() - openedAt.current,
        }),
      });

      const payload = await response.json().catch(() => null);
      if (!response.ok) {
        const detail = payload && payload.detail;
        setState({
          status: 'error',
          message:
            response.status === 429
              ? typeof detail === 'string'
                ? detail
                : copy.tooFast
              : typeof detail === 'string'
                ? detail
                : copy.failed,
        });
        return;
      }
      setState({ status: 'success' });
      setForm(EMPTY_FORM);
      setAgree(false);
      openedAt.current = Date.now();
      onSuccess?.();
    } catch {
      setState({ status: 'error', message: copy.network });
    }
  };

  if (state.status === 'success') {
    return (
      <div
        className="border-2 p-6 text-center sm:p-8"
        style={{ background: 'var(--bg-secondary)', borderColor: 'var(--border-subtle)' }}
      >
        <CheckCircle2 className="mx-auto h-10 w-10" style={{ color: 'var(--success)' }} />
        <h3
          className="mt-4 text-xl font-bold uppercase"
          style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-pixel)' }}
        >
          {copy.successTitle}
        </h3>
        <p className="mt-2 text-sm" style={{ color: 'var(--text-secondary)' }}>
          {isUpdate ? copy.successUpdate : copy.successBody}
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <button
            type="button"
            onClick={() => setState({ status: 'idle' })}
            className="border-2 px-4 py-2 text-sm font-bold uppercase"
            style={{ borderColor: 'var(--border-subtle)', color: 'var(--text-primary)' }}
          >
            {copy.again}
          </button>
          {!embedded && (
            <Link
              href="/friends"
              className="border-2 px-4 py-2 text-sm font-bold uppercase"
              style={{
                background: 'var(--accent-primary)',
                borderColor: 'var(--border-subtle)',
                color: 'var(--bg-primary)',
              }}
            >
              {copy.back}
            </Link>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      {!embedded && (
        <Link
          href="/friends"
          className="mb-6 inline-flex items-center gap-2 font-mono text-xs uppercase"
          style={{ color: 'var(--text-muted)' }}
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          {copy.back}
        </Link>
      )}

      <header className="mb-5">
        <h2
          className="text-xl font-bold uppercase sm:text-2xl"
          style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-pixel)' }}
        >
          {isUpdate ? copy.updateTitle : copy.createTitle}
        </h2>
        <p className="mt-1.5 text-sm leading-6" style={{ color: 'var(--text-secondary)' }}>
          {isUpdate ? copy.updateSubtitle : copy.createSubtitle}
        </p>
      </header>

      {isUpdate ? (
        <p
          className="mb-5 flex items-start gap-2 border-2 px-3 py-2 text-xs leading-5"
          style={{
            borderColor: 'var(--accent-primary)',
            background: 'color-mix(in srgb, var(--accent-primary) 12%, transparent)',
            color: 'var(--text-primary)',
          }}
        >
          <Info className="mt-0.5 h-3.5 w-3.5 flex-shrink-0" style={{ color: 'var(--accent-primary)' }} />
          {copy.updateHint}
        </p>
      ) : (
        <ul
          className="mb-5 space-y-1.5 border-2 p-3.5 font-mono text-[11px] leading-5"
          style={{
            borderColor: 'var(--border-subtle)',
            background: 'var(--bg-primary)',
            color: 'var(--text-secondary)',
          }}
        >
          {copy.requirements.map((item) => (
            <li key={item}>— {item}</li>
          ))}
        </ul>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <Field label={copy.name} requiredBadge={copy.required}>
          <input
            className="w-full border-2 px-3 py-2 text-sm outline-none focus:border-[var(--accent-primary)]"
            style={fieldStyle}
            value={form.name}
            onChange={update('name')}
            placeholder={copy.namePlaceholder}
            maxLength={60}
            required
          />
        </Field>

        <Field label={copy.url} requiredBadge={copy.required}>
          <input
            type="url"
            className="w-full border-2 px-3 py-2 text-sm outline-none focus:border-[var(--accent-primary)]"
            style={fieldStyle}
            value={form.url}
            onChange={update('url')}
            placeholder={copy.urlPlaceholder}
            maxLength={300}
            required
          />
        </Field>

        <Field
          label={copy.icon}
          requiredBadge={isUpdate ? undefined : copy.required}
          optionalBadge={isUpdate ? copy.optional : undefined}
          hint={copy.iconHint}
        >
          <input
            type="url"
            className="w-full border-2 px-3 py-2 text-sm outline-none focus:border-[var(--accent-primary)]"
            style={fieldStyle}
            value={form.icon}
            onChange={update('icon')}
            placeholder={isUpdate ? copy.iconKeepPlaceholder : copy.iconPlaceholder}
            maxLength={300}
            required={!isUpdate}
          />
        </Field>

        <Field label={copy.description} requiredBadge={copy.required}>
          <textarea
            className="w-full resize-y border-2 px-3 py-2 text-sm outline-none focus:border-[var(--accent-primary)]"
            style={fieldStyle}
            value={form.description}
            onChange={update('description')}
            placeholder={copy.descriptionPlaceholder}
            rows={3}
            maxLength={200}
            required
          />
        </Field>

        <Field label={copy.email} requiredBadge={copy.required} hint={copy.emailHint}>
          <input
            type="email"
            className="w-full border-2 px-3 py-2 text-sm outline-none focus:border-[var(--accent-primary)]"
            style={fieldStyle}
            value={form.email}
            onChange={update('email')}
            placeholder={copy.emailPlaceholder}
            maxLength={120}
            required
          />
        </Field>

        <Field label={copy.feed} optionalBadge={copy.optional}>
          <input
            type="url"
            className="w-full border-2 px-3 py-2 text-sm outline-none focus:border-[var(--accent-primary)]"
            style={fieldStyle}
            value={form.feed}
            onChange={update('feed')}
            placeholder={copy.feedPlaceholder}
            maxLength={300}
          />
        </Field>

        {/* 蜜罐：真实用户看不到，机器人往往会填 */}
        <div aria-hidden className="pointer-events-none absolute -left-[9999px] h-0 w-0 overflow-hidden">
          <label>
            Website
            <input tabIndex={-1} autoComplete="off" value={form.website} onChange={update('website')} />
          </label>
        </div>

        <label
          className="flex cursor-pointer items-start gap-3 border-2 p-3 text-xs leading-5"
          style={{
            borderColor: 'var(--border-subtle)',
            background: 'var(--bg-primary)',
            color: 'var(--text-secondary)',
          }}
        >
          <input
            type="checkbox"
            checked={agree}
            onChange={(event) => setAgree(event.target.checked)}
            className="mt-0.5 h-4 w-4 flex-shrink-0"
            style={{ accentColor: 'var(--accent-primary)' }}
          />
          <span>{copy.agree}</span>
        </label>

        {state.status === 'error' && (
          <p
            className="flex items-center gap-2 border-2 px-3 py-2 text-xs"
            style={{ borderColor: 'var(--danger)', color: 'var(--danger)' }}
          >
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
            {state.message}
          </p>
        )}

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="submit"
            disabled={!canSubmit || state.status === 'submitting'}
            className="flex items-center justify-center gap-2 border-2 px-5 py-2.5 text-sm font-bold uppercase transition-transform disabled:cursor-not-allowed disabled:opacity-50 hover:-translate-y-0.5"
            style={{
              background: 'var(--accent-primary)',
              borderColor: 'var(--border-subtle)',
              color: 'var(--bg-primary)',
              boxShadow: '3px 3px 0 var(--border-subtle)',
            }}
          >
            {state.status === 'submitting' ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
            {state.status === 'submitting'
              ? copy.submitting
              : isUpdate
                ? copy.submitUpdate
                : copy.submitCreate}
          </button>
          <span className="font-mono text-[10px] uppercase" style={{ color: 'var(--text-muted)' }}>
            {copy.notice}
          </span>
        </div>
      </form>
    </div>
  );
}

const fieldStyle = {
  background: 'var(--bg-primary)',
  borderColor: 'var(--border-subtle)',
  color: 'var(--text-primary)',
} as const;

function Field({
  label,
  requiredBadge,
  optionalBadge,
  hint,
  children,
}: {
  label: string;
  requiredBadge?: string;
  optionalBadge?: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 flex flex-wrap items-center gap-2">
        <span
          className="font-mono text-[11px] font-bold uppercase tracking-wide"
          style={{ color: 'var(--text-primary)' }}
        >
          {label}
        </span>
        {requiredBadge && (
          <span
            className="border px-1.5 py-0.5 font-mono text-[10px] font-bold uppercase leading-none"
            style={{
              borderColor: 'var(--accent-primary)',
              background: 'color-mix(in srgb, var(--accent-primary) 18%, transparent)',
              color: 'var(--accent-primary)',
            }}
          >
            {requiredBadge}
          </span>
        )}
        {optionalBadge && (
          <span
            className="border px-1.5 py-0.5 font-mono text-[10px] font-bold uppercase leading-none"
            style={{
              borderColor: 'var(--border-subtle)',
              color: 'var(--text-muted)',
            }}
          >
            {optionalBadge}
          </span>
        )}
      </span>
      {children}
      {hint && (
        <span className="mt-1 block text-[11px] leading-4" style={{ color: 'var(--text-secondary)' }}>
          {hint}
        </span>
      )}
    </label>
  );
}
