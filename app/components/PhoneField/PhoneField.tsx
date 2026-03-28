"use client";

import { useState } from "react";
import PhoneInput, { isValidPhoneNumber } from "react-phone-number-input";

export function PhoneField({
  name = "phone",
  defaultCountry = "TH",
}: { name?: string; defaultCountry?: any }) {
  const [value, setValue] = useState<string | undefined>();

  return (
    <div>
      <label className="text-sm font-medium">Phone</label>
      <div className="mt-1">
        <PhoneInput
          international
          countryCallingCodeEditable={false}
          defaultCountry={defaultCountry}
          value={value}
          onChange={setValue}
          name={name}
          countrySelectProps={{ unicodeFlags: true }}
          placeholder="xx-xxx-xxxx"
        />
      </div>


      {value && !isValidPhoneNumber(value) && (
        <p className="mt-1 text-xs text-red-600">Invalid phone number</p>
      )}
    </div>
  );
}
