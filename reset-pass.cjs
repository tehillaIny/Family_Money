// שינוי לייבוא מודולרי
const { initializeApp, cert } = require('firebase-admin/app');
const { getAuth } = require('firebase-admin/auth');

// טעינת ה-JSON
const serviceAccount = require('./service-account-key.json');

// איתחול
initializeApp({
  credential: cert(serviceAccount)
});

const uid = '2LFsskRuckXwtmVd1ZQsTL3QtLq2';
const newPassword = '123456'; // תשני לסיסמה שתרצי

async function resetPassword() {
    try {
        // שימוש ב-getAuth() ישירות
        const userRecord = await getAuth().updateUser(uid, {
            password: newPassword
        });
        console.log('✅ סיסמה עודכנה בהצלחה עבור:', userRecord.email);
    } catch (error) {
        console.error('❌ שגיאה בעדכון הסיסמה:', error);
    }
}

resetPassword();