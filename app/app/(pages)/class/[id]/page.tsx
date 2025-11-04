"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";

import {
  Class,
  getClassById,
  getClassMembers,
  joinClass,
} from "@/lib/api/class";
import { Assignment, getAssignmentsForClass } from "@/lib/api/assignment";
import { useToast } from "@/components/ui/ToastAlert/ToastAlert";

import { Button } from "@/components/ui/Button";
import AssignmentList from "@/components/assignment/AssignmentList";

import {
  HiChevronLeft,
  HiOutlineHeart,
  HiOutlineDotsHorizontal,
  HiOutlineGlobeAlt,
  HiOutlineLockClosed,
  HiExclamationCircle,
} from "react-icons/hi";
import { RxEnter } from "react-icons/rx";
import { MdDashboardCustomize } from "react-icons/md";
import { FaUsers, FaHeart } from "react-icons/fa";
import { HiOutlineUser, HiPlus } from "react-icons/hi2";
import { decodeToken, getToken } from "@/lib/auth/token";

export default function ViewClassPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const { addToast } = useToast();

  const [classData, setClassData] = useState<Class | null>(null);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [isJoining, setIsJoining] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isOwner, setIsOwner] = useState(false);
  const [isMember, setIsMember] = useState(false);

  const fetchClassDetails = useCallback(async () => {
    // This function can be called to refetch all data for the page
    try {
      setError(null);
      const [classResult, assignmentsResult, membersResult] = await Promise.all(
        [
          getClassById(id),
          getAssignmentsForClass(id).catch((err) => {
            if (err.message?.includes("record not found")) return [];
            throw err;
          }),
          getClassMembers(id),
        ],
      );

      setClassData(classResult);
      setAssignments(assignmentsResult);

      const token = getToken();
      if (token) {
        const decoded = decodeToken(token);
        if (decoded && decoded.user_id) {
          const currentUserId = decoded.user_id;
          const owner = currentUserId === classResult.owner;
          const member = Array.isArray(membersResult)
            ? membersResult.some((m) => m && m.id === currentUserId)
            : false;
          setIsOwner(owner);
          setIsMember(owner || Boolean(member));
        }
      }
    } catch (err: any) {
      setError(err.message || "Failed to fetch class details.");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    fetchClassDetails();
  }, [id, fetchClassDetails]);

  const handleJoinClass = async () => {
    setIsJoining(true);
    try {
      const response = await joinClass(id);
      addToast(response.message || "Successfully joined the class!", "success");
      // Refetch all data to update the UI correctly
      await fetchClassDetails();
    } catch (err: any) {
      addToast(err.message || "Failed to join class.", "error");
      console.error("Join class error:", err);
    } finally {
      setIsJoining(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-gray-500">Loading class details...</p>
      </div>
    );
  }

  if (error || !classData) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-6">
        <HiExclamationCircle className="w-16 h-16 text-red-400 mb-4" />
        <h2 className="text-2xl font-bold text-gray-800">
          {error ? "An Error Occurred" : "Class Not Found"}
        </h2>
        <p className="mt-2 text-gray-500 max-w-sm">
          {error
            ? error
            : `Sorry, we couldn't find the class you're looking for.`}
        </p>
        <Button onClick={() => router.push("/class")} className="mt-6">
          Go to Class Dashboard
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-screen-xl mx-auto p-4 md:p-6">
      {/* Action Bar */}
      <div className="flex items-center gap-2 py-4">
        <Button variant="outline" size="icon" onClick={() => router.back()}>
          <HiChevronLeft className="h-5 w-5" />
        </Button>
        <Button variant="outline" size="icon" aria-label="Favorite class">
          <HiOutlineHeart className="h-5 w-5" />
        </Button>
        <div className="flex-grow" />

        {/* Owner-specific buttons */}
        {isOwner && (
          <>
            <Button
              onClick={() => router.push(`/class/${id}/assignments/new`)}
              className="flex items-center gap-2"
            >
              <HiPlus className="w-5 h-5" />
              New Assignment
            </Button>
            <Button
              variant="outline"
              onClick={() => router.push(`/class/${id}/members`)}
              className="flex items-center gap-2"
            >
              <FaUsers className="w-5 h-5" />
              Members
            </Button>
          </>
        )}

        {/* Conditional Join/Dashboard Buttons */}
        {isOwner ? (
          <Button
            variant="outline"
            onClick={() => router.push(`/class/${id}/dashboard`)}
            className="flex items-center gap-2"
          >
            <MdDashboardCustomize className="w-5 h-5" />
            Dashboard
          </Button>
        ) : !isMember ? (
          <Button
            onClick={handleJoinClass}
            disabled={isJoining}
            className="flex items-center gap-2"
          >
            <RxEnter className="w-5 h-5" />
            {isJoining ? "Joining..." : "Join Class"}
          </Button>
        ) : null}

        <Button variant="ghost" size="icon" aria-label="More options">
          <HiOutlineDotsHorizontal className="h-5 w-5" />
        </Button>
      </div>

      {/* Header with Cover Image */}
      <header className="relative h-56 md:h-64 rounded-2xl overflow-hidden shadow-lg">
        <Image
          src="/images/p2.png"
          alt={classData.topic}
          fill
          className="object-cover"
        />

        <div
          className="absolute inset-0 flex items-end"
          style={{
            background:
              "linear-gradient(180deg, rgba(2,0,36,0.15) 0%, rgba(9,9,121,0.55) 40%, rgba(2,0,36,0.9) 95%)",

            backdropFilter: "saturate(120%) blur(6px)",
          }}
        >
          <div className="w-full p-5 md:p-6 flex flex-col md:flex-row items-start md:items-end gap-4">
            <div className="w-full md:w-2/3">
              <div className="flex items-center gap-3 md:gap-5">
                <h1 className="text-2xl md:text-4xl font-extrabold text-white tracking-tight leading-tight">
                  {classData.topic}
                </h1>

                <span
                  className={`inline-flex items-center gap-2 px-2 py-1 rounded-md text-sm font-medium ${
                    classData.status === 0 // 0 = public
                      ? "bg-white/10 text-blue-200"
                      : "bg-white/8 text-amber-200"
                  }`}
                >
                  {classData.status === 0 ? (
                    <>
                      <HiOutlineGlobeAlt className="w-4 h-4" />

                      <span>Public</span>
                    </>
                  ) : (
                    <>
                      <HiOutlineLockClosed className="w-4 h-4" />

                      <span>Private</span>
                    </>
                  )}
                </span>
              </div>

              <div className="mt-2 max-w-full">
                <p
                  className="text-sm text-white/90 leading-relaxed line-clamp-2 break-words"
                  style={{
                    display: "-webkit-box",

                    WebkitLineClamp: 3,

                    WebkitBoxOrient: "vertical",

                    overflow: "hidden",
                  }}
                >
                  {classData.description}
                </p>
              </div>

              <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-white/80">
                <div className="inline-flex items-center gap-2 bg-white/6 px-2 py-1 rounded-md">
                  <span>
                    <FaHeart className="w-4 h-4 fill-red-500" />
                  </span>

                  <span>{classData.fav_score} favorites</span>
                </div>

                <div className="inline-flex items-center gap-2 bg-white/6 px-2 py-1 rounded-md">
                  <span>
                    <FaUsers className="w-4 h-4 fill-blue-500" />
                  </span>

                  <span>{/* You can display membersResult.length here */}</span>
                </div>
              </div>
            </div>

            <div className="w-full md:w-1/3 flex items-center justify-between md:justify-end gap-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center text-white/90">
                  <HiOutlineUser className="w-6 h-6" />
                </div>

                <div className="hidden md:block text-right">
                  <div className="text-sm font-medium text-white">
                    {classData.owner}
                  </div>

                  <div className="text-xs text-white/80">Owner</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mt-8">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Assignments</h2>
        <AssignmentList
          assignments={assignments}
          isOwner={isOwner}
          isMember={isMember}
        />
      </main>
    </div>
  );
}
