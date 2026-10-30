# Design research · 30 October 2026

## References actually accessed
1. [Refero Styles](https://styles.refero.design/) and [DESIGN.md examples](https://styles.refero.design/ai-agents/design-md-examples): inspected machine-readable typography/color roles and the Warp, Raycast and editorial example descriptions. Functional canvas/surface/text/action color roles are more useful than copying isolated colors. Deep individual DESIGN.md exports were not downloaded. Adopt a dark canvas and clear action color; use our own lime and geometry.
2. [Godly](https://godly.design/) and its [Agentwork case page](https://godly.design/website/agentwork/): accessed gallery information and desktop/mobile/hero/CTA/footer screenshot links. The section taxonomy suggests a complete editorial progression. These were text/link inspections, not a claim of watching every site's motion. Adopt large type, varied section composition, strong product proof, generous margins.
3. [MotionSites](https://motionsites.ai/) and [3D gallery](https://motionsites.ai/3d-websites): accessed the gallery and Digital Reality/hero listings. The 3D listing exposed only sparse text; proprietary prompts and source animations were not accessible. Use a procedural orbital network, pointer response, and a motion-safe fallback; no copied prompt or downloaded model.

## Original identity
AI Atlas is an observatory for personal AI activity. Canvas #0b0e0d, surface #131714, hairlines #29302b, ivory #f0f2eb, muted sage #a0a79d, action/chart lime #d5fa6b. Peach, lavender and blue identify categories rather than decorate every surface. Oversized tightly tracked grotesk headings contrast with small monospaced telemetry and editorial serif accents. Four-point atlas logo combines orbit and navigational star.

## Layout and motion
Landing: generous desktop gutter, narrow navigation, left-aligned headline, oversized right-side orbital map, provider rail, real interactive analytics preview, step-by-step explanation, fingerprint, privacy and final action. Dashboard: fixed restrained navigation, no 3D behind data, readable tables and distinct chart forms. Grid spacing based on 4/8px; rounded corners 8–18px; avoid repetitive pills and glow.

R3F scene: procedural point sphere, orbit paths, lime central meridians, labeled provider nodes. R3F + drei + WebGL2; lazy import, intersection/document visibility pause, adaptive DPR, fewer mobile particles, reduced-motion/static SVG fallback and error boundary. Motion for section reveal and hover transitions; GSAP is unnecessary without complex choreography. No scroll hijacking.

Accessibility: keyboard links/buttons, visible focus, skip link, live result feedback, labelled forms, table headers, textual chart summaries, mobile nav. All marketing/demo statistics labelled illustrative. Canvas information duplicated in DOM.

## Edition 02 — monochrome redesign
The user rejected the green/lime direction. All UI, charts, SVG and WebGL palette values now use achromatic black/white/silver. Revisited Refero's actual Warp style record (https://styles.refero.design/style/d4c51049-58eb-404a-9fcb-f195928b1c99) and Sociotype record, plus Godly and MotionSites galleries. Warp informs grayscale surface elevation and filled-vs-ghost action hierarchy; Sociotype informs oversized editorial type and deliberate negative space. Original Atlas compositions retain their own orbital metaphor.

The new centered hero uses grotesk and italic editorial type over a silver procedural atlas. A white 175vh story section progressively inks words as scroll advances; its footer moves horizontally with scroll. Product preview rotates from 14 degrees and scales into place with scroll. Section reveals now use larger, eased movement with blur resolution and staggered timing. The hero's geometry tilts and its containing layer moves with scroll, without intercepting native scrolling. A top reading-progress line follows the page. White how-it-works and final CTA sections create contrast against black product sections. Reduced-motion removes parallax/tilt and presents the narrative in full.
