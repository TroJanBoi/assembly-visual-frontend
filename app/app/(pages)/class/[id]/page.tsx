"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";

import {
  getClassMembers,
  joinClass,
  deleteClass,
} from "@/lib/api/class";
import { useBookmarks } from "@/lib/context/BookmarkContext";
import { useClass } from "./ClassContext";
import { Assignment, getAssignmentsForClass } from "@/lib/api/assignment";
import { toast } from "sonner";

import { Button } from "@/components/ui/Button";
import AssignmentList from "@/components/assignment/AssignmentList";
import { HiExclamationCircle } from "react-icons/hi";
import { decodeToken, getToken } from "@/lib/auth/token";

import ClassHeader from "@/components/class/ClassHeader";
import ClassActions from "@/components/class/ClassActions";
import ClassPageSkeleton from "@/components/skeletons/ClassPageSkeleton";


export default function ViewClassPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const { classData, isOwner: contextIsOwner, loading: contextLoading, refreshClass } = useClass();
  const { toggleFavorite } = useBookmarks();


  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [isJoining, setIsJoining] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isMember, setIsMember] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Use context isOwner directly
  const isOwner = contextIsOwner;

  const fetchClassDetails = useCallback(async () => {
    try {
      setError(null);
      const [assignmentsResult, membersResult] = await Promise.all(
        [
          getAssignmentsForClass(id).catch((err) => {
            if (err.message?.includes("record not found")) return [];
            throw err;
          }),
          getClassMembers(id),
        ],
      );

      setAssignments(assignmentsResult);

      if (classData) {
        const token = getToken();
        if (token) {
          const decoded = decodeToken(token);
          if (decoded && decoded.user_id) {
            const currentUserId = decoded.user_id;
            // isOwner is already determined by context, but we check member status here
            const member = Array.isArray(membersResult)
              ? membersResult.some((m) => m && m.id === currentUserId)
              : false;
            setIsMember(isOwner || Boolean(member));
          }
        }
      }
    } catch (err: any) {
      setError(err.message || "Failed to fetch class details.");
    } finally {
      setLoading(false);
    }
  }, [id, classData, isOwner]);

  useEffect(() => {
    if (!id) return;
    if (!contextLoading) {
      setLoading(true); // Set local loading to true when context loading is done, before fetching assignments/members
      fetchClassDetails();
    }
  }, [id, contextLoading, fetchClassDetails]);

  const handleJoinClass = async () => {
    setIsJoining(true);
    try {
      const response = await joinClass(id);
      toast.success(response.message || "Successfully joined the class!");
      await refreshClass(); // Refresh context data (e.g. member count)
      await fetchClassDetails(); // Refresh list-specific data
    } catch (err: any) {
      toast.error(err.message || "Failed to join class.");
      console.error("Join class error:", err);
    } finally {
      setIsJoining(false);
    }
  };

  const handleToggleBookmark = async () => {
    try {
      await toggleFavorite(id);
      toast.success("Bookmark updated!");
    } catch (err: any) {
      // Error is handled in context
    }
  };

  const handleDeleteClass = async () => {
    setIsDeleting(true);
    try {
      await deleteClass(id);
      toast.success("Class deleted successfully");
      router.push("/class");
    } catch (err: any) {
      toast.error(err.message || "Failed to delete class.");
    } finally {
      setIsDeleting(false);
      setIsDeleteDialogOpen(false);
    }
  };


  // ... existing imports ...

  if (loading || contextLoading) {
    return <ClassPageSkeleton />;
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
      <ClassActions
        classData={classData}
        isOwner={isOwner}
        isMember={isMember}
        isJoining={isJoining}
        onJoin={handleJoinClass}
        onBookmark={handleToggleBookmark}
      />

      <ClassHeader classData={classData} isOwner={isOwner} />

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
