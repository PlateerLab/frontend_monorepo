'use client';

import React, { useState, useCallback } from 'react';
import { StatusBadge } from '@xgen/ui';
import { useTranslation } from '@xgen/i18n';
import { FiChevronDown, FiChevronRight, FiInfo } from '@xgen/icons';
import type { NodeCategory, Node } from '../types';

interface NodeTreeViewProps {
  categories: NodeCategory[];
  expandedCategories: Set<string>;
  expandedFunctions: Set<string>;
  onToggleCategory: (categoryId: string) => void;
  onToggleFunction: (functionKey: string) => void;
}

const NodeTreeView: React.FC<NodeTreeViewProps> = ({
  categories,
  expandedCategories,
  expandedFunctions,
  onToggleCategory,
  onToggleFunction,
}) => {
  const { t } = useTranslation();
  const prefix = 'admin.agentflowManagement.nodeManagement';
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);

  const handleSelectNode = useCallback((node: Node) => {
    setSelectedNode(node);
  }, []);

  return (
    <div className="flex gap-4 h-full">
      {/* Left panel: Tree */}
      <div className="w-1/3 min-w-[280px] rounded-lg border border-border bg-card overflow-y-auto">
        <div className="px-4 py-3 border-b border-border">
          <h3 className="text-sm font-semibold text-foreground">
            {t(`${prefix}.nodeTree`)}
          </h3>
        </div>
        <div className="p-2">
          {categories.map((category) => {
            const catExpanded = expandedCategories.has(category.categoryId);
            return (
              <div key={category.categoryId}>
                {/* Category row */}
                <button
                  type="button"
                  className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm font-medium text-foreground hover:bg-muted transition-colors"
                  onClick={() => onToggleCategory(category.categoryId)}
                >
                  {catExpanded ? (
                    <FiChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
                  ) : (
                    <FiChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                  )}
                  <span className="truncate">{category.categoryName}</span>
                </button>

                {catExpanded &&
                  category.functions.map((fn) => {
                    const fnKey = `${category.categoryId}::${fn.functionId}`;
                    const fnExpanded = expandedFunctions.has(fnKey);
                    return (
                      <div key={fn.functionId} className="ml-4">
                        {/* Function row */}
                        <button
                          type="button"
                          className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm text-foreground hover:bg-muted transition-colors"
                          onClick={() => onToggleFunction(fnKey)}
                        >
                          {fnExpanded ? (
                            <FiChevronDown className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                          ) : (
                            <FiChevronRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                          )}
                          <span className="truncate">{fn.functionName}</span>
                        </button>

                        {fnExpanded &&
                          fn.nodes.map((node) => {
                            const isSelected =
                              selectedNode?.id === node.id &&
                              selectedNode?.functionId === node.functionId;
                            return (
                              <button
                                key={node.id}
                                type="button"
                                className={`flex w-full items-center gap-2 rounded-md ml-4 px-2 py-1.5 text-sm transition-colors ${
                                  isSelected
                                    ? 'bg-muted font-medium text-foreground'
                                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                                }`}
                                onClick={() => handleSelectNode(node)}
                              >
                                <span className="truncate">{node.nodeName}</span>
                              </button>
                            );
                          })}
                      </div>
                    );
                  })}
              </div>
            );
          })}
        </div>
      </div>

      {/* Right panel: Node detail */}
      <div className="flex-1 rounded-lg border border-border bg-card overflow-y-auto">
        {selectedNode ? (
          <div className="p-6 flex flex-col gap-5">
            {/* Header */}
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold text-foreground">
                  {selectedNode.nodeName}
                </h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {selectedNode.id}
                </p>
              </div>
              <StatusBadge variant={selectedNode.disable ? 'error' : 'success'}>
                {selectedNode.disable
                  ? t(`${prefix}.statusDisabled`)
                  : t(`${prefix}.statusEnabled`)}
              </StatusBadge>
            </div>

            {/* Description */}
            <div>
              <h3 className="text-sm font-medium text-foreground mb-1">
                {t(`${prefix}.description`)}
              </h3>
              <p className="text-sm text-muted-foreground">
                {selectedNode.description || '-'}
              </p>
            </div>

            {/* Tags */}
            <div>
              <h3 className="text-sm font-medium text-foreground mb-1">
                {t(`${prefix}.tags`)}
              </h3>
              <div className="flex flex-wrap gap-1.5">
                {selectedNode.tags.length > 0 ? (
                  selectedNode.tags.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center rounded-full bg-muted px-2.5 py-0.5 text-xs text-muted-foreground"
                    >
                      {tag}
                    </span>
                  ))
                ) : (
                  <span className="text-sm text-muted-foreground">-</span>
                )}
              </div>
            </div>

            {/* Inputs */}
            <div>
              <h3 className="text-sm font-medium text-foreground mb-2">
                {t(`${prefix}.inputs`)} ({selectedNode.inputs.length})
              </h3>
              {selectedNode.inputs.length > 0 ? (
                <div className="space-y-1.5">
                  {selectedNode.inputs.map((input) => (
                    <div
                      key={input.id}
                      className="flex items-center gap-3 rounded-md border border-border px-3 py-2 text-sm"
                    >
                      <span className="font-medium text-foreground">
                        {input.name}
                      </span>
                      <span className="rounded bg-muted px-1.5 py-0.5 text-xs text-muted-foreground">
                        {input.type}
                      </span>
                      {input.required && (
                        <span className="text-xs text-destructive">{t(`${prefix}.required`)}</span>
                      )}
                      {input.multi && (
                        <span className="text-xs text-primary">{t(`${prefix}.multi`)}</span>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">-</p>
              )}
            </div>

            {/* Outputs */}
            <div>
              <h3 className="text-sm font-medium text-foreground mb-2">
                {t(`${prefix}.outputs`)} ({selectedNode.outputs.length})
              </h3>
              {selectedNode.outputs.length > 0 ? (
                <div className="space-y-1.5">
                  {selectedNode.outputs.map((output) => (
                    <div
                      key={output.id}
                      className="flex items-center gap-3 rounded-md border border-border px-3 py-2 text-sm"
                    >
                      <span className="font-medium text-foreground">
                        {output.name}
                      </span>
                      <span className="rounded bg-muted px-1.5 py-0.5 text-xs text-muted-foreground">
                        {output.type}
                      </span>
                      {output.required && (
                        <span className="text-xs text-destructive">{t(`${prefix}.required`)}</span>
                      )}
                      {output.stream && (
                        <span className="text-xs text-primary">{t(`${prefix}.stream`)}</span>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">-</p>
              )}
            </div>

            {/* Parameters */}
            <div>
              <h3 className="text-sm font-medium text-foreground mb-2">
                {t(`${prefix}.parameters`)} ({selectedNode.parameters.length})
              </h3>
              {selectedNode.parameters.length > 0 ? (
                <div className="space-y-1.5">
                  {selectedNode.parameters.map((param) => (
                    <div
                      key={param.id}
                      className="flex flex-col gap-1 rounded-md border border-border px-3 py-2 text-sm"
                    >
                      <div className="flex items-center gap-3">
                        <span className="font-medium text-foreground">
                          {param.name}
                        </span>
                        <span className="rounded bg-muted px-1.5 py-0.5 text-xs text-muted-foreground">
                          {param.type}
                        </span>
                        {param.required && (
                          <span className="text-xs text-destructive">{t(`${prefix}.required`)}</span>
                        )}
                        {param.optional && (
                          <span className="text-xs text-muted-foreground">
                            {t(`${prefix}.optional`)}
                          </span>
                        )}
                      </div>
                      {param.description && (
                        <p className="text-xs text-muted-foreground">
                          {param.description}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">-</p>
              )}
            </div>
          </div>
        ) : (
          <div className="flex h-full items-center justify-center p-8">
            <div className="flex flex-col items-center gap-3 text-center">
              <FiInfo className="h-8 w-8 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium text-foreground">
                  {t(`${prefix}.selectNode`)}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {t(`${prefix}.selectNodeDescription`)}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default NodeTreeView;
