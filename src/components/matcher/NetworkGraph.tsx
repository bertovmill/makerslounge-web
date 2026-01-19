"use client";

import { useCallback, useMemo, useState } from "react";
import {
  ReactFlow,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
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

export default function NetworkGraph({ groups, contacts }: NetworkGraphProps) {
  const [layoutSeed, setLayoutSeed] = useState(0);

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
  }, []);

  const handleFitView = useCallback(() => {
    // This will be handled by the Controls component
  }, []);

  return (
    <div className="network-graph-container h-[700px] w-full rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden bg-slate-50 dark:bg-slate-950">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
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
      </ReactFlow>
    </div>
  );
}
