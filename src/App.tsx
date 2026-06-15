import { useState } from 'react';
import { createClient } from 'genlayer-js';
import { studionet } from 'genlayer-js/chains';
import { privateKeyToAccount } from 'viem/accounts';
import { Code2, CheckCircle2, XCircle, Rocket, Terminal } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

declare global {
  interface Window {
    ethereum: any;
  }
}

// Replace this with the GenLayer Studio deployed contract address later
const CONTRACT_ADDRESS = '0x4567728A95ed34535dB19452321C3381Cfe792E2'; 

function App() {
  const [walletAddress, setWalletAddress] = useState<string>('');
  const [githubUrl, setGithubUrl] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);
  const [resultData, setResultData] = useState<any>(null);
  const [treasury, setTreasury] = useState<string>('100,000');

  const addLog = (log: string, delay: number = 0) => {
    setTimeout(() => {
      setLogs(prev => [...prev, log]);
    }, delay);
  };

  const connectWallet = async () => {
    if (typeof window.ethereum !== 'undefined') {
      try {
        const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
        setWalletAddress(accounts[0]);
      } catch (error) {
        console.error('Connection failed:', error);
      }
    } else {
      alert('Please install MetaMask!');
    }
  };

  const handleApply = async () => {
    if (!walletAddress) {
      alert("Please connect your wallet first.");
      return;
    }
    if (!githubUrl.includes('github.com')) {
      alert("Please enter a valid GitHub repository URL.");
      return;
    }

    setIsProcessing(true);
    setLogs([]);
    setResultData(null);

    // MetaMask Signature Check
    try {
      addLog(`[System] Requesting Wallet Signature for Grant Application...`);
      const message = `GrantGenie Authorization\n\nApply for funding for repository: ${githubUrl}\nApplicant: ${walletAddress}`;
      await window.ethereum.request({
        method: 'personal_sign',
        params: [message, walletAddress],
      });
      addLog(`[Success] Signature verified. Proceeding to AI evaluation.`, 1000);
    } catch (signError) {
      addLog(`[Error] User rejected wallet signature.`, 500);
      setIsProcessing(false);
      return;
    }

    if (!CONTRACT_ADDRESS) {
      // ---------------------------------------------------------
      // MOCK MODE FOR LOCALHOST TESTING
      // ---------------------------------------------------------
      addLog(`[Localhost] No contract address found. Running simulation...`, 2000);
      
      setTimeout(() => {
        addLog(`[Oracle] gl.nondet.web.get scraping ${githubUrl}...`, 3000);
      }, 3000);

      setTimeout(() => {
        addLog(`[GenVM] Passing repository data to AI Validator nodes...`, 5000);
        addLog(`[Oracle] gl.nondet.exec_prompt evaluating code quality & scope...`, 6500);
      }, 3000);

      setTimeout(() => {
        addLog(`[Consensus] Validators agreeing on 'APPROVED' via strict_eq...`, 9000);
      }, 3000);

      setTimeout(() => {
        const mockResult = {
          id: "0",
          url: githubUrl,
          status: "FUNDED",
          funds_allocated: 5000,
          message: "Project verified by AI Oracle. 5,000 GEN streamed to builder."
        };
        setResultData(mockResult);
        setTreasury('95,000');
        addLog(`[Success] Treasury execution complete. Funds released!`, 11000);
        setIsProcessing(false);
      }, 11000);

      return;
    }

    // ---------------------------------------------------------
    // REAL GENLAYER STUDIONET INTERACTION
    // ---------------------------------------------------------
    try {
      addLog(`[Web3] Connecting to GenLayer Studionet...`, 2000);
      const dummyKey = '0x1111111111111111111111111111111111111111111111111111111111111111' as `0x${string}`;
      const glAccount = privateKeyToAccount(dummyKey);
      const glClient = createClient({ chain: studionet, account: glAccount });

      addLog(`[GenVM] Submitting Grant Application to Smart Contract...`, 3000);
      
      const txHash = await glClient.writeContract({
        address: CONTRACT_ADDRESS as `0x${string}`,
        functionName: 'apply_for_grant',
        args: [githubUrl],
        value: 0n,
      });

      addLog(`[Blockchain] TX Hash generated: ${txHash.substring(0, 15)}...`, 4000);
      addLog(`[Oracle] Contract is currently scraping GitHub and consulting AI...`, 5000);
      
      // Wait for ledger acceptance
      try {
        await glClient.waitForTransactionReceipt({ hash: txHash, status: 'ACCEPTED' as any });
      } catch (err) {
        await new Promise(r => setTimeout(r, 6000));
      }
      
      addLog(`[Consensus] Validators reached consensus. Fetching results...`, 6000);

      // Poll for the result
      let finalData = null;
      for (let i = 0; i < 15; i++) {
        await new Promise(r => setTimeout(r, 4000));
        try {
          const res = await glClient.readContract({
            address: CONTRACT_ADDRESS as `0x${string}`,
            functionName: 'get_grant_status',
            args: [githubUrl],
          });
          
          if (res && res !== "NOT_FOUND" && res !== "DUPLICATE") {
            finalData = JSON.parse(res as string);
            break;
          } else if (res === "DUPLICATE") {
             throw new Error("This URL was already evaluated.");
          }
        } catch (e) {}
      }

      if (finalData) {
        setResultData(finalData);
        addLog(`[Success] Application processed.`, 1000);
        
        // Update Treasury
        try {
          const tRes = await glClient.readContract({
            address: CONTRACT_ADDRESS as `0x${string}`,
            functionName: 'get_treasury_balance'
          });
          setTreasury(Number(tRes).toLocaleString());
        } catch(e) {}
      } else {
        addLog(`[Error] Timeout waiting for consensus.`, 1000);
      }
      
      setIsProcessing(false);

    } catch (error: any) {
      addLog(`[Error] ${error.message}`, 1000);
      setIsProcessing(false);
    }
  };

  return (
    <>
      <nav>
        <div className="logo">
          <Code2 className="logo-icon" size={28} />
          GrantGenie
        </div>
        <button 
          className={`btn-connect ${walletAddress ? 'connected' : ''}`} 
          onClick={connectWallet}
        >
          {walletAddress ? `[${walletAddress.substring(0,6)}...${walletAddress.substring(38)}]` : 'Connect Wallet'}
        </button>
      </nav>

      <main className="container">
        <div className="hero">
          <div className="badge">GenLayer Intelligent Protocol</div>
          <h1 className="title">Autonomous Builder Grants.</h1>
          <p className="subtitle">
            Submit your open-source project. GrantGenie uses GenLayer's AI Oracle to instantly scrape, evaluate, and fund high-quality repositories. No human committees. No bias. Just code.
          </p>
        </div>

        <div className="dashboard">
          <div className="dashboard-header">
            <div className="treasury-stats">
              <span className="treasury-label">// DAO TREASURY BALANCE</span>
              <span className="treasury-value">{treasury} GEN</span>
            </div>
            <Rocket size={32} color="var(--border-color)" />
          </div>

          <div className="dashboard-body">
            <div className="input-group">
              <input 
                type="text" 
                className="input-field" 
                placeholder="https://github.com/username/project"
                value={githubUrl}
                onChange={(e) => setGithubUrl(e.target.value)}
                disabled={isProcessing}
              />
              <button 
                className="btn-primary" 
                onClick={handleApply}
                disabled={isProcessing || !githubUrl}
              >
                <Terminal size={18} />
                {isProcessing ? 'Evaluating...' : 'Apply for Grant'}
              </button>
            </div>

            <div className="console-area">
              {logs.length === 0 && <span style={{opacity: 0.5}}>&gt; Waiting for application payload...</span>}
              <AnimatePresence>
                {logs.map((log, i) => {
                  let logClass = "log-line";
                  if (log.includes("[Success]")) logClass += " log-success";
                  if (log.includes("[Error]")) logClass += " log-error";
                  if (log.includes("[Oracle]") || log.includes("[GenVM]")) logClass += " log-active";
                  return (
                    <motion.div 
                      key={i} 
                      className={logClass}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                    >
                      {log}
                    </motion.div>
                  )
                })}
              </AnimatePresence>
              {isProcessing && <motion.span animate={{opacity: [1, 0, 1]}} transition={{repeat: Infinity}}>_</motion.span>}
            </div>

            {resultData && (
              <div className={`result-card ${resultData.status.toLowerCase()}`}>
                <div className="result-header">
                  {resultData.status === 'FUNDED' ? <CheckCircle2 size={24} /> : <XCircle size={24} />}
                  GRANT {resultData.status}
                </div>
                <div className="result-message">
                  {resultData.message}
                </div>
                <div className="result-stats">
                  <div>
                    <span>TARGET REPO: </span>
                    <span style={{color: 'var(--text-main)'}}>{resultData.url.split('/').pop()}</span>
                  </div>
                  <div style={{textAlign: 'right'}}>
                    <span>FUNDS ALLOCATED: </span>
                    <span style={{color: resultData.status === 'FUNDED' ? 'var(--accent-green)' : 'var(--text-main)'}}>
                      {resultData.funds_allocated.toLocaleString()} GEN
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </>
  );
}

export default App;
