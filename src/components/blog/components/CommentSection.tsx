import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, Send, User, Mail, Reply, ChevronDown, ChevronUp, AlertCircle, Check, Loader2, Monitor } from 'lucide-react';
import { generateAuthHeaders } from '@/lib/api-auth';
import { MarkdownRenderer } from '@/components/markdown/MarkdownRenderer';
import { useTranslation } from '@/hooks';
import './comments.css';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || '';

interface Comment {
  id: string;
  nickname: string;
  avatarColor: string;
  content: string;
  isMarkdown: boolean;
  createdAt: string;
  parentId: string | null;
  replyTo: string | null;
  browser?: string;
  os?: string;
  replies: Comment[];
}

interface CommentSectionProps {
  postId: string;
}

interface FormData {
  nickname: string;
  email: string;
  content: string;
  isMarkdown: boolean;
}

const initialFormData: FormData = {
  nickname: '',
  email: '',
  content: '',
  isMarkdown: false,
};

export function CommentSection({ postId }: CommentSectionProps) {
  const { t, tReplace } = useTranslation();
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [replyTo, setReplyTo] = useState<{ id: string; nickname: string; parentId: string | null } | null>(null);
  const [expandedReplies, setExpandedReplies] = useState<Set<string>>(new Set());
  const [totalComments, setTotalComments] = useState(0);
  const [maxComments] = useState(50);
  
  const [sliderValue, setSliderValue] = useState(0);
  const [sliderVerified, setSliderVerified] = useState(false);
  const sliderRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  
  const formRef = useRef<HTMLFormElement>(null);

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!email) {
      setEmailError(t.blog.commentForm.emailRequired);
      return false;
    }
    if (!emailRegex.test(email)) {
      setEmailError(t.blog.commentForm.emailInvalid);
      return false;
    }
    setEmailError(null);
    return true;
  };

  const handleEmailChange = (email: string) => {
    setFormData(prev => ({ ...prev, email }));
    if (email && email.includes('@')) {
      validateEmail(email);
    } else {
      setEmailError(null);
    }
  };

  const fetchComments = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/api/comments?postId=${encodeURIComponent(postId)}`, {
        cache: 'no-store',
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch comments');
      }
      
      const data = await response.json();
      if (data.success) {
        setComments(data.comments || []);
        setTotalComments(data.total || 0);
      }
    } catch (err) {
      // Degrade silently when the comments API is unavailable; only warn in development.
      if (process.env.NODE_ENV === 'development') {
        console.warn('[Comments] 评论加载失败（接口可能未部署），已进入降级态:', err);
      }
      setComments([]);
      setTotalComments(0);
      setError(t.blog.commentForm.serviceUnavailable);
    } finally {
      setLoading(false);
    }
  }, [postId]);

  useEffect(() => {
    fetchComments();
  }, [fetchComments]);

  const handleSliderMove = useCallback((clientX: number) => {
    if (!sliderRef.current || sliderVerified) return;
    
    const rect = sliderRef.current.getBoundingClientRect();
    const thumbWidth = 36;
    const maxX = rect.width - thumbWidth;
    const x = Math.max(0, Math.min(clientX - rect.left - thumbWidth / 2, maxX));
    const percentage = (x / maxX) * 100;
    
    if (percentage >= sliderValue) {
      setSliderValue(percentage);
      
      if (percentage >= 95) {
        setSliderVerified(true);
        setSliderValue(100);
      }
    }
  }, [sliderVerified, sliderValue]);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (sliderVerified) return;
    setIsDragging(true);
    handleSliderMove(e.clientX);
  };

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging) return;
    handleSliderMove(e.clientX);
  }, [isDragging, handleSliderMove]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    if (!sliderVerified) {
      setSliderValue(0);
    }
  }, [sliderVerified]);

  const handleTouchStart = (e: React.TouchEvent) => {
    if (sliderVerified) return;
    setIsDragging(true);
    handleSliderMove(e.touches[0].clientX);
  };

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (!isDragging) return;
    handleSliderMove(e.touches[0].clientX);
  }, [isDragging, handleSliderMove]);

  const handleTouchEnd = useCallback(() => {
    setIsDragging(false);
    if (!sliderVerified) {
      setSliderValue(0);
    }
  }, [sliderVerified]);

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.addEventListener('touchmove', handleTouchMove);
      document.addEventListener('touchend', handleTouchEnd);
    }
    
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, [isDragging, handleMouseMove, handleMouseUp, handleTouchMove, handleTouchEnd]);

  const resetSlider = () => {
    setSliderValue(0);
    setSliderVerified(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!sliderVerified) {
      setError(t.blog.commentForm.captchaRequired);
      return;
    }

    if (!formData.nickname.trim() || formData.nickname.length < 2 || formData.nickname.length > 20) {
      setError(t.blog.commentForm.nicknameLength);
      return;
    }

    if (!validateEmail(formData.email)) {
      return;
    }

    if (!formData.content.trim()) {
      setError(t.blog.commentForm.contentRequired);
      return;
    }

    if (formData.content.length > 2000) {
      setError(t.blog.commentForm.contentTooLong);
      return;
    }

    try {
      setSubmitting(true);
      setError(null);
      
      const authHeaders = await generateAuthHeaders();
      
      const response = await fetch(`${API_BASE_URL}/api/comments?postId=${encodeURIComponent(postId)}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...authHeaders,
        },
        body: JSON.stringify({
          nickname: formData.nickname.trim(),
          email: formData.email.trim().toLowerCase(),
          content: formData.content.trim(),
          isMarkdown: formData.isMarkdown,
          parentId: replyTo?.parentId || replyTo?.id || null,
          replyTo: replyTo?.nickname || null,
          verificationToken: `verified_${Date.now()}`,
        }),
      });

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(data?.error || t.blog.commentForm.serviceUnavailable);
      }

      setSuccess(t.blog.commentForm.success);
      setFormData(initialFormData);
      setReplyTo(null);
      resetSlider();
      
      await fetchComments();
      
      setTimeout(() => setSuccess(null), 3000);
      
    } catch (err) {
      setError(err instanceof Error ? err.message : t.blog.commentForm.serviceUnavailable);
    } finally {
      setSubmitting(false);
    }
  };

  const handleReply = (commentId: string, nickname: string, parentId: string | null = null) => {
    setReplyTo({ id: commentId, nickname, parentId });
    formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  const cancelReply = () => {
    setReplyTo(null);
  };

  const toggleReplies = (commentId: string) => {
    setExpandedReplies(prev => {
      const newSet = new Set(prev);
      if (newSet.has(commentId)) {
        newSet.delete(commentId);
      } else {
        newSet.add(commentId);
      }
      return newSet;
    });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const { relativeTime } = t.blog.commentForm;

    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today.getTime() - 86400000);
    const commentDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());

    if (seconds < 60) return tReplace(relativeTime.seconds, { count: seconds });
    if (minutes < 60) return tReplace(relativeTime.minutes, { count: minutes });
    if (hours < 24) return tReplace(relativeTime.hours, { count: hours });

    if (commentDate.getTime() === yesterday.getTime()) {
      return relativeTime.yesterday;
    }

    return tReplace(relativeTime.days, { count: days });
  };

  const renderContent = (content: string, isMarkdown: boolean) => {
    if (isMarkdown) {
      return (
        <div className="comment-markdown">
          <MarkdownRenderer content={content} />
        </div>
      );
    }
    return <p className="comment-text" dangerouslySetInnerHTML={{ __html: content }} />;
  };

  const renderComment = (comment: Comment, isReply: boolean = false) => (
    <motion.div
      key={comment.id}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`comment-item ${isReply ? 'comment-reply' : ''}`}
    >
      <div
        className="comment-avatar"
        style={{ backgroundColor: comment.avatarColor }}
      >
        {comment.nickname.charAt(0).toUpperCase()}
      </div>
      
      <div className="comment-body">
        <div className="comment-header">
          <span className="comment-nickname">{comment.nickname}</span>
          <span className="comment-time">{formatDate(comment.createdAt)}</span>
          {comment.browser && (
            <span className="comment-browser" title={comment.os ? `${comment.browser} · ${comment.os}` : comment.browser}>
              <Monitor size={12} />
              {comment.browser}
            </span>
          )}
          {comment.isMarkdown && (
            <span className="comment-badge">MD</span>
          )}
        </div>
        
        <div className="comment-content">
          {comment.replyTo && (
            <span className="comment-reply-to">@{comment.replyTo}</span>
          )}
          {renderContent(comment.content, comment.isMarkdown)}
        </div>
        
        <div className="comment-actions">
          <button
            className="comment-action-btn"
            onClick={() => handleReply(comment.id, comment.nickname, isReply ? comment.parentId : comment.id)}
          >
            <Reply size={14} />
            {t.blog.reply}
          </button>

          {!isReply && comment.replies.length > 0 && (
            <button
              className="comment-action-btn"
              onClick={() => toggleReplies(comment.id)}
            >
              {expandedReplies.has(comment.id) ? (
                <>
                  <ChevronUp size={14} />
                  {tReplace(t.blog.commentForm.collapseReplies, { count: comment.replies.length })}
                </>
              ) : (
                <>
                  <ChevronDown size={14} />
                  {tReplace(t.blog.commentForm.expandReplies, { count: comment.replies.length })}
                </>
              )}
            </button>
          )}
        </div>
        
        <AnimatePresence>
          {!isReply && expandedReplies.has(comment.id) && comment.replies.length > 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="comment-replies"
            >
              {comment.replies.map(reply => renderComment(reply, true))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );

  return (
    <div className="comment-section">
      <div className="comment-header-section">
        <h3 className="comment-title">
          <MessageCircle size={20} />
          {tReplace(t.blog.commentForm.title, { count: totalComments, max: maxComments })}
        </h3>
      </div>

      {totalComments < maxComments && (
        <form ref={formRef} className="comment-form" onSubmit={handleSubmit}>
          <h4 className="form-title">
            {replyTo ? tReplace(t.blog.commentForm.replyTo, { name: replyTo.nickname }) : t.blog.commentForm.submit}
          </h4>

          {replyTo && (
            <button type="button" className="cancel-reply-btn" onClick={cancelReply}>
              {t.blog.commentForm.cancelReply}
            </button>
          )}

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="nickname">
                <User size={14} />
                {t.blog.nickname} *
              </label>
              <input
                id="nickname"
                type="text"
                placeholder={t.blog.commentForm.nicknamePlaceholder}
                value={formData.nickname}
                onChange={e => setFormData(prev => ({ ...prev, nickname: e.target.value }))}
                maxLength={20}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="email">
                <Mail size={14} />
                {t.blog.email} *
              </label>
              <input
                id="email"
                type="email"
                placeholder={t.blog.commentForm.emailPlaceholder}
                value={formData.email}
                onChange={e => handleEmailChange(e.target.value)}
                onBlur={() => formData.email && validateEmail(formData.email)}
                className={emailError ? 'input-error' : ''}
                required
              />
              {emailError && <span className="field-error">{emailError}</span>}
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="content">
              <MessageCircle size={14} />
              {t.blog.content} *
              <span className="char-count">{formData.content.length}/2000</span>
            </label>
            <textarea
              id="content"
              placeholder={t.blog.commentForm.contentPlaceholder}
              value={formData.content}
              onChange={e => setFormData(prev => ({ ...prev, content: e.target.value }))}
              maxLength={2000}
              rows={4}
              required
            />
          </div>

          <div className="form-options">
            <label className="markdown-toggle">
              <input
                type="checkbox"
                checked={formData.isMarkdown}
                onChange={e => setFormData(prev => ({ ...prev, isMarkdown: e.target.checked }))}
              />
              <span className="toggle-label">{t.blog.commentForm.markdownSyntax}</span>
            </label>
          </div>

          <div className="form-footer">
            <div className="slider-verification">
              <div
                ref={sliderRef}
                className={`slider-container ${sliderVerified ? 'verified' : ''}`}
              >
                <div className="slider-track">
                  <div className="slider-fill" style={{ width: `calc(${sliderValue}% - ${sliderValue * 0.36}px)` }} />
                </div>
                <div
                  className={`slider-thumb ${isDragging ? 'dragging' : ''}`}
                  style={{ left: `calc((100% - 36px) * ${sliderValue} / 100)` }}
                  onMouseDown={handleMouseDown}
                  onTouchStart={handleTouchStart}
                >
                  {sliderVerified ? (
                    <Check size={14} />
                  ) : (
                    <ChevronDown size={14} className="rotate-90" />
                  )}
                </div>
                <span className="slider-text">
                  {sliderVerified ? t.blog.commentForm.verified : t.blog.commentForm.slideToVerify}
                </span>
              </div>
            </div>

            <button
              type="submit"
              className="submit-btn"
              disabled={submitting || !sliderVerified}
            >
              {submitting ? (
                <>
                  <Loader2 className="spin" size={16} />
                  {t.blog.commentForm.loading}
                </>
              ) : (
                <>
                  <Send size={16} />
                  {t.blog.commentForm.submit}
                </>
              )}
            </button>
          </div>

          {error && (
            <div className="form-error">
              <AlertCircle size={14} />
              {error}
            </div>
          )}

          {success && (
            <div className="form-success">
              <Check size={14} />
              {success}
            </div>
          )}
        </form>
      )}

      {loading ? (
        <div className="comment-loading">
          <Loader2 className="spin" size={24} />
          <span>{t.blog.commentForm.loadingComments}</span>
        </div>
      ) : (
        <div className="comment-list">
          {comments.length === 0 ? (
            <div className="comment-empty">
              <MessageCircle size={40} />
              <p>{t.blog.commentForm.emptyHint}</p>
            </div>
          ) : (
            comments.map(comment => renderComment(comment))
          )}
        </div>
      )}

      {totalComments >= maxComments && (
        <div className="comment-limit-notice">
          <AlertCircle size={16} />
          {t.blog.commentForm.limitReached}
        </div>
      )}
    </div>
  );
}
