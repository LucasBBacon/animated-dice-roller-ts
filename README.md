# Animated Dice Roller (TypeScript)

Animated Dice Roller is a React + TypeScript feature module that renders physical-style 3D dice rolls with animation, audio feedback, and roll history.

This repository is built as a feature-first implementation you can run directly with Vite or embed into a larger React application.

## Repository Description

This project provides a reusable dice roller feature with:

- 3D dice rendering using Three.js through React Three Fiber
- Roll animation with staggered motion and face alignment
- Dice pool controls for d4, d6, d8, d10, d12, and d20
- Roll history with grouped die values and totals
- Programmatic rolling API via React ref
- Optional notation parsing for string-based roll requests
- Lightweight global state management with Zustand

## Tech Stack

- React 19
- TypeScript
- Vite
- Three.js, @react-three/fiber, @react-three/drei
- @react-three/rapier (installed dependency)
- Zustand
- Leva (debug control for animation speed)

## Getting Started

### 1. Install dependencies

```bash
npm install
```

### 2. Start development server

```bash
npm run dev
```

### 3. Build for production

```bash
npm run build
```

### 4. Preview production build

```bash
npm run preview
```

## Usage Guide

### Basic usage in app

Render the feature component directly:

```tsx
import { DiceRollerFeature } from "./features/dice-roller/DiceRollerFeature";

export default function App() {
	return <DiceRollerFeature />;
}
```

### User flow

1. Increase or decrease dice counts per die type with +/- controls.
2. Click **Roll Dice**.
3. Watch 3D dice tumble and settle.
4. Read grouped results and total in History.

### Roll history behavior

- The newest roll appears first.
- While dice are still animating, the newest entry shows a pending state.
- Kept/dropped and min/max values are visually distinguished in the history UI.

## Programmatic API

`DiceRollerFeature` exposes an imperative API through `ref`:

```ts
type RollRequest = string | Partial<Record<"d4" | "d6" | "d8" | "d10" | "d12" | "d20", number>>;

interface DiceRollerAPI {
	triggerRoll: (request: RollRequest) => void;
	clearHistory: () => void;
}
```

### Example: trigger rolls from parent component

```tsx
import { useRef } from "react";
import {
	DiceRollerFeature,
} from "./features/dice-roller/DiceRollerFeature";
import type { DiceRollerAPI } from "./features/dice-roller/types";

export default function Parent() {
	const diceRef = useRef<DiceRollerAPI>(null);

	return (
		<>
			<button onClick={() => diceRef.current?.triggerRoll("4d6kh3")}>Roll 4d6 Keep Highest 3</button>
			<button onClick={() => diceRef.current?.triggerRoll({ d20: 1 })}>Roll 1d20</button>
			<button onClick={() => diceRef.current?.clearHistory()}>Clear History</button>

			<DiceRollerFeature
				ref={diceRef}
				onRollComplete={(result) => {
					console.log("Roll complete:", result.total, result.rolls);
				}}
			/>
		</>
	);
}
```

## Supported Dice Types

- d4
- d6
- d8
- d10
- d12
- d20

## Roll Request Formats

### 1. Object pool format

Use explicit die counts:

```ts
{ d6: 2, d8: 1 }
```

### 2. String notation format

Use tabletop-style notation:

- `2d20`
- `4d6kh3`
- `2d10 + 1d4 - 2`

String notation is parsed into:

- dice pool
- keep-highest or keep-lowest rules (`kh` / `kl`)
- flat modifier

## Project Structure

```text
src/
	features/
		dice-roller/
			DiceRollerFeature.tsx
			types.ts
			components/
				canvas/
					DiceScene.tsx
					InstancedPolyhedron.tsx
				ui/
					DiceControls.tsx
					RollHistory.tsx
			hooks/
				useDiceNormals.ts
			store/
				useDiceStore.ts
			utils/
				audioEngine.ts
				layout.ts
				parser.ts
```

## Assets

This feature expects static assets in `public/`:

- `public/models/*.glb` for each die geometry
- `public/audio/dice-clack.mp3` for collision sound effects

## Notes

- Audio playback depends on browser audio context policies and resumes on interaction.
- The dice scene is constrained by CSS sizing in the feature stylesheet.
- `onRollComplete` fires when roll animation lifecycle is complete.

## License

Add your preferred license information here.
