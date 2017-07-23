const backgroundImages = [
  "http://wallpapercave.com/wp/zm8bgId.jpg",
  "https://s-media-cache-ak0.pinimg.com/originals/31/80/d2/3180d2c319d8400c096696b687f9a5b5.jpg",
  "/images/sexy-image.jpg",
  "https://image.freepik.com/free-psd/abstract-background-design_1297-84.jpg",
];
let preloadImages = imageUrls => {
  for (let i=0; i<imageUrls.length; i++) {
    let img = new Image();
    img.src = imageUrls[i];
  }
};
window.onload = () => {
  let util = {};
  handleBgImages(util);
  handleJmConsole(util);
};

let handleBgImages = util => {
  preloadImages(backgroundImages);
  let bgElement = document.getElementsByClassName("jm-background-img")[0];
  let bgIndex = 0;
  bgElement.style.backgroundImage = `url('${backgroundImages[bgIndex++]}')`;
  bgElement.style.transition = "background-image 1s";
  util.changeBg = () => {
    bgElement.style.backgroundImage = `url('${backgroundImages[bgIndex++ % backgroundImages.length]}')`;
  };
};

let handleJmConsole = util => {
  let consoleElement = document.getElementById("jm-console");
  let consoleInstructionsElement = document.getElementById("jm-console-instructions");
  let setInstructions = instruction => { consoleInstructionsElement.innerHTML = instruction; };
  util.clearConsole = () => {
    consoleElement.value = "";
  };

  let processCmdLoggedIn = cmd => {
    const commands = {
      "help": {
        description: "list all available commands",
        run: () => {
          let helpAvailableCmds = "";
          for (key in commands) {
            helpAvailableCmds += `${key} - ${commands[key].description}<br>`;
          }
          helpAvailableCmds += "<br>More commands available soon™.";
          setInstructions(helpAvailableCmds);
        }
      },
      "changebg": {
        description: "change the background",
        run: () => {
          util.changeBg();
          setInstructions("Background changed.");
        }
      },
      "linkedin": {
        description: "open my linkedin in a new tab",
        run: () => {
          window.open('https://www.linkedin.com/in/dayjamie/', '_blank');
        }
      }
    };
    for (key in commands) {
      if (cmd == key) {
        commands[key].run();
        return;
      } else if (cmd.toLowerCase() == key.toLowerCase()) {
        setInstructions(`all lowercase please, this is a shift-unfriendly console..
          <br>"${cmd}" -> "${key}"`);
        return;
      }
    }
    setInstructions(`"${cmd}" is not a recognized command 😢
      <br>If you want a list of available commands, try "help"`);
  };

  // Handle commands
  const INIT = 0, LOGGED_IN = 1;;
  let state = INIT
  let swagTimeout, hacked;
  let computingCmd = false;
  let processCmd = async cmd => {
    util.clearConsole();
    if (!cmd) return;
    switch (state) {
      case INIT:
        if (cmd === "jamie is the best") {
          if (swagTimeout) clearTimeout(swagTimeout);
          setInstructions("Validating password...");
          consoleElement.disabled = true;
          await (new Promise((resolve) => setTimeout(resolve, 500+Math.random()*1000)));
          setInstructions("Access unlocked.<br>"
           + " Try \"help\" to start off.");
           consoleElement.disabled = false;
           consoleElement.focus();
          state = LOGGED_IN;
        } else if (!hacked && cmd === "jamie is the worst") {
          setInstructions("Hacking your computer.. please don't close this window.");
          swagTimeout = setTimeout(() => {
            setInstructions("You are now hacked."
              + "<br>If you wish to be unhacked, simply type \"jamie is the best\".");
            hacked = true;
          }, 2500);
        }
        break;
      case LOGGED_IN:
        processCmdLoggedIn(cmd);
        break;
    }
  };

  // Add key events for handling input
  consoleElement.onkeypress = e => {
    e = e || window.event;
    let keyCode = e.keyCode || e.which;
    if (keyCode == 13) {
      processCmd(consoleElement.value);
      return false;
    }
  };
};
