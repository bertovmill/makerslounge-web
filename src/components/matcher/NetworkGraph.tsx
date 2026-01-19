"use client";

import { useCallback, useMemo, useState } from "react";
import {
  ReactFlow,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  useReactFlow,
  ReactFlowProvider,
  type Node,
  type Edge,
  BackgroundVariant,
  Panel,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";

import PersonNode, { getGroupColor } from "./PersonNode";
import ConnectionEdge from "./ConnectionEdge";
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

interface NetworkGraphProps {
  groups: Group[];
  contacts: Contact[];
}

const nodeTypes = {
  person: PersonNode,
};

const edgeTypes = {
  connection: ConnectionEdge,
};

// Generate a theme title from the group reason
function generateGroupTheme(reason: string): string {
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

function NetworkGraphInner({ groups, contacts }: NetworkGraphProps) {
  const [layoutSeed, setLayoutSeed] = useState(0);
  const [selectedGroupIndex, setSelectedGroupIndex] = useState<number | null>(null);
  const { getNodes } = useReactFlow();

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
  }, [groups, contacts, layoutSeed]);

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  // Reset layout when groups change
  useMemo(() => {
    setNodes(initialNodes);
    setEdges(initialEdges);
  }, [initialNodes, initialEdges, setNodes, setEdges]);

  const handleResetLayout = useCallback(() => {
    setLayoutSeed((s) => s + 1);
    setSelectedGroupIndex(null);
  }, []);

  const handleNodeClick = useCallback((_event: React.MouseEvent, node: Node) => {
    const groupIndex = (node.data as { groupIndex: number }).groupIndex;
    setSelectedGroupIndex((prev) => (prev === groupIndex ? null : groupIndex));
  }, []);

  const handlePaneClick = useCallback(() => {
    setSelectedGroupIndex(null);
  }, []);

  // Calculate bounding box for selected group
  const selectedGroupBounds = useMemo(() => {
    if (selectedGroupIndex === null) return null;

    const currentNodes = getNodes();
    const groupNodes = currentNodes.filter(
      (n) => (n.data as { groupIndex: number }).groupIndex === selectedGroupIndex
    );

    if (groupNodes.length === 0) return null;

    const padding = 40;
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;

    groupNodes.forEach((node) => {
      const nodeWidth = 140;
      const nodeHeight = 100;
      minX = Math.min(minX, node.position.x - padding);
      minY = Math.min(minY, node.position.y - padding);
      maxX = Math.max(maxX, node.position.x + nodeWidth + padding);
      maxY = Math.max(maxY, node.position.y + nodeHeight + padding);
    });

    return { minX, minY, maxX, maxY, width: maxX - minX, height: maxY - minY };
  }, [selectedGroupIndex, getNodes, nodes]);

  const selectedGroup = selectedGroupIndex !== null ? groups[selectedGroupIndex] : null;
  const selectedGroupColor = selectedGroupIndex !== null ? getGroupColor(selectedGroupIndex) : null;

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
        {/* Group boundary when selected */}
        {selectedGroupBounds && selectedGroupColor && (
          <svg
            className="pointer-events-none absolute inset-0 overflow-visible"
            style={{ zIndex: 0 }}
          >
            <defs>
              <filter id="glow">
                <feGaussianBlur stdDeviation="4" result="coloredBlur"/>
                <feMerge>
                  <feMergeNode in="coloredBlur"/>
                  <feMergeNode in="SourceGraphic"/>
                </feMerge>
              </filter>
            </defs>
            <rect
              x={selectedGroupBounds.minX}
              y={selectedGroupBounds.minY}
              width={selectedGroupBounds.width}
              height={selectedGroupBounds.height}
              rx={24}
              ry={24}
              fill={`${selectedGroupColor}10`}
              stroke={selectedGroupColor}
              strokeWidth={3}
              strokeDasharray="8 4"
              filter="url(#glow)"
              className="transition-all duration-300"
            />
          </svg>
        )}
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

        {/* Selected group theme panel */}
        {selectedGroup && selectedGroupColor && (
          <Panel position="top-left" className="max-w-sm">
            <div
              className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm rounded-xl p-4 border-2 shadow-lg"
              style={{ borderColor: selectedGroupColor }}
            >
              <div className="flex items-start gap-3">
                <div
                  className="w-1.5 h-full rounded-full flex-shrink-0 self-stretch min-h-[60px]"
                  style={{ background: selectedGroupColor }}
                />
                <div>
                  <div
                    className="text-sm font-semibold mb-1"
                    style={{ color: selectedGroupColor }}
                  >
                    {selectedGroup.theme || generateGroupTheme(selectedGroup.reason)}
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                    {selectedGroup.reason}
                  </p>
                  <div className="mt-2 text-xs text-slate-500">
                    {selectedGroup.members.length} members
                  </div>
                </div>
              </div>
              <button
                onClick={() => setSelectedGroupIndex(null)}
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
