import React, { useState, useEffect } from 'react';
import type { AuthCredentials, AuthResponse } from '../types';
import { Mail, Lock, Eye, EyeOff } from "lucide-react";

interface LoginProps {
    onSuccess: (response: AuthResponse) => void;
    onSwitchToSignUp: () => void;
    onClose?: () => void;
}

const Login: React.FC<LoginProps> = ({ onSuccess, onSwitchToSignUp, onClose }) => {
    const [credentials, setCredentials] = useState<AuthCredentials>({
        email: '',
        password: ''
    });
    const [isLoading, setIsLoading] = useState(false);
    const [errors, setErrors] = useState<{ email?: string; password?: string; general?: string }>({});

    // 🔹 Check for token on mount
    useEffect(() => {
        const existingToken = localStorage.getItem('authToken');
        if (!existingToken) {
            setErrors({ general: "No account found. Please sign up first." });
        }
    }, []);

    const validateForm = () => {
        const newErrors: { email?: string; password?: string } = {};

        if (!credentials.email) {
            newErrors.email = 'Email is required';
        } else if (!/\S+@\S+\.\S+/.test(credentials.email)) {
            newErrors.email = 'Email is invalid';
        }

        if (!credentials.password) {
            newErrors.password = 'Password is required';
        } else if (credentials.password.length < 6) {
            newErrors.password = 'Password must be at least 6 characters';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // If token not found, block login
        if (!localStorage.getItem('authToken')) {
            setErrors({ general: "No account found. Please sign up first." });
            return;
        }

        if (!validateForm()) return;

        setIsLoading(true);

        try {
            // Simulate API call
            await new Promise(resolve => setTimeout(resolve, 1500));

            // Mock response - replace with actual API call
            const mockResponse: AuthResponse = {
                user: {
                    id: '1',
                    email: credentials.email,
                    name: credentials.email.split('@')[0],
                    avatar: '👤'
                },
                token: 'mock-jwt-token',
                expiresIn: 3600
            };

            // Save token to localStorage
            localStorage.setItem('authToken', mockResponse.token);

            onSuccess(mockResponse);
        } catch (error) {
            setErrors({ password: 'Invalid credentials' });
        } finally {
            setIsLoading(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setCredentials(prev => ({
            ...prev,
            [name]: value
        }));
        if (errors[name as keyof typeof errors]) {
            setErrors(prev => ({ ...prev, [name]: undefined }));
        }
    };

    return (
        <div className="bg-white/10 backdrop-blur-lg rounded-3xl border border-white/20 shadow-2xl overflow-hidden">
            {/* Header */}
            <div className="relative p-8 bg-gradient-to-r from-purple-600 to-blue-600 text-white">
                <div className="text-center">
                    <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                        <span className="text-2xl">🤖</span>
                    </div>
                    <h2 className="text-2xl font-bold">Welcome Back!</h2>
                    <p className="text-white/80 mt-2">Sign in to continue your conversation</p>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="p-8 space-y-6">
                {/* 🔹 General error (like no token) */}
                {errors.general && (
                    <p className="text-red-500 text-sm flex items-center gap-2">
                        <span>⚠️</span> {errors.general}
                    </p>
                )}

                {/* Email */}
                <div className="space-y-2">
                    <label htmlFor="email" className="block text-sm font-medium text-gray-300">
                        Email Address
                    </label>
                    <div className="relative">
                        <input
                            id="email"
                            name="email"
                            type="email"
                            value={credentials.email}
                            onChange={handleChange}
                            className={`w-full px-4 py-3 rounded-xl border text-white bg-gray-800/50 backdrop-blur-sm transition-all duration-300 ${errors.email
                                ? 'border-red-500 focus:border-red-500'
                                : 'border-gray-300 dark:border-gray-600 focus:border-purple-500'
                                } focus:outline-none focus:ring-2 focus:ring-purple-500/20`}
                            placeholder="Enter your email"
                        />
                        <Mail className="absolute right-3 top-3 text-gray-400 w-5 h-5" />
                    </div>
                    {errors.email && (
                        <p className="text-red-500 text-sm flex items-center gap-2">
                            <span>⚠️</span> {errors.email}
                        </p>
                    )}
                </div>

                {/* Password */}
                <div className="space-y-2">
                    <label htmlFor="password" className="block text-sm font-medium dark:text-gray-300">
                        Password
                    </label>
                    <div className="relative">
                        <input
                            id="password"
                            name="password"
                            type="password"
                            value={credentials.password}
                            onChange={handleChange}
                            className={`w-full px-4 py-3 rounded-xl border text-white dark:bg-gray-800/50 backdrop-blur-sm transition-all duration-300 ${errors.password
                                ? 'border-red-500 focus:border-red-500'
                                : 'border-gray-300 dark:border-gray-600 focus:border-purple-500'
                                } focus:outline-none focus:ring-2 focus:ring-purple-500/20`}
                            placeholder="Enter your password"
                        />
                        <Lock className="absolute right-3 top-3 text-gray-400 w-5 h-5" />
                    </div>
                    {errors.password && (
                        <p className="text-red-500 text-sm flex items-center gap-2">
                            <span>⚠️</span> {errors.password}
                        </p>
                    )}
                </div>

                {/* Remember & Forgot */}
                <div className="flex items-center justify-between">
                    <label className="flex items-center space-x-2 cursor-pointer">
                        <input type="checkbox" className="rounded border-gray-300 text-purple-600 focus:ring-purple-500" />
                        <span className="text-sm text-gray-600 dark:text-gray-400">Remember me</span>
                    </label>
                    <button type="button" className="text-sm text-purple-600 hover:text-purple-700 transition-colors">
                        Forgot password?
                    </button>
                </div>

                {/* Submit */}
                <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white py-3 px-4 rounded-xl font-semibold shadow-lg hover:shadow-xl transform hover:scale-[1.02] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                    {isLoading ? (
                        <>
                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                            Signing In...
                        </>
                    ) : (
                        <>
                            <span>🚀</span> Sign In
                        </>
                    )}
                </button>

                {/* Switch to Sign Up */}
                <div className="text-center text-sm text-gray-600 dark:text-gray-400">
                    Don't have an account?{' '}
                    <button
                        type="button"
                        onClick={onSwitchToSignUp}
                        className="text-purple-600 hover:text-purple-700 font-semibold transition-colors"
                    >
                        Sign up here
                    </button>
                </div>
            </form>
        </div>
    );
};

export default Login;
