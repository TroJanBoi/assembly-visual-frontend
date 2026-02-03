"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";

import {
  Class,
  getClassById,
  getClassMembers,
  joinClass,
  toggleBookmark,
  deleteClass,
} from "@/lib/api/class";
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


  const [classData, setClassData] = useState<Class | null>(null);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [isJoining, setIsJoining] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isOwner, setIsOwner] = useState(false);
  const [isMember, setIsMember] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchClassDetails = useCallback(async () => {
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
          const owner = currentUserId === classResult.owner_id;
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
      toast.success(response.message || "Successfully joined the class!");
      await fetchClassDetails();
    } catch (err: any) {
      toast.error(err.message || "Failed to join class.");
      console.error("Join class error:", err);
    } finally {
      setIsJoining(false);
    }
  };

  const handleToggleBookmark = async () => {
    if (!classData) return;
    try {
      const result = await toggleBookmark(id);
      setClassData({ ...classData, favorite: result.bookmarked ? 1 : 0 });
      toast.success(result.message);
    } catch (err: any) {
      toast.error(err.message || "Failed to update bookmark.");
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

  if (loading) {
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
        onDelete={handleDeleteClass}
      />

      <ClassHeader classData={classData} />

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
