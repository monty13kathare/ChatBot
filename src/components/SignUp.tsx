import React, { useState, useRef } from "react";
import { User, Mail, Lock, Camera, Eye, EyeOff } from "lucide-react";
import type { AuthCredentials, AuthResponse } from "../types";
import { useNavigate } from "react-router-dom";

const SignUp = () => {
    const [credentials, setCredentials] = useState<AuthCredentials>({
        name: "",
        email: "",
        password: "",
        avatar: "",
    });
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [imagePreview, setImagePreview] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        if (name === "confirmPassword") {
            setConfirmPassword(value);
        } else {
            setCredentials((prev) => ({ ...prev, [name]: value }));
        }

        if (errors[name]) {
            setErrors((prev) => ({ ...prev, [name]: "" }));
        }
    };

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (!file.type.startsWith("image/")) {
            setErrors(prev => ({ ...prev, avatar: "Please select a valid image file" }));
            return;
        }

        if (file.size > 5 * 1024 * 1024) {
            setErrors(prev => ({ ...prev, avatar: "Image size should be less than 5MB" }));
            return;
        }

        const reader = new FileReader();
        reader.onload = (ev) => setImagePreview(ev.target?.result as string);
        reader.readAsDataURL(file);

        if (errors.avatar) {
            setErrors(prev => ({ ...prev, avatar: "" }));
        }
    };

    const validateForm = (): boolean => {
        const newErrors: Record<string, string> = {};

        if (!credentials.name?.trim()) newErrors.name = "Name is required";

        if (!credentials.email) {
            newErrors.email = "Email is required";
        } else if (!/\S+@\S+\.\S+/.test(credentials.email)) {
            newErrors.email = "Please enter a valid email address";
        }

        if (!credentials.password) {
            newErrors.password = "Password is required";
        } else if (credentials.password.length < 6) {
            newErrors.password = "Password must be at least 6 characters";
        }

        if (!confirmPassword) {
            newErrors.confirmPassword = "Please confirm your password";
        } else if (credentials.password !== confirmPassword) {
            newErrors.confirmPassword = "Passwords do not match";
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: any) => {
        e.preventDefault();
        if (!validateForm()) return;

        setIsLoading(true);

        try {
            await new Promise((resolve) => setTimeout(resolve, 1000));

            const mockResponse: AuthResponse = {
                user: {
                    id: crypto.randomUUID(),
                    email: credentials.email,
                    name: credentials.name,
                    avatar: imagePreview || "👤",
                },
                token: crypto.randomUUID(),
                expiresIn: 3600,
            };

            localStorage.setItem("authToken", mockResponse.token);
            localStorage.setItem("user", JSON.stringify(mockResponse.user));

            // ✅ redirect + refresh
            window.location.href = "/";

        } catch (error) {
            console.error("Sign up failed:", error);
            setErrors(prev => ({ ...prev, submit: "Sign up failed. Please try again." }));
        } finally {
            setIsLoading(false);
        }
    };

    // Dark theme classes
    const containerClasses = "w-full max-w-md mx-auto bg-red-600 backdrop-blur-lg rounded-2xl md:rounded-3xl border border-gray-700 shadow-2xl overflow-hidden";
    const headerClasses = "relative p-6 md:p-8 bg-gradient-to-r from-purple-900 via-purple-800 to-indigo-900 text-white border-b border-gray-700";
    const formClasses = "p-6 md:p-8 space-y-6 bg-gray-900";

    const inputContainerClasses = "space-y-2";
    const labelClasses = "block text-sm font-medium text-gray-200";
    const inputWrapperClasses = "relative";
    const iconClasses = "absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5";

    const getInputClasses = (error: string | undefined) =>
        `w-full pl-10 pr-10 py-3 rounded-xl border bg-gray-800 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50 transition-all duration-200 ${error
            ? "border-red-500 focus:border-red-500 focus:ring-red-500/20"
            : "border-gray-600 focus:border-purple-500"
        }`;

    const toggleButtonClasses = "absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-300 transition-colors";

    const avatarClasses = "w-16 h-16 md:w-20 md:h-20 rounded-full border-2 border-dashed border-gray-600 flex items-center justify-center cursor-pointer overflow-hidden bg-gray-800 hover:border-purple-500 transition-colors duration-200";

    const submitButtonClasses = "w-full bg-gradient-to-r from-purple-700 to-indigo-700 hover:from-purple-600 hover:to-indigo-600 text-white py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transform hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:hover:shadow-lg flex items-center justify-center gap-2";

    return (
        <div className="w-full h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-cyan-900 flex justify-center items-center">
            <div className={containerClasses}>
                {/* Header */}
                <div className={headerClasses}>
                    <h2 className="text-xl md:text-2xl font-bold text-center">Create Account</h2>
                    <p className="text-purple-200 text-center mt-2 text-sm">Join our community today</p>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className={formClasses}>
                    {/* Avatar Upload */}
                    <div className="flex flex-col items-center space-y-3">
                        <div
                            onClick={() => fileInputRef.current?.click()}
                            className={avatarClasses}
                            role="button"
                            tabIndex={0}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' || e.key === ' ') {
                                    fileInputRef.current?.click();
                                }
                            }}
                        >
                            {imagePreview ? (
                                <img
                                    src={imagePreview}
                                    alt="Profile preview"
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                <Camera className="w-5 h-5 md:w-6 md:h-6 text-gray-400" />
                            )}
                        </div>
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            onChange={handleImageUpload}
                            className="hidden"
                            aria-label="Upload profile picture"
                        />
                        {errors.avatar && (
                            <p className="text-red-400 text-sm text-center">⚠️ {errors.avatar}</p>
                        )}
                    </div>

                    {/* Name Field */}
                    <div className={inputContainerClasses}>
                        <label htmlFor="name" className={labelClasses}>
                            Full Name
                        </label>
                        <div className={inputWrapperClasses}>
                            <User className={iconClasses} />
                            <input
                                id="name"
                                type="text"
                                name="name"
                                value={credentials.name}
                                onChange={handleChange}
                                placeholder="Your full name"
                                className={getInputClasses(errors.name)}
                                aria-invalid={!!errors.name}
                                aria-describedby={errors.name ? "name-error" : undefined}
                            />
                        </div>
                        {errors.name && (
                            <p id="name-error" className="text-red-400 text-sm flex items-center gap-1">
                                ⚠️ {errors.name}
                            </p>
                        )}
                    </div>

                    {/* Email Field */}
                    <div className={inputContainerClasses}>
                        <label htmlFor="email" className={labelClasses}>
                            Email
                        </label>
                        <div className={inputWrapperClasses}>
                            <Mail className={iconClasses} />
                            <input
                                id="email"
                                type="email"
                                name="email"
                                value={credentials.email}
                                onChange={handleChange}
                                placeholder="you@example.com"
                                className={getInputClasses(errors.email)}
                                aria-invalid={!!errors.email}
                                aria-describedby={errors.email ? "email-error" : undefined}
                            />
                        </div>
                        {errors.email && (
                            <p id="email-error" className="text-red-400 text-sm flex items-center gap-1">
                                ⚠️ {errors.email}
                            </p>
                        )}
                    </div>

                    {/* Password Field */}
                    <div className={inputContainerClasses}>
                        <label htmlFor="password" className={labelClasses}>
                            Password
                        </label>
                        <div className={inputWrapperClasses}>
                            <Lock className={iconClasses} />
                            <input
                                id="password"
                                type={showPassword ? "text" : "password"}
                                name="password"
                                value={credentials.password}
                                onChange={handleChange}
                                placeholder="Enter password"
                                className={getInputClasses(errors.password)}
                                aria-invalid={!!errors.password}
                                aria-describedby={errors.password ? "password-error" : undefined}
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className={toggleButtonClasses}
                                aria-label={showPassword ? "Hide password" : "Show password"}
                            >
                                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                            </button>
                        </div>
                        {errors.password && (
                            <p id="password-error" className="text-red-400 text-sm flex items-center gap-1">
                                ⚠️ {errors.password}
                            </p>
                        )}
                    </div>

                    {/* Confirm Password Field */}
                    <div className={inputContainerClasses}>
                        <label htmlFor="confirmPassword" className={labelClasses}>
                            Confirm Password
                        </label>
                        <div className={inputWrapperClasses}>
                            <Lock className={iconClasses} />
                            <input
                                id="confirmPassword"
                                type={showConfirmPassword ? "text" : "password"}
                                name="confirmPassword"
                                value={confirmPassword}
                                onChange={handleChange}
                                placeholder="Confirm password"
                                className={getInputClasses(errors.confirmPassword)}
                                aria-invalid={!!errors.confirmPassword}
                                aria-describedby={errors.confirmPassword ? "confirm-password-error" : undefined}
                            />
                            <button
                                type="button"
                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                className={toggleButtonClasses}
                                aria-label={showConfirmPassword ? "Hide confirm password" : "Show confirm password"}
                            >
                                {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                            </button>
                        </div>
                        {errors.confirmPassword && (
                            <p id="confirm-password-error" className="text-red-400 text-sm flex items-center gap-1">
                                ⚠️ {errors.confirmPassword}
                            </p>
                        )}
                    </div>

                    {/* Submit Button */}
                    <button
                        type="submit"
                        disabled={isLoading}
                        className={submitButtonClasses}
                    >
                        {isLoading ? (
                            <>
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                <span>Creating Account...</span>
                            </>
                        ) : (
                            <>
                                <span>🚀</span>
                                <span>Create Account</span>
                            </>
                        )}
                    </button>

                    {/* Submit Error */}
                    {errors.submit && (
                        <p className="text-red-400 text-sm text-center">⚠️ {errors.submit}</p>
                    )}

                    {/* Additional Info */}
                    <div className="text-center text-gray-400 text-xs pt-4 border-t border-gray-800">
                        <p>By creating an account, you agree to our Terms of Service</p>
                    </div>
                </form>
            </div>
        </div>

    );
};

export default SignUp;