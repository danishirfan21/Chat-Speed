const inject = () => {
  // This selector changes often, you'll need to inspect ChatGPT 
  // to find the main scrollable div or its parent.
  const target = document.querySelector('main'); 

  if (target && !document.getElementById('chatspeed-root')) {
    const rootDiv = document.createElement('div');
    rootDiv.id = 'chatspeed-root';
    
    // Position it absolutely or fixed for now just to see it
    rootDiv.style.cssText = "position: fixed; top: 10px; right: 10px; z-index: 9999; background: white; border: 2px solid red; padding: 10px; color: black;";
    rootDiv.innerText = "ChatSpeed is Active";
    
    target.appendChild(rootDiv);
  }
}

// Simple poller to wait for the UI to load
setInterval(inject, 2000);
