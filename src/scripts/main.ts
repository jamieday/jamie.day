declare function io(): any;

import { J$, escapeHtml } from './util.js';
import { LoginPayload } from './socket-payloads.js';
import Blackboard from './blackboard.js';

const ws = {
  socket: io(),
  _totalOnline: 0,
  set totalOnline(value) {
    this._totalOnline = value;

    const countElement = <HTMLElement> J$(".online-count");
    countElement.style.visibility = "visible";
    countElement.innerHTML = `${escapeHtml(ws.totalOnline.toString())} <span style="color:#BDBDBD">online</span>`;
  },
  get totalOnline() {
    return this._totalOnline;
  }
};

ws.socket.on('login', onLogin);
ws.socket.on('logout', onLogout);

function onLogin(data: LoginPayload) {
  ws.totalOnline = data.totalOnline;
}

function onLogout(data: LoginPayload) {
  ws.totalOnline = data.totalOnline;
}

const getBackgroundImageElement = () => <HTMLElement> document.getElementsByClassName("jm-background-img")[0];

const updateBgImgHeight = () => {
  getBackgroundImageElement().style.height =
    `${(<HTMLElement> document.getElementsByClassName("bg-content")[0]).offsetHeight + 70}px`;
};

setTimeout(updateBgImgHeight, 1000);
function shuffle<T>(a: T[]) {
    for (let i = a.length; i; i--) {
        let j = Math.floor(Math.random() * i);
        [a[i - 1], a[j]] = [a[j], a[i - 1]];
    }
    return a;
}

// preload images
const backgroundImages = 
  ["/images/prism-wallpaper.jpg"] // this one always first
  .concat(shuffle([
    "/images/bluebox-wallpaper.jpg",
    "/images/lightblue-wallpaper.jpg",
    "/images/green-wallpaper.jpg"
]));
for (let i=0; i<backgroundImages.length; i++) {
  let img = new Image();
  img.src = backgroundImages[i];
}

window.onload = () => {
  handleBgImages();
  handleJmConsole();
};

let changeBg: () => void;

const handleBgImages = () => {
  const bgElement = getBackgroundImageElement();
  let bgIndex = 0;
  bgElement.style.transition = "background-image 1s";
  changeBg = () => {
    bgElement.style.backgroundImage = `url('${backgroundImages[bgIndex++ % backgroundImages.length]}')`;
  }
  changeBg();
};

const handleJmConsole = () => {
  const consoleElement = <HTMLInputElement> J$("#jm-console-input");
  const consoleInstructionsElement = J$("#jm-console-instructions");
  const setInstructions = (instruction: string) => {
    const toHtml = (instruction: string) => {
      for (let i = 0; i < instruction.length; i++) {
        if (instruction.charAt(i) == "`") {
          for (let j = i+1; j < instruction.length; j++) {
            if (instruction.charAt(j) == "`") {
              const opening = '<span style="color: #ef5350">';
              const closing = '</span>';
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
  const clearConsole = () => {
    consoleElement.value = "";
  };

  interface Command {
    description: string;
    run: () => void;
    aliases?: string[];
  }

  let processCmdLoggedIn = (cmd: string) => {
    const commands: { [index:string] : Command } = {
      "help": {
        description: "list all available commands",
        run: () => {
          let helpAvailableCmds = "";
          for (const key in commands) {
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
        description: "show/hide the blackboard",
        run: () => {
          toggleBlackboard(true);
        }
      },
      "changebg": {
        description: "change the background",
        run: () => {
          changeBg();
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
          resetConsole();
        },
        aliases: ["logout"]
      }
    };
    for (const key in commands) {
      const command = commands[key];
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

  async function sleep(ms: number) {
    await new Promise((resolve) => setTimeout(resolve, ms));
  }
  // Handle commands
  const INIT = 0, LOGGED_IN = 1;
  let state = INIT;
  const welcomeMsg = "Type `help` for a list of commands.";
  let resetConsole = () => {
    state = LOGGED_IN;
    setInstructions(welcomeMsg);
  }
  resetConsole();
  const toggleBlackboard = (scrollTo = false) => {
    const contentElement = document.getElementsByClassName("content")[0];
    const blackboardContainer = document.getElementsByClassName("blackboard-container");
    if (blackboardContainer.length) {
      contentElement.removeChild(blackboardContainer[0]);
      setInstructions("Board of that.");
    } else {
      const blackboard = new Blackboard(ws);
      contentElement.appendChild(blackboard.element);
      if (scrollTo) {
        blackboard.element.scrollIntoView({
          behavior: "smooth",
          block: "end",
        });
      }
      resetConsole();
    }
  };
  setTimeout(toggleBlackboard, 1000); // todo onFadeInComplete()
  let computingCmd = false;
  let processCmd = async (cmd: string) => {
    clearConsole();
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
      processCmd(escapeHtml(consoleElement.value));
      return false;
    }
  };

  // Focus console input if console is clicked
  (<HTMLElement> J$("#jm-console")).onclick = () => {
    consoleElement.focus();
  };
};
