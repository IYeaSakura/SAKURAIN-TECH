import { useState } from 'react';
import { useHealthCheck, useSecureApi } from '@/hooks/useSecureApi';
import { GlowBadge } from '@/components/atoms';

export default function ApiTest() {
  const { data: healthData, loading: healthLoading, error: healthError, checkHealth } = useHealthCheck();
  const { loading: sending, error: sendError, sendData } = useSecureApi();
  
  const [message, setMessage] = useState('');
  const [response, setResponse] = useState<any>(null);

  const handleSendData = async () => {
    try {
      const result = await sendData({ message });
      setResponse(result);
    } catch (error) {
      console.error('Failed to send data:', error);
    }
  };

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <GlowBadge text="API 测试" variant="primary" size="lg" />
        </div>

        <div className="space-y-8">
          <div
            className="p-6 rounded-xl"
            style={{
              background: 'var(--bg-card)',
              border: '3px solid var(--border-subtle)',
            }}
          >
            <h2
              className="text-xl font-bold mb-4"
              style={{ color: 'var(--text-primary)' }}
            >
              健康检查
            </h2>
            
            <button
              onClick={checkHealth}
              disabled={healthLoading}
              className="px-6 py-3 rounded-lg font-bold transition-all duration-200"
              style={{
                background: 'var(--accent-primary)',
                color: 'white',
                opacity: healthLoading ? 0.6 : 1,
                cursor: healthLoading ? 'not-allowed' : 'pointer',
              }}
            >
              {healthLoading ? '检查中...' : '检查健康状态'}
            </button>

            {healthData && (
              <div
                className="mt-4 p-4 rounded-lg"
                style={{
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--border-subtle)',
                }}
              >
                <p style={{ color: 'var(--text-secondary)' }}>
                  状态: <span style={{ color: 'var(--accent-primary)' }}>{healthData.status}</span>
                </p>
                <p style={{ color: 'var(--text-secondary)' }}>
                  时间戳: <span style={{ color: 'var(--accent-primary)' }}>{healthData.timestamp}</span>
                </p>
              </div>
            )}

            {healthError && (
              <div
                className="mt-4 p-4 rounded-lg"
                style={{
                  background: 'rgba(239, 68, 68, 0.1)',
                  border: '1px solid #ef4444',
                }}
              >
                <p style={{ color: '#ef4444' }}>错误: {healthError}</p>
              </div>
            )}
          </div>

          <div
            className="p-6 rounded-xl"
            style={{
              background: 'var(--bg-card)',
              border: '3px solid var(--border-subtle)',
            }}
          >
            <h2
              className="text-xl font-bold mb-4"
              style={{ color: 'var(--text-primary)' }}
            >
              发送数据
            </h2>

            <div className="mb-4">
              <input
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="输入消息..."
                className="w-full px-4 py-2 rounded-lg"
                style={{
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--border-subtle)',
                  color: 'var(--text-primary)',
                }}
              />
            </div>

            <button
              onClick={handleSendData}
              disabled={sending || !message}
              className="px-6 py-3 rounded-lg font-bold transition-all duration-200"
              style={{
                background: 'var(--accent-primary)',
                color: 'white',
                opacity: sending || !message ? 0.6 : 1,
                cursor: sending || !message ? 'not-allowed' : 'pointer',
              }}
            >
              {sending ? '发送中...' : '发送数据'}
            </button>

            {response && (
              <div
                className="mt-4 p-4 rounded-lg"
                style={{
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--border-subtle)',
                }}
              >
                <p style={{ color: 'var(--text-secondary)' }}>
                  消息: <span style={{ color: 'var(--accent-primary)' }}>{response.message}</span>
                </p>
                <p style={{ color: 'var(--text-secondary)' }}>
                  接收数据: <span style={{ color: 'var(--accent-primary)' }}>{JSON.stringify(response.receivedData)}</span>
                </p>
                <p style={{ color: 'var(--text-secondary)' }}>
                  时间戳: <span style={{ color: 'var(--accent-primary)' }}>{response.timestamp}</span>
                </p>
              </div>
            )}

            {sendError && (
              <div
                className="mt-4 p-4 rounded-lg"
                style={{
                  background: 'rgba(239, 68, 68, 0.1)',
                  border: '1px solid #ef4444',
                }}
              >
                <p style={{ color: '#ef4444' }}>错误: {sendError}</p>
              </div>
            )}
          </div>

          <div
            className="p-6 rounded-xl"
            style={{
              background: 'var(--bg-card)',
              border: '3px solid var(--border-subtle)',
            }}
          >
            <h2
              className="text-xl font-bold mb-4"
              style={{ color: 'var(--text-primary)' }}
            >
              使用说明
            </h2>

            <div className="space-y-2 text-sm" style={{ color: 'var(--text-secondary)' }}>
              <p>1. 确保 <code style={{ background: 'var(--bg-secondary)', padding: '2px 6px', borderRadius: '4px' }}>.env</code> 文件已配置</p>
              <p>2. 配置 <code style={{ background: 'var(--bg-secondary)', padding: '2px 6px', borderRadius: '4px' }}>API_SECRET_KEY</code> 和 <code style={{ background: 'var(--bg-secondary)', padding: '2px 6px', borderRadius: '4px' }}>VITE_API_BASE_URL</code></p>
              <p>3. 所有 API 请求都会自动添加安全验证头</p>
              <p>4. 验证失败会返回 401 错误</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
