"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase-browser";
import { LogOut, User as UserIcon, ChevronDown } from "lucide-react";
import { useRouter } from "next/navigation";

interface UserData {
  email: string;
  name: string;
  avatar: string | null;
}

export default function UserMenu() {
  const [user, setUser] = useState<UserData | null>(null);
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        setUser({
          email: user.email || "",
          name:
            user.user_metadata?.full_name ||
            user.user_metadata?.name ||
            user.email?.split("@")[0] ||
            "User",
          avatar: user.user_metadata?.avatar_url || null,
        });
      }
    });
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    toast("Signed out successfully");
    router.push("/");
    router.refresh();
  };

  if (!user) return null;

  return (
    <div className="relative" ref={menuRef}>
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.97 }}
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-xl hover:bg-gray-100 transition-colors"
      >
        {user.avatar ? (
          <img
            src={user.avatar}
            alt={user.name}
            className="w-7 h-7 rounded-full"
            referrerPolicy="no-referrer"
          />
        ) : (
          <div className="w-7 h-7 rounded-full bg-indigo-100 flex items-center justify-center">
            <UserIcon className="w-4 h-4 text-indigo-600" />
          </div>
        )}
        <span className="text-sm text-gray-700 font-medium hidden sm:inline max-w-[120px] truncate">
          {user.name}
        </span>
        <ChevronDown
          className={`w-3.5 h-3.5 text-gray-400 transition-transform ${
            open ? "rotate-180" : ""
          }`}
        />
      </motion.button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -4 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 mt-2 w-56 bg-white rounded-xl border border-gray-200 shadow-lg overflow-hidden z-50"
          >
            <div className="px-4 py-3 border-b border-gray-100">
              <p className="text-sm font-medium text-gray-900 truncate">
                {user.name}
              </p>
              <p className="text-xs text-gray-500 truncate">{user.email}</p>
            </div>
            <button
              onClick={handleSignOut}
              className="w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-700
                hover:bg-gray-50 transition-colors text-left"
            >
              <LogOut className="w-4 h-4 text-gray-400" />
              Sign out
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
