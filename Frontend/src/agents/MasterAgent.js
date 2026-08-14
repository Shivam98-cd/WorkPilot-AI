import React, { useState, useEffect, useRef } from 'react';
import DataFetchAgent from './DataFetchAgent';
import UIUpdateAgent from './UIUpdateAgent';
import StateManagerAgent from './StateManagerAgent';
import IntegrationAgent from './IntegrationAgent';

const MasterAgent = ({ children }) => {
  const [state, setState] = useState({});
  const [data, setData] = useState({});
  const [uiState, setUiState] = useState({});
  const refs = useRef({});

  const stateAgent = StateManagerAgent({ setState, getState: () => state });
  const dataAgent = DataFetchAgent({ setData, getData: () => data });
  const uiAgent = UIUpdateAgent({ setUiState, getUiState: () => uiState, refs });
  const integrationAgent = IntegrationAgent({ 
    setData, 
    setState, 
    setUiState, 
    getData: () => data, 
    getState: () => state,
    getUiState: () => uiState
  });

  // Initialize agents on mount
  useEffect(() => {
    stateAgent.init();
    dataAgent.init();
    uiAgent.init();
    integrationAgent.init();
  }, []);

  return (
    <div>
      {children}
      {/* Agents could expose methods via context or refs */}
    </div>
  );
};

export default MasterAgent;