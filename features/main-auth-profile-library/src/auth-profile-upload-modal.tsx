'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Modal, Button, Label, Input, useToast } from '@xgen/ui';
import { FiUpload } from '@xgen/icons';
import { useTranslation } from '@xgen/i18n';
import { uploadToAuthProfileStore, listMyStorageProfiles } from './api';
import type { MyStorageProfile } from './api';

// ─────────────────────────────────────────────────────────────
// Props
// ─────────────────────────────────────────────────────────────

interface AuthProfileUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

// ─────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────

export const AuthProfileUploadModal: React.FC<AuthProfileUploadModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { t } = useTranslation();
  const { toast } = useToast();

  const [myProfiles, setMyProfiles] = useState<MyStorageProfile[]>([]);
  const [loadingProfiles, setLoadingProfiles] = useState(false);
  const [uploading, setUploading] = useState(false);

  // Form state
  const [selectedServiceId, setSelectedServiceId] = useState('');
  const [description, setDescription] = useState('');
  const [tags, setTags] = useState('');

  // Load user's storage profiles on open
  const loadMyProfiles = useCallback(async () => {
    try {
      setLoadingProfiles(true);
      const profiles = await listMyStorageProfiles();
      setMyProfiles(profiles);
    } catch {
      toast.error(t('authProfileLibrary.upload.errors.loadProfilesFailed'));
    } finally {
      setLoadingProfiles(false);
    }
  }, [toast, t]);

  useEffect(() => {
    if (isOpen) {
      loadMyProfiles();
      // Reset form
      setSelectedServiceId('');
      setDescription('');
      setTags('');
    }
  }, [isOpen, loadMyProfiles]);

  // Auto-fill description when profile selected
  const handleProfileSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const serviceId = e.target.value;
    setSelectedServiceId(serviceId);
    if (serviceId) {
      const profile = myProfiles.find((p) => p.serviceId === serviceId);
      if (profile) setDescription(profile.description || '');
    } else {
      setDescription('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedServiceId) {
      toast.error(t('authProfileLibrary.upload.errors.selectProfile'));
      return;
    }

    const profile = myProfiles.find((p) => p.serviceId === selectedServiceId);
    if (!profile) return;

    const tagArray = tags
      .split(',')
      .map((tag) => tag.trim())
      .filter((tag) => tag.length > 0);

    try {
      setUploading(true);
      await uploadToAuthProfileStore({
        serviceId: selectedServiceId,
        name: profile.name,
        description: description.trim(),
        tags: tagArray,
      });
      toast.success(t('authProfileLibrary.upload.success'));
      onSuccess();
      onClose();
    } catch (err) {
      const msg = err instanceof Error ? err.message : t('authProfileLibrary.upload.errors.uploadFailed');
      toast.error(msg);
    } finally {
      setUploading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={t('authProfileLibrary.upload.title')}
      size="md"
      footer={
        <div className="flex justify-end gap-2">
          <Button variant="outline" size="sm" onClick={onClose} disabled={uploading}>
            {t('authProfileLibrary.upload.cancel')}
          </Button>
          <Button size="sm" onClick={handleSubmit} disabled={uploading || !selectedServiceId}>
            <FiUpload className="mr-1" />
            {uploading
              ? t('authProfileLibrary.upload.uploading')
              : t('authProfileLibrary.upload.submit')}
          </Button>
        </div>
      }
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {/* Profile selector */}
        <div className="flex flex-col gap-1.5">
          <Label>{t('authProfileLibrary.upload.selectProfile')} <span className="text-red-500">*</span></Label>
          <select
            value={selectedServiceId}
            onChange={handleProfileSelect}
            disabled={loadingProfiles || uploading}
            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
          >
            <option value="">{t('authProfileLibrary.upload.selectProfilePlaceholder')}</option>
            {myProfiles.map((profile) => (
              <option key={profile.serviceId} value={profile.serviceId}>
                {profile.name} ({profile.serviceId})
              </option>
            ))}
          </select>
        </div>

        {/* Description */}
        <div className="flex flex-col gap-1.5">
          <Label>{t('authProfileLibrary.upload.description')}</Label>
          <Input
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder={t('authProfileLibrary.upload.descriptionPlaceholder')}
            disabled={uploading}
          />
        </div>

        {/* Tags */}
        <div className="flex flex-col gap-1.5">
          <Label>{t('authProfileLibrary.upload.tags')}</Label>
          <Input
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            placeholder={t('authProfileLibrary.upload.tagsPlaceholder')}
            disabled={uploading}
          />
          <p className="text-xs text-muted-foreground">{t('authProfileLibrary.upload.tagsHint')}</p>
        </div>
      </form>
    </Modal>
  );
};

export default AuthProfileUploadModal;
