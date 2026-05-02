import { Handle, Position } from '@xyflow/react';

export default function PackageNode({ data }) {
  return (
    <div
      className={`package-node package-node-${data.type || 'package'} ${data.pathRole || ''} ${data.dimmed ? 'dimmed' : ''}`}
      style={{ width: data.width }}
    >
      <Handle type="target" position={Position.Left} className="node-handle" />
      <div className="package-node-name">{data.name || data.label}</div>
      <Handle type="source" position={Position.Right} className="node-handle" />
    </div>
  );
}
