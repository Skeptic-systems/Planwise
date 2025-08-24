import React, { useEffect, useState } from "react";
import { Input } from "@/components/ui/elements/input";
import { Button } from "@/components/ui/elements/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/overlays/dialog";
import { Switch } from "@/components/ui/elements/switch";
import { Loader2, User, Palette, Bell, Lock, ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { createAuthClient } from "better-auth/client";

const authClient = createAuthClient();

interface UserSettings {
  email: string;
  display_name: string;
  theme: "light" | "dark" | "system";
  language: "en" | "de" | "fr";
  accent_color: string;
  email_notifications: boolean;
  push_notifications: boolean;
  two_factor_enabled: boolean;
}

const ACCENT_COLORS = [
  { id: "blue",   gradient: "from-blue-500 to-blue-600",   text: "text-blue-500",   hover: "hover:text-blue-400" },
  { id: "purple", gradient: "from-purple-500 to-purple-600", text: "text-purple-500", hover: "hover:text-purple-400" },
  { id: "orange", gradient: "from-orange-500 to-orange-600", text: "text-orange-500", hover: "hover:text-orange-400" },
  { id: "green",  gradient: "from-emerald-500 to-emerald-600", text: "text-emerald-500", hover: "hover:text-emerald-400" },
];

const getAccentClasses = (accentColor: string) => {
  const color = ACCENT_COLORS.find((c) => c.id === accentColor) || ACCENT_COLORS[0];
  return { text: color.text, gradient: color.gradient, hover: color.hover };
};

async function apiGetProfile() {
  const res = await fetch("/api/profile", { method: "GET" });
  if (!res.ok) throw new Error(`GET /api/profile ${res.status}`);
  return (await res.json()) as Partial<UserSettings> & { id: string };
}

async function apiUpdateProfile(patch: Partial<UserSettings>) {
  const res = await fetch("/api/profile", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(patch),
  });
  if (!res.ok) {
    let msg = "Update failed";
    try { msg = (await res.json()).error ?? msg; } catch {}
    throw new Error(msg);
  }
}

