'use client';

/**
 * 自助友链申请表单。
 *
 * 提交到 sakurain-api 的 /api/friends/applications，审核结果由站主在
 * api.sakurain.net/admin 处理；通过后会邮件通知申请人。
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { ChangeEvent, FormEvent, ReactNode } from 'react';
import Link from 'next/link';
import { ArrowLeft, CheckCircle2, AlertCircle, Send, Loader2 } from 'lucide-react';
import { useTranslation } from '@/hooks';

const DEFAULT_API = 'https://api.sakurain.net';

const COPY = {
  zh: {
    title: '申请友链',
    subtitle: '填好下面几项就行，站主会人工看一遍，通过后邮件通知你。',
    back: '返回友链页',
    name: '网站名称',
    namePlaceholder: '你的站点叫什么',
    url: '网站地址',
    urlPlaceholder: 'https://example.com',
    icon: '网站图标链接',
    iconPlaceholder: 'https://example.com/favicon.ico',
    iconHint: '建议 32×32 以上的 png / ico / svg，填错会显示成首字母',
    description: '网站描述',
    descriptionPlaceholder: '一句话介绍你的站点，最多 200 字',
    feed: 'Feed 地址',
    email: '联系邮箱',
    optional: '选填',
    submit: '提交申请',
    submitting: '提交中…',
    agree: '我确认站点内容健康、无广告推广，且在站内添加了本站友链',
    required: '必填',
    successTitle: '申请已收到',
    successBody: '站主看到后会尽快审核，结果会发到你的邮箱（如果留了的话）。',
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
    title: 'Apply for a link',
    subtitle: 'Fill in the fields below. Applications are reviewed manually and you will get an email once approved.',
    back: 'Back to friends',
    name: 'Site name',
    namePlaceholder: 'What is your site called',
    url: 'Site URL',
    urlPlaceholder: 'https://example.com',
    icon: 'Icon URL',
    iconPlaceholder: 'https://example.com/favicon.ico',
    iconHint: 'A png / ico / svg of at least 32×32 works best',
    description: 'Description',
    descriptionPlaceholder: 'One sentence about your site, up to 200 characters',
    feed: 'Feed URL',
    email: 'Contact email',
    optional: 'optional',
    submit: 'Submit',
    submitting: 'Submitting…',
    agree: 'I confirm my site is legal, ad-free, and already links back to this site',
    required: 'required',
    successTitle: 'Application received',
    successBody: 'It will be reviewed shortly. If you left an email, you will hear back there.',
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

export default function FriendApplyForm() {
  const { locale } = useTranslation();
  const copy = COPY[locale === 'en' ? 'en' : 'zh'];

  const [apiBase, setApiBase] = useState(DEFAULT_API);
  const [form, setForm] = useState({
    name: '',
    url: '',
    icon: '',
    description: '',
    feed: '',
    email: '',
    website: '',
  });
  const [agree, setAgree] = useState(false);
  const [state, setState] = useState<SubmitState>({ status: 'idle' });
  const openedAt = useRef(Date.now());

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

  const canSubmit = useMemo(
    () =>
      Boolean(
        form.name.trim() && form.url.trim() && form.icon.trim() && form.description.trim() && agree
      ),
    [form, agree]
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
          name: form.name.trim(),
          url: form.url.trim(),
          icon: form.icon.trim(),
          description: form.description.trim(),
          feed: form.feed.trim() || null,
          email: form.email.trim() || null,
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
      setForm({ name: '', url: '', icon: '', description: '', feed: '', email: '', website: '' });
      setAgree(false);
      openedAt.current = Date.now();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch {
      setState({ status: 'error', message: copy.network });
    }
  };

  const fieldStyle = {
    background: 'var(--bg-primary)',
    borderColor: 'var(--border-subtle)',
    color: 'var(--text-primary)',
  } as const;

  if (state.status === 'success') {
    return (
      <div className="mx-auto w-full max-w-2xl">
        <div
          className="border-2 p-8 text-center"
          style={{ background: 'var(--bg-secondary)', borderColor: 'var(--border-subtle)' }}
        >
          <CheckCircle2 className="mx-auto h-12 w-12" style={{ color: 'var(--success)' }} />
          <h1
            className="mt-4 text-2xl font-bold uppercase"
            style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-pixel)' }}
          >
            {copy.successTitle}
          </h1>
          <p className="mt-2 text-sm" style={{ color: 'var(--text-secondary)' }}>
            {copy.successBody}
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
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-2xl">
      <Link
        href="/friends"
        className="mb-6 inline-flex items-center gap-2 font-mono text-xs uppercase"
        style={{ color: 'var(--text-muted)' }}
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        {copy.back}
      </Link>

      <header className="mb-6">
        <h1
          className="text-2xl font-bold uppercase sm:text-3xl"
          style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-pixel)' }}
        >
          {copy.title}
        </h1>
        <p className="mt-2 text-sm" style={{ color: 'var(--text-secondary)' }}>
          {copy.subtitle}
        </p>
      </header>

      <ul
        className="mb-6 space-y-1.5 border-2 p-4 font-mono text-[11px] uppercase leading-5"
        style={{ borderColor: 'var(--border-subtle)', background: 'var(--bg-secondary)', color: 'var(--text-muted)' }}
      >
        {copy.requirements.map((item) => (
          <li key={item}>— {item}</li>
        ))}
      </ul>

      <form onSubmit={handleSubmit} className="space-y-4">
        <Field label={copy.name} required>
          <input
            className="w-full border-2 px-3 py-2 text-sm outline-none"
            style={fieldStyle}
            value={form.name}
            onChange={update('name')}
            placeholder={copy.namePlaceholder}
            maxLength={60}
            required
          />
        </Field>

        <Field label={copy.url} required>
          <input
            type="url"
            className="w-full border-2 px-3 py-2 text-sm outline-none"
            style={fieldStyle}
            value={form.url}
            onChange={update('url')}
            placeholder={copy.urlPlaceholder}
            maxLength={300}
            required
          />
        </Field>

        <Field label={copy.icon} required hint={copy.iconHint}>
          <input
            type="url"
            className="w-full border-2 px-3 py-2 text-sm outline-none"
            style={fieldStyle}
            value={form.icon}
            onChange={update('icon')}
            placeholder={copy.iconPlaceholder}
            maxLength={300}
            required
          />
        </Field>

        <Field label={copy.description} required>
          <textarea
            className="w-full resize-y border-2 px-3 py-2 text-sm outline-none"
            style={fieldStyle}
            value={form.description}
            onChange={update('description')}
            placeholder={copy.descriptionPlaceholder}
            rows={3}
            maxLength={200}
            required
          />
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label={copy.feed} optional={copy.optional}>
            <input
              type="url"
              className="w-full border-2 px-3 py-2 text-sm outline-none"
              style={fieldStyle}
              value={form.feed}
              onChange={update('feed')}
              placeholder="https://example.com/feed"
              maxLength={300}
            />
          </Field>
          <Field label={copy.email} optional={copy.optional}>
            <input
              type="email"
              className="w-full border-2 px-3 py-2 text-sm outline-none"
              style={fieldStyle}
              value={form.email}
              onChange={update('email')}
              placeholder="you@example.com"
              maxLength={120}
            />
          </Field>
        </div>

        {/* 蜜罐：真实用户看不到，机器人往往会填 */}
        <div aria-hidden className="pointer-events-none absolute -left-[9999px] h-0 w-0 overflow-hidden">
          <label>
            Website
            <input
              tabIndex={-1}
              autoComplete="off"
              value={form.website}
              onChange={update('website')}
            />
          </label>
        </div>

        <label
          className="flex cursor-pointer items-start gap-3 border-2 p-3 text-xs leading-5"
          style={{ borderColor: 'var(--border-subtle)', background: 'var(--bg-secondary)', color: 'var(--text-secondary)' }}
        >
          <input
            type="checkbox"
            checked={agree}
            onChange={(event) => setAgree(event.target.checked)}
            className="mt-0.5 h-4 w-4"
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

        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={!canSubmit || state.status === 'submitting'}
            className="flex items-center justify-center gap-2 border-2 px-5 py-3 text-sm font-bold uppercase transition-transform disabled:cursor-not-allowed disabled:opacity-50 hover:-translate-y-0.5"
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
            {state.status === 'submitting' ? copy.submitting : copy.submit}
          </button>
          <span className="font-mono text-[10px] uppercase" style={{ color: 'var(--text-muted)' }}>
            {copy.notice}
          </span>
        </div>
      </form>
    </div>
  );
}

function Field({
  label,
  required,
  optional,
  hint,
  children,
}: {
  label: string;
  required?: boolean;
  optional?: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <label className="block">
      <span
        className="mb-1.5 flex items-center gap-1.5 font-mono text-[11px] font-bold uppercase"
        style={{ color: 'var(--text-secondary)' }}
      >
        {label}
        {required && <span style={{ color: 'var(--danger)' }}>*</span>}
        {optional && <span style={{ color: 'var(--text-muted)' }}>· {optional}</span>}
      </span>
      {children}
      {hint && (
        <span className="mt-1 block text-[11px]" style={{ color: 'var(--text-muted)' }}>
          {hint}
        </span>
      )}
    </label>
  );
}
