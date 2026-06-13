// Iframe embedding support.
//
// URL params:
//   ?game=memory|match3|bubble   — launch straight into a game, skip home screen
//   ?embed=true                  — hide navigation chrome (back button)
//
// postMessage events emitted to window.parent:
//   { type: 'game:ready',    game: string }
//   { type: 'game:complete', game: string, score: number }
//   { type: 'game:back' }   — user pressed the in-game back/close button

import type { GameId } from './store/useAppStore';

const params = new URLSearchParams(window.location.search);

const rawGame = params.get('game');
export const EMBED_GAME: Exclude<GameId, 'home'> | null =
  rawGame === 'memory' || rawGame === 'match3' || rawGame === 'bubble'
    ? rawGame
    : null;

// Hide chrome when ?embed=true is set, or when a specific game is targeted.
export const IS_EMBED = params.get('embed') === 'true' || EMBED_GAME !== null;

export function postMsg(event: Record<string, unknown>): void {
  if (IS_EMBED && window.parent !== window) {
    window.parent.postMessage(event, '*');
  }
}
