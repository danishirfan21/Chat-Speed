import { useState } from 'react';
import './App.css';
import { motion } from 'framer-motion';
import NeoSkeuomorphicToggle from './components/reactor/neo-toggle';
// import MetricsGrid from './components/reactor/metrics-grid';
import ScanningLineAnimation from './components/reactor/scanning-line';
// import Header from './components/reactor/chat-header';

const App = () => {
  const [isActive, setIsActive] = useState(false);
  // const [ramSaved, setRamSaved] = useState(0);
  // const [nodesPruned, setNodesPruned] = useState(0);
  // const [latency, setLatency] = useState(0);
  // const [isScanning, setIsScanning] = useState(false);

  // Simulate real-time metrics updates
  // useEffect(() => {
    // if (!isActive) return;

    // setIsScanning(true);

    // const ramInterval = setInterval(() => {
    //   setRamSaved((prev) => {
    //     const increase = Math.random() * 5 + 2;
    //     return Math.min(prev + increase, 512);
    //   });
    // }, 800);

    // const nodesInterval = setInterval(() => {
    //   setNodesPruned((prev) => {
    //     const increase = Math.floor(Math.random() * 15 + 8);
    //     return prev + increase;
    //   });
    // }, 600);

  //   const latencyInterval = setInterval(() => {
  //     setLatency(Math.max(0, Math.random() * 25 + 5));
  //   }, 1000);

  //   return () => {
  //     clearInterval(ramInterval);
  //     clearInterval(nodesInterval);
  //     clearInterval(latencyInterval);
  //   };
  // }, [isActive]);

  const handleToggle = (newState: boolean) => {
    setIsActive(newState);
    // if (!newState) {
    //   setRamSaved(0);
    //   setNodesPruned(0);
    //   setLatency(0);
    // }
  };

  return (
    <div className="min-h-screen bg-background text-foreground overflow-hidden">
      {/* Background Gradient Mesh */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-accent/5 via-background to-background" />
        <div className="absolute top-0 right-0 w-96 h-96 bg-accent/5 rounded-full blur-3xl opacity-20" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl opacity-20" />
      </div>

      {/* Circuit Board Texture */}
      <div className="fixed inset-0 circuit-texture pointer-events-none opacity-30" />

      {/* Main Content */}
      <div className="relative z-10">
        {/* <Header isActive={isActive} /> */}

        {/* Master Control Section */}
        <div className="px-6 py-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="flex flex-col items-center gap-8 mb-12"
          >
            {/* Heading */}
            <div className="text-center">
              <h1 className="text-3xl font-bold mb-2 text-transparent bg-clip-text bg-gradient-to-r from-primary via-accent to-primary">
                Surgical Network Graft
              </h1>
              <p className="text-muted-foreground text-sm tracking-wide uppercase">
                O(1) JSON Data Stream Pruning
              </p>
            </div>

            {/* Master Switch - 3D Neo-Skeuomorphic Toggle */}
            <div className="relative">
              <div className="absolute inset-0 rounded-3xl blur-2xl bg-gradient-to-r from-primary to-accent opacity-0 group-hover:opacity-20 transition-opacity" />
              <NeoSkeuomorphicToggle isActive={isActive} onChange={handleToggle} />
            </div>

            {/* Status Indicator */}
            <motion.div
              animate={{ opacity: isActive ? 1 : 0.5 }}
              className="flex items-center gap-2"
            >
              <motion.div
                animate={{
                  boxShadow: isActive
                    ? ['0 0 20px rgba(0, 245, 255, 0.8)', '0 0 40px rgba(0, 245, 255, 0.4)']
                    : '0 0 0px rgba(0, 245, 255, 0)',
                }}
                transition={{ duration: 2, repeat: Infinity }}
                className="w-3 h-3 rounded-full bg-accent"
              />
              <span className="text-sm text-muted-foreground font-mono">
                {isActive ? 'ACTIVE' : 'STANDBY'}
              </span>
            </motion.div>
          </motion.div>

          {/* Metrics Grid Section */}
          {isActive && (
            <>
              <ScanningLineAnimation />
              {/* <MetricsGrid
                ramSaved={ramSaved}
                nodesPruned={nodesPruned}
                latency={latency}
                isScanning={isScanning}
              /> */}
            </>
          )}

          {/* Idle State Message */}
          {!isActive && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="flex justify-center"
            >
              <div className="glass-card px-8 py-6 max-w-md text-center border-accent/30">
                <p className="text-muted-foreground text-sm">
                  Enable ChatSpeed to start intercepting and pruning ChatGPT's JSON data streams in real-time.
                </p>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
};

export default App;