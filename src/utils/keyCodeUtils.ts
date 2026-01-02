// Convert KeyboardEvent.code to user-friendly display format
// Examples: "KeyW" -> "W", "Digit1" -> "1", "Space" -> "Space"
export function formatKeyCode(code: string): string {
  if (!code) return '';
  
  // Handle letter keys: KeyA -> A
  if (code.startsWith('Key')) {
    return code.replace('Key', '');
  }
  
  // Handle digit keys: Digit1 -> 1
  if (code.startsWith('Digit')) {
    return code.replace('Digit', '');
  }
  
  // Handle numpad keys: Numpad1 -> Num1
  if (code.startsWith('Numpad')) {
    return code.replace('Numpad', 'Num');
  }
  
  // Common special keys
  const specialKeys: Record<string, string> = {
    'Space': 'Space',
    'Enter': 'Enter',
    'Tab': 'Tab',
    'Backspace': 'Backspace',
    'ArrowUp': '↑',
    'ArrowDown': '↓',
    'ArrowLeft': '←',
    'ArrowRight': '→',
    'Minus': '-',
    'Equal': '=',
    'BracketLeft': '[',
    'BracketRight': ']',
    'Backslash': '\\',
    'Semicolon': ';',
    'Quote': "'",
    'Comma': ',',
    'Period': '.',
    'Slash': '/',
    'Backquote': '`',
  };
  
  return specialKeys[code] || code;
}

// Validate if a code is acceptable for hotkey
export function isValidHotkey(code: string): boolean {
  // Exclude modifier keys and special system keys
  const invalidCodes = [
    'ShiftLeft', 'ShiftRight',
    'ControlLeft', 'ControlRight',
    'AltLeft', 'AltRight',
    'MetaLeft', 'MetaRight',
    'CapsLock', 'NumLock', 'ScrollLock',
    'ContextMenu',
    'Escape', // Reserved for canceling
  ];
  
  return !invalidCodes.includes(code);
}
