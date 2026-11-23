import type { Metadata } from 'next';
import FriendApplyForm from '@/components/friends/FriendApplyForm';

/**
 * 自助友链申请页：表单直接提交到 sakurain-api，由站主在后台审核。
 */
export const metadata: Metadata = {
  title: '申请友链 — SAKURAIN',
  description: '填写网站名称、地址、图标与描述即可申请交换友链，人工审核后邮件通知。',
  alternates: { canonical: '/friends/apply' },
};

export default function Page() {
  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
      <FriendApplyForm />
    </main>
  );
}
