let updateBgImgHeight = () => {
  document.getElementsByClassName("jm-background-img")[0].style.height =
    `${document.getElementsByClassName("bg-content")[0].offsetHeight + 70}px`;
};
setTimeout(updateBgImgHeight, 1000);
function shuffle(a) {
    for (let i = a.length; i; i--) {
        let j = Math.floor(Math.random() * i);
        [a[i - 1], a[j]] = [a[j], a[i - 1]];
    }
    return a;
}
const backgroundImages = shuffle([
  "/images/bluebox-wallpaper.jpg",
  "/images/lightblue-wallpaper.jpg",
  "/images/prism-wallpaper.jpg",
  "/images/green-wallpaper.jpg",
]);
let preloadImages = imageUrls => {
  for (let i=0; i<imageUrls.length; i++) {
    let img = new Image();
    img.src = imageUrls[i];
  }
};
preloadImages(backgroundImages);
window.onload = () => {
  let util = {
    escapeHtml: html => {
      let text = document.createTextNode(html);
      let div = document.createElement("div");
      div.appendChild(text);
      return div.innerHTML;
    }
  };
  handleBgImages(util);
  handleJmConsole(util);
};

let handleBgImages = util => {
  let bgElement = document.getElementsByClassName("jm-background-img")[0];
  let bgIndex = 0;
  bgElement.style.transition = "background-image 1s";
  util.changeBg = () => {
    bgElement.style.backgroundImage = `url('${backgroundImages[bgIndex++ % backgroundImages.length]}')`;
  };
  util.changeBg();
};

let handleJmConsole = util => {
  let consoleElement = document.getElementById("jm-console-input");
  let consoleInstructionsElement = document.getElementById("jm-console-instructions");
  let setInstructions = instruction => {
    let toHtml = instruction => {
      let html = "";
      for (let i = 0; i < instruction.length; i++) {
        if (instruction.charAt(i) == "`") {
          for (let j = i+1; j < instruction.length; j++) {
            if (instruction.charAt(j) == "`") {
              let opening = '<span style="color: #ef5350">';
              let closing = '</span>';
              instruction = instruction.substring(0, i)
                + opening
                + instruction.substring(i+1, j)
                + closing
                + instruction.substring(j+1);
              i = j + closing.length;
              break;
            }
          }
        }
      }
      return instruction;
    };
    consoleInstructionsElement.innerHTML = toHtml(instruction);
  };
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
            let command = commands[key];
            let aliasesStr = '';
            if (command.aliases) {
              const separator = " / ";
              aliasesStr = separator;
              aliasesStr += command.aliases.join(separator);
            }
            helpAvailableCmds += `\`${key}${aliasesStr}\` - ${commands[key].description}<br>`;
          }
          helpAvailableCmds += "<br>More commands available soon™.";
          setInstructions(helpAvailableCmds);
        }
      },
      "blackboard": {
        description: "show/hide the blackboard!",
        run: () => {
          let contentElement = document.getElementsByClassName("content")[0];
          let blackboardContainer = document.getElementsByClassName("blackboard-container");
          if (blackboardContainer.length) {
            contentElement.removeChild(blackboardContainer[0]);
            setInstructions("See ya later bb.");
          } else {
            let blackboard = new Blackboard();
            contentElement.appendChild(blackboard.element);
            blackboard.element.scrollIntoView({
              behavior: "smooth",
              block: "end",
            });
            resetConsole();
          }
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
      },
      "exit": {
        description: "get me outta here",
        run: () => {
          util.consoleLogout();
        },
        aliases: ["logout"]
      }
    };
    for (key in commands) {
      let command = commands[key];
      if (cmd == key || (command.aliases && command.aliases.indexOf(cmd) !== -1)) {
        commands[key].run();
        return;
      } else if (cmd.toLowerCase() == key.toLowerCase()) {
        setInstructions(`all lowercase please, this is a shift-unfriendly console..
          <br>"${cmd}" -> "${key}"`);
        return;
      }
    }
    setInstructions(`\`${cmd}\` is not a recognized command 😢
      <br>If you want a list of available commands, try \`help\``);
  };

  async function sleep(ms) {
    await new Promise((resolve) => setTimeout(resolve, ms));
  }
  // Handle commands
  const INIT = 0, LOGGED_IN = 1;
  let state = INIT;
  const welcomeMsg = "Type `help` for more commands.";
  let resetConsole = () => {
    state = LOGGED_IN;
    setInstructions(welcomeMsg);
  }
  resetConsole();
  setInstructions("Launching blackboard...");
  setTimeout(() => {
    processCmdLoggedIn("blackboard");
  }, 2500);
  util.consoleLogout = resetConsole;
  let computingCmd = false;
  let processCmd = async cmd => {
    util.clearConsole();
    if (!cmd) return;
    switch (state) {
      case INIT:
        if (cmd === "CORRECT_PASSWORD") {
          setInstructions("Validating password...");
          consoleElement.disabled = true;
          await sleep(400 + Math.random()*300);
          setInstructions("Access unlocked.<br>"
           + " Try `help` to start off.");
           consoleElement.disabled = false;
           consoleElement.focus();
           state = LOGGED_IN;
        }
        break;
      case LOGGED_IN:
        processCmdLoggedIn(cmd);
        break;
    }
    updateBgImgHeight();
  };

  // Add key events for handling input
  consoleElement.onkeypress = e => {
    e = e || window.event;
    let keyCode = e.keyCode || e.which;
    if (keyCode == 13) {
      processCmd(util.escapeHtml(consoleElement.value));
      return false;
    }
  };

  // Focus console input is console is clicked
  document.getElementById("jm-console").onclick = () => {
    consoleElement.focus();
  };
};
