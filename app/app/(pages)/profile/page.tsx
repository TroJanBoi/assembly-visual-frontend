"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { getProfile, updateProfile, deleteProfile, type Profile } from "@/lib/api/profile";
import { changePassword } from "@/lib/api/auth";
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";

import multiavatar from "@multiavatar/multiavatar";
import { svgToDataUrl, randomSeed } from "@/components/utils/avatar";
import { uploadAvatarFile, uploadAvatarSvg } from "@/lib/api/upload";

const MySwal = withReactContent(Swal);

type TabKey = "profile" | "password" | "danger";

export default function ProfilePage() {
  const [tab, setTab] = useState<TabKey>("profile");
  const [me, setMe] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  // form state (profile)
  const [editing, setEditing] = useState(false);
  const [name, setName]   = useState("");
  const [email, setEmail] = useState("");
  const [tel, setTel]     = useState("");

  // form state (password)
  // const [curPwd, setCurPwd]   = useState("");
  const [newPwd, setNewPwd]   = useState("");
  const [confPwd, setConfPwd] = useState("");

  // const [showCurPwd, setShowCurPwd] = useState(false);
  const [showNewPwd, setShowNewPwd] = useState(false);
  const [showConfPwd, setShowConfPwd] = useState(false);

  const [avatarOpen, setAvatarOpen] = useState(false);
  const [avatarTab, setAvatarTab] = useState<"generator" | "upload">("generator");
  const [seed, setSeed] = useState<string>("");
  const [svg, setSvg] = useState<string>("");
  const [previewUrl, setPreviewUrl] = useState<string>("");
  const [uploadFile, setUploadFile] = useState<File | null>(null);


  useEffect(() => {
    (async () => {
      try {
        const data = await getProfile();     // ✅ /api/v2/profile/
        setMe(data);
        setName(data.name ?? "");
        setEmail(data.email ?? "");
        setTel(data.tel ?? "");

        if (!me?.picture_path) {
          const s = randomSeed();
          const svgCode = multiavatar(s);
          setSeed(s);
          setSvg(svgCode);
          setPreviewUrl(svgToDataUrl(svgCode));
        } else {
          setPreviewUrl(me.picture_path!);
        }
      } finally {
        setLoading(false);
      }
    })();
  }, [me?.picture_path]);

  const displayName = useMemo(() => (name || me?.name || "User"), [name, me?.name]);

  const initials = useMemo(() => {
    const parts = (displayName || "User").trim().split(" ");
    const a = parts[0]?.[0]?.toUpperCase() || "U";
    const b = parts[1]?.[0]?.toUpperCase() || "";
    return (a + b).slice(0, 2);
  }, [displayName]);

  async function toastOK(message: string) {
    await MySwal.fire({
      icon: "success",
      title: message,
      showConfirmButton: false,
      timer: 1000,
      timerProgressBar: true,
    });
  }

  async function onSaveProfile() {
    try {
      const updated = await updateProfile({ name, email, tel });
      setMe(updated);
      setEditing(false);
      toastOK("Saved successfully");
    } catch (e) {
      console.error(e);
      MySwal.fire({ icon: "error", title: "Save failed" });
    }
  }

  async function onChangePassword() {
    if (!newPwd || newPwd !== confPwd) {
      MySwal.fire({ icon: "warning", title: "New passwords do not match" });
      return;
    }
    
    try {
      // await changePassword({ currentPassword: curPwd, newPassword: newPwd });
      await changePassword(newPwd );
      setNewPwd(""); setConfPwd("");
      toastOK("Password updated");
    } catch (e) {
      console.error(e);
      MySwal.fire({ icon: "error", title: "Change password failed" });
    }
  }

  async function onDeleteAccount() {
    const ok = await MySwal.fire({
      icon: "warning",
      title: "Delete account permanently?",
      text: "This action is irreversible.",
      showCancelButton: true,
      confirmButtonText: "Delete",
      confirmButtonColor: "#dc2626",
    });
    if (!ok.isConfirmed) return;

    try {
      await deleteProfile(); // ✅ /api/v2/profile/
      await toastOK("Account deleted");
      // TODO: signout + router.push("/signin")
    } catch (e) {
      console.error(e);
      MySwal.fire({ icon: "error", title: "Delete failed" });
    }
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse h-6 w-40 bg-gray-200 rounded mb-4" />
        <div className="animate-pulse h-[400px] bg-gray-100 rounded-xl" />
      </div>
    );
  }

  function onSeedChange(newSeed: string) {
    setSeed(newSeed);
    const svgCode = multiavatar(newSeed);
    setSvg(svgCode);
    setPreviewUrl(svgToDataUrl(svgCode));
    setUploadFile(null);
    setAvatarTab("generator");
  }

  function onRandomize() {
    onSeedChange(randomSeed());
  }

  function onPickFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    setUploadFile(f);
    setPreviewUrl(URL.createObjectURL(f));
    setSvg("");
    setAvatarTab("upload");
  }

  // บันทึก avatar แล้วอัปเดต picture_path
  async function onSaveAvatar() {
    try {
      let url: string | null = null;

      if (avatarTab === "generator" && svg) {
        // ส่ง SVG ไปให้ backend เซฟแล้วคืน URL (แนะนำ)
        url = await uploadAvatarSvg(svg);
      } else if (avatarTab === "upload" && uploadFile) {
        url = await uploadAvatarFile(uploadFile);
      }
      if (!url) return;

      const updated = await updateProfile({ picture_path: url });
      setMe(updated);

      setAvatarOpen(false);
      setUploadFile(null);
      toastOK("Avatar updated");
    } catch (e) {
      console.error(e);
      MySwal.fire({ icon: "error", title: "Update avatar failed" });
    }
  }

  return (
    <div className="p-6">
      <div className="rounded-2xl border border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-0 overflow-hidden">
        <div className="flex">
          {/* Left tabs */}
          <div className="w-64 border-r border-gray-200 dark:border-slate-800 p-4">
            <ul className="space-y-2">
              <li>
                <button
                  onClick={() => setTab("profile")}
                  className={`w-full text-left px-3 py-2 rounded-lg font-medium ${
                    tab === "profile"
                      ? "bg-gray-100 dark:bg-slate-800 text-gray-900 dark:text-gray-100"
                      : "hover:bg-gray-50 dark:hover:bg-slate-800/50 text-gray-600 dark:text-gray-300"
                  }`}
                >
                  My Profile
                </button>
              </li>
              <li>
                <button
                  onClick={() => setTab("password")}
                  className={`w-full text-left px-3 py-2 rounded-lg font-medium ${
                    tab === "password"
                      ? "bg-gray-100 dark:bg-slate-800 text-gray-900 dark:text-gray-100"
                      : "hover:bg-gray-50 dark:hover:bg-slate-800/50 text-gray-600 dark:text-gray-300"
                  }`}
                >
                  Change Password
                </button>
              </li>
              <li>
                <button
                  onClick={() => setTab("danger")}
                  className={`w-full text-left px-3 py-2 rounded-lg font-medium ${
                    tab === "danger"
                      ? "bg-red-50 text-red-700 dark:bg-red-900/20"
                      : "hover:bg-red-50/60 text-red-600"
                  }`}
                >
                  Delete Account
                </button>
              </li>
            </ul>
          </div>

          {/* Right content */}
          <div className="flex-1 p-6">
            {/* Avatar + name */}
            <div className="flex items-center justify-center mb-6">
              <div className="text-center">
                {me?.picture_path ? (
                  <Image
                    src={me.picture_path}
                    alt={displayName}
                    width={96}
                    height={96}
                    className="rounded-full object-cover mx-auto"
                  />
                ) : (
                  <div
                    className="w-24 h-24 rounded-full mx-auto grid place-items-center text-xl font-semibold text-white"
                    style={{ background: "linear-gradient(135deg,#ff7849,#ff3d68)" }}
                  >
                    {initials}
                  </div>
                )}
                <div className="mt-2 font-semibold text-lg">{displayName}</div>

                <div className="mt-3">
                  <button
                    type="button"
                    onClick={() => { setAvatarOpen(true); setAvatarTab("generator"); }}
                    className="text-xs px-3 py-1.5 rounded border border-gray-200 hover:bg-gray-50"
                  >
                    Change photo
                  </button>
                </div>
              </div>
            </div>
            {avatarOpen && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
                <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl shadow-xl p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-lg font-semibold">Profile Photo</h3>
                    <button onClick={() => setAvatarOpen(false)} className="px-2 py-1 rounded hover:bg-gray-100 dark:hover:bg-slate-800">✕</button>
                  </div>

                  <div className="flex gap-2 mb-4">
                    <button
                      onClick={() => setAvatarTab("generator")}
                      className={`px-3 py-1.5 rounded border text-sm ${
                        avatarTab === "generator"
                          ? "bg-gray-100 dark:bg-slate-800 border-gray-200 dark:border-slate-700"
                          : "border-transparent hover:bg-gray-50 dark:hover:bg-slate-800/60"
                      }`}
                    >
                      Random / Seed (Multiavatar)
                    </button>
                    <button
                      onClick={() => setAvatarTab("upload")}
                      className={`px-3 py-1.5 rounded border text-sm ${
                        avatarTab === "upload"
                          ? "bg-gray-100 dark:bg-slate-800 border-gray-200 dark:border-slate-700"
                          : "border-transparent hover:bg-gray-50 dark:hover:bg-slate-800/60"
                      }`}
                    >
                      From device
                    </button>
                  </div>

                  {avatarTab === "generator" ? (
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <input
                          value={seed}
                          onChange={(e) => onSeedChange(e.target.value)}
                          placeholder="Type your seed"
                          className="flex-1 px-3 py-2 rounded border border-gray-200"
                        />
                        <button onClick={onRandomize} className="px-3 py-2 rounded border border-gray-200 hover:bg-gray-50">🎲 Random</button>
                      </div>
                      {previewUrl ? (
                        <img src={previewUrl} alt="preview" className="w-32 h-32 rounded-full object-cover" />
                      ) : <div className="text-sm text-gray-500">No preview</div>}
                      <p className="text-xs text-gray-500">* Multiavatar สร้างภาพจาก seed อัตโนมัติ</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={onPickFile}
                        className="block w-full text-sm text-gray-700 dark:text-gray-200
                                  file:mr-4 file:py-2 file:px-4 file:rounded file:border-0
                                  file:bg-gray-100 dark:file:bg-slate-800
                                  hover:file:bg-gray-200 dark:hover:file:bg-slate-700"
                      />
                      {previewUrl ? (
                        <img src={previewUrl} alt="preview" className="w-32 h-32 rounded-full object-cover" />
                      ) : <div className="text-sm text-gray-500">No image selected</div>}
                    </div>
                  )}

                  <div className="mt-5 flex justify-end gap-2">
                    <button onClick={() => setAvatarOpen(false)} className="px-4 py-2 rounded border border-gray-200 hover:bg-gray-50">Cancel</button>
                    <button
                      onClick={onSaveAvatar}
                      disabled={!previewUrl}
                      className={`px-4 py-2 rounded text-white ${previewUrl ? "bg-blue-600 hover:opacity-90" : "bg-blue-300 cursor-not-allowed"}`}
                    >
                      Save
                    </button>
                  </div>
                </div>
              </div>
            )}



            {/* Tab panels */}
            {tab === "profile" && (
              <section className="min-h-[60vh]">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="font-semibold">Personal Information</h2>
                  {!editing ? (
                    <button
                      onClick={() => setEditing(true)}
                      className="text-sm px-3 py-1.5 rounded border border-gray-200 hover:bg-gray-50"
                    >
                      Edit
                    </button>
                  ) : (
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setEditing(false);
                          // รีเซ็ตค่าเป็นข้อมูลล่าสุดจาก me
                          setName(me?.name ?? "");
                          setEmail(me?.email ?? "");
                          setTel(me?.tel ?? "");
                        }}
                        className="text-sm px-3 py-1.5 rounded border border-gray-200 hover:bg-gray-50"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={onSaveProfile}
                        className="text-sm px-3 py-1.5 rounded bg-blue-600 text-white hover:opacity-90"
                      >
                        Save
                      </button>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-sm text-gray-500 mb-1">Name</label>
                    <input
                      className="w-full px-3 py-2 rounded border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      disabled={!editing}
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-500 mb-1">Email</label>
                    <input
                      type="email"
                      className="w-full px-3 py-2 rounded border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      disabled={!editing}
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-500 mb-1">Phone</label>
                    <input
                      className="w-full px-3 py-2 rounded border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      value={tel}
                      onChange={(e) => setTel(e.target.value)}
                      disabled={!editing}
                    />
                  </div>
                </div>
              </section>
            )}

            {tab === "password" && (
              <section className="max-w-lg min-h-[60vh]">
                <h2 className="font-semibold mb-3">Change Password</h2>
                <div className="space-y-4">

                  {/* New Password */}
                  <div className="relative">
                    <label className="block text-sm text-gray-500 mb-1">New password</label>
                    <input
                      type={showNewPwd ? "text" : "password"}
                      className="w-full px-3 py-2 rounded border border-gray-200 pr-10"
                      value={newPwd}
                      onChange={(e) => setNewPwd(e.target.value)}
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPwd(!showNewPwd)}
                      className="absolute right-3 top-8 text-gray-400 hover:text-gray-600 text-sm"
                    >
                      {/* {showNewPwd ? "Hide" : "Show"} */}
                      {showNewPwd ? (
                      // Eye-off
                      <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M3 3l18 18" />
                        <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7S1 12 1 12z" />
                        <circle cx="12" cy="12" r="3" />
                      </svg>
                    ) : (
                      // Eye
                      <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7S1 12 1 12z" />
                        <circle cx="12" cy="12" r="3" />
                      </svg>
                    )}
                      
                    </button>
                  </div>

                  {/* Confirm Password */}
                  <div className="relative">
                    <label className="block text-sm text-gray-500 mb-1">Confirm new password</label>
                    <input
                      type={showConfPwd ? "text" : "password"}
                      className="w-full px-3 py-2 rounded border border-gray-200 pr-10"
                      value={confPwd}
                      onChange={(e) => setConfPwd(e.target.value)}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfPwd(!showConfPwd)}
                      className="absolute right-3 top-8 text-gray-400 hover:text-gray-600 text-sm"
                    >
                      {/* {showConfPwd ? "Hide" : "Show"} */}
                      {showConfPwd ? (
                      // Eye-off
                      <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M3 3l18 18" />
                        <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7S1 12 1 12z" />
                        <circle cx="12" cy="12" r="3" />
                      </svg>
                    ) : (
                      // Eye
                      <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7S1 12 1 12z" />
                        <circle cx="12" cy="12" r="3" />
                      </svg>
                    )}
                    </button>
                  </div>

                  <button
                    onClick={onChangePassword}
                    className="px-4 py-2 rounded bg-blue-600 text-white hover:opacity-90"
                  >
                    Update Password
                  </button>
                </div>
              </section>
            )}


            {tab === "danger" && (
              <section className="max-w-lg min-h-[60vh]">
                <h2 className="font-semibold mb-3 text-red-600">Delete Account</h2>
                <p className="text-sm text-gray-600 mb-4">
                  This action is irreversible. All your data will be permanently removed.
                </p>
                <button
                  onClick={onDeleteAccount}
                  className="px-4 py-2 rounded bg-red-600 text-white hover:opacity-90"
                >
                  Delete Account
                </button>
              </section>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
