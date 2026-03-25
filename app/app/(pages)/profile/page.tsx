"use client";

import { useState, useEffect, useMemo } from "react";
import Image from "next/image";
import { toast } from "sonner";
import { User, Lock, Trash2, Camera, Key, ShieldAlert, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

// API
import { getProfile, updateProfile, deleteProfile, type Profile } from "@/lib/api/profile";
import { changePassword } from "@/lib/api/auth";
import { uploadAvatarFile, uploadAvatarSvg } from "@/lib/api/upload";
import { svgToDataUrl, randomSeed } from "@/components/utils/avatar";
import multiavatar from "@multiavatar/multiavatar";

// Components
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import SpotlightCard from "@/components/ui/SpotlightCard";

type TabKey = "general" | "security" | "danger";

interface TabItem {
  key: TabKey;
  label: string;
  icon: React.ElementType;
  description: string;
}

const TABS: TabItem[] = [
  { key: "general", label: "General", icon: User, description: "Manage your personal information" },
  { key: "security", label: "Security", icon: Lock, description: "Update your password and security settings" },
  { key: "danger", label: "Danger Zone", icon: ShieldAlert, description: "Irreversible account actions" },
];

export default function ProfilePage() {
  const [activeTab, setActiveTab] = useState<TabKey>("general");
  const [loading, setLoading] = useState(true);
  const [me, setMe] = useState<Profile | null>(null);

  // --- Data Fetching ---
  const fetchMe = async () => {
    try {
      const data = await getProfile();
      setMe(data);
    } catch (error) {
      console.error("Failed to fetch profile", error);
      toast.error("Failed to load profile data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMe();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
      </div>
    );
  }

  return (
    <div className="container max-w-5xl mx-auto py-10 px-4 md:px-6 lg:px-8">
      <div className="flex flex-col md:flex-row gap-8">
        {/* --- Sidebar Navigation --- */}
        <aside className="w-full md:w-64 shrink-0 space-y-2">
          <div className="mb-6 px-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">Settings</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">Manage your account settings and preferences.</p>
          </div>

          <nav className="flex flex-col space-y-1">
            {TABS.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.key;
              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
                    isActive
                      ? "bg-indigo-50 text-indigo-700 dark:bg-indigo-900/20 dark:text-indigo-300"
                      : "text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"
                  )}
                >
                  <Icon className={cn("w-4 h-4", isActive ? "text-indigo-600 dark:text-indigo-400" : "text-slate-400")} />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </aside>

        {/* --- Main Content Area --- */}
        <main className="flex-1 min-w-0">
          <div className="space-y-6">
            {/* Header for Mobile only (optional, can be hidden on desktop if redundant) */}
            <div className="md:hidden">
              <h2 className="text-lg font-semibold">{TABS.find(t => t.key === activeTab)?.label}</h2>
              <p className="text-sm text-slate-500">{TABS.find(t => t.key === activeTab)?.description}</p>
            </div>

            {activeTab === "general" && me && (
              <GeneralTab me={me} refreshProfile={fetchMe} />
            )}

            {activeTab === "security" && (
              <SecurityTab />
            )}

            {activeTab === "danger" && (
              <DangerTab onDelete={() => { }} />
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

// ----------------------------------------------------------------------

interface GeneralTabProps {
  me: Profile;
  refreshProfile: () => Promise<void>;
}

function GeneralTab({ me, refreshProfile }: GeneralTabProps) {
  const [name, setName] = useState(me.name || "");
  const [email, setEmail] = useState(me.email || "");
  const [isSaving, setIsSaving] = useState(false);
  const [avatarOpen, setAvatarOpen] = useState(false);

  // Avatar state
  const [seed, setSeed] = useState("");
  const [svg, setSvg] = useState("");
  const [previewAvatar, setPreviewAvatar] = useState("");
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [avatarMode, setAvatarMode] = useState<"generator" | "upload">("generator");

  const isDirty = name !== (me.name || "") || email !== (me.email || "");

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await updateProfile({ name, email });
      await refreshProfile();
      toast.success("Profile updated successfully");
    } catch (e) {
      console.error(e);
      toast.error("Failed to update profile");
    } finally {
      setIsSaving(false);
    }
  };

  // Avatar Logic
  const handleAvatarSave = async () => {
    try {
      let url: string | null = null;
      if (avatarMode === "generator" && svg) {
        url = await uploadAvatarSvg(svg);
      } else if (avatarMode === "upload" && uploadFile) {
        url = await uploadAvatarFile(uploadFile);
      }

      if (url) {
        await updateProfile({ picture_path: url });
        await refreshProfile();
        setAvatarOpen(false);
        toast.success("Avatar updated");
      }
    } catch (e) {
      toast.error("Failed to update avatar");
    }
  };

  const generateRandomAvatar = () => {
    const newSeed = randomSeed();
    setSeed(newSeed);
    const newSvg = multiavatar(newSeed);
    setSvg(newSvg);
    setPreviewAvatar(svgToDataUrl(newSvg));
    setAvatarMode("generator");
    setUploadFile(null);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadFile(file);
      setPreviewAvatar(URL.createObjectURL(file));
      setAvatarMode("upload");
    }
  };

  // Init avatar generator if no picture
  useEffect(() => {
    if (!me.picture_path && !previewAvatar) {
      generateRandomAvatar();
    }
  }, [me.picture_path]);

  return (
    <>
      <SpotlightCard className="p-0 border-0 shadow-sm bg-white dark:bg-slate-900/50">
        <div className="p-6 md:p-8">
          <div className="flex flex-col items-center sm:flex-row sm:items-start gap-6 mb-8">
            <div className="relative group">
              <Avatar className="w-24 h-24 sm:w-28 sm:h-28 border-4 border-white dark:border-slate-800 shadow-lg">
                <AvatarImage
                  src={me.picture_path || previewAvatar}
                  className="object-cover"
                  referrerPolicy="no-referrer"
                />
                <AvatarFallback className="text-2xl bg-indigo-100 text-indigo-600">
                  {me.name?.charAt(0).toUpperCase() || "U"}
                </AvatarFallback>
              </Avatar>
              <button
                onClick={() => { setAvatarOpen(true); if (!me.picture_path) generateRandomAvatar(); }}
                className="absolute bottom-0 right-0 p-2 rounded-full bg-indigo-600 text-white shadow-md hover:bg-indigo-700 transition-colors"
                title="Change Avatar"
              >
                <Camera className="w-4 h-4" />
              </button>
            </div>

            <div className="text-center sm:text-left space-y-1 mt-2">
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">{me.name || "User"}</h3>
              <p className="text-sm text-slate-500 break-all">{me.email || "No email provided"}</p>

            </div>
          </div>

          <div className="space-y-4 max-w-xl">
            <div className="grid gap-2">
              <Label htmlFor="name">Display Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter your name"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
              />
            </div>
          </div>

          <div className="mt-8 flex justify-end">
            <Button onClick={handleSave} disabled={!isDirty || isSaving} isLoading={isSaving} loadingText="Saving...">
              Save Changes
            </Button>
          </div>
        </div>
      </SpotlightCard>

      {/* Avatar Modal */}
      {avatarOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <Card className="w-full max-w-md shadow-2xl">
            <CardHeader>
              <CardTitle>Change Profile Photo</CardTitle>
              <CardDescription>Choose a generated avatar or upload your own.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex justify-center">
                <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-slate-100 dark:border-slate-800 shadow-inner">
                  <img src={previewAvatar || me.picture_path || ""} alt="Preview" className="w-full h-full object-cover" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Button
                  variant={avatarMode === "generator" ? "default" : "outline"}
                  onClick={generateRandomAvatar}
                  className="w-full"
                >
                  Random Custom
                </Button>
                <div className="relative">
                  <Button variant={avatarMode === "upload" ? "default" : "outline"} className="w-full">
                    Upload Image
                  </Button>
                  <input
                    type="file"
                    className="absolute inset-0 opacity-0 cursor-pointer"
                    onChange={handleFileUpload}
                    accept="image/*"
                  />
                </div>
              </div>

              {avatarMode === "generator" && (
                <div className="flex gap-2">
                  <Input
                    value={seed}
                    onChange={(e) => {
                      setSeed(e.target.value);
                      const s = multiavatar(e.target.value);
                      setSvg(s);
                      setPreviewAvatar(svgToDataUrl(s));
                    }}
                    placeholder="Enter seed..."
                  />
                  <Button size="icon" variant="ghost" onClick={generateRandomAvatar}>
                    <Loader2 className="w-4 h-4" />
                  </Button>
                </div>
              )}
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="ghost" onClick={() => setAvatarOpen(false)}>Cancel</Button>
              <Button onClick={handleAvatarSave}>Save Avatar</Button>
            </CardFooter>
          </Card>
        </div>
      )}
    </>
  );
}

// ----------------------------------------------------------------------

function SecurityTab() {
  const [newPwd, setNewPwd] = useState("");
  const [confPwd, setConfPwd] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChangePassword = async () => {
    if (!newPwd || newPwd !== confPwd) {
      toast.error("Passwords do not match");
      return;
    }

    setLoading(true);
    try {
      await changePassword(newPwd);
      toast.success("Password updated successfully");
      setNewPwd("");
      setConfPwd("");
    } catch (e) {
      console.error(e);
      toast.error("Failed to update password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Security Settings</CardTitle>
        <CardDescription>Update your password to keep your account secure.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 max-w-xl">
        <div className="grid gap-2">
          <Label htmlFor="new-password">New Password</Label>
          <div className="relative">
            <Key className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
            <Input
              id="new-password"
              type="password"
              className="pl-9"
              value={newPwd}
              onChange={(e) => setNewPwd(e.target.value)}
            />
          </div>
        </div>
        <div className="grid gap-2">
          <Label htmlFor="confirm-password">Confirm Password</Label>
          <div className="relative">
            <Key className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
            <Input
              id="confirm-password"
              type="password"
              className="pl-9"
              value={confPwd}
              onChange={(e) => setConfPwd(e.target.value)}
            />
          </div>
        </div>
      </CardContent>
      <CardFooter className="border-t bg-slate-50 dark:bg-slate-900/50 py-4">
        <Button onClick={handleChangePassword} disabled={!newPwd || loading} isLoading={loading} loadingText="Updating...">
          Update Password
        </Button>
      </CardFooter>
    </Card>
  );
}

// ----------------------------------------------------------------------

function DangerTab({ onDelete }: { onDelete: () => void }) {
  const handleDelete = () => {
    toast("Are you sure?", {
      description: "This action cannot be undone.",
      action: {
        label: "Delete Account",
        onClick: () => {
          (async () => {
            try {
              await deleteProfile();
              toast.success("Account deleted");
              // Redirect handled by caller or auth provider usually
            } catch (e) {
              toast.error("Failed to delete account");
            }
          })();
        }
      },
      cancel: { label: "Cancel", onClick: () => { } },
    });
  };

  return (
    <Card className="border-red-200 dark:border-red-900/50">
      <CardHeader>
        <CardTitle className="text-red-600 dark:text-red-400">Danger Zone</CardTitle>
        <CardDescription>
          Irreversible actions for your account.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="rounded-lg border border-red-100 bg-red-50 p-4 dark:border-red-900/20 dark:bg-red-900/10">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium text-red-900 dark:text-red-200">Delete Account</h4>
              <p className="text-sm text-red-700 dark:text-red-300 mt-1">
                Permanently remove your Personal data and all of your content.
              </p>
            </div>
            <Button variant="destructive" onClick={handleDelete}>
              <Trash2 className="w-4 h-4 mr-2" />
              Delete Account
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
