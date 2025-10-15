"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { getProfile, updateProfile, deleteProfile, type Profile } from "@/lib/api/profile";
import { changePassword } from "@/lib/api/auth";
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";

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
  const [curPwd, setCurPwd]   = useState("");
  const [newPwd, setNewPwd]   = useState("");
  const [confPwd, setConfPwd] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const data = await getProfile();     // ✅ /api/v2/profile/
        setMe(data);
        setName(data.name ?? "");
        setEmail(data.email ?? "");
        setTel(data.tel ?? "");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

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
      setCurPwd(""); setNewPwd(""); setConfPwd("");
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
                {/* ถ้ามี avatarUrl ใน profile ก็ใช้ได้เลย */}
                {(me as any)?.avatarUrl ? (
                  <Image
                    src={(me as any).avatarUrl}
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
              </div>
            </div>

            {/* Tab panels */}
            {tab === "profile" && (
              <section>
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
              <section className="max-w-lg">
                <h2 className="font-semibold mb-3">Change Password</h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm text-gray-500 mb-1">Current password</label>
                    <input
                      type="password"
                      className="w-full px-3 py-2 rounded border border-gray-200"
                      value={curPwd}
                      onChange={(e) => setCurPwd(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-500 mb-1">New password</label>
                    <input
                      type="password"
                      className="w-full px-3 py-2 rounded border border-gray-200"
                      value={newPwd}
                      onChange={(e) => setNewPwd(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-500 mb-1">Confirm new password</label>
                    <input
                      type="password"
                      className="w-full px-3 py-2 rounded border border-gray-200"
                      value={confPwd}
                      onChange={(e) => setConfPwd(e.target.value)}
                    />
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
              <section className="max-w-lg">
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
