import { resolveArtifactByIdOrPath } from './deriveArtifacts'

export function traceArtifact(artifact: string): string {
  const current = resolveArtifactByIdOrPath(artifact)
  let userStoryId = String(current.data.id || 'unknown')
  let feature = current.data.feature ? String(current.data.feature) : ''
  let epic = current.data.epic ? String(current.data.epic) : ''
  let source = current.data.source ? String(current.data.source) : ''

  const storyRef = current.data.story ? String(current.data.story) : ''
  if (storyRef) {
    userStoryId = storyRef
  }

  if ((!feature || !epic || storyRef) && storyRef) {
    try {
      const story = resolveArtifactByIdOrPath(storyRef)
      userStoryId = String(story.data.id || storyRef)
      feature = feature || String(story.data.feature || '')
      epic = epic || String(story.data.epic || '')
      source = source || String(story.data.source || '')
    } catch {
      userStoryId = storyRef
    }
  }

  if (!epic && feature) {
    try {
      const featureArtifact = resolveArtifactByIdOrPath(feature)
      epic = String(featureArtifact.data.epic || '')
      source = source || String(featureArtifact.data.source || '')
    } catch {
      epic = ''
    }
  }

  return [
    'Traceability graph:',
    `User Story: ${userStoryId || 'unknown'}`,
    `Feature: ${feature || 'unknown'}`,
    `Epic: ${epic || 'unknown'}`,
    `Governance source: ${source || 'unknown'}`,
  ].join('\n')
}
