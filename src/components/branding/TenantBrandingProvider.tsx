"use client";

import { ReactNode, useEffect, useMemo, useState, createContext, useContext } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useTenantBranding } from "@/hooks/useTenantBranding";

interface BrandingContextValue {
  companyName?: string;
  logoUrl?: string;
  faviconUrl?: string;
  isLoading: boolean;
}

const BrandingContext = createContext<BrandingContextValue>({
  isLoading: false,
});

export function useBrandingContext() {
  return useContext(BrandingContext);
}

function setCssVar(name: string, value: string | null | undefined) {
  if (!value) return;
  document.documentElement.style.setProperty(name, value);
}

export function TenantBrandingProvider({ children }: { children: ReactNode }) {
  const { user, isAdmin, isConsultor } = useAuth();

  const { data: memberOrgId } = useQuery({
    queryKey: ["tenant-org-membership", user?.id],
    queryFn: async (): Promise<string | null> => {
      if (!user) return null;
      const { data, error } = await (supabase as any)
        .from("organization_members")
        .select("organizacao_id")
        .eq("user_id", user.id)
        .maybeSingle();
      if (error) throw error;
      return data?.organizacao_id || null;
    },
    enabled: !!user,
    staleTime: 60_000,
    retry: 1,
  });

  const [previewOrgId, setPreviewOrgId] = useState<string | null>(null);

  useEffect(() => {
    const readPreview = () => {
      try {
        const id = window.localStorage.getItem("tenant_branding_preview_org_id");
        setPreviewOrgId(id || null);
      } catch {
        setPreviewOrgId(null);
      }
    };

    readPreview();
    window.addEventListener("tenant-branding-preview-change", readPreview);
    return () => window.removeEventListener("tenant-branding-preview-change", readPreview);
  }, []);

  const organizacaoId = useMemo(() => {
    if (memberOrgId) return memberOrgId;
    if ((isAdmin || isConsultor) && previewOrgId) return previewOrgId;
    return undefined;
  }, [memberOrgId, isAdmin, isConsultor, previewOrgId]);

  const { data: branding } = useTenantBranding(organizacaoId);

  useEffect(() => {
    const styleId = "tenant-custom-css";
    let styleEl = document.getElementById(styleId) as HTMLStyleElement | null;
    if (!styleEl) {
      styleEl = document.createElement("style");
      styleEl.id = styleId;
      document.head.appendChild(styleEl);
    }

    const faviconId = "tenant-favicon";
    const faviconLinkId = document.getElementById(faviconId) as HTMLLinkElement | null;

    if (!branding) {
      // Clear optional overrides if switching away / no branding
      styleEl.textContent = "";
      if (faviconLinkId) faviconLinkId.remove();
      // Reset to default title
      document.title = "Sistema GIG";
      return;
    }

    setCssVar("--primary", branding.primary_hsl);
    setCssVar("--secondary", branding.secondary_hsl);
    setCssVar("--accent", branding.accent_hsl);

    // Optional per-tenant CSS overrides
    styleEl.textContent = branding.custom_css || "";

    // Update page title with company name
    if (branding.company_name) {
      document.title = `Sistema GIG - ${branding.company_name}`;
    } else {
      document.title = "Sistema GIG";
    }

    // Favicon per tenant
    if (branding.favicon_url) {
      let linkEl = document.getElementById(faviconId) as HTMLLinkElement | null;
      if (!linkEl) {
        linkEl = document.createElement("link");
        linkEl.id = faviconId;
        linkEl.rel = "icon";
        document.head.appendChild(linkEl);
      }
      linkEl.href = branding.favicon_url;
    } else if (faviconLinkId) {
      faviconLinkId.remove();
    }
  }, [branding]);

  const brandingContextValue = useMemo<BrandingContextValue>(
    () => ({
      companyName: branding?.company_name,
      logoUrl: branding?.logo_url,
      faviconUrl: branding?.favicon_url,
      isLoading: false,
    }),
    [branding]
  );

  return (
    <BrandingContext.Provider value={brandingContextValue}>
      {children}
    </BrandingContext.Provider>
  );
}
