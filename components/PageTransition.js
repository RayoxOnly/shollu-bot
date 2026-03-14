'use client';

import { usePathname } from 'next/navigation';
import { useState, useEffect, useRef } from 'react';
import { Box } from '@mui/material';

export default function PageTransition({ children }) {
  const pathname = usePathname();
  const [displayChildren, setDisplayChildren] = useState(children);
  const [phase, setPhase] = useState('enter'); // 'enter' | 'exit'
  const prevPathname = useRef(pathname);

  useEffect(() => {
    // On first mount, just show with enter animation
    setPhase('enter');
  }, []);

  useEffect(() => {
    if (pathname !== prevPathname.current) {
      // Route changed — start exit phase
      setPhase('exit');

      const timeout = setTimeout(() => {
        // After exit animation, swap content and enter
        setDisplayChildren(children);
        setPhase('enter');
        prevPathname.current = pathname;
      }, 150);

      return () => clearTimeout(timeout);
    } else {
      // Same route, content may have updated (e.g. data fetch)
      setDisplayChildren(children);
    }
  }, [pathname, children]);

  return (
    <Box
      sx={{
        animation: phase === 'enter'
          ? 'pageEnter 0.35s var(--ease-out-quart) both'
          : 'pageExit 0.15s ease-in both',
      }}
    >
      {displayChildren}
    </Box>
  );
}
