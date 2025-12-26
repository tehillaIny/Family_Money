import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { AlertCircle } from 'lucide-react'; // אייקון לשגיאה

const LoginPage = () => {
  const [isLogin, setIsLogin] = useState(true); // Toggle between Login and Signup
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState(''); // Only for signup
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const { login, signup } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isLogin) {
        await login(email, password);
        toast({ title: "התחברת בהצלחה", description: "ברוך שובך!" });
      } else {
        await signup(email, password, name);
        toast({ title: "נרשמת בהצלחה", description: "ברוך הבא למשפחה!" });
      }
      navigate('/dashboard'); // מעבר לדף הראשי אחרי הצלחה
    } catch (err) {
      console.error(err);
      let msg = "אירעה שגיאה בהתחברות";
      if (err.code === 'auth/invalid-credential') msg = "פרטים שגויים";
      if (err.code === 'auth/email-already-in-use') msg = "המייל הזה כבר קיים במערכת";
      if (err.code === 'auth/weak-password') msg = "הסיסמה חלשה מדי (מינימום 6 תווים)";
      setError(msg);
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4" dir="rtl">
      <Card className="w-full max-w-md shadow-lg border-t-4 border-primary">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-primary">
            {isLogin ? 'התחברות לחשבון' : 'יצירת חשבון חדש'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* הודעת שגיאה - עיצוב פשוט במקום רכיב Alert שחסר */}
            {error && (
              <div className="bg-destructive/15 text-destructive p-3 rounded-md flex items-center gap-2 text-sm font-medium">
                <AlertCircle className="h-4 w-4" />
                <span>{error}</span>
              </div>
            )}
            
            {!isLogin && (
              <div className="space-y-1">
                <label className="text-sm font-medium">שם מלא (או שם המשפחה)</label>
                <Input 
                  type="text" 
                  value={name} 
                  onChange={(e) => setName(e.target.value)} 
                  required 
                  placeholder="משפחת כהן"
                />
              </div>
            )}

            <div className="space-y-1">
              <label className="text-sm font-medium">אימייל</label>
              <Input 
                type="email" 
                value={email} 
                onChange={(e) => setEmail(e.target.value)} 
                required 
                placeholder="name@example.com"
              />
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium">סיסמה</label>
              <Input 
                type="password" 
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
                required 
                placeholder="******"
              />
            </div>

            <Button type="submit" className="w-full mt-4" disabled={loading}>
              {loading ? 'טוען...' : (isLogin ? 'התחבר' : 'הירשם')}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex justify-center border-t p-4 bg-muted/20">
          <button 
            onClick={() => setIsLogin(!isLogin)} 
            className="text-sm text-primary hover:underline font-medium"
          >
            {isLogin ? 'אין לך חשבון? הירשם כאן' : 'יש לך כבר חשבון? התחבר כאן'}
          </button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default LoginPage;