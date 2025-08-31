"use client";

import WorkPlane from "./WorkPlane";

export default function AssignmentPlayPage() {
  // This page intentionally does not render the app sidebar/topnav.
  // It mounts a full-bleed workplane for the React Flow editor.

  return (
    <div className="w-full h-full">
      <WorkPlane />
    </div>
  );
}
