import { useState } from 'react';
import { getFunctions, httpsCallable } from 'firebase/functions';

function SendSMS() {
  const [loading, setLoading] = useState(false);

  const handleSend = async () => {
    setLoading(true);
    const functions = getFunctions();
    const sendSMS = httpsCallable(functions, 'sendSMS');

    try {
      // در عمل، شماره‌ها را می‌توانید از Firestore یا هر منبع دیگری دریافت کنید.
      const phoneNumbers = [
        '09137804658',
      ];

      await sendSMS({
        phoneNumbers,
        message: 'حادثه جدید ثبت شد!',
      });

      alert('✅ پیام ارسال شد');
    } catch (error) {
      console.error('sendSMS error:', error);
      alert('❌ خطا در ارسال');
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleSend}
      disabled={loading}
      className="px-4 py-2 bg-red-600 text-white rounded disabled:opacity-50"
    >
      {loading ? 'در حال ارسال...' : 'ارسال پیامک'}
    </button>
  );
}

export default SendSMS;

