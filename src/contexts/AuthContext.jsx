import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
    createUserWithEmailAndPassword, 
    signInWithEmailAndPassword, 
    signOut, 
    onAuthStateChanged 
} from 'firebase/auth';
import { 
    doc, setDoc, getDoc, updateDoc, arrayUnion, 
    collection, query, where, getDocs 
} from 'firebase/firestore'; 
import { auth, db } from '../firebase';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    const [currentUser, setCurrentUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [familyId, setFamilyId] = useState(null);
    const [userData, setUserData] = useState(null);
    const [familyMembers, setFamilyMembers] = useState([]); // <--- רשימת חברי המשפחה

    // הרשמה למערכת
    const signup = async (email, password, name) => {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        
        const newFamilyId = user.uid; 

        const userDataObj = {
            email: user.email,
            name: name || "משתמש",
            familyId: newFamilyId,
            createdAt: new Date()
        };

        await setDoc(doc(db, "users", user.uid), userDataObj);

        await setDoc(doc(db, "families", newFamilyId), {
            ownerId: user.uid,
            members: [user.uid],
            createdAt: new Date()
        });

        setFamilyId(newFamilyId);
        setUserData(userDataObj);
        return user;
    };

    const login = (email, password) => {
        return signInWithEmailAndPassword(auth, email, password);
    };

    const logout = () => {
        setFamilyId(null);
        setUserData(null);
        setFamilyMembers([]);
        return signOut(auth);
    };

    // הצטרפות למשפחה
    const joinFamily = async (targetFamilyId) => {
        if (!currentUser) return;
        
        const familyDoc = await getDoc(doc(db, "families", targetFamilyId));
        if (!familyDoc.exists()) {
            throw new Error("קוד משפחה שגוי - לא נמצאה משפחה כזו");
        }

        await updateDoc(doc(db, "users", currentUser.uid), { 
            familyId: targetFamilyId 
        });

        await updateDoc(doc(db, "families", targetFamilyId), {
            members: arrayUnion(currentUser.uid)
        });

        setFamilyId(targetFamilyId);
        window.location.reload();
    };

    // עדכון פרופיל (נשתמש בזה בשלב 2, אבל אני מכין את זה כבר)
    const updateUserProfile = async (newName) => {
        if (!currentUser) return;
        await updateDoc(doc(db, "users", currentUser.uid), { name: newName });
        setUserData(prev => ({ ...prev, name: newName }));
        // רענון הרשימה כדי לראות את השינוי מיד
        fetchFamilyMembers(familyId);
    };

    // פונקציה לשליפת חברי המשפחה
    const fetchFamilyMembers = async (currentFamilyId) => {
        if (!currentFamilyId) return;
        try {
            const q = query(
                collection(db, "users"), 
                where("familyId", "==", currentFamilyId)
            );
            const querySnapshot = await getDocs(q);
            const members = querySnapshot.docs.map(doc => ({
                uid: doc.id,
                ...doc.data()
            }));
            setFamilyMembers(members);
        } catch (error) {
            console.error("Error fetching family members:", error);
        }
    };

    // טעינת משתמש ראשונית
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            setCurrentUser(user);
            
            if (user) {
                try {
                    const userDoc = await getDoc(doc(db, "users", user.uid));
                    if (userDoc.exists()) {
                        const data = userDoc.data();
                        setFamilyId(data.familyId);
                        setUserData(data);
                    } else {
                        const newFamilyId = user.uid;
                        await setDoc(doc(db, "users", user.uid), {
                            email: user.email,
                            familyId: newFamilyId
                        });
                        setFamilyId(newFamilyId);
                    }
                } catch (error) {
                    console.error("Error fetching user data:", error);
                }
            } else {
                setFamilyId(null);
                setUserData(null);
                setFamilyMembers([]);
            }
            
            setLoading(false);
        });

        return unsubscribe;
    }, []);

    // האזנה לשינויים ב-familyId כדי לטעון את רשימת החברים
    useEffect(() => {
        if (familyId) {
            fetchFamilyMembers(familyId);
        }
    }, [familyId]);

    const value = {
        currentUser,
        familyId,
        userData,
        familyMembers, // <--- החשיפה החדשה
        signup,
        login,
        logout,
        joinFamily,
        updateUserProfile // <--- הפונקציה החדשה לשלב הבא
    };

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    );
};