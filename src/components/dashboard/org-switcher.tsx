"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronsUpDown, Building2, Check, Plus } from "lucide-react";
import { PlanType } from "@prisma/client";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PLAN_NAMES } from "@/lib/plans";
import { cn } from "@/lib/utils";

interface Organization {
  id: string;
  name: string;
  slug: string;
  plan: PlanType;
  role: string;
}

interface OrgSwitcherProps {
  organizations: Organization[];
  currentOrgSlug?: string;
}

export function OrgSwitcher({ organizations, currentOrgSlug }: OrgSwitcherProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  // Use first org as current if not specified
  const currentOrg = currentOrgSlug
    ? organizations.find((o) => o.slug === currentOrgSlug)
    : organizations[0];

  if (!currentOrg) return null;

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          aria-label={`Current organization: ${currentOrg.name}`}
          className="flex items-center gap-2 h-9 px-3 font-normal"
        >
          <Building2 className="h-4 w-4 text-muted-foreground flex-shrink-0" aria-hidden="true" />
          <span className="max-w-[140px] truncate text-sm">{currentOrg.name}</span>
          <Badge variant="secondary" className="text-[10px] py-0 px-1.5 h-4 ml-1 hidden sm:flex">
            {PLAN_NAMES[currentOrg.plan]}
          </Badge>
          <ChevronsUpDown className="h-3.5 w-3.5 ml-1 opacity-50 flex-shrink-0" aria-hidden="true" />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="start" className="w-64">
        <DropdownMenuLabel className="text-xs text-muted-foreground font-normal">
          Your organizations
        </DropdownMenuLabel>

        {organizations.map((org) => (
          <DropdownMenuItem
            key={org.id}
            onClick={() => {
              // TODO: implement org switching via cookie/server action
              setOpen(false);
            }}
            className="flex items-center gap-2 cursor-pointer"
          >
            <Building2 className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{org.name}</p>
              <p className="text-xs text-muted-foreground capitalize">{org.role.toLowerCase()}</p>
            </div>
            <Badge variant="outline" className="text-[10px] py-0 px-1.5 h-4 flex-shrink-0">
              {PLAN_NAMES[org.plan]}
            </Badge>
            {org.id === currentOrg.id && (
              <Check className="h-4 w-4 text-primary flex-shrink-0" aria-hidden="true" />
            )}
          </DropdownMenuItem>
        ))}

        <DropdownMenuSeparator />

        <DropdownMenuItem
          onClick={() => {
            setOpen(false);
            router.push("/settings/new-org");
          }}
          className="flex items-center gap-2 cursor-pointer text-muted-foreground"
        >
          <Plus className="h-4 w-4" aria-hidden="true" />
          <span className="text-sm">Create organization</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