export default function SettingsPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [settings, setSettings] = useState<UserSettings>({
    email: "",
    display_name: "",
    theme: "system",
    language: "en",
    accent_color: ACCENT_COLORS[0].id,
    email_notifications: true,
    push_notifications: true,
    two_factor_enabled: false,
  });
  const { toast } = useToast();

  useEffect(() => { fetchUserSettings(); }, []);

  async function fetchUserSettings() {
    try {
      setIsLoading(true);
      const session = await authClient.getSession();
      const email = session?.user?.email ?? "";

      const profile = await apiGetProfile();

      setSettings({
        email,
        display_name: profile.display_name ?? "",
        theme: (profile.theme as UserSettings["theme"]) ?? "system",
        language: (profile.language as UserSettings["language"]) ?? "en",
        accent_color: profile.accent_color ?? ACCENT_COLORS[0].id,
        email_notifications: !!profile.email_notifications,
        push_notifications: !!profile.push_notifications,
        two_factor_enabled: !!profile.two_factor_enabled,
      });
    } catch (error: any) {
      console.error("Error fetching settings:", error);
      toast({ variant: "destructive", title: "Error", description: "Failed to load settings" });
    } finally {
      setIsLoading(false);
    }
  }

  async function saveSettings(section: keyof UserSettings) {
    try {
      setIsSaving(true);
      const patch: Partial<UserSettings> = {};
      if (section === "display_name") patch.display_name = settings.display_name;
      if (section === "theme") patch.theme = settings.theme;
      if (section === "language") patch.language = settings.language;
      if (section === "email_notifications") patch.email_notifications = settings.email_notifications;
      if (section === "push_notifications") patch.push_notifications = settings.push_notifications;
      if (section === "two_factor_enabled") patch.two_factor_enabled = settings.two_factor_enabled;

      await apiUpdateProfile(patch);
      toast({ title: "Success", description: "Settings saved successfully" });
    } catch (error: any) {
      toast({ variant: "destructive", title: "Error", description: error.message || "Failed to save settings" });
    } finally {
      setIsSaving(false);
    }
  }

  const handleBackToDashboard = () => { window.location.href = "/dashboard"; };

  const handleSaveAccentColor = async () => {
    try {
      setIsSaving(true);
      await apiUpdateProfile({ accent_color: settings.accent_color });
      toast({ title: "Success", description: "Accent color saved successfully" });
    } catch (error: any) {
      toast({ variant: "destructive", title: "Error", description: error.message || "Failed to save accent color" });
    } finally {
      setIsSaving(false);
    }
  };

  const accentClasses = getAccentClasses(settings.accent_color);

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-3xl p-6">
      <div className="flex items-center justify-between mb-8">
        <h1 className={`text-3xl font-bold ${accentClasses.text}`}>Settings</h1>
        <Button
          onClick={handleBackToDashboard}
          variant="ghost"
          className={`flex items-center gap-2 ${accentClasses.text} ${accentClasses.hover} transition-colors`}
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </Button>
      </div>

      <div className="space-y-6">
        {/* Profile Information */}
        <section className="bg-secondary/20 rounded-lg p-6">
          <div className="flex items-center gap-3 mb-6">
            <User className={accentClasses.text} />
            <h2 className="text-xl font-semibold">Profile Information</h2>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Email</label>
              <Input value={settings.email} disabled className="max-w-md bg-secondary/30" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Display Name</label>
              <div className="flex gap-3 items-start">
                <Input
                  value={settings.display_name}
                  onChange={(e) => setSettings({ ...settings, display_name: e.target.value })}
                  placeholder="Enter your display name"
                  className="max-w-md"
                />
                <Button onClick={() => saveSettings("display_name")} size="sm" disabled={isSaving}>
                  {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save"}
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Appearance */}
        <section className="bg-secondary/20 rounded-lg p-6">
          <div className="flex items-center gap-3 mb-6">
            <Palette className={accentClasses.text} />
            <h2 className="text-xl font-semibold">Appearance</h2>
          </div>
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium mb-2">Accent Color</label>
              <div className="space-y-4">
                <div className="flex gap-3 items-center">
                  {ACCENT_COLORS.map((color) => (
                    <button
                      key={color.id}
                      onClick={() => setSettings({ ...settings, accent_color: color.id })}
                      className={`w-24 h-12 rounded-lg bg-gradient-to-r ${color.gradient} transition-all ${
                        settings.accent_color === color.id ? "ring-2 ring-white ring-offset-2 ring-offset-background" : ""
                      }`}
                    />
                  ))}
                </div>
                <Button
                  onClick={handleSaveAccentColor}
                  size="sm"
                  className={`w-[100px] bg-gradient-to-r ${accentClasses.gradient}`}
                  disabled={isSaving}
                >
                  {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save Color"}
                </Button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Theme</label>
              <div className="flex gap-3 items-start">
                <select
                  value={settings.theme}
                  onChange={(e) => setSettings({ ...settings, theme: e.target.value as UserSettings["theme"] })}
                  className="w-full max-w-md p-2 rounded-lg bg-background border border-input"
                >
                  <option value="system">System</option>
                  <option value="light">Light</option>
                  <option value="dark">Dark</option>
                </select>
                <Button onClick={() => saveSettings("theme")} size="sm" disabled={isSaving}>
                  {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save"}
                </Button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Language</label>
              <div className="flex gap-3 items-start">
                <select
                  value={settings.language}
                  onChange={(e) => setSettings({ ...settings, language: e.target.value as UserSettings["language"] })}
                  className="w-full max-w-md p-2 rounded-lg bg-background border border-input"
                >
                  <option value="en">English</option>
                  <option value="de">Deutsch</option>
                  <option value="fr">Français</option>
                </select>
                <Button onClick={() => saveSettings("language")} size="sm" disabled={isSaving}>
                  {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save"}
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Notifications */}
        <section className="bg-secondary/20 rounded-lg p-6">
          <div className="flex items中心 gap-3 mb-6">
            <Bell className={accentClasses.text} />
            <h2 className="text-xl font-semibold">Notifications</h2>
          </div>
          <div className="space-y-6">
            <div className="flex items-center justify-between max-w-md">
              <div>
                <h3 className="font-medium">Email Notifications</h3>
                <p className="text-sm text-gray-400">Receive updates and reminders via email</p>
              </div>
              <Switch
                checked={settings.email_notifications}
                onCheckedChange={(checked) => {
                  setSettings({ ...settings, email_notifications: checked });
                  void apiUpdateProfile({ email_notifications: checked }).catch((e) =>
                    toast({ variant: "destructive", title: "Error", description: e.message || "Failed to save" })
                  );
                }}
              />
            </div>

            <div className="flex items-center justify-between max-w-md">
              <div>
                <h3 className="font-medium">Push Notifications</h3>
                <p className="text-sm text-gray-400">Receive real-time updates in your browser</p>
              </div>
              <Switch
                checked={settings.push_notifications}
                onCheckedChange={(checked) => {
                  setSettings({ ...settings, push_notifications: checked });
                  void apiUpdateProfile({ push_notifications: checked }).catch((e) =>
                    toast({ variant: "destructive", title: "Error", description: e.message || "Failed to save" })
                  );
                }}
              />
            </div>
          </div>
        </section>

        {/* Security */}
        <section className="bg-secondary/20 rounded-lg p-6">
          <div className="flex items-center gap-3 mb-6">
            <Lock className={accentClasses.text} />
            <h2 className="text-xl font-semibold">Security</h2>
          </div>
          <div className="space-y-6">
            <div className="flex items-center justify-between max-w-md">
              <div>
                <h3 className="font-medium">Two-Factor Authentication</h3>
                <p className="text-sm text-gray-400">Add an extra layer of security to your account</p>
              </div>
              <Switch
                checked={settings.two_factor_enabled}
                onCheckedChange={(checked) => {
                  setSettings({ ...settings, two_factor_enabled: checked });
                  void apiUpdateProfile({ two_factor_enabled: checked }).catch((e) =>
                    toast({ variant: "destructive", title: "Error", description: e.message || "Failed to save" })
                  );
                }}
              />
            </div>

            <div>
              <Button variant="outline" onClick={() => {/* TODO: password reset route here */}}>
                Reset Password
              </Button>
            </div>

            <div className="pt-4 border-t border-gray-800">
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="destructive">Delete Account</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Delete Account?</DialogTitle>
                  </DialogHeader>
                  <p className="text-gray-400">
                    This action cannot be undone. This will permanently delete your account and remove your data from our servers.
                  </p>
                  <div className="flex justify-end gap-3 mt-4">
                    <Button variant="ghost">Cancel</Button>
                    <Button variant="destructive">Delete Account</Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </section>

        {/* Bottom Back Button */}
        <div className="flex justify-center pt-4">
          <Button
            onClick={handleBackToDashboard}
            variant="ghost"
            className={`flex items-center gap-2 ${accentClasses.text} ${accentClasses.hover} transition-colors`}
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Button>
        </div>
      </div>
    </div>
  );
}
