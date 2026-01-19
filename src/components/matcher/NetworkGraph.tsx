"use client";

import { useCallback, useMemo, useState } from "react";
import {
  ReactFlow,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  ReactFlowProvider,
  type Node,
  type Edge,
  BackgroundVariant,
  Panel,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";

import PersonNode, { getGroupColor } from "./PersonNode";
import ConnectionEdge, { EDGE_COLOR, type ConnectionEdgeData } from "./ConnectionEdge";
import { Button } from "@/components/ui/button";

interface Contact {
  [key: string]: string;
}

interface Connection {
  from: string;
  to: string;
  reason: string;
  strength: number;
}

interface Group {
  members: string[];
  reason: string;
  theme?: string;
  connections?: Connection[];
}

interface Recommendation {
  name: string;
  reason: string;
  matchStrength: number;
}

interface NetworkGraphProps {
  groups: Group[];
  contacts: Contact[];
  recommendations?: Recommendation[];
  selectedGroupIndex?: number | null;
  onGroupSelect?: (index: number | null) => void;
}

const nodeTypes = {
  person: PersonNode,
};

const edgeTypes = {
  connection: ConnectionEdge,
};

// Generate a theme title from the group reason
export function generateGroupTheme(reason: string): string {
  // Extract key themes from the reason text
  const keywords = reason.toLowerCase();
  if (keywords.includes("ai") || keywords.includes("machine learning") || keywords.includes("automation")) {
    return "AI & Automation Innovators";
  }
  if (keywords.includes("fintech") || keywords.includes("finance") || keywords.includes("payment")) {
    return "Fintech Pioneers";
  }
  if (keywords.includes("health") || keywords.includes("wellness") || keywords.includes("medical")) {
    return "Health & Wellness Tech";
  }
  if (keywords.includes("sustainability") || keywords.includes("climate") || keywords.includes("green")) {
    return "Sustainability Champions";
  }
  if (keywords.includes("creative") || keywords.includes("design") || keywords.includes("art")) {
    return "Creative Technologists";
  }
  if (keywords.includes("community") || keywords.includes("social") || keywords.includes("platform")) {
    return "Community Builders";
  }
  if (keywords.includes("education") || keywords.includes("learning") || keywords.includes("mentor")) {
    return "EdTech & Mentorship";
  }
  return "Synergy Group";
}

function NetworkGraphInner({ groups, contacts, recommendations = [], selectedGroupIndex, onGroupSelect }: NetworkGraphProps) {
  const [layoutSeed, setLayoutSeed] = useState(0);

  // Create a map of recommended people for quick lookup
  const recommendedMap = useMemo(() => {
    const map = new Map<string, { strength: number; reason: string }>();
    recommendations.forEach((rec) => {
      map.set(rec.name, { strength: rec.matchStrength, reason: rec.reason });
    });
    return map;
  }, [recommendations]);

  // Convert groups to nodes and edges
  const { initialNodes, initialEdges } = useMemo(() => {
    const nodes: Node[] = [];
    const edges: Edge[] = [];

    // Much larger spacing for better readability
    const numGroups = groups.length;

    // Grid-based layout: arrange groups in a grid pattern
    const cols = Math.ceil(Math.sqrt(numGroups));
    const groupSpacingX = 500; // Horizontal space between group centers
    const groupSpacingY = 450; // Vertical space between group centers
    const memberSpacing = 180; // Space between members within a group

    groups.forEach((group, groupIndex) => {
      const groupColor = getGroupColor(groupIndex);

      // Grid position for group
      const col = groupIndex % cols;
      const row = Math.floor(groupIndex / cols);

      // Add stagger to odd rows for more organic feel
      const staggerX = row % 2 === 1 ? groupSpacingX / 2 : 0;

      const groupCenterX = col * groupSpacingX + staggerX + 300;
      const groupCenterY = row * groupSpacingY + 200;

      // Position members in a circle around group center
      const numMembers = group.members.length;

      group.members.forEach((memberName, memberIndex) => {
        const contact = contacts.find((c) => c.name === memberName);

        // Spread members in a circle, with slight randomness
        const memberAngle = (2 * Math.PI * memberIndex) / numMembers - Math.PI / 2;
        const radiusVariation = 1 + (Math.sin(layoutSeed + groupIndex * 7 + memberIndex * 3) * 0.15);
        const actualRadius = memberSpacing * radiusVariation;

        // Small random offset for organic feel
        const offsetX = Math.sin(layoutSeed * 2 + groupIndex + memberIndex * 5) * 25;
        const offsetY = Math.cos(layoutSeed * 3 + groupIndex + memberIndex * 7) * 25;

        const x = groupCenterX + actualRadius * Math.cos(memberAngle) + offsetX;
        const y = groupCenterY + actualRadius * Math.sin(memberAngle) + offsetY;

        const recommendation = recommendedMap.get(memberName);

        nodes.push({
          id: memberName,
          type: "person",
          position: { x, y },
          data: {
            name: memberName,
            email: contact?.email,
            project: contact?.project,
            phase: contact?.phase,
            skills: contact?.skills,
            needsHelp: contact?.needsHelp,
            groupIndex,
            groupColor,
            isRecommended: !!recommendation,
            recommendationStrength: recommendation?.strength,
            isSelectedGroup: false, // Will be updated dynamically
          },
        });
      });

      // Create edges from connections
      if (group.connections) {
        group.connections.forEach((conn, connIndex) => {
          edges.push({
            id: `${groupIndex}-${connIndex}-${conn.from}-${conn.to}`,
            source: conn.from,
            target: conn.to,
            type: "connection",
            data: {
              reason: conn.reason,
              strength: conn.strength,
            },
          });
        });
      }
    });

    return { initialNodes: nodes, initialEdges: edges };
  }, [groups, contacts, layoutSeed, recommendedMap]);

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  // Reset layout when groups change
  useMemo(() => {
    setNodes(initialNodes);
    setEdges(initialEdges);
  }, [initialNodes, initialEdges, setNodes, setEdges]);

  // Update nodes when selected group changes
  useMemo(() => {
    setNodes((nds) =>
      nds.map((node) => {
        const nodeGroupIndex = (node.data as { groupIndex: number }).groupIndex;
        return {
          ...node,
          data: {
            ...node.data,
            isSelectedGroup: selectedGroupIndex !== null && nodeGroupIndex === selectedGroupIndex,
          },
        };
      })
    );
  }, [selectedGroupIndex, setNodes]);

  const handleResetLayout = useCallback(() => {
    setLayoutSeed((s) => s + 1);
    onGroupSelect?.(null);
  }, [onGroupSelect]);

  const handleNodeClick = useCallback((_event: React.MouseEvent, node: Node) => {
    const groupIndex = (node.data as { groupIndex: number }).groupIndex;
    onGroupSelect?.(selectedGroupIndex === groupIndex ? null : groupIndex);
  }, [onGroupSelect, selectedGroupIndex]);

  const handlePaneClick = useCallback(() => {
    onGroupSelect?.(null);
  }, [onGroupSelect]);

  // Find selected edge for connection detail panel
  const selectedEdge = useMemo(() => {
    return edges.find((edge) => edge.selected) || null;
  }, [edges]);

  const selectedEdgeData = selectedEdge?.data as ConnectionEdgeData | undefined;

  const handleDeselectEdge = useCallback(() => {
    setEdges((eds) => eds.map((e) => ({ ...e, selected: false })));
  }, [setEdges]);

  return (
    <div className="network-graph-container h-[700px] w-full rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden bg-slate-50 dark:bg-slate-950">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={handleNodeClick}
        onPaneClick={handlePaneClick}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        minZoom={0.3}
        maxZoom={1.5}
        defaultEdgeOptions={{
          type: "connection",
        }}
        proOptions={{ hideAttribution: true }}
      >
        <Background variant={BackgroundVariant.Dots} gap={20} size={1} color="var(--border)" />
        <Controls showInteractive={false} />

        <Panel position="top-right" className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleResetLayout}
            className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm border-slate-200 dark:border-slate-700 shadow-sm hover:bg-slate-50 dark:hover:bg-slate-800"
          >
            <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Shuffle
          </Button>
        </Panel>

        {/* Legend */}
        <Panel position="bottom-left" className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm rounded-xl p-4 border border-slate-200 dark:border-slate-700 shadow-sm">
          <div className="text-xs font-medium mb-3 text-slate-700 dark:text-slate-300">Connection Strength</div>
          <div className="flex flex-col gap-2.5 text-xs text-slate-600 dark:text-slate-400">
            <div className="flex items-center gap-3">
              <div className="w-6 rounded-full" style={{ background: "#94A3B8", height: 2 }} />
              <span>Mild</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-6 rounded-full" style={{ background: "#94A3B8", height: 4 }} />
              <span>Medium</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-6 rounded-full" style={{ background: "#94A3B8", height: 6 }} />
              <span>Strong</span>
            </div>
          </div>
        </Panel>


        {/* Selected connection detail panel */}
        {selectedEdge && selectedEdgeData && (
          <Panel position="bottom-right" className="max-w-sm mb-2 mr-2">
            <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm rounded-xl p-4 border border-slate-200 dark:border-slate-700 shadow-lg">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-3 h-3 rounded-full bg-blue-500" />
                <div className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  {selectedEdge.source} ↔ {selectedEdge.target}
                </div>
              </div>
              <div className="flex items-start gap-2">
                <div
                  className="w-1 h-full rounded-full flex-shrink-0 self-stretch min-h-[40px]"
                  style={{ background: EDGE_COLOR }}
                />
                <div>
                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                    {selectedEdgeData.reason}
                  </p>
                  <div className="mt-2 flex items-center gap-1.5 text-slate-500" style={{ fontSize: 10 }}>
                    <div
                      className="h-1 rounded-full"
                      style={{
                        background: EDGE_COLOR,
                        width: selectedEdgeData.strength === 3 ? 20 : selectedEdgeData.strength === 2 ? 12 : 6
                      }}
                    />
                    <span>
                      {selectedEdgeData.strength === 3 ? "Strong" : selectedEdgeData.strength === 2 ? "Medium" : "Mild"} connection
                    </span>
                  </div>
                </div>
              </div>
              <button
                onClick={handleDeselectEdge}
                className="absolute top-2 right-2 w-5 h-5 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </Panel>
        )}
      </ReactFlow>
    </div>
  );
}

// Wrap with ReactFlowProvider for useReactFlow hook
export default function NetworkGraph(props: NetworkGraphProps) {
  return (
    <ReactFlowProvider>
      <NetworkGraphInner {...props} />
    </ReactFlowProvider>
  );
}
