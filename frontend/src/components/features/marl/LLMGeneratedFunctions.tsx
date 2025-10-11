import { useState } from 'react'
import { Card, CardContent, Button } from '@/components/ui'
import { ChevronDown, ChevronUp } from 'lucide-react'

interface LLMGeneratedFunctionsProps {
  cotLog?: string
  policyCode?: string
  rewardCode?: string
}

export default function LLMGeneratedFunctions({
  cotLog = `The robots should form a circle by attraction to the center...
  
Constraint Analysis:
- Basic constraints: enter region, avoid collision
- Complex constraints: synchronize neighbors, explore cells

Derived Skills:
1. Move to region (attraction force)
2. Collision avoidance (repulsion force)
3. Synchronization (alignment with neighbors)

Key Sub-goals:
- Goal 1: All robots enter target region
- Goal 2: Maintain equal spacing
- Goal 4: Full coverage with uniformity`,
  policyCode = `def prior_policy(observation):
    """LLM-generated prior policy for shape assembly."""
    position, velocity, neighbors, target = parse_obs(observation)
    
    # Force 1: Attraction to target region
    f_attraction = alpha * (target - position)
    
    # Force 2: Collision avoidance
    f_repulsion = np.zeros(2)
    for neighbor in neighbors:
        diff = position - neighbor['pos']
        dist = np.linalg.norm(diff)
        if dist < r_avoid:
            f_repulsion += beta * (diff / dist)
    
    # Force 3: Synchronization with neighbors
    f_sync = gamma * np.mean([n['vel'] for n in neighbors], axis=0)
    
    # Combined action
    action = f_attraction + f_repulsion + f_sync
    return np.clip(action, -1, 1)`,
  rewardCode = `def reward_function(state, action, next_state):
    """LLM-generated reward function."""
    # Condition 1: In target region
    in_region = is_in_target_region(next_state['position'])
    
    # Condition 2: No collisions
    no_collision = min_distance_to_neighbors(next_state) > r_avoid
    
    # Condition 3: Synchronized velocity
    synchronized = velocity_variance(next_state) < threshold
    
    # Condition 4: Coverage uniformity
    uniform = voronoi_variance(next_state) < uniformity_threshold
    
    # Return 1 if all conditions met, else 0
    return 1.0 if (in_region and no_collision and synchronized and uniform) else 0.0`,
}: LLMGeneratedFunctionsProps) {
  const [expandedSection, setExpandedSection] = useState<string | null>('cot')

  const toggleSection = (section: string) => {
    setExpandedSection(expandedSection === section ? null : section)
  }

  return (
    <section className="space-y-3">
      <h3 className="text-sm font-semibold text-foreground">🤖 LLM Generated Functions</h3>

      {/* CoT Log */}
      <Card>
        <CardContent className="p-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => toggleSection('cot')}
            className="w-full flex items-center justify-between p-0 h-auto hover:bg-transparent"
          >
            <span className="text-xs font-semibold">Chain-of-Thought Analysis</span>
            {expandedSection === 'cot' ? (
              <ChevronUp size={14} />
            ) : (
              <ChevronDown size={14} />
            )}
          </Button>
          {expandedSection === 'cot' && (
            <pre className="mt-3 text-xs bg-muted/50 p-3 rounded overflow-x-auto whitespace-pre-wrap font-mono">
              {cotLog}
            </pre>
          )}
        </CardContent>
      </Card>

      {/* Prior Policy */}
      <Card>
        <CardContent className="p-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => toggleSection('policy')}
            className="w-full flex items-center justify-between p-0 h-auto hover:bg-transparent"
          >
            <span className="text-xs font-semibold">Prior Policy Function</span>
            {expandedSection === 'policy' ? (
              <ChevronUp size={14} />
            ) : (
              <ChevronDown size={14} />
            )}
          </Button>
          {expandedSection === 'policy' && (
            <pre className="mt-3 text-xs bg-blue-50 border border-blue-200 p-3 rounded overflow-x-auto font-mono">
              {policyCode}
            </pre>
          )}
        </CardContent>
      </Card>

      {/* Reward Function */}
      <Card>
        <CardContent className="p-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => toggleSection('reward')}
            className="w-full flex items-center justify-between p-0 h-auto hover:bg-transparent"
          >
            <span className="text-xs font-semibold">Reward Function</span>
            {expandedSection === 'reward' ? (
              <ChevronUp size={14} />
            ) : (
              <ChevronDown size={14} />
            )}
          </Button>
          {expandedSection === 'reward' && (
            <pre className="mt-3 text-xs bg-green-50 border border-green-200 p-3 rounded overflow-x-auto font-mono">
              {rewardCode}
            </pre>
          )}
        </CardContent>
      </Card>
    </section>
  )
}

