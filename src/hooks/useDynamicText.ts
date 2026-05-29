import { useState, useEffect } from 'react';

export function useDynamicText(originalText: string, isEditor: boolean = false) {
  const [displayText, setDisplayText] = useState(originalText);
  const [opacity, setOpacity] = useState(1);

  useEffect(() => {
    // Basic matchers for {{time}} and {{timer:mm:ss|action}}
    const hasTime = /\{\{time(?::([^}]+))?\}\}/.test(originalText);
    const timerMatch = originalText.match(/\{\{timer:(\d{2}:\d{2})(?:\|([^}]+))?\}\}/);

    if (!hasTime && !timerMatch) {
      setDisplayText(originalText);
      setOpacity(1);
      return;
    }

    let timerTargetTime: number | null = null;
    let timerAction: string | null = null;

    if (timerMatch && !isEditor) {
      const timeStr = timerMatch[1];
      const action = timerMatch[2];
      const [mins, secs] = timeStr.split(':').map(Number);
      timerTargetTime = Date.now() + (mins * 60 + secs) * 1000;
      timerAction = action;
    }

    const tick = () => {
      let newText = originalText;
      let currentOpacity = 1;

      if (hasTime) {
        newText = newText.replace(/\{\{time(?::([^}]+))?\}\}/g, (_match, formatStr) => {
          const now = new Date();
          const format = formatStr || 'HH:mm';
          
          const h24 = now.getHours();
          const h12 = h24 % 12 || 12;
          const m = now.getMinutes().toString().padStart(2, '0');
          const s = now.getSeconds().toString().padStart(2, '0');
          const ampmUpper = h24 >= 12 ? 'PM' : 'AM';
          const ampmLower = h24 >= 12 ? 'pm' : 'am';
          
          let result = format;
          result = result.replace(/HH/g, h24.toString().padStart(2, '0'));
          result = result.replace(/H/g, h24.toString());
          result = result.replace(/hh/g, h12.toString().padStart(2, '0'));
          result = result.replace(/h/g, h12.toString());
          result = result.replace(/mm/g, m);
          result = result.replace(/ss/g, s);
          result = result.replace(/A/g, ampmUpper);
          result = result.replace(/a/g, ampmLower);
          
          return result;
        });
      }

      if (timerMatch) {
        if (isEditor) {
          // Freeze countdown in editor, just show the time string
          newText = newText.replace(timerMatch[0], timerMatch[1]);
        } else if (timerTargetTime !== null) {
          const remaining = Math.max(0, timerTargetTime - Date.now());
          const totalSeconds = Math.ceil(remaining / 1000);

          if (totalSeconds <= 0) {
            if (timerAction === 'hide') {
              currentOpacity = 0;
              newText = newText.replace(timerMatch[0], '00:00');
            } else if (timerAction?.startsWith('text:')) {
              const replacementText = timerAction.substring(5);
              newText = newText.replace(timerMatch[0], replacementText);
            } else {
              newText = newText.replace(timerMatch[0], '00:00');
            }
          } else {
            const m = Math.floor(totalSeconds / 60).toString().padStart(2, '0');
            const s = (totalSeconds % 60).toString().padStart(2, '0');
            newText = newText.replace(timerMatch[0], `${m}:${s}`);
          }
        }
      }

      setDisplayText(newText);
      setOpacity(currentOpacity);
    };

    // Run immediately once
    tick();

    const interval = setInterval(tick, 100);

    return () => clearInterval(interval);
  }, [originalText]);

  return { displayText, opacity };
}
