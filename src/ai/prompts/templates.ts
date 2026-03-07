export const epicPrompt = (governanceMarkdown: string): string => `
Derive 5-10 implementation-ready product epics from this digital-governance markdown.

Requirements:
- Focus only on digital systems, software controls, automation, access, logging, and security.
- Exclude physical storage, manual filing, and paper-only process work.
- Each epic must be concrete enough to guide implementation planning.
- Titles should be specific (avoid generic names like "Governance Controls").
- Objectives should include measurable delivery intent.
- Include outcomes and non-goals to reduce ambiguity.

Return only a valid JSON array with fields:
- title (string)
- objective (string)
- outcomes (string[])
- non_goals (string[])

${governanceMarkdown.slice(0, 14000)}
`

export const featurePrompt = (epicTitle: string, governanceMarkdown: string): string => `
Derive 3-6 implementation features for this epic.
Epic: ${epicTitle}

Requirements:
- Features must be implementable software capabilities.
- Include controls for access, auditability, automation, monitoring, or data protection when relevant.
- Avoid broad placeholders or repeated wording.
- Add concrete implementation notes and testable acceptance criteria.

Return only a valid JSON array with fields:
- title (string)
- capability (string)
- implementation_notes (string[])
- acceptance_criteria (string[])

${governanceMarkdown.slice(0, 14000)}
`

export const storyPrompt = (featureTitle: string, governanceMarkdown: string): string => `
Derive 3-5 implementation-ready user stories for this feature.
Feature: ${featureTitle}

Requirements:
- Stories must map to software delivery work that can be tested.
- Stories must describe system behaviors (not team tasks or persona goals).
- Use role "system" for every story.
- Behavior must be a concrete capability clause suitable for: "As a system, I must perform <behavior> so that governance requirements are satisfied."
- Benefit intent must align to governance requirement satisfaction.
- Keep stories digital-only and exclude physical/manual process requirements.
- Include acceptance criteria and technical notes specific enough for implementation.
- Acceptance criteria should include timestamped evidence, actor identity attribution, secure logging/storage, and automated tests.

Return only a valid JSON array with fields:
- title (string)
- role (string)
- behavior (string)
- benefit (string)
- acceptance_criteria (string[])
- technical_notes (string[])

${governanceMarkdown.slice(0, 14000)}
`
