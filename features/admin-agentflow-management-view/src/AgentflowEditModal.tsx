'use client';

import React, { useState, useEffect } from 'react';
import type { AdminAgentflowMeta } from '@xgen/api-client';
import { updateAgentflowAdmin, getAllGroupsList } from '@xgen/api-client';
import { Modal, Button, ToggleSwitch, useToast } from '@xgen/ui';
import { useTranslation } from '@xgen/i18n';

interface AgentflowEditModalProps {
  workflow: AdminAgentflowMeta;
  isOpen: boolean;
  onClose: () => void;
  onUpdated: () => void;
}

export const AgentflowEditModal: React.FC<AgentflowEditModalProps> = ({
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
      await updateAgentflowAdmin(workflow.workflow_id, {
        is_shared: isShared,
        share_group: isShared ? shareGroup || null : null,
        share_permissions: isShared ? sharePermissions : null,
        enable_deploy: toggleDeploy,
        inquire_deploy: Boolean(workflow.inquire_deploy),
        is_accepted: isAccepted,
        user_id: workflow.user_id,
      });
      toast.success(t('admin.agentflowManagement.editModal.updateSuccess'));
      onUpdated();
      onClose();
    } catch {
      toast.error(t('admin.agentflowManagement.editModal.updateError'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={t('admin.agentflowManagement.editModal.title')} size="md">
      <div className="flex flex-col gap-5 p-1">
        {/* Agentflow name (readonly) */}
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-foreground">
            {t('admin.agentflowManagement.editModal.workflowName')}
          </label>
          <input
            type="text"
            value={workflow.workflow_name}
            disabled
            className="rounded-md border border-border bg-muted px-3 py-2 text-sm text-muted-foreground"
          />
          <span className="text-xs text-muted-foreground">
            {t('admin.agentflowManagement.editModal.workflowNameReadonly')}
          </span>
        </div>

        {/* Deploy toggle */}
        <div className="flex items-center justify-between">
          <div>
            <label className="text-sm font-medium text-foreground">
              {t('admin.agentflowManagement.editModal.deploy')}
            </label>
          </div>
          <ToggleSwitch
            checked={toggleDeploy}
            onChange={setToggleDeploy}
            size="sm"
            color="green"
            onLabel={t('admin.agentflowManagement.editModal.deploying')}
            offLabel={t('admin.agentflowManagement.editModal.private')}
            showStateLabel
          />
        </div>

        {/* Approval toggle */}
        <div className="flex flex-col gap-1">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-foreground">
              {t('admin.agentflowManagement.editModal.approvalStatus')}
            </label>
            <ToggleSwitch
              checked={isAccepted}
              onChange={setIsAccepted}
              size="sm"
              color="green"
              onLabel={t('admin.agentflowManagement.editModal.approved')}
              offLabel={t('admin.agentflowManagement.editModal.disabled')}
              showStateLabel
            />
          </div>
          <span className="text-xs text-muted-foreground">
            {t('admin.agentflowManagement.editModal.disabledDescription')}
          </span>
        </div>

        {/* Share toggle */}
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium text-foreground">
            {t('admin.agentflowManagement.editModal.share')}
          </label>
          <ToggleSwitch
            checked={isShared}
            onChange={setIsShared}
            size="sm"
            color="teal"
            onLabel={t('admin.agentflowManagement.editModal.sharing')}
            offLabel={t('admin.agentflowManagement.editModal.private')}
            showStateLabel
          />
        </div>

        {/* Share group selector (conditional) */}
        {isShared && (
          <>
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-foreground">
                {t('admin.agentflowManagement.editModal.shareGroup')}
              </label>
              <select
                value={shareGroup}
                onChange={(e) => setShareGroup(e.target.value)}
                disabled={loading || availableGroups.length === 0}
                className="rounded-md border border-border bg-background px-3 py-2 text-sm"
              >
                <option value="">
                  {availableGroups.length > 0
                    ? t('admin.agentflowManagement.editModal.selectGroup')
                    : t('admin.agentflowManagement.editModal.noOrganization')}
                </option>
                {availableGroups.map((g) => (
                  <option key={g} value={g}>{g}</option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-foreground">
                {t('admin.agentflowManagement.editModal.permissions')}
              </label>
              <select
                value={sharePermissions}
                onChange={(e) => setSharePermissions(e.target.value)}
                disabled={loading}
                className="rounded-md border border-border bg-background px-3 py-2 text-sm"
              >
                <option value="read">{t('admin.agentflowManagement.editModal.readOnly')}</option>
                <option value="read_write">{t('admin.agentflowManagement.editModal.readWrite')}</option>
              </select>
            </div>
          </>
        )}
      </div>

      {/* Footer */}
      <div className="flex justify-end gap-2 pt-4 border-t border-border mt-4">
        <Button variant="outline" size="sm" onClick={onClose} disabled={loading}>
          {t('admin.agentflowManagement.editModal.cancel')}
        </Button>
        <Button size="sm" onClick={handleSubmit} disabled={loading}>
          {loading
            ? t('admin.agentflowManagement.editModal.updating')
            : t('admin.agentflowManagement.editModal.update')}
        </Button>
      </div>
    </Modal>
  );
};
