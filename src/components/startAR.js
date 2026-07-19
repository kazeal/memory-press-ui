import React, { useState } from 'react';
import './startAR.css';

import MindARThreeViewer from './mindar-three-viewer';

function StartAR() {
  const [started, setStarted] = useState(null);

  const renderViewer = () => {
    if (started === 'three') {
      return (
        <div className="container">
          <MindARThreeViewer />
        </div>
      );
    }
    return null;
  };

  return (
    <div className="StartAR">
      <div className="control-buttons">
        {started === null && (
          <button onClick={() => setStarted('three')}>Start</button>
        )}
        {started !== null && <button onClick={() => setStarted(null)}>Stop</button>}
      </div>

      {renderViewer()}
    </div>
  );
}

export default StartAR;