'use client';

import React, { useState } from 'react';
import { Modal, Input, Label, Button, Switch } from '@xgen/ui';
import { useTranslation } from '@xgen/i18n';
import { AVAILABLE_USER_SECTIONS } from '@xgen/types';

interface GroupCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    group_name: string;
    available: boolean;
    available_sections: string[];
  }) => Promise<void>;
}

export const GroupCreateModal: React.FC<GroupCreateModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
}) => {
  const { t } = useTranslation();
  const [groupName, setGroupName] = useState('');
  const [available, setAvailable] = useState(true);
  const [sections, setSections] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  const toggleSection = (section: string) => {
    setSections((prev) =>
      prev.includes(section)
        ? prev.filter((s) => s !== section)
        : [...prev, section],
    );
  };

  const handleSubmit = async () => {
    if (!groupName.trim()) return;
    setSaving(true);
    try {
      await onSubmit({
        group_name: groupName.trim(),
        available,
        available_sections: sections,
      });
      setGroupName('');
      setSections([]);
      setAvailable(true);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={t('admin.userManagement.groupPermissions.createModal.title')}
      size="md"
      footer={
        <div className="flex gap-2">
          <Button variant="outline" onClick={onClose}>
            {t('admin.userManagement.groupPermissions.createModal.cancel')}
          </Button>
          <Button onClick={handleSubmit} disabled={saving || !groupName.trim()}>
            {saving
              ? t('admin.userManagement.userEditModal.saving')
              : t('admin.userManagement.groupPermissions.createModal.create')}
          </Button>
        </div>
      }
    >
      <div className="space-y-4">
        <div className="space-y-2">
          <Label>{t('admin.userManagement.groupPermissions.createModal.groupName')}</Label>
          <Input
            value={groupName}
            onChange={(e) => setGroupName(e.target.value)}
            placeholder={t('admin.userManagement.groupPermissions.createModal.groupNamePlaceholder')}
          />
        </div>

        <div className="flex items-center gap-3">
          <Switch checked={available} onCheckedChange={setAvailable} />
          <Label>
            {available
              ? t('admin.userManagement.groupPermissions.permissionModal.statusActive')
              : t('admin.userManagement.groupPermissions.permissionModal.statusInactive')}
          </Label>
        </div>

        <div className="space-y-2">
          <Label>{t('admin.userManagement.groupPermissions.permissionModal.availableSections')}</Label>
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
        </div>
      </div>
    </Modal>
  );
};
