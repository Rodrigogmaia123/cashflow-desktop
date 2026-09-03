"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { updateOfferFeeProfile } from "./actions";

interface UpdateFeeProfileFormProps {
  offerId: string;
  feeProfiles: Array<{ id: string; name: string }>;
  currentFeeProfileId: string | null;
}

export function UpdateFeeProfileForm({
  offerId,
  feeProfiles,
  currentFeeProfileId,
}: UpdateFeeProfileFormProps) {
  const router = useRouter();

  const handleSubmit = async (formData: FormData) => {
    await updateOfferFeeProfile(formData);
    router.refresh();
  };

  return (
    <form
      action={handleSubmit}
      className="mt-2 flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground"
    >
      <input type="hidden" name="offerId" value={offerId} />
      <label
        htmlFor="feeProfileId"
        className="font-medium"
      >
        Alterar perfil de taxas:
      </label>
      <select
        id="feeProfileId"
        name="feeProfileId"
        defaultValue={currentFeeProfileId ?? feeProfiles[0]?.id}
        className="h-7 rounded-md border bg-background px-2 text-[11px] outline-none focus-visible:ring-1 focus-visible:ring-ring"
      >
        {feeProfiles.map((fp) => (
          <option key={fp.id} value={fp.id}>
            {fp.name}
          </option>
        ))}
      </select>
      <Button type="submit" size="sm" variant="outline">
        Atualizar (futuros)
      </Button>
    </form>
  );
}

