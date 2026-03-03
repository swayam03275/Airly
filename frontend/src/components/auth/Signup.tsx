import {
  AlertCircle,
  CheckCircle,
  Eye,
  EyeOff,
  Lock,
  Mail,
  Upload,
  User,
} from "lucide-react";
import React, { useRef, useState } from "react";
import toast from "react-hot-toast";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { loginSuccess } from "../../features/auth/authSlice";
import { userService } from "../../services/userService";

interface ValidationErrors {
  fullName?: string;
  username?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
  pfp?: string;
}

export const Signup: React.FC = () => {
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [pfp, setPfp] = useState<File | null>(null);
  const [pfpPreview, setPfpPreview] = useState<string>("");
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>(
    {},
  );
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const MAX_FULLNAME_LENGTH = 30;
  const MAX_USERNAME_LENGTH = 30;
  const MIN_PASSWORD_LENGTH = 6;
  const MAX_PASSWORD_LENGTH = 8;
  const MAX_PFP_SIZE = 3 * 1024 * 1024;
  const ALLOWED_IMAGE_TYPES = [
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/gif",
    "image/webp",
  ];
  const EMAIL_REGEX = /^\S+@\S+\.\S+$/;

  const validateFullName = (value: string): string | undefined => {
    const trimmedValue = value.trim();
    if (trimmedValue.length === 0) {
      return "Full name is required";
    }
    if (trimmedValue.length > MAX_FULLNAME_LENGTH) {
      return `Full name must be ${MAX_FULLNAME_LENGTH} characters or less`;
    }
    return undefined;
  };

  const validateUsername = (value: string): string | undefined => {
    const trimmedValue = value.trim().toLowerCase();
    if (trimmedValue.length === 0) {
      return "Username is required";
    }
    if (trimmedValue.length > MAX_USERNAME_LENGTH) {
      return `Username must be ${MAX_USERNAME_LENGTH} characters or less`;
    }
    if (!/^[a-z0-9_]+$/.test(trimmedValue)) {
      return "Username can only contain lowercase letters, numbers, and underscores";
    }
    return undefined;
  };

  const validateEmail = (value: string): string | undefined => {
    const trimmedValue = value.trim().toLowerCase();
    if (trimmedValue.length === 0) {
      return "Email is required";
    }
    if (!EMAIL_REGEX.test(trimmedValue)) {
      return "Please enter a valid email address";
    }
    return undefined;
  };

  const validatePassword = (value: string): string | undefined => {
    if (value.length === 0) {
      return "Password is required";
    }
    if (value.length < MIN_PASSWORD_LENGTH) {
      return `Password must be at least ${MIN_PASSWORD_LENGTH} characters`;
    }
    if (value.length > MAX_PASSWORD_LENGTH) {
      return `Password must be ${MAX_PASSWORD_LENGTH} characters or less`;
    }
    return undefined;
  };

  const validateConfirmPassword = (
    value: string,
    originalPassword: string,
  ): string | undefined => {
    if (value.length === 0) {
      return "Please confirm your password";
    }
    if (value !== originalPassword) {
      return "Passwords do not match";
    }
    return undefined;
  };

  const validatePfp = (file: File | null): string | undefined => {
    if (!file) {
      return "Profile picture is required";
    }

    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      return "Please upload a valid image file (JPEG, PNG, GIF, or WebP)";
    }

    if (file.size > MAX_PFP_SIZE) {
      return `Profile picture must be ${MAX_PFP_SIZE / (1024 * 1024)}MB or less`;
    }

    return undefined;
  };

  const handleNameChange = (value: string) => {
    setName(value);
    const error = validateFullName(value);
    setValidationErrors((prev) => ({ ...prev, fullName: error }));
  };

  const handleUsernameChange = (value: string) => {
    const lowercaseValue = value.toLowerCase();
    setUsername(lowercaseValue);
    const error = validateUsername(lowercaseValue);
    setValidationErrors((prev) => ({ ...prev, username: error }));
  };

  const handleEmailChange = (value: string) => {
    setEmail(value);
    const error = validateEmail(value);
    setValidationErrors((prev) => ({ ...prev, email: error }));
  };

  const handlePasswordChange = (value: string) => {
    setPassword(value);
    const error = validatePassword(value);
    setValidationErrors((prev) => ({ ...prev, password: error }));

    if (confirmPassword) {
      const confirmError = validateConfirmPassword(confirmPassword, value);
      setValidationErrors((prev) => ({
        ...prev,
        confirmPassword: confirmError,
      }));
    }
  };

  const handleConfirmPasswordChange = (value: string) => {
    setConfirmPassword(value);
    const error = validateConfirmPassword(value, password);
    setValidationErrors((prev) => ({ ...prev, confirmPassword: error }));
  };

  const handlePfpChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    const pfpError = validatePfp(file);
    setValidationErrors((prev) => ({ ...prev, pfp: pfpError }));

    if (file && !pfpError) {
      setPfp(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPfpPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setPfp(null);
      setPfpPreview("");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const fullNameError = validateFullName(name);
    const usernameError = validateUsername(username);
    const emailError = validateEmail(email);
    const passwordError = validatePassword(password);
    const confirmPasswordError = validateConfirmPassword(
      confirmPassword,
      password,
    );
    const pfpError = validatePfp(pfp);

    const errors: ValidationErrors = {};
    if (fullNameError) errors.fullName = fullNameError;
    if (usernameError) errors.username = usernameError;
    if (emailError) errors.email = emailError;
    if (passwordError) errors.password = passwordError;
    if (confirmPasswordError) errors.confirmPassword = confirmPasswordError;
    if (pfpError) errors.pfp = pfpError;

    setValidationErrors(errors);

    if (Object.keys(errors).length > 0) {
      return;
    }

    setIsLoading(true);

    try {
      await userService.register({
        fullName: name.trim(),
        username: username.toLowerCase().trim(),
        email: email.toLowerCase().trim(),
        password: password,
        pfp: pfp!,
      });

      toast.success("Signed up successfully!");

      const loginResponse = await userService.login({
        email: email.toLowerCase().trim(),
        password: password,
      });

      toast("Logging you in...");

      dispatch(
        loginSuccess({
          user: loginResponse.user,
          accessToken: loginResponse.accessToken,
          refreshToken: loginResponse.refreshToken,
        }),
      );

      setTimeout(() => {
        toast.success("Logged in!");
        navigate("/dashboard");
      }, 1000);
    } catch (error: any) {
      setError(
        error.response?.data?.message || "Signup failed. Please try again.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  const getFileSizeText = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const isFormValid = () => {
    return (
      !Object.values(validationErrors).some((error) => error) &&
      name.trim().length > 0 &&
      username.trim().length > 0 &&
      email.trim().length > 0 &&
      password.length > 0 &&
      confirmPassword.length > 0 &&
      pfp !== null
    );
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-6">
      <div className="bg-white border border-gray-200/50 rounded-3xl p-6 w-full max-w-lg shadow-xl">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="flex items-center justify-center space-x-3 mb-3">
            <div className="w-10 h-10 bg-gradient-to-r from-amber-400 to-orange-500 rounded-xl flex items-center justify-center shadow-lg">
              <span className="text-white font-bold text-lg">A</span>
            </div>
            <span className="font-bold text-2xl bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
              Airly
            </span>
          </div>
          <h1 className="text-2xl font-bold text-gray-800 mb-1">
            Create an Account
          </h1>
          <p className="text-gray-500 text-sm">
            Start your creative journey today
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          {/* Full Name + Username — 2 columns */}
          <div className="grid grid-cols-2 gap-3">
            {/* Full Name */}
            <div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-4 w-4 text-gray-400" />
                </div>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  className={`w-full pl-9 pr-3 py-2.5 bg-gray-50 border rounded-xl text-gray-800 text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-400/50 focus:border-amber-400/50 transition-all duration-200 ${
                    validationErrors.fullName
                      ? "border-red-400 bg-red-50"
                      : "border-gray-200"
                  }`}
                  placeholder="Full name"
                  maxLength={MAX_FULLNAME_LENGTH}
                />
              </div>
              <div className="mt-1 min-h-[16px]">
                {validationErrors.fullName ? (
                  <div className="flex items-center space-x-1 text-red-400">
                    <AlertCircle className="w-3 h-3 flex-shrink-0" />
                    <span className="text-xs leading-tight">
                      {validationErrors.fullName}
                    </span>
                  </div>
                ) : name.trim().length > 0 ? (
                  <div className="flex items-center space-x-1 text-green-400">
                    <CheckCircle className="w-3 h-3" />
                    <span className="text-xs">Looks good</span>
                  </div>
                ) : null}
              </div>
            </div>

            {/* Username */}
            <div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-4 w-4 text-gray-400" />
                </div>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => handleUsernameChange(e.target.value)}
                  className={`w-full pl-9 pr-3 py-2.5 bg-gray-50 border rounded-xl text-gray-800 text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-400/50 focus:border-amber-400/50 transition-all duration-200 ${
                    validationErrors.username
                      ? "border-red-400 bg-red-50"
                      : "border-gray-200"
                  }`}
                  placeholder="Username"
                  maxLength={MAX_USERNAME_LENGTH}
                />
              </div>
              <div className="mt-1 min-h-[16px]">
                {validationErrors.username ? (
                  <div className="flex items-center space-x-1 text-red-400">
                    <AlertCircle className="w-3 h-3 flex-shrink-0" />
                    <span className="text-xs leading-tight">
                      {validationErrors.username}
                    </span>
                  </div>
                ) : username.trim().length > 0 ? (
                  <div className="flex items-center space-x-1 text-green-400">
                    <CheckCircle className="w-3 h-3" />
                    <span className="text-xs">Available</span>
                  </div>
                ) : null}
              </div>
            </div>
          </div>

          {/* Email */}
          <div>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Mail className="h-4 w-4 text-gray-400" />
              </div>
              <input
                type="email"
                value={email}
                onChange={(e) => handleEmailChange(e.target.value)}
                className={`w-full pl-9 pr-4 py-2.5 bg-gray-50 border rounded-xl text-gray-800 text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-400/50 focus:border-amber-400/50 transition-all duration-200 ${
                  validationErrors.email
                    ? "border-red-400 bg-red-50"
                    : "border-gray-200"
                }`}
                placeholder="Email address"
              />
            </div>
            <div className="mt-1 min-h-[16px]">
              {validationErrors.email ? (
                <div className="flex items-center space-x-1 text-red-400">
                  <AlertCircle className="w-3 h-3 flex-shrink-0" />
                  <span className="text-xs">{validationErrors.email}</span>
                </div>
              ) : email.trim().length > 0 && EMAIL_REGEX.test(email) ? (
                <div className="flex items-center space-x-1 text-green-400">
                  <CheckCircle className="w-3 h-3" />
                  <span className="text-xs">Valid email</span>
                </div>
              ) : null}
            </div>
          </div>

          {/* Password + Confirm Password — 2 columns */}
          <div className="grid grid-cols-2 gap-3">
            {/* Password */}
            <div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-4 w-4 text-gray-400" />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => handlePasswordChange(e.target.value)}
                  className={`w-full pl-9 pr-9 py-2.5 bg-gray-50 border rounded-xl text-gray-800 text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-400/50 focus:border-amber-400/50 transition-all duration-200 ${
                    validationErrors.password
                      ? "border-red-400 bg-red-50"
                      : "border-gray-200"
                  }`}
                  placeholder="Password"
                  maxLength={MAX_PASSWORD_LENGTH}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4 text-gray-400 hover:text-gray-600 transition-colors" />
                  ) : (
                    <Eye className="h-4 w-4 text-gray-400 hover:text-gray-600 transition-colors" />
                  )}
                </button>
              </div>
              <div className="mt-1 min-h-[16px]">
                {validationErrors.password ? (
                  <div className="flex items-center space-x-1 text-red-400">
                    <AlertCircle className="w-3 h-3 flex-shrink-0" />
                    <span className="text-xs leading-tight">
                      {validationErrors.password}
                    </span>
                  </div>
                ) : password.length >= MIN_PASSWORD_LENGTH ? (
                  <div className="flex items-center space-x-1 text-green-400">
                    <CheckCircle className="w-3 h-3" />
                    <span className="text-xs">Strong</span>
                  </div>
                ) : null}
              </div>
            </div>

            {/* Confirm Password */}
            <div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-4 w-4 text-gray-400" />
                </div>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => handleConfirmPasswordChange(e.target.value)}
                  className={`w-full pl-9 pr-3 py-2.5 bg-gray-50 border rounded-xl text-gray-800 text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-400/50 focus:border-amber-400/50 transition-all duration-200 ${
                    validationErrors.confirmPassword
                      ? "border-red-400 bg-red-50"
                      : "border-gray-200"
                  }`}
                  placeholder="Confirm password"
                />
              </div>
              <div className="mt-1 min-h-[16px]">
                {validationErrors.confirmPassword ? (
                  <div className="flex items-center space-x-1 text-red-400">
                    <AlertCircle className="w-3 h-3 flex-shrink-0" />
                    <span className="text-xs leading-tight">
                      {validationErrors.confirmPassword}
                    </span>
                  </div>
                ) : confirmPassword.length > 0 &&
                  confirmPassword === password ? (
                  <div className="flex items-center space-x-1 text-green-400">
                    <CheckCircle className="w-3 h-3" />
                    <span className="text-xs">Passwords match</span>
                  </div>
                ) : null}
              </div>
            </div>
          </div>

          {/* Profile Picture */}
          <div>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handlePfpChange}
              accept={ALLOWED_IMAGE_TYPES.join(",")}
              className="hidden"
            />
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 border rounded-xl text-sm transition-all duration-200 ${
                  validationErrors.pfp
                    ? "bg-red-50 border-red-400 text-red-500"
                    : "bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100"
                }`}
              >
                <Upload className="h-4 w-4" />
                {pfpPreview ? "Change Photo" : "Upload Profile Photo"}
              </button>
              {pfpPreview && (
                <img
                  src={pfpPreview}
                  alt="Profile preview"
                  className="w-10 h-10 rounded-full object-cover border-2 border-amber-400/50 flex-shrink-0"
                />
              )}
            </div>
            <div className="mt-1 min-h-[16px]">
              {validationErrors.pfp ? (
                <div className="flex items-center space-x-1 text-red-400">
                  <AlertCircle className="w-3 h-3 flex-shrink-0" />
                  <span className="text-xs">{validationErrors.pfp}</span>
                </div>
              ) : pfp ? (
                <div className="flex items-center space-x-1 text-green-400">
                  <CheckCircle className="w-3 h-3" />
                  <span className="text-xs">
                    {pfp.name} ({getFileSizeText(pfp.size)})
                  </span>
                </div>
              ) : (
                <span className="text-xs text-gray-400">
                  JPEG, PNG, GIF, WebP · max {MAX_PFP_SIZE / (1024 * 1024)}MB
                </span>
              )}
            </div>
          </div>

          {/* Error Display */}
          {error && (
            <div className="flex items-center space-x-2 text-red-500 bg-red-50 p-3 rounded-xl border border-red-200">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span className="text-sm">{error}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading || !isFormValid()}
            className="w-full bg-gradient-to-r from-amber-400 to-orange-500 text-white py-2.5 px-4 rounded-xl font-semibold hover:from-amber-500 hover:to-orange-600 focus:outline-none focus:ring-2 focus:ring-amber-400/50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-[1.02] shadow-lg disabled:transform-none"
          >
            {isLoading ? "Creating account..." : "Create Account"}
          </button>
        </form>

        <div className="mt-4 text-center">
          <p className="text-gray-500 text-sm">
            Already have an account?{" "}
            <button
              onClick={() => navigate("/login")}
              className="text-amber-500 font-semibold hover:text-amber-600 focus:outline-none transition-colors"
            >
              Sign in
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};
