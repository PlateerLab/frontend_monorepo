'use client';

import React, { useState, useEffect } from 'react';
import type { AdminWorkflowMeta } from '@xgen/api-client';
import { updateWorkflowAdmin, getAllGroupsList } from '@xgen/api-client';
import { Modal, Button, ToggleSwitch, useToast } from '@xgen/ui';
import { useTranslation } from '@xgen/i18n';

interface WorkflowEditModalProps {
  workflow: AdminWorkflowMeta;
  isOpen: boolean;
  onClose: () => void;
  onUpdated: () => void;
}

export const WorkflowEditModal: React.FC<WorkflowEditModalProps> = ({
  workflow,
  isOpen,
  onClose,
  onUpdated,
}) => {
  const { t } = useTranslation();
  const { toast } = useToast();

  const [isShared, setIsShared] = useState(false);
  const [toggleDeploy, setToggleDeploy] = useState(false);
  const [isAccepted, setIsAccepted] = useState(true);
  const [shareGroup, setShareGroup] = useState('');
  const [sharePermissions, setSharePermissions] = useState('read');
  const [availableGroups, setAvailableGroups] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (workflow) {
      setIsShared(workflow.is_shared === true);
      setToggleDeploy(workflow.is_deployed === true);
      setIsAccepted(workflow.is_accepted !== false);
      setShareGroup(workflow.share_group || '');
      setSharePermissions(workflow.share_permissions || 'read');
    }
  }, [workflow]);

  useEffect(() => {
    if (isOpen) {
      getAllGroupsList()
        .then((groups) => setAvailableGroups(groups ?? []))
        .catch(() => setAvailableGroups([]));
    }
  }, [isOpen]);

  const handleSubmit = async () => {
    try {
      setLoading(true);
      await updateWorkflowAdmin(workflow.workflow_id, {
        is_shared: isShared,
        share_group: isShared ? shareGroup || null : null,
        share_permissions: isShared ? sharePermissions : null,
        enable_deploy: toggleDeploy,
        inquire_deploy: Boolean(workflow.inquire_deploy),
        is_accepted: isAccepted,
        user_id: workflow.user_id,
      });
      toast.success(t('admin.workflowManagement.editModal.updateSuccess'));
      onUpdated();
      onClose();
    } catch {
      toast.error(t('admin.workflowManagement.editModal.updateError'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={t('admin.workflowManagement.editModal.title')} size="md">
      <div className="flex flex-col gap-5 p-1">
        {/* Workflow name (readonly) */}
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-foreground">
            {t('admin.workflowManagement.editModal.workflowName')}
          </label>
          <input
            type="text"
            value={workflow.workflow_name}
            disabled
            className="rounded-md border border-border bg-muted px-3 py-2 text-sm text-muted-foreground"
          />
          <span className="text-xs text-muted-foreground">
            {t('admin.workflowManagement.editModal.workflowNameReadonly')}
          </span>
        </div>

        {/* Deploy toggle */}
        <div className="flex items-center justify-between">
          <div>
            <label className="text-sm font-medium text-foreground">
              {t('admin.workflowManagement.editModal.deploy')}
            </label>
          </div>
          <ToggleSwitch
            checked={toggleDeploy}
            onChange={setToggleDeploy}
            size="sm"
            color="green"
            onLabel={t('admin.workflowManagement.editModal.deploying')}
            offLabel={t('admin.workflowManagement.editModal.private')}
            showStateLabel
          />
        </div>

        {/* Approval toggle */}
        <div className="flex flex-col gap-1">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-foreground">
              {t('admin.workflowManagement.editModal.approvalStatus')}
            </label>
            <ToggleSwitch
              checked={isAccepted}
              onChange={setIsAccepted}
              size="sm"
              color="green"
              onLabel={t('admin.workflowManagement.editModal.approved')}
              offLabel={t('admin.workflowManagement.editModal.disabled')}
              showStateLabel
            />
          </div>
          <span className="text-xs text-muted-foreground">
            {t('admin.workflowManagement.editModal.disabledDescription')}
          </span>
        </div>

        {/* Share toggle */}
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium text-foreground">
            {t('admin.workflowManagement.editModal.share')}
          </label>
          <ToggleSwitch
            checked={isShared}
            onChange={setIsShared}
            size="sm"
            color="teal"
            onLabel={t('admin.workflowManagement.editModal.sharing')}
            offLabel={t('admin.workflowManagement.editModal.private')}
            showStateLabel
          />
        </div>

        {/* Share group selector (conditional) */}
        {isShared && (
          <>
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-foreground">
                {t('admin.workflowManagement.editModal.shareGroup')}
              </label>
              <select
                value={shareGroup}
                onChange={(e) => setShareGroup(e.target.value)}
                disabled={loading || availableGroups.length === 0}
                className="rounded-md border border-border bg-background px-3 py-2 text-sm"
              >
                <option value="">
                  {availableGroups.length > 0
                    ? t('admin.workflowManagement.editModal.selectGroup')
                    : t('admin.workflowManagement.editModal.noOrganization')}
                </option>
                {availableGroups.map((g) => (
                  <option key={g} value={g}>{g}</option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-foreground">
                {t('admin.workflowManagement.editModal.permissions')}
              </label>
              <select
                value={sharePermissions}
                onChange={(e) => setSharePermissions(e.target.value)}
                disabled={loading}
                className="rounded-md border border-border bg-background px-3 py-2 text-sm"
              >
                <option value="read">{t('admin.workflowManagement.editModal.readOnly')}</option>
                <option value="read_write">{t('admin.workflowManagement.editModal.readWrite')}</option>
              </select>
            </div>
          </>
        )}
      </div>

      {/* Footer */}
      <div className="flex justify-end gap-2 pt-4 border-t border-border mt-4">
        <Button variant="outline" size="sm" onClick={onClose} disabled={loading}>
          {t('admin.workflowManagement.editModal.cancel')}
        </Button>
        <Button size="sm" onClick={handleSubmit} disabled={loading}>
          {loading
            ? t('admin.workflowManagement.editModal.updating')
            : t('admin.workflowManagement.editModal.update')}
        </Button>
      </div>
    </Modal>
  );
};
