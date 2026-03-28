"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import { format } from "date-fns";
import {
    HiOutlineSearch,
    HiOutlineFilter,
    HiOutlineUserGroup,
    HiOutlineMail,
    HiChevronLeft,
    HiTrash
} from "react-icons/hi";
import { DateRange } from "react-day-picker";

import { getClassMembers, Member, changeMemberRole, removeMember, inviteMember } from "@/lib/api/class";
import { useClass } from "../ClassContext";
import { DatePickerWithRange } from "@/components/ui/date-range-picker";
import { InviteMemberDialog } from "@/components/class/InviteMemberDialog";
import { HiOutlineClipboardCopy, HiOutlinePlus, HiCheck } from "react-icons/hi";
import ClassToolHeader from "@/components/class/ClassToolHeader";

import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/Checkbox";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Skeleton } from "@/components/ui/Skeleton";
import { cn } from "@/lib/utils";

export default function MemberPage() {
    const { id } = useParams() as { id: string };
    const router = useRouter();
    const { classData, isOwner: contextIsOwner, loading: contextLoading } = useClass();

    const [members, setMembers] = useState<Member[]>([]);
    const [loading, setLoading] = useState(true);
    // Removed local isOwner and classCode state, derived from context
    const isOwner = contextIsOwner;
    const classCode = classData?.code || null;

    const [searchQuery, setSearchQuery] = useState("");
    const [selectedMembers, setSelectedMembers] = useState<number[]>([]);

    // Advanced Filters
    const [dateRange, setDateRange] = useState<DateRange | undefined>();
    const [roleFilter, setRoleFilter] = useState<string>("all"); // "all", "teacher", "student"

    // Dialog State
    const [isConfirmOpen, setIsConfirmOpen] = useState(false);
    const [memberToKick, setMemberToKick] = useState<Member | null>(null);
    const [isBulkAction, setIsBulkAction] = useState(false);
    const [kickLoading, setKickLoading] = useState(false);

    // Invite State
    const [isInviteOpen, setIsInviteOpen] = useState(false);
    const [inviteLoading, setInviteLoading] = useState(false);
    const [copiedCode, setCopiedCode] = useState(false);

    // Filter Loading State
    const [isFiltering, setIsFiltering] = useState(false);

    useEffect(() => {
        if (!contextLoading) {
            fetchMembers();
        }
    }, [id, contextLoading]);

    useEffect(() => {
        if (loading) return;
        setIsFiltering(true);
        const timer = setTimeout(() => setIsFiltering(false), 350);
        return () => clearTimeout(timer);
    }, [searchQuery, dateRange, roleFilter]);

    const showSkeleton = loading || isFiltering || contextLoading;

    const fetchMembers = async () => {
        const startTime = Date.now();
        try {
            setLoading(true);

            const membersData = await getClassMembers(id);

            // Ensure min 0.35s delay for smooth UI
            const elapsed = Date.now() - startTime;
            if (elapsed < 350) {
                await new Promise(resolve => setTimeout(resolve, 350 - elapsed));
            }

            // Default to empty array if null
            setMembers(membersData || []);
        } catch (error) {
            console.error("Failed to fetch members:", error);
            toast.error("Failed to load class members");
        } finally {
            setLoading(false);
        }
    };

    const handleInvite = async (email: string) => {
        try {
            setInviteLoading(true);
            await inviteMember(id, email);
            toast.success(`Invitation sent to ${email}`);
            setIsInviteOpen(false);
        } catch (error) {
            console.error("Failed to invite member:", error);
            toast.error("Failed to send invitation. Please try again.");
        } finally {
            setInviteLoading(false);
        }
    };

    const handleCopyCode = () => {
        if (!classCode) return;
        navigator.clipboard.writeText(classCode);
        setCopiedCode(true);
        toast.success("Class code copied to clipboard");
        setTimeout(() => setCopiedCode(false), 2000);
    };

    const handleRoleChange = async (userId: number, newRole: string) => {
        try {
            // Optimistic update
            setMembers(prev => prev.map(m => m.id === userId ? { ...m, role: newRole } : m));
            await changeMemberRole(id, userId, newRole);
            toast.success(`Role updated to ${newRole}`);
        } catch (error) {
            console.error("Failed to update role:", error);
            toast.error("Failed to update role");
            // Revert on failure
            fetchMembers();
        }
    };

    const handleKickMember = (member: Member) => {
        setIsBulkAction(false);
        setMemberToKick(member);
        setIsConfirmOpen(true);
    };

    const handleBulkKick = () => {
        setIsBulkAction(true);
        setMemberToKick(null);
        setIsConfirmOpen(true);
    };

    const onConfirmKick = async () => {
        if (!isBulkAction && !memberToKick) return;
        if (isBulkAction && selectedMembers.length === 0) return;

        try {
            setKickLoading(true);
            if (isBulkAction) {
                // Bulk delete
                const targets = [...selectedMembers];
                setMembers(prev => prev.filter(m => !targets.includes(m.id)));

                await Promise.all(targets.map(userId => removeMember(id, userId)));

                toast.success(`${targets.length} members removed successfully`);
                setSelectedMembers([]);
            } else if (memberToKick) {
                // Single delete
                const userId = memberToKick.id;
                setMembers(prev => prev.filter(m => m.id !== userId));
                await removeMember(id, userId);
                toast.success("Member removed successfully");
            }
            setIsConfirmOpen(false);
        } catch (error) {
            console.error("Failed to remove member(s):", error);
            toast.error("Failed to remove member(s)");
            // Revert on failure
            fetchMembers();
        } finally {
            setKickLoading(false);
            setMemberToKick(null);
            setIsBulkAction(false);
        }
    };

    // Filter Logic
    const filteredMembers = (members || []).filter((member) => {
        const query = searchQuery.toLowerCase();
        const matchesSearch =
            member.name.toLowerCase().includes(query) ||
            member.email.toLowerCase().includes(query);

        let matchesRole = true;
        if (roleFilter !== "all") {
            if (roleFilter === "teacher") matchesRole = member.role === "teacher" || member.role === "owner";
            if (roleFilter === "student") matchesRole = member.role === "student" || member.role === "member" || !member.role;
        }

        let matchesDate = true;
        if (dateRange?.from) {
            const joinDate = member.join_at ? new Date(member.join_at) : null;
            if (joinDate) {
                if (dateRange.to) {
                    matchesDate = joinDate >= dateRange.from && joinDate <= dateRange.to;
                } else {
                    matchesDate = joinDate >= dateRange.from;
                }
            }
        }

        return matchesSearch && matchesRole && matchesDate;
    });

    const toggleSelectAll = (checked: boolean) => {
        if (checked) {
            setSelectedMembers(filteredMembers.map((m) => m.id));
        } else {
            setSelectedMembers([]);
        }
    };

    const toggleSelectMember = (memberId: number, checked: boolean) => {
        if (checked) {
            setSelectedMembers((prev) => [...prev, memberId]);
        } else {
            setSelectedMembers((prev) => prev.filter((id) => id !== memberId));
        }
    };

    const getInitials = (name: string) => {
        return name
            .split(" ")
            .map((n) => n[0])
            .join("")
            .toUpperCase()
            .slice(0, 2);
    };

    const RoleToggle = () => (
        <div className="flex items-center p-1 bg-gray-100 rounded-lg border border-gray-200">
            <button
                onClick={() => setRoleFilter(roleFilter === "all" ? "teacher" : roleFilter === "teacher" ? "student" : "all")}
                className="relative px-3 py-1.5 text-sm font-medium transition-all flex items-center gap-2"
            >
                <div className={cn(
                    "w-3 h-3 rounded-full",
                    roleFilter === "all" ? "bg-gray-400" :
                        roleFilter === "teacher" ? "bg-indigo-500" : "bg-emerald-500"
                )} />
                <span className="text-gray-700">
                    {roleFilter === "all" ? "All Roles" :
                        roleFilter === "teacher" ? "TA Only" : "Student Only"}
                </span>
            </button>
        </div>
    );

    const TableSkeleton = () => (
        <>
            {[...Array(5)].map((_, i) => (
                <TableRow key={i}>
                    {isOwner && <TableCell><Skeleton className="h-4 w-4 rounded" /></TableCell>}
                    <TableCell>
                        <div className="flex items-center gap-3">
                            <Skeleton className="h-10 w-10 rounded-full" />
                            <Skeleton className="h-4 w-24" />
                        </div>
                    </TableCell>
                    <TableCell><Skeleton className="h-6 w-16 rounded-full" /></TableCell>
                    <TableCell>
                        <div className="flex items-center gap-2">
                            <Skeleton className="h-4 w-4 rounded-full" />
                            <Skeleton className="h-4 w-32" />
                        </div>
                    </TableCell>
                    <TableCell className="text-right font-medium">
                        <Skeleton className="h-4 w-20 ml-auto" />
                    </TableCell>
                    {isOwner && <TableCell><Skeleton className="h-8 w-8 rounded ml-auto" /></TableCell>}
                </TableRow>
            ))}
        </>
    );

    return (
        <div className="min-h-screen bg-gray-50/50 pb-20">
            {/* Header */}
            <ClassToolHeader
                title="Class Members"
                subtitle="Manage students and instructors in this class"
                showBackButton
            >
                {isOwner && classCode && (
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={handleCopyCode}
                        className={cn(
                            "flex items-center gap-2 border-dashed border-indigo-200 text-indigo-700 bg-indigo-50 hover:bg-indigo-100 transition-all",
                            copiedCode && "border-green-300 bg-green-50 text-green-700"
                        )}
                    >
                        {copiedCode ? (
                            <HiCheck className="w-4 h-4" />
                        ) : (
                            <HiOutlineClipboardCopy className="w-4 h-4" />
                        )}
                        <span className="font-mono font-bold tracking-wider">{classCode}</span>
                    </Button>
                )}
                {isOwner && (
                    <Button
                        size="sm"
                        onClick={() => setIsInviteOpen(true)}
                        className="hidden sm:flex gap-2 bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-600/20"
                    >
                        <HiOutlinePlus className="w-4 h-4" />
                        <span>Invite</span>
                    </Button>
                )}
                <div className="text-sm font-medium bg-indigo-500/20 px-3 py-1 rounded-full text-indigo-600 whitespace-nowrap">
                    <span className="font-bold ">{(members?.length || 0)}</span> <span className="hidden sm:inline">Total Members</span><span className="sm:hidden">Members</span>
                </div>
            </ClassToolHeader>

            <div className="max-w-screen-xl mx-auto px-4 md:px-6 py-8 space-y-8">
                {/* Toolbar */}
                <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                    <div className="flex items-center gap-4 w-full md:w-auto flex-1">
                        <div className="relative flex-1 md:max-w-96">
                            <HiOutlineSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <Input
                                placeholder="Search by name or email..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-9 bg-white"
                            />
                        </div>
                        {(isOwner && selectedMembers.length > 0) && (
                            <Button
                                variant="destructive"
                                size="sm"
                                className="flex items-center gap-2 animate-in fade-in slide-in-from-left-2 duration-200"
                                onClick={handleBulkKick}
                            >
                                <HiTrash className="w-4 h-4" />
                                <span>Delete Selected ({selectedMembers.length})</span>
                            </Button>
                        )}
                    </div>
                    <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
                        <DatePickerWithRange date={dateRange} setDate={setDateRange} />
                        <RoleToggle />
                    </div>
                </div>

                {/* Members Table */}
                <Card className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                    <div className="relative w-full overflow-auto">
                        <Table>
                            <TableHeader className="bg-gray-50/50">
                                <TableRow>
                                    {isOwner && (
                                        <TableHead className="w-[50px]">
                                            <Checkbox
                                                checked={
                                                    filteredMembers.length > 0 &&
                                                    selectedMembers.length === filteredMembers.length
                                                }
                                                onCheckedChange={(checked) => toggleSelectAll(checked as boolean)}
                                            />
                                        </TableHead>
                                    )}
                                    <TableHead>Member</TableHead>
                                    <TableHead>Role</TableHead>
                                    <TableHead>Email</TableHead>
                                    <TableHead className="text-right">Joined Date</TableHead>
                                    {isOwner && <TableHead className="w-[50px]"></TableHead>}
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {showSkeleton ? (
                                    <TableSkeleton />
                                ) : filteredMembers.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={6} className="h-32 text-center">
                                            <div className="flex flex-col items-center justify-center text-muted-foreground">
                                                <HiOutlineUserGroup className="w-8 h-8 mb-2 opacity-20" />
                                                <p>No members found</p>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    filteredMembers.map((member) => (
                                        <TableRow key={member.id} className="group hover:bg-gray-50/50 transition-colors">
                                            {isOwner && (
                                                <TableCell>
                                                    <Checkbox
                                                        checked={selectedMembers.includes(member.id)}
                                                        onCheckedChange={(checked) =>
                                                            toggleSelectMember(member.id, checked as boolean)
                                                        }
                                                    />
                                                </TableCell>
                                            )}
                                            <TableCell>
                                                <div className="flex items-center gap-3">
                                                    <Avatar>
                                                        <AvatarImage src={member.picture_path} alt={member.name} />
                                                        <AvatarFallback className="bg-indigo-100 text-indigo-700 font-medium">
                                                            {getInitials(member.name)}
                                                        </AvatarFallback>
                                                    </Avatar>
                                                    <div className="flex flex-col">
                                                        <span className="font-medium text-gray-900 group-hover:text-indigo-600 transition-colors">
                                                            {member.name}
                                                        </span>
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild disabled={!isOwner}>
                                                        <Badge
                                                            variant={member.role === "owner" || member.role === "teacher" ? "default" : "secondary"}
                                                            className={cn(
                                                                "capitalize font-normal select-none",
                                                                isOwner && "cursor-pointer",
                                                                member.role === "owner" && "bg-indigo-100 text-indigo-700 border-indigo-200",
                                                                member.role === "teacher" && "bg-purple-100 text-purple-700 border-purple-200",
                                                                (member.role === "student" || member.role === "member" || !member.role) && "bg-green-100 text-green-700 border-green-200"
                                                            )}
                                                        >
                                                            {member.role === "student" || member.role === "member" || !member.role ? "Student" : member.role}
                                                        </Badge>
                                                    </DropdownMenuTrigger>

                                                    {isOwner && member.role !== "owner" && (
                                                        <DropdownMenuContent align="start" className="w-32">
                                                            <DropdownMenuItem onClick={() => handleRoleChange(member.id, "teacher")}>
                                                                <div className="flex items-center gap-2">
                                                                    <span className="w-1.5 h-1.5 rounded-full bg-purple-500"></span>
                                                                    <span>TA</span>
                                                                </div>
                                                            </DropdownMenuItem>
                                                            <DropdownMenuItem onClick={() => handleRoleChange(member.id, "student")}>
                                                                <div className="flex items-center gap-2">
                                                                    <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                                                                    <span>Student</span>
                                                                </div>
                                                            </DropdownMenuItem>
                                                        </DropdownMenuContent>
                                                    )}
                                                </DropdownMenu>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-2 text-muted-foreground">
                                                    <HiOutlineMail className="w-4 h-4" />
                                                    <span className="text-sm">{member.email}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-right text-muted-foreground tabular-nums">
                                                {member.join_at ? format(new Date(member.join_at), "MMM d, yyyy") : "-"}
                                            </TableCell>
                                            <TableCell>
                                                {isOwner && member.role !== "owner" && (
                                                    <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-8 w-8 text-red-400 hover:text-red-600 hover:bg-red-50"
                                                            onClick={() => handleKickMember(member)}
                                                        >
                                                            <HiTrash className="w-4 h-4" />
                                                        </Button>
                                                    </div>
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </Card>
            </div>
            <ConfirmDialog
                isOpen={isConfirmOpen}
                onClose={() => setIsConfirmOpen(false)}
                onConfirm={onConfirmKick}
                title={isBulkAction ? "Remove Selected Members" : "Remove Member"}
                description={
                    isBulkAction
                        ? `Are you sure you want to remove ${selectedMembers.length} selected members from this class?`
                        : (memberToKick ? `Are you sure you want to remove ${memberToKick.name} from this class?` : "Are you sure you want to remove this member?")
                }
                confirmLabel={isBulkAction ? "Remove All" : "Remove"}
                variant="destructive"
                loading={kickLoading}
            />
            <InviteMemberDialog
                isOpen={isInviteOpen}
                onClose={() => setIsInviteOpen(false)}
                onInvite={handleInvite}
                loading={inviteLoading}
            />
        </div>
    );
}
