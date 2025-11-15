const functions = require('firebase-functions');
const axios = require('axios');

exports.sendSMS = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError(
      'unauthenticated',
      'برای ارسال پیامک باید وارد شده باشید.'
    );
  }

  const { phoneNumbers, message } = data || {};

  if (!Array.isArray(phoneNumbers) || phoneNumbers.length === 0) {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'لیست شماره‌ها معتبر نیست.'
    );
  }

  if (typeof message !== 'string' || message.trim().length === 0) {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'متن پیام معتبر نیست.'
    );
  }

  const apiKey = functions.config().kavenegar?.key;
  if (!apiKey) {
    throw new functions.https.HttpsError(
      'failed-precondition',
      'کلید Kavenegar تنظیم نشده است.'
    );
  }

  const endpoint = `https://api.kavenegar.com/v1/${apiKey}/sms/send.json`;

  try {
    const response = await axios.post(
      endpoint,
      null,
      {
        params: {
          receptor: phoneNumbers.join(','),
          message,
        },
      }
    );

    const entries =
      response?.data?.entries && Array.isArray(response.data.entries)
        ? response.data.entries
        : [];

    const result = phoneNumbers.map((number) => {
      const entry = entries.find((item) => item.receptor === number);
      return {
        phoneNumber: number,
        status: entry ? entry.status : 'unknown',
        messageId: entry ? entry.messageid : null,
      };
    });

    return { success: true, result };
  } catch (error) {
    const status = error.response?.data?.return?.status;
    const messageText =
      error.response?.data?.return?.message || 'ارسال پیامک با خطا مواجه شد.';
    throw new functions.https.HttpsError('internal', messageText, { status });
  }
});

