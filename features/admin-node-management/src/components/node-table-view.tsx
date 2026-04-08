'use client';

import React from 'react';
import { StatusBadge } from '@xgen/ui';
import { useTranslation } from '@xgen/i18n';
import type { FlatNode } from '../types';

interface NodeTableViewProps {
  nodes: FlatNode[];
}

const NodeTableView: React.FC<NodeTableViewProps> = ({ nodes }) => {
  const { t } = useTranslation();
  const prefix = 'admin.agentflowManagement.nodeManagement';

  return (
    <div className="overflow-x-auto rounded-lg border border-border">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border bg-muted">
            <th className="px-4 py-3 text-left font-semibold text-xs text-muted-foreground tracking-wide">
              {t(`${prefix}.columns.category`)}
            </th>
            <th className="px-4 py-3 text-left font-semibold text-xs text-muted-foreground tracking-wide">
              {t(`${prefix}.columns.function`)}
            </th>
            <th className="px-4 py-3 text-left font-semibold text-xs text-muted-foreground tracking-wide">
              {t(`${prefix}.columns.nodeName`)}
            </th>
            <th className="px-4 py-3 text-left font-semibold text-xs text-muted-foreground tracking-wide">
              {t(`${prefix}.columns.description`)}
            </th>
            <th className="px-4 py-3 text-left font-semibold text-xs text-muted-foreground tracking-wide">
              {t(`${prefix}.columns.tags`)}
            </th>
            <th className="px-4 py-3 text-left font-semibold text-xs text-muted-foreground tracking-wide">
              {t(`${prefix}.columns.status`)}
            </th>
            <th className="px-4 py-3 text-center font-semibold text-xs text-muted-foreground tracking-wide">
              {t(`${prefix}.columns.inputs`)}
            </th>
            <th className="px-4 py-3 text-center font-semibold text-xs text-muted-foreground tracking-wide">
              {t(`${prefix}.columns.outputs`)}
            </th>
            <th className="px-4 py-3 text-center font-semibold text-xs text-muted-foreground tracking-wide">
              {t(`${prefix}.columns.parameters`)}
            </th>
          </tr>
        </thead>
        <tbody>
          {nodes.map((node) => (
            <tr
              key={`${node.categoryId}-${node.functionId}-${node.id}`}
              className="border-b border-border last:border-b-0 hover:bg-muted/50 transition-colors"
            >
              <td className="px-4 py-3 text-foreground">{node.categoryName}</td>
              <td className="px-4 py-3 text-foreground">{node.functionName}</td>
              <td className="px-4 py-3">
                <div className="text-foreground font-medium">{node.nodeName}</div>
                <div className="text-xs text-muted-foreground">{node.id}</div>
              </td>
              <td className="px-4 py-3 text-foreground max-w-xs truncate">
                {node.description}
              </td>
              <td className="px-4 py-3">
                <div className="flex flex-wrap gap-1">
                  {node.tags.slice(0, 2).map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground"
                    >
                      {tag}
                    </span>
                  ))}
                  {node.tags.length > 2 && (
                    <span className="inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                      +{node.tags.length - 2}
                    </span>
                  )}
                </div>
              </td>
              <td className="px-4 py-3">
                <StatusBadge variant={node.disable ? 'error' : 'success'}>
                  {node.disable
                    ? t(`${prefix}.statusDisabled`)
                    : t(`${prefix}.statusEnabled`)}
                </StatusBadge>
              </td>
              <td className="px-4 py-3 text-center text-foreground">
                {node.inputs.length}
              </td>
              <td className="px-4 py-3 text-center text-foreground">
                {node.outputs.length}
              </td>
              <td className="px-4 py-3 text-center text-foreground">
                {node.parameters.length}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default NodeTableView;
