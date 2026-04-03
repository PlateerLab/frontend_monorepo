'use client';

import React, { useState, useEffect } from 'react';
import type { AdminGroup } from '@xgen/types';
import { AVAILABLE_USER_SECTIONS } from '@xgen/types';
import { Modal, Label, Button, Switch } from '@xgen/ui';
import { useTranslation } from '@xgen/i18n';

interface GroupPermissionModalProps {
  group: AdminGroup | null;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    group_name: string;
    available: boolean;
    available_sections: string[];
  }) => Promise<void>;
}

export const GroupPermissionModal: React.FC<GroupPermissionModalProps> = ({
  group,
  isOpen,
  onClose,
  onSubmit,
}) => {
  const { t } = useTranslation();
  const [available, setAvailable] = useState(true);
  const [sections, setSections] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (group) {
      setAvailable(group.available);
      setSections(group.available_sections || []);
    }
  }, [group]);

  if (!group) return null;

  const toggleSection = (section: string) => {
    setSections((prev) =>
      prev.includes(section)
        ? prev.filter((s) => s !== section)
        : [...prev, section],
    );
  };

  const selectAll = () => setSections([...AVAILABLE_USER_SECTIONS]);
  const clearAll = () => setSections([]);

  const handleSubmit = async () => {
    setSaving(true);
    try {
      await onSubmit({
        group_name: group.group_name,
        available,
        available_sections: sections,
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`${group.group_name} ${t('admin.userManagement.groupPermissions.permissionModal.titleSuffix')}`}
      size="lg"
      footer={
        <div className="flex gap-2">
          <Button variant="outline" onClick={onClose}>
            {t('admin.userManagement.groupPermissions.cancel')}
          </Button>
          <Button onClick={handleSubmit} disabled={saving}>
            {saving
              ? t('admin.userManagement.userEditModal.saving')
              : t('admin.userManagement.groupPermissions.permissionModal.update')}
          </Button>
        </div>
      }
    >
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <Switch checked={available} onCheckedChange={setAvailable} />
          <Label>
            {available
              ? t('admin.userManagement.groupPermissions.permissionModal.statusActive')
              : t('admin.userManagement.groupPermissions.permissionModal.statusInactive')}
          </Label>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label>{t('admin.userManagement.groupPermissions.permissionModal.availableSections')}</Label>
            <div className="flex gap-1">
              <Button variant="ghost" size="sm" onClick={selectAll}>
                {t('admin.userManagement.groupPermissions.permissionModal.selectAll')}
              </Button>
              <Button variant="ghost" size="sm" onClick={clearAll}>
                {t('admin.userManagement.groupPermissions.permissionModal.clearAll')}
              </Button>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {AVAILABLE_USER_SECTIONS.map((section) => (
              <Button
                key={section}
                variant={sections.includes(section) ? 'secondary' : 'outline'}
                size="sm"
                onClick={() => toggleSection(section)}
              >
                {section}
              </Button>
            ))}
          </div>
          <p className="text-xs text-muted-foreground">
            {t('admin.userManagement.groupPermissions.permissionModal.selectedCount', {
              count: String(sections.length),
              total: String(AVAILABLE_USER_SECTIONS.length),
            })}
          </p>
        </div>
      </div>
    </Modal>
  );
};
