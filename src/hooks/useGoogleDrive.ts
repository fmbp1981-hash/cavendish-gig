import { useMutation, useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

const sb = supabase;

interface DriveFolder {
    id: string;
    name: string;
    webViewLink: string;
}

interface CreateFolderResult {
    rootFolder: DriveFolder;
    subfolders: Record<string, DriveFolder>;
}

export function useGoogleDriveSettings() {
    return useQuery({
        queryKey: ['google-drive-settings'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('system_settings')
                .select('key, value')
                .in('key', ['google_drive_enabled', 'google_drive_base_folder_id']);

            if (error) throw error;

            const settings: Record<string, string | null> = {};
            const rows = (data ?? []) as unknown as Array<{ key: string; value: string | null }>;
            rows.forEach((row) => {
                settings[row.key] = row.value;
            });

            return {
                enabled: settings['google_drive_enabled'] === 'true',
                baseFolderId: settings['google_drive_base_folder_id'] || null,
            };
        },
    });
}

export function useUpdateDriveSettings() {
    return useMutation({
        mutationFn: async ({
            enabled,
            baseFolderId
        }: {
            enabled?: boolean;
            baseFolderId?: string;
        }) => {
            const updates = [];

            if (enabled !== undefined) {
                updates.push(
                    supabase
                        .from('system_settings')
                        .upsert({
                            key: 'google_drive_enabled',
                            value: String(enabled)
                        }, { onConflict: 'key' })
                );
            }

            if (baseFolderId !== undefined) {
                updates.push(
                    supabase
                        .from('system_settings')
                        .upsert({
                            key: 'google_drive_base_folder_id',
                            value: baseFolderId
                        }, { onConflict: 'key' })
                );
            }

            await Promise.all(updates);
        },
    });
}

export function useCreateClientDriveFolder() {
    return useMutation({
        mutationFn: async ({
            clientName,
            organizacaoId
        }: {
            clientName: string;
            organizacaoId: string;
        }): Promise<CreateFolderResult | null> => {
            // First check if Drive is enabled and get base folder
            const { data: settings } = await supabase
                .from('system_settings')
                .select('key, value')
                .in('key', ['google_drive_enabled', 'google_drive_base_folder_id']);

            const settingsMap: Record<string, string | null> = {};
            const rows = (settings ?? []) as unknown as Array<{ key: string; value: string | null }>;
            rows.forEach((row) => {
                settingsMap[row.key] = row.value;
            });

            if (settingsMap['google_drive_enabled'] !== 'true') {
                console.log('Google Drive integration is disabled');
                return null;
            }

            const baseFolderId = settingsMap['google_drive_base_folder_id'];

            // Call the edge function to create folder structure
            const { data, error } = await supabase.functions.invoke('google-drive', {
                body: {
                    action: 'createClientStructure',
                    clientName,
                    organizacaoId,
                    parentFolderId: baseFolderId,
                },
            });

            if (error) throw error;

            if (data?.success && data?.data) {
                return data.data as CreateFolderResult;
            }

            return null;
        },
    });
}

export function useUploadToDrive() {
    return useMutation({
        mutationFn: async ({
            organizacaoId,
            file,
            targetFolder = "01 - Documentos Recebidos",
        }: {
            organizacaoId: string;
            file: File;
            targetFolder?: string; // subfolder name like "01 - Documentos Recebidos"
        }) => {
            // Check if Drive is enabled
            const { data: settings } = await sb
                .from('system_settings')
                .select('value')
                .eq('key', 'google_drive_enabled')
                .single();

            if (settings?.value !== 'true') {
                console.log('Google Drive integration is disabled, skipping upload');
                return { success: false, message: 'Google Drive integration is disabled' };
            }

            // Get the organization's Drive folder structure
            const { data: org } = await sb
                .from('organizacoes')
                .select('drive_folder_id')
                .eq('id', organizacaoId)
                .single();

            if (!org?.drive_folder_id) {
                throw new Error('Organization does not have a Google Drive folder configured');
            }

            // Get list of subfolders to find the target folder ID
            const { data: listResult, error: listError } = await supabase.functions.invoke('google-drive', {
                body: {
                    action: 'listFolders',
                    parentFolderId: org.drive_folder_id,
                },
            });

            if (listError) throw listError;

            const targetFolderObj = listResult?.data?.find(
                (folder: { name: string; id: string }) => folder.name === targetFolder
            );

            if (!targetFolderObj) {
                throw new Error(`Target folder "${targetFolder}" not found in organization Drive`);
            }

            // Convert file to base64
            const reader = new FileReader();
            const base64Promise = new Promise<string>((resolve, reject) => {
                reader.onload = () => {
                    const result = reader.result as string;
                    const base64 = result.split(',')[1]; // Remove data:mime;base64, prefix
                    resolve(base64);
                };
                reader.onerror = reject;
            });
            reader.readAsDataURL(file);
            const fileData = await base64Promise;

            // Upload file to Drive
            const { data, error } = await supabase.functions.invoke('google-drive', {
                body: {
                    action: 'uploadFile',
                    fileName: file.name,
                    fileData,
                    mimeType: file.type,
                    parentFolderId: targetFolderObj.id,
                },
            });

            if (error) throw error;

            return { success: true, data };
        },
    });
}

export function useShareDriveFolder() {
    return useMutation({
        mutationFn: async ({
            folderId,
            email,
            role = 'reader',
        }: {
            folderId: string;
            email: string;
            role?: 'reader' | 'writer' | 'commenter';
        }) => {
            const { data, error } = await supabase.functions.invoke('google-drive', {
                body: {
                    action: 'shareFolder',
                    folderId,
                    email,
                    role,
                },
            });

            if (error) throw error;
            return data;
        },
    });
}
