
import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, CheckCircle2, AlertTriangle } from 'lucide-react';
import { getApiUrl } from '@/config/env';
import { toast } from 'sonner';

const VerifyEmailPage: React.FC = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [status, setStatus] = useState<'verifying' | 'success' | 'error'>('verifying');
    const [message, setMessage] = useState('');

    useEffect(() => {
        const token = searchParams.get('token');

        if (!token) {
            setStatus('error');
            setMessage('Missing verification token.');
            setLoading(false);
            return;
        }

        const verifyEmail = async () => {
            try {
                setLoading(true);
                const response = await fetch(getApiUrl(`/auth/verify-email?token=${token}`), {
                    method: 'GET',
                    headers: { 'Content-Type': 'application/json' },
                });

                const data = await response.json();

                if (response.ok && data.success) {
                    setStatus('success');
                    setMessage('Email verified successfully!');
                    toast.success('Email verified! Logging you in...');

                    // Auto-Login Logic
                    if (data.token) {
                        localStorage.setItem('token', data.token);
                        // Also store user info if available to help Context hydrate faster
                        if (data.user) {
                            localStorage.setItem('user', JSON.stringify(data.user));
                        }
                    }

                    // Redirect based on role
                    setTimeout(() => {
                        const role = data.role?.toUpperCase();
                        if (role === 'CUSTOMER') {
                            navigate('/customer');
                        } else if (role === 'VENDOR') {
                            navigate('/vendor');
                        } else if (role === 'MANAGER') {
                            navigate('/manager');
                        } else if (role === 'ADMIN') {
                            navigate('/admin');
                        } else {
                            navigate('/login'); // Fallback
                        }
                    }, 1500);

                } else {
                    setStatus('error');
                    // If already verified, treat as success-ish but maybe redirect to login
                    if (data.message === 'Email already verified') {
                        setMessage('Your email is already verified. Please login.');
                        setTimeout(() => navigate('/login'), 2000);
                    } else {
                        setMessage(data.message || 'Verification failed.');
                    }
                }
            } catch (error) {
                console.error('Verification error:', error);
                setStatus('error');
                setMessage('An unexpected error occurred.');
            } finally {
                setLoading(false);
            }
        };

        verifyEmail();
    }, [searchParams, navigate]);

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
            <Card className="max-w-md w-full shadow-lg">
                <CardHeader className="text-center">
                    <div className="flex justify-center mb-4">
                        {status === 'verifying' && <Loader2 className="h-12 w-12 text-blue-500 animate-spin" />}
                        {status === 'success' && <CheckCircle2 className="h-12 w-12 text-green-500" />}
                        {status === 'error' && <AlertTriangle className="h-12 w-12 text-red-500" />}
                    </div>
                    <CardTitle className="text-2xl font-bold text-gray-800">
                        {status === 'verifying' && 'Verifying Email...'}
                        {status === 'success' && 'Email Verified!'}
                        {status === 'error' && 'Verification Failed'}
                    </CardTitle>
                </CardHeader>
                <CardContent className="text-center space-y-4">
                    <p className="text-gray-600">
                        {status === 'verifying' && 'Please wait while we verify your email address.'}
                        {message}
                    </p>

                    {status === 'error' && (
                        <Button asChild className="w-full mt-4">
                            <Link to="/login">Go to Login</Link>
                        </Button>
                    )}

                    {status === 'success' && (
                        <p className="text-sm text-gray-500">Redirecting you to dashboard...</p>
                    )}
                </CardContent>
            </Card>
        </div>
    );
};

export default VerifyEmailPage;
