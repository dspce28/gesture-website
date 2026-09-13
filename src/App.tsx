import { useEffect, useState } from 'react';
import { PipelineCheck } from './components/PipelineCheck';
import { ScrollLab } from './components/ScrollLab';
import './App.css';

type View = 'scroll' | 'pipeline';

/**
 * Two development views, selected by hash so a reload keeps your place.
 * These are scaffolding for building the engine, not the eventual site.
 */
export default function App() {
  const [view, setView] = useState<View>(
    () => (location.hash === '#pipeline' ? 'pipeline' : 'scroll')
  );

  useEffect(() => {
    const onHash = () =>
      setView(location.hash === '#pipeline' ? 'pipeline' : 'scroll');
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  const go = (v: View) => {
    location.hash = v === 'pipeline' ? '#pipeline' : '#scroll';
  };

  return (
    <>
      <nav className="switch">
        <button
          className={view === 'scroll' ? 'on' : ''}
          onClick={() => go('scroll')}
        >
          Scroll feel
        </button>
        <button
          className={view === 'pipeline' ? 'on' : ''}
          onClick={() => go('pipeline')}
        >
          Pipeline
        </button>
      </nav>

      {view === 'scroll' ? <ScrollLab /> : <PipelineCheck />}
    </>
  );
}
