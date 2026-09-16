<!--
  Rewritten to describe the logo actually in use (frontend/src/assets/logo-mark.png).
  The previous version described an older emerald/mint design that was abandoned
  and never shipped. Color swatches are static shields.io badges — a markdown
  file can't animate, so nothing here claims or attempts animation.
-->

<div align="center">

<img src="../frontend/src/assets/logo-mark.png" alt="NeuroCode logo mark" width="220"/>

# NeuroCode — Brand Logo Rationale

**A circuit-board brain around a bold "N": organic intelligence fused with structured engineering.**

![Brand Orange](https://img.shields.io/badge/Brand_Orange-%23FF6E1A-FF6E1A?style=for-the-badge)
![Brand Teal](https://img.shields.io/badge/Brand_Teal-%232DD4A0-2DD4A0?style=for-the-badge)
![Circuit Gold](https://img.shields.io/badge/Circuit_Gold-%23D4AF37-D4AF37?style=for-the-badge)

</div>

## Contents

1. [The mark at a glance](#1-the-mark-at-a-glance)
2. [Color palette](#2-color-palette)
3. [Anatomy of the mark](#3-anatomy-of-the-mark)
4. [What it communicates](#4-what-it-communicates)
5. [How the logo is used in the product](#5-how-the-logo-is-used-in-the-product)

---

## 1. The mark at a glance

The NeuroCode mark is a **brain silhouette drawn as a circuit board**. Its outline is a single dark,
metallic contour; inside it, every fold of the brain is rendered as circuit traces ending in solder
pads and glowing nodes. A **bold "N"** stands at the center, and the brain is split vertically into
**two color halves**: warm orange on the left, teal/mint on the right. Small **gold microchips** and
gold contact points are embedded in the circuitry on both sides.

The idea in one line: **intelligence (the brain) and engineering (the circuit) are the same shape.**
The mark doesn't place a brain next to a chip — the brain *is* the circuit.

## 2. Color palette

| Swatch | Name | Hex | Where it appears in the mark |
|---|---|---|---|
| ![](https://img.shields.io/badge/-%20%20%20%20%20%20-FF6E1A?style=for-the-badge) | Brand Orange | `#FF6E1A` | Left half: circuit traces and glowing nodes; the warm side of the "N" |
| ![](https://img.shields.io/badge/-%20%20%20%20%20%20-2DD4A0?style=for-the-badge) | Brand Teal | `#2DD4A0` | Right half: circuit traces, nodes and chip bodies |
| ![](https://img.shields.io/badge/-%20%20%20%20%20%20-D4AF37?style=for-the-badge) | Circuit Gold | `#D4AF37` | Microchip borders, contact points, the `</>` bracket and the bright face of the "N" |

These are the same values the landing page uses as its design tokens (`--l-orange`, `--l-teal` and
`--l-gold` in `frontend/src/styles/landing.css`, dark theme), so the site and the mark share one palette.
The light theme uses deeper variants of the same hues for contrast on a pale background.

## 3. Anatomy of the mark

### The brain silhouette
A rounded, lobed outline in dark metallic gray, with a short "stem" of traces at the bottom. Its soft,
organic curves read as a *mind* — approachable rather than mechanical.

### The circuit-board interior
Instead of drawn folds, the brain is filled with right-angled circuit traces that terminate in round
pads and nodes, like a printed circuit board. The glowing nodes read as active connections — thought
happening in hardware.

### The two color halves
- **Orange (left)** — warm, energetic, human. The side with the brightest glowing nodes.
- **Teal/mint (right)** — cool, precise, technical. The side carrying the `</>` code bracket.

The split is vertical and clean, so the mark is one brain, not two halves pasted together — both
sides share the same outline and the same circuit language.

### The bold "N"
A thick, beveled "N" sits over the center line, shaded from bright gold to orange. It anchors the
composition, gives the mark an instant initial for **N**euroCode, and bridges both halves.

### Gold microchips and contacts
Small square chips with gold borders sit inside both halves, along with gold solder contacts and the
gold `</>` bracket on the teal side. Gold is used sparingly — as detail, not as a third half — so it
reads as precision and value.

## 4. What it communicates

| Element | Meaning |
|---|---|
| Brain silhouette | Learning and understanding — the platform is about how a student *thinks*, not only what they type |
| Circuit-board interior | Real engineering underneath: code that is actually executed, parsed and analyzed |
| Orange / teal split | The fusion of organic intelligence and structured engineering in one system |
| Central "N" | NeuroCode's identity, holding both halves together |
| `</>` bracket | An unmistakable "this is a coding platform" cue, even at small sizes |
| Gold chips | Earned, verifiable value — the credentials at the end of the learning path |

## 5. How the logo is used in the product

- **Source file:** `frontend/src/assets/logo-mark.png`, rendered by `frontend/src/components/common/Logo.jsx`.
- **Wordmark:** next to the mark, "Neuro" is set in the primary text color and "Code" in Brand Orange —
  the same two-tone treatment used for the developer's name on the landing page.
- **Favicons:** `frontend/public/favicon.ico`, `favicon-32.png` and `apple-touch-icon.png`.
- **Hero:** on the landing page the mark is shown large, with a soft orange/teal glow, breathing rings
  and a circuit-trace background that echoes the circuitry inside the mark itself.
- **App shell:** the sidebar and loading screens use the mark on its own, without the wordmark.
