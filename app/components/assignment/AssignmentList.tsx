"use client";

import React from "react";
import { Assignment } from "@/lib/api/assignment";
import {
  HiOutlineDocumentText,
  HiOutlineCalendar,
  HiOutlinePencil,
  HiOutlineTrash,
  HiOutlinePlay,
  HiExclamationCircle,
  HiOutlineLockClosed,
} from "react-icons/hi";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import { isAssignmentIncomplete } from "@/lib/utils/assignment";

// Helper to format date and check status
const formatDate = (dateString: string | null) => {
  if (!dateString) return { text: "No due date", isPast: false };
  const dueDate = new Date(dateString);
  const now = new Date();
  const isPast = dueDate < now;
  const formattedDate = dueDate.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
  return { text: `Due: ${formattedDate}`, isPast };
};

// --- Single List Item Component ---
const AssignmentListItem = ({
  assignment,
  isOwner,
  isMember, // Receive isMember prop
}: {
  assignment: Assignment;
  isOwner: boolean;
  isMember: boolean; // Add isMember to props
}) => {
  const router = useRouter();
  const { text: dueDateText, isPast } = formatDate(assignment.due_date);
  const status = isPast ? "Closed" : "Open";
  const canAccess = isOwner || isMember; // User can access if they are the owner or a member

  // Navigate to the play page
  const handleStart = () => {
    if (canAccess) {
      router.push(`/assignment/play/${assignment.id}`);
    }
  };

  // Placeholder functions for edit/delete
  const handleEdit = () => {
    // console.log("Edit assignment:", assignment.id);
    router.push(`/class/${assignment.class_id}/assignments/${assignment.id}/edit`);
  };

  const handleDelete = () => {
    console.log("Delete assignment:", assignment.id);
    // Add confirmation modal logic here
  };

  return (
    <li className="flex items-center justify-between gap-4 p-4 hover:bg-gray-50 transition-colors duration-150">
      <div className="flex items-center gap-4 flex-1 min-w-0">
        <div className="flex-shrink-0 w-10 h-10 bg-indigo-100 text-indigo-600 rounded-lg flex items-center justify-center">
          <HiOutlineDocumentText className="w-6 h-6" />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-gray-900 truncate">
            {assignment.title}
          </p>
          <p className="text-sm text-gray-500 truncate">
            {assignment.description}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-6 text-sm text-gray-600 flex-shrink-0">
        <div className="hidden md:flex items-center gap-2">
          <HiOutlineCalendar className="w-5 h-5 text-gray-400" />
          <span>{dueDateText}</span>
        </div>

        {isAssignmentIncomplete(assignment) ? (<span
          className={cn(
            "px-2 py-1 text-xs font-medium rounded-full bg-amber-100 text-amber-800"
          )}
        >
          Setup Required
        </span>
        ) : (
          <span
            className={cn(
              "px-2 py-1 text-xs font-medium rounded-full",
              isPast ? "bg-red-100 text-red-800" : "bg-green-100 text-green-800",
            )}
          >
            {status}
          </span>
        )}
      </div>

      <div className="flex items-center gap-2 flex-shrink-0 w-auto min-w-[7rem] justify-end">
        {isOwner ? (
          <>
            <button
              aria-label="Play assignment"
              onClick={() =>
                router.push(
                  `/class/${assignment.class_id}/assignment/${assignment.id}/playground`,
                )
              }
              className="p-2 text-gray-500 hover:text-green-600 hover:bg-gray-100 rounded-md"
              title="Play / Test"
            >
              <HiOutlinePlay className="w-5 h-5" />
            </button>
            <button
              aria-label="Edit assignment"
              onClick={handleEdit}
              className="p-2 text-gray-500 hover:text-indigo-600 hover:bg-gray-100 rounded-md"
            >
              <HiOutlinePencil className="w-5 h-5" />
            </button>
            <button
              aria-label="Delete assignment"
              onClick={handleDelete}
              className="p-2 text-gray-500 hover:text-red-600 hover:bg-gray-100 rounded-md"
            >
              <HiOutlineTrash className="w-5 h-5" />
            </button>
          </>
        ) : canAccess ? (
          isAssignmentIncomplete(assignment) ? (
            <Button
              className="inline-flex items-center justify-center gap-2 cursor-not-allowed opacity-70"
              disabled
              variant="secondary"
            >
              <HiExclamationCircle className="w-5 h-5" />
              Not Ready
            </Button>
          ) : (
            <Button
              className="inline-flex items-center justify-center gap-2"
              disabled={isPast}
              onClick={() =>
                router.push(
                  `/class/${assignment.class_id}/assignment/${assignment.id}/playground`,
                )
              }
            >
              <HiOutlinePlay className="w-5 h-5" />
              Start
            </Button>
          )
        ) : (
          <div className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-500 rounded-lg">
            <HiOutlineLockClosed className="w-5 h-5" />
            <span className="text-sm font-medium">Locked</span>
          </div>
        )}
      </div>
    </li>
  );
};

// --- Main List Component ---
export default function AssignmentList({
  assignments,
  isOwner,
  isMember, // Receive isMember prop
}: {
  assignments: Assignment[];
  isOwner: boolean;
  isMember: boolean;
}) {
  if (!assignments || assignments.length === 0) {
    return (
      <div className="text-center py-16 px-6 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
        <HiExclamationCircle className="w-12 h-12 mx-auto text-gray-400" />
        <h3 className="mt-2 text-lg font-medium text-gray-900">
          No assignments yet
        </h3>
        <p className="mt-1 text-sm text-gray-500">
          {isOwner
            ? "Click 'New Assignment' to get started."
            : "Check back later for new assignments."}
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
      <ul className="divide-y divide-gray-200">
        {assignments.map((assignment) => (
          <AssignmentListItem
            key={assignment.id}
            assignment={assignment}
            isOwner={isOwner}
            isMember={isMember}
          />
        ))}
      </ul>
    </div>
  );
}
