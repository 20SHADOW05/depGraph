import { BaseEdge, getBezierPath } from '@xyflow/react';

export default function DependencyEdge(props) {
  const [edgePath] = getBezierPath({
    sourceX: props.sourceX,
    sourceY: props.sourceY,
    sourcePosition: props.sourcePosition,
    targetX: props.targetX,
    targetY: props.targetY,
    targetPosition: props.targetPosition,
    curvature: 0.35
  });

  return (
    <BaseEdge
      id={props.id}
      path={edgePath}
      className={`dependency-edge ${props.data?.pathRole || ''} ${props.data?.dimmed ? 'dimmed' : ''}`}
      markerEnd={props.markerEnd}
    />
  );
}
