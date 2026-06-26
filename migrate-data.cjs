const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');

const serviceAccount = require('./service-account-key.json');

initializeApp({
  credential: cert(serviceAccount)
});

const db = getFirestore();

const oldUserIds = [
    'demouser', 
    '390NeQUzDqTetneXawFmYAVi8fc2'
]; 

const targetFamilyId = '390NeQUzDqTetneXawFmYAVi8fc2'

async function runMigration() {
    console.log('🚀 מתחיל בהעברת נתונים...');
    let totalMigrated = 0;

    try {
        for (const userId of oldUserIds) {
            console.log(`\n📂 סורק עסקאות עבור יוזר: ${userId}...`);
            
            const oldRef = db.collection('users').doc(userId).collection('transactions');
            const snapshot = await oldRef.get();

            if (snapshot.empty) {
                console.log('לא נמצאו עסקאות עבור יוזר זה.');
                continue;
            }

            console.log(`נמצאו ${snapshot.size} עסקאות. מתחיל העתקה...`);

            let skipped = 0;
            let processed = 0;

            for (const document of snapshot.docs) {
                const data = document.data();
                const newRef = db.collection('users').doc(targetFamilyId).collection('transactions').doc(document.id);                
                const docCheck = await newRef.get();
                
                if (!docCheck.exists) {
                    await newRef.set(data);
                    totalMigrated++;
                } else {
                    skipped++;
                }

                processed++;
                                if (processed % 100 === 0) {
                    console.log(`⏳ התקדמות: עובדו ${processed} מתוך ${snapshot.size} עסקאות...`);
                }
            }
            
            console.log(`✅ הסתיימה ההעתקה עבור ${userId}. הועתקו: ${totalMigrated}, דילגנו (כבר קיימים): ${skipped}`);
        }

        console.log(`\n🎉 ההגירה הושלמה בהצלחה! סך הכל הועתקו ${totalMigrated} עסקאות חדשות.`);
        
        process.exit(0); 
        
    } catch (error) {
        console.error('❌ שגיאה במהלך ההגירה:', error);
        process.exit(1); 
    }
}

runMigration();