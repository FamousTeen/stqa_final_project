// components/Layout.tsx
// Repo reference (uploaded file): /mnt/data/cloud-tiket-konser-main.zip

"use client";

import React, { ReactNode, useState, useRef, useEffect } from "react";
import Head from "next/head";
import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import Image from "next/image";

export default function Layout({
  children,
  title = "Events",
}: {
  children: ReactNode;
  title?: string;
}) {
  const { data: session, status } = useSession();
  const isAuthenticated = status === "authenticated";
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  return (
    <>
      <Head>
        <title>{title}</title>
        <meta name="description" content="Event ticketing" />
      </Head>

      <div className="min-h-screen bg-linear-to-b from-[#0A0F29] via-[#0a1138] to-[#010314] text-white relative">
        <header className="py-6">
          <div className="max-w-7xl mx-auto px-4 md:px-0 flex items-center justify-between">
            <Link href="/" className="text-xl font-bold text-white">
              Cloud Tiket
            </Link>

            <nav className="flex items-center gap-6">
              <Link href="/events" className="text-sm text-gray-300 hover:text-indigo-300">
                Events
              </Link>

              <Link href="/tickets" className="text-sm text-gray-300 hover:text-indigo-300">
                Tickets
              </Link>

              {/* Conditionally render Login link or Profile avatar */}
              {!isAuthenticated ? (
                <Link href="/auth/login" className="text-sm text-gray-300 hover:text-indigo-300">
                  Login
                </Link>
              ) : (
                <ProfileAvatar
                  name={session?.user?.name ?? undefined}
                  image={session?.user?.image ?? "/profile_icon.png"}
                  onClick={() => setShowLogoutModal(true)}
                />
              )}
            </nav>
          </div>
        </header>

        <main>{children}</main>

        <footer className="py-8">
          <div className="max-w-7xl mx-auto px-4 md:px-0 text-sm text-gray-400">
            © {new Date().getFullYear()} Cloud Tiket — All rights reserved.
          </div>
        </footer>

        {/* Logout confirmation modal */}
        {showLogoutModal && (
          <LogoutModal
            onCancel={() => setShowLogoutModal(false)}
            onConfirm={() => {
              sessionStorage.clear();
              signOut({
                callbackUrl: "/auth/login",
              });
            }}
            userName={session?.user?.name}
          />
        )}
      </div>
    </>
  );
}

/* -------------------------------------------------------------------------- */
/* Simple profile avatar button with accessible markup                       */
/* -------------------------------------------------------------------------- */

function ProfileAvatar({
  name,
  image,
  onClick,
}: {
  name?: string;
  image?: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      aria-label="Open account menu"
      title={name ?? "Account"}
      className="relative inline-flex items-center justify-center w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 overflow-hidden"
    >
      {/* Use Next Image if you prefer; keep <img> for simplicity/stability in any setup */}
      <Image src={image ?? "/profile_icon.png"} alt={name ?? "Profile"} className="w-full h-full object-cover" width={128} height={128} />
      <span className="sr-only">Open account menu</span>
    </button>
  );
}

/* -------------------------------------------------------------------------- */
/* Logout confirmation modal component                                       */
/* -------------------------------------------------------------------------- */

function LogoutModal({
  onCancel,
  onConfirm,
  userName,
}: {
  onCancel: () => void;
  onConfirm: () => void;
  userName?: string | null;
}) {
  // close modal on ESC or click outside
  const overlayRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onCancel();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onCancel]);

  const onOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === overlayRef.current) onCancel();
  };

  return (
    <div
      ref={overlayRef}
      onClick={onOverlayClick}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="logout-title"
    >
      <div className="w-full max-w-sm bg-[#07102a]/90 border border-white/10 rounded-2xl p-6 shadow-2xl">
        <h3 id="logout-title" className="text-lg font-semibold text-white">
          Sign out
        </h3>

        <p className="mt-2 text-sm text-gray-300">
          {userName ? (
            <>
              Are you sure you want to sign out, <span className="font-medium">{userName}</span>?
            </>
          ) : (
            "Are you sure you want to sign out?"
          )}
        </p>

        <div className="mt-6 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 bg-white/5 hover:bg-white/7 text-sm rounded-lg border border-white/6"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={onConfirm}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm rounded-lg shadow"
          >
            Sign out
          </button>
        </div>
      </div>
    </div>
  );
}
