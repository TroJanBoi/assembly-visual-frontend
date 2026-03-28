"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useParams } from "next/navigation";
import { toast } from "sonner";
import { format } from "date-fns";
import {
    HiOutlineClipboardCheck,
    HiOutlineSearch,
    HiOutlinePencilAlt,
    HiOutlineCode,
    HiOutlineExternalLink,
} from "react-icons/hi";

import { useClass } from "../ClassContext";
import {
    Assignment,
    getAssignmentsForClass,
} from "@/lib/api/assignment";
import {
    OwnerSubmission,
    getAllSubmissionsForAssignment,
    updateGrade,
    UpdateGradePayload,
    getMySubmissions,
} from "@/lib/api/submission";
import { getClassMembers, Member } from "@/lib/api/class";
import { getTestSuitesForAssignment } from "@/lib/api/test_cases";
import { TestSuite } from "@/lib/playground/test_runner";

import ClassToolHeader from "@/components/class/ClassToolHeader";
import SubmissionRunModal from "@/components/class/SubmissionRunModal";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/Modal";
import { Checkbox } from "@/components/ui/Checkbox";
import { Textarea } from "@/components/ui/Textarea";
import { Skeleton } from "@/components/ui/Skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

export default function SubmissionsPage() {
    const { id } = useParams() as { id: string };
    const { classData, isOwner: contextIsOwner, loading: contextLoading } = useClass();

    // State: Data
    const [assignments, setAssignments] = useState<Assignment[]>([]);
    const [members, setMembers] = useState<Member[]>([]);
    const [submissions, setSubmissions] = useState<OwnerSubmission[]>([]);
    const [testSuites, setTestSuites] = useState<TestSuite[]>([]);

    // State: UI Selection
    const [selectedAssignmentId, setSelectedAssignmentId] = useState<number | null>(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [filterDate, setFilterDate] = useState("");
    const [filterVerified, setFilterVerified] = useState("all");

    // State: Loading
    const [loadingTasks, setLoadingTasks] = useState(true);
    const [loadingSubmissions, setLoadingSubmissions] = useState(false);

    // State: Grading Modal
    const [isGradeModalOpen, setIsGradeModalOpen] = useState(false);
    const [gradingSubmission, setGradingSubmission] = useState<OwnerSubmission | null>(null);
    const [gradeInput, setGradeInput] = useState<UpdateGradePayload>({
        score: 0,
        is_verified: false,
        feed_back: "",
    });
    const [isSubmittingGrade, setIsSubmittingGrade] = useState(false);

    // State: Run Modal
    const [isRunModalOpen, setIsRunModalOpen] = useState(false);
    const [runningSubmission, setRunningSubmission] = useState<OwnerSubmission | null>(null);

    // 1. Fetch initial data (assignments + members)
    useEffect(() => {
        if (!contextLoading) {
            fetchInitialData();
        }
    }, [id, contextLoading]);

    const fetchInitialData = async () => {
        try {
            setLoadingTasks(true);
            const [assignmentsData, membersData] = await Promise.all([
                getAssignmentsForClass(id).catch(() => []),
                getClassMembers(id).catch(() => []),
            ]);
            setAssignments(assignmentsData || []);
            setMembers(membersData || []);

            // Auto-select first assignment if available
            if (assignmentsData && assignmentsData.length > 0) {
                setSelectedAssignmentId(assignmentsData[0].id);
            }
        } catch (error) {
            console.error("Failed to fetch initial data:", error);
            toast.error("Failed to load assignments or members.");
        } finally {
            setLoadingTasks(false);
        }
    };

    // 2. Fetch submissions when selected assignment changes
    useEffect(() => {
        if (selectedAssignmentId) {
            fetchSubmissions(selectedAssignmentId);
        } else {
            setSubmissions([]);
        }
    }, [selectedAssignmentId]);

    const fetchSubmissions = async (assignmentId: number) => {
        try {
            setLoadingSubmissions(true);
            let data: OwnerSubmission[] = [];
            
            if (contextIsOwner) {
                const res = await getAllSubmissionsForAssignment(assignmentId);
                data = res || [];
            } else {
                const res = await getMySubmissions(assignmentId);
                data = (res || []).map((s: any) => ({
                    ...s,
                    attempt_no: s.attempt_no || s.attempt_number,
                }));
            }

            const suitesData = await getTestSuitesForAssignment(Number(id), assignmentId).catch(() => []);
            
            setSubmissions(data);
            setTestSuites(suitesData);
        } catch (error) {
            console.error("Failed to fetch submissions or test suites:", error);
            toast.error("Failed to load submissions for this assignment.");
            setSubmissions([]);
        } finally {
            setLoadingSubmissions(false);
        }
    };

    // --- Derived Data / UI Logic ---

    // Map member data for quick lookup
    const memberMap = useMemo(() => {
        const map = new Map<number, Member>();
        members.forEach((m) => map.set(m.id, m));
        return map;
    }, [members]);

    // Filter submissions and join with member data
    const tableData = useMemo(() => {
        let filtered = submissions.map((sub) => {
            const member = memberMap.get(sub.user_id);
            return {
                ...sub,
                memberName: member?.name || `User ID: ${sub.user_id}`,
                memberEmail: member?.email || "Unknown Email",
                memberAvatar: member?.picture_path || "",
            };
        });

        if (searchQuery) {
            const lowerQuery = searchQuery.toLowerCase();
            filtered = filtered.filter(
                (item) =>
                    item.memberName.toLowerCase().includes(lowerQuery) ||
                    item.memberEmail.toLowerCase().includes(lowerQuery)
            );
        }

        if (filterDate) {
            filtered = filtered.filter(item => {
                if (!item.created_at) return false;
                const d = new Date(item.created_at);
                const year = d.getFullYear();
                const month = String(d.getMonth() + 1).padStart(2, '0');
                const day = String(d.getDate()).padStart(2, '0');
                return `${year}-${month}-${day}` === filterDate;
            });
        }

        if (filterVerified !== "all") {
            const isV = filterVerified === "verified";
            filtered = filtered.filter(item => item.is_verified === isV);
        }

        // Sort by attempt_no descending (latest attempt first), fallback to created_at
        filtered.sort((a, b) => {
            const attemptDiff = (b.attempt_no || 0) - (a.attempt_no || 0);
            if (attemptDiff !== 0) return attemptDiff;
            
            const timeA = new Date(a.created_at || 0).getTime();
            const timeB = new Date(b.created_at || 0).getTime();
            return timeB - timeA;
        });

        return filtered;
    }, [submissions, memberMap, searchQuery, filterDate, filterVerified]);

    const uniqueDates = useMemo(() => {
        const datesSet = new Set<string>();
        tableData.forEach(sub => {
            const dateStr = sub.created_at ? format(new Date(sub.created_at), "PPP") : "Unknown Date";
            datesSet.add(dateStr);
        });
        return Array.from(datesSet);
    }, [tableData]);

    const getInitials = (name: string) => {
        return name
            .split(" ")
            .map((n) => n[0])
            .join("")
            .toUpperCase()
            .slice(0, 2);
    };

    // --- Handlers ---
    const handleOpenGradeModal = (submission: OwnerSubmission) => {
        setGradingSubmission(submission);
        setGradeInput({
            score: submission.score || 0,
            is_verified: submission.is_verified || false,
            feed_back: submission.feed_back || "",
        });
        setIsGradeModalOpen(true);
    };

    const handleSaveGrade = async () => {
        if (!gradingSubmission) return;
        setIsSubmittingGrade(true);
        try {
            await updateGrade(gradingSubmission.id, gradeInput);
            toast.success("Grade updated successfully.");
            setIsGradeModalOpen(false);

            // Optimistic Update
            setSubmissions((prev) =>
                prev.map((s) =>
                    s.id === gradingSubmission.id
                        ? {
                            ...s,
                            score: gradeInput.score,
                            is_verified: gradeInput.is_verified,
                            feed_back: gradeInput.feed_back || null,
                        }
                        : s
                )
            );
        } catch (error: any) {
            console.error("Failed to update grade:", error);
            toast.error(error.message || "Failed to update grade. Please try again.");
        } finally {
            setIsSubmittingGrade(false);
        }
    };


    const handleOpenRunModal = (submission: OwnerSubmission) => {
        setRunningSubmission(submission);
        setIsRunModalOpen(true);
    };

    // --- Render Helpers ---
    const showSkeleton = contextLoading || loadingTasks;

    const TableSkeleton = () => (
        <>
            {[...Array(3)].map((_, i) => (
                <TableRow key={i}>
                    <TableCell>
                        <div className="flex items-center gap-3">
                            <Skeleton className="h-10 w-10 rounded-full" />
                            <div className="space-y-2">
                                <Skeleton className="h-4 w-24" />
                                <Skeleton className="h-3 w-32" />
                            </div>
                        </div>
                    </TableCell>
                    <TableCell><Skeleton className="h-4 w-12" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-16 rounded-full" /></TableCell>
                    <TableCell><Skeleton className="h-6 w-16" /></TableCell>
                    <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                    {contextIsOwner && (
                        <TableCell className="text-right">
                            <Skeleton className="h-8 w-20 ml-auto rounded-md" />
                        </TableCell>
                    )}
                </TableRow>
            ))}
        </>
    );

    // Removed owner blocker to allow members to review their own submissions.

    return (
        <div className="min-h-screen bg-gray-50/50 pb-20">
            {/* Header */}
            <ClassToolHeader
                title={contextIsOwner ? "Submissions & Grading" : "My Submissions"}
                subtitle={contextIsOwner ? "Review student work, assign grades, and provide feedback." : "View your scores and feedback."}
                showBackButton
            >
                <div className="text-sm font-medium bg-indigo-500/20 px-3 py-1 rounded-full text-indigo-600">
                    <HiOutlineClipboardCheck className="inline-block w-4 h-4 mr-1" />
                    <span>{submissions.length} Submissions</span>
                </div>
            </ClassToolHeader>

            <div className="max-w-screen-xl mx-auto px-4 md:px-6 py-8 flex flex-col lg:flex-row gap-6">

                {/* Left Sidebar: Assignment Selector */}
                <div className="w-full lg:w-64 flex-shrink-0 space-y-4">
                    <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider">
                        Assignments
                    </h3>
                    {showSkeleton ? (
                        <div className="space-y-2">
                            {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-10 w-full rounded-md" />)}
                        </div>
                    ) : assignments.length === 0 ? (
                        <div className="text-sm text-gray-500 bg-white p-4 rounded-lg border border-gray-100 shadow-sm">
                            No assignments found for this class.
                        </div>
                    ) : (
                        <div className="flex flex-col gap-1">
                            {assignments.map((assignment) => (
                                <button
                                    key={assignment.id}
                                    onClick={() => setSelectedAssignmentId(assignment.id)}
                                    className={cn(
                                        "text-left px-3 py-2.5 rounded-lg text-sm transition-all border",
                                        selectedAssignmentId === assignment.id
                                            ? "bg-indigo-50 border-indigo-200 text-indigo-700 font-medium shadow-sm"
                                            : "bg-transparent border-transparent text-gray-600 hover:bg-gray-100"
                                    )}
                                >
                                    <div className="truncate">{assignment.title}</div>
                                    <div className="text-xs opacity-70 mt-0.5 truncate">
                                        Max Score: {assignment.grade}
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Right Content: Submissions Table */}
                <div className="flex-1 space-y-4 min-w-0">
                    {/* Toolbar */}
                    <div className="flex flex-col xl:flex-row gap-4 justify-between items-center bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                        <div className="flex flex-col sm:flex-row gap-3 w-full xl:w-auto">
                            <div className="relative w-full sm:w-56">
                                <HiOutlineSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                <Input
                                    placeholder="Search student..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="pl-9 h-9"
                                    disabled={!selectedAssignmentId || loadingSubmissions}
                                />
                            </div>
                            <Input
                                type="date"
                                value={filterDate}
                                onChange={(e) => setFilterDate(e.target.value)}
                                className="h-9 text-sm text-gray-500 w-full sm:w-auto"
                                disabled={!selectedAssignmentId || loadingSubmissions}
                            />
                            <select
                                value={filterVerified}
                                onChange={(e) => setFilterVerified(e.target.value)}
                                className="h-9 px-3 py-1.5 border border-gray-200 rounded-lg text-sm bg-white text-gray-500 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none w-full sm:w-36 transition-colors disabled:opacity-50"
                                disabled={!selectedAssignmentId || loadingSubmissions}
                            >
                                <option value="all">All Verification</option>
                                <option value="verified">Verified</option>
                                <option value="unverified">Unverified</option>
                            </select>
                        </div>
                        {selectedAssignmentId && (
                            <div className="text-sm text-gray-500">
                                Viewing{" "}
                                <span className="font-semibold text-gray-900">
                                    {assignments.find((a) => a.id === selectedAssignmentId)?.title}
                                </span>
                            </div>
                        )}
                    </div>

                    {/* Table Container */}
                    <Card className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader className="bg-gray-50/80">
                                    <TableRow>
                                        <TableHead>Student</TableHead>
                                        <TableHead>Attempt</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead>Score</TableHead>
                                        <TableHead>Submitted</TableHead>
                                        {contextIsOwner && <TableHead className="text-right">Action</TableHead>}
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {showSkeleton || loadingSubmissions ? (
                                        <TableSkeleton />
                                    ) : !selectedAssignmentId ? (
                                        <TableRow>
                                            <TableCell colSpan={contextIsOwner ? 6 : 5} className="h-48 text-center text-gray-500">
                                                Please select an assignment from the sidebar to view submissions.
                                            </TableCell>
                                        </TableRow>
                                    ) : tableData.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={contextIsOwner ? 6 : 5} className="h-48 text-center">
                                                <div className="flex flex-col items-center justify-center text-gray-400">
                                                    <HiOutlineClipboardCheck className="w-10 h-10 mb-3 opacity-20" />
                                                    <p>No submissions found for this assignment.</p>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        uniqueDates.map((dateSection) => (
                                            <React.Fragment key={dateSection}>
                                                <TableRow className="bg-slate-50 border-t border-slate-200 hover:bg-slate-50">
                                                    <TableCell colSpan={contextIsOwner ? 6 : 5} className="py-2.5 shadow-inner">
                                                        <span className="font-semibold text-slate-700 text-xs uppercase tracking-wider">{dateSection}</span>
                                                    </TableCell>
                                                </TableRow>
                                                {tableData
                                                    .filter(sub => (sub.created_at ? format(new Date(sub.created_at), "PPP") : "Unknown Date") === dateSection)
                                                    .map((sub) => (
                                                        <TableRow key={sub.id} className="hover:bg-gray-50/50 transition-colors group">
                                                            <TableCell>
                                                                <div className="flex items-center gap-3">
                                                                    <Avatar className="h-9 w-9">
                                                                        <AvatarImage src={sub.memberAvatar} alt={sub.memberName} />
                                                                        <AvatarFallback className="bg-indigo-100 text-indigo-700 text-xs font-medium">
                                                                            {getInitials(sub.memberName)}
                                                                        </AvatarFallback>
                                                                    </Avatar>
                                                                    <div className="flex flex-col max-w-[150px] sm:max-w-[200px]">
                                                                        <span className="font-medium text-gray-900 truncate" title={sub.memberName}>
                                                                            {sub.memberName}
                                                                        </span>
                                                                        <span className="text-xs text-gray-500 truncate" title={sub.memberEmail}>
                                                                            {sub.memberEmail}
                                                                        </span>
                                                                    </div>
                                                                </div>
                                                            </TableCell>
                                                            <TableCell className="text-gray-600">{sub.attempt_no}</TableCell>
                                                            <TableCell>
                                                                <Badge
                                                                    variant="outline"
                                                                    className={cn(
                                                                        "font-medium",
                                                                        sub.status === "passed"
                                                                            ? "border-green-200 bg-green-50 text-green-700"
                                                                            : sub.status === "failed"
                                                                                ? "border-red-200 bg-red-50 text-red-700"
                                                                                : "border-gray-200 bg-gray-50 text-gray-700"
                                                                    )}
                                                                >
                                                                    {sub.status || "Pending"}
                                                                </Badge>
                                                            </TableCell>
                                                            <TableCell>
                                                                <div className="flex items-center gap-2">
                                                                    <span className="font-semibold text-gray-900">
                                                                        {sub.score !== null ? Number(sub.score).toFixed(2) : "-"}
                                                                    </span>
                                                                    {sub.is_verified && (
                                                                        <Badge className="bg-indigo-100 text-indigo-700 border-none hover:bg-indigo-100 text-[10px] px-1.5 py-0 h-4">
                                                                            Verified
                                                                        </Badge>
                                                                    )}
                                                                </div>
                                                            </TableCell>
                                                            <TableCell className="text-xs text-gray-500 tabular-nums">
                                                                {sub.created_at ? format(new Date(sub.created_at), "HH:mm") : "-"}
                                                            </TableCell>
                                                            {contextIsOwner && (
                                                                <TableCell className="text-right">
                                                                    <div className="flex justify-end gap-2">
                                                                        <Button
                                                                            variant="outline"
                                                                            size="sm"
                                                                            className="shadow-sm gap-1.5 hover:bg-slate-50 hover:text-slate-900 border-slate-200"
                                                                            onClick={() => window.open(`/class/${id}/assignment/${selectedAssignmentId}/playground?submissionId=${sub.id}`, '_blank')}
                                                                            title="View Program Code"
                                                                        >
                                                                            <HiOutlineExternalLink className="w-4 h-4 text-slate-500" />
                                                                            <span className="hidden sm:inline-block">View Code</span>
                                                                        </Button>
                                                                        <Button
                                                                            variant="outline"
                                                                            size="sm"
                                                                            className="shadow-sm gap-1.5 hover:bg-gray-50 hover:text-gray-900 border-gray-200"
                                                                            onClick={() => handleOpenRunModal(sub)}
                                                                            title="Execute Output"
                                                                        >
                                                                            <HiOutlineCode className="w-4 h-4 text-indigo-500" />
                                                                            <span className="hidden sm:inline-block">Run</span>
                                                                        </Button>
                                                                        <Button
                                                                            variant="outline"
                                                                            size="sm"
                                                                            className="shadow-sm gap-1.5 hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-200"
                                                                            onClick={() => handleOpenGradeModal(sub)}
                                                                        >
                                                                            <HiOutlinePencilAlt className="w-4 h-4" />
                                                                            <span className="hidden sm:inline-block">Grade</span>
                                                                        </Button>
                                                                    </div>
                                                                </TableCell>
                                                            )}
                                                        </TableRow>
                                                    ))
                                                }
                                            </React.Fragment>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </Card>
                </div>
            </div>

            {/* Grading Modal */}
            <Modal open={isGradeModalOpen} onClose={() => setIsGradeModalOpen(false)} title="Evaluate Submission">
                {gradingSubmission && (
                    <div className="py-4 space-y-5">
                        <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-100">
                            <Avatar className="h-10 w-10">
                                <AvatarImage src={memberMap.get(gradingSubmission.user_id)?.picture_path} />
                                <AvatarFallback className="bg-indigo-100 text-indigo-700 font-medium">
                                    {getInitials(memberMap.get(gradingSubmission.user_id)?.name || "??")}
                                </AvatarFallback>
                            </Avatar>
                            <div>
                                <p className="font-medium text-sm text-gray-900">
                                    {memberMap.get(gradingSubmission.user_id)?.name || `Student ID: ${gradingSubmission.user_id}`}
                                </p>
                                <p className="text-xs text-gray-500">
                                    Attempt {gradingSubmission.attempt_no} • System Status: <span className="font-medium text-gray-700 capitalize">{gradingSubmission.status}</span>
                                </p>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700">
                                    Score
                                </label>
                                <Input
                                    type="number"
                                    step="0.01"
                                    value={gradeInput.score}
                                    onChange={(e) => setGradeInput({ ...gradeInput, score: parseFloat(e.target.value) || 0 })}
                                    className="h-9"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700 flex justify-between">
                                    <span>Feedback</span>
                                    <span className="text-gray-400 font-normal text-xs">(Optional)</span>
                                </label>
                                <Textarea
                                    placeholder="Add constructive feedback for the student..."
                                    value={gradeInput.feed_back || ""}
                                    onChange={(e) => setGradeInput({ ...gradeInput, feed_back: e.target.value })}
                                    rows={4}
                                    className="resize-none"
                                />
                            </div>

                            <div className="flex items-center space-x-2 pt-2">
                                <Checkbox
                                    id="verified"
                                    checked={gradeInput.is_verified}
                                    onCheckedChange={(checked) => setGradeInput({ ...gradeInput, is_verified: !!checked })}
                                />
                                <label
                                    htmlFor="verified"
                                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                                >
                                    Mark as verified
                                </label>
                            </div>
                            <p className="text-xs text-gray-500 pl-6">
                                Verified submissions indicate the teacher has manually reviewed this attempt. It will also lock the score.
                            </p>
                        </div>
                    </div>
                )}

                <div className="flex justify-end gap-3 mt-6">
                    <Button variant="outline" onClick={() => setIsGradeModalOpen(false)} disabled={isSubmittingGrade}>
                        Cancel
                    </Button>
                    <Button onClick={handleSaveGrade} disabled={isSubmittingGrade} className="bg-indigo-600 hover:bg-indigo-700 text-white">
                        {isSubmittingGrade ? "Saving..." : "Save Grade"}
                    </Button>
                </div>
            </Modal>

            {/* Run Execution Modal */}
            <SubmissionRunModal
                open={isRunModalOpen}
                onClose={() => setIsRunModalOpen(false)}
                submission={runningSubmission}
                assignment={assignments.find((a) => a.id === selectedAssignmentId) || null}
                testSuites={testSuites}
            />

        </div>
    );
}
