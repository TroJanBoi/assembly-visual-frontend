"use client";

import React from "react";
import { AssignmentFormData } from "@/types/assignment";
import { Horizontalrule } from "@/components/ui/Horizontalrule";

import SectionRegisters from "./step2/SectionRegisters";
import SectionMemory from "./step2/SectionMemory";
import SectionInstructions from "./step2/SectionInstructions";
import SectionTestSuites from "./step2/SectionTestSuites";

interface Step2ConditionalProps {
  formData: AssignmentFormData;
  setFormData: React.Dispatch<React.SetStateAction<AssignmentFormData>>;
}

export default function Step2Conditional({
  formData,
  setFormData,
}: Step2ConditionalProps) {
  return (
    <div className="space-y-8">
      {/* SECTION: Number of Registers */}
      <SectionRegisters formData={formData} setFormData={setFormData} />

      <Horizontalrule />

      {/* SECTION: Initial Memory Value */}
      <SectionMemory formData={formData} setFormData={setFormData} />

      <Horizontalrule />

      {/* SECTION: Allowed Instructions */}
      <SectionInstructions formData={formData} setFormData={setFormData} />

      <Horizontalrule />

      {/* SECTION: Test Suites & Cases */}
      <SectionTestSuites formData={formData} setFormData={setFormData} />
    </div>
  );
}
