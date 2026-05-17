import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";

const API_URL = import.meta.env.VITE_API_URL;

const Signup = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  /**
   * Client-side validation before sending request.
   * @returns {string|null} Error message or null if valid
   */
  const validate = () => {
    if (!name.trim()) return "Name is required";
    if (name.trim().length < 2) return "Name must be at least 2 characters";
    if (!email.trim()) return "Email is required";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return "Please enter a valid email";
    if (!password) return "Password is required";
    if (password.length < 8) return "Password must be at least 8 characters";
    return null;
  };

  /**
   * Calculate password strength (0-3).
   */
  const getPasswordStrength = () => {
    if (!password) return { level: 0, label: "", color: "" };
    let score = 0;
    if (password.length >= 8) score++;
    if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score++;
    if (/[0-9]/.test(password) && /[^A-Za-z0-9]/.test(password)) score++;

    const levels = [
      { level: 1, label: "Weak", color: "bg-red-400" },
      { level: 2, label: "Medium", color: "bg-yellow-400" },
      { level: 3, label: "Strong", color: "bg-green-400" },
    ];
    return levels[score - 1] || { level: 0, label: "", color: "" };
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    setError("");

    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/api/auth/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim().toLowerCase(),
          password,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem("token", data.token);
        localStorage.setItem("user", JSON.stringify(data));
        navigate("/");
      } else if (response.status === 429) {
        setError(data.error || "Too many signup attempts. Please try again later.");
      } else {
        setError(data.error || "Failed to sign up");
      }
    } catch (err) {
      setError("Unable to connect to server. Please check your connection.");
    } finally {
      setLoading(false);
    }
  };

  const strength = getPasswordStrength();

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md glass-card rounded-3xl p-8 animate-fade-in">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-neon-blue/10 border border-neon-blue/20 mb-4">
            <i className="fa-solid fa-user-plus text-neon-blue"></i>
          </div>
          <h2 className="text-3xl font-bold text-white mb-2">Create Account</h2>
          <p className="text-slate-500 text-sm font-medium uppercase tracking-widest">Join the Dialogix AI community</p>
        </div>

        {error && (
          <div className="bg-red-400/10 border border-red-400/20 text-red-400 text-xs py-3 px-4 rounded-xl mb-6 text-center animate-shake">
            {error}
          </div>
        )}

        <form onSubmit={handleSignup} className="space-y-6" noValidate>
          <div className="space-y-2">
            <label htmlFor="signup-name" className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Full Name</label>
            <input
              id="signup-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="John Doe"
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3.5 text-white placeholder:text-slate-600 focus:outline-none focus:border-neon-blue/50 focus:bg-white/[0.08] transition-all"
              required
              autoComplete="name"
              maxLength={50}
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="signup-email" className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Email Address</label>
            <input
              id="signup-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@example.com"
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3.5 text-white placeholder:text-slate-600 focus:outline-none focus:border-neon-blue/50 focus:bg-white/[0.08] transition-all"
              required
              autoComplete="email"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="signup-password" className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Password</label>
            <div className="relative">
              <input
                id="signup-password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Create a password (min. 8 chars)"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3.5 text-white placeholder:text-slate-600 focus:outline-none focus:border-neon-blue/50 focus:bg-white/[0.08] transition-all"
                required
                autoComplete="new-password"
                minLength={8}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                <i className={`fa-solid ${showPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
              </button>
            </div>
            {/* Password strength indicator */}
            {password && (
              <div className="flex items-center gap-2 mt-2">
                <div className="flex-1 flex gap-1">
                  {[1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className={`h-1 flex-1 rounded-full transition-all duration-300 ${
                        i <= strength.level ? strength.color : "bg-white/10"
                      }`}
                    />
                  ))}
                </div>
                <span className={`text-[10px] uppercase tracking-widest font-bold ${
                  strength.level === 1 ? "text-red-400" : strength.level === 2 ? "text-yellow-400" : "text-green-400"
                }`}>
                  {strength.label}
                </span>
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-neon-blue hover:bg-cyan-400 text-slate-950 font-bold py-4 rounded-xl transition-all active:scale-[0.98] shadow-[0_0_20px_rgba(0,209,255,0.3)] disabled:opacity-50 disabled:cursor-not-allowed mt-4"
          >
            {loading ? "Creating account..." : "Sign Up"}
          </button>
        </form>

        <div className="mt-8 text-center text-slate-500 text-sm">
          Already have an account? <Link to="/login" className="text-neon-blue hover:underline font-bold ml-1">Login</Link>
        </div>
      </div>
    </div>
  );
};

export default Signup;
