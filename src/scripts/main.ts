import { J$, escapeHtml } from './util.js';
import { LoginPayload } from './socket-payloads.js';
import Blackboard from './blackboard.js';
// import * as showdown from './modules/showdown/showdown.js';

const markdownConverter = new showdown.Converter();

export class WebSocketInfo {
  public socket: SocketIOClient.Socket;
  private _totalOnline: number;
  
  constructor(socket: SocketIOClient.Socket) {
    this.socket = socket;
    this._totalOnline = 0;
  }

  set totalOnline(value) {
    this._totalOnline = value;

    const countElement = <HTMLElement> J$(".online-count");
    countElement.style.visibility = "visible";
    countElement.innerHTML = `${escapeHtml(ws.totalOnline.toString())} <span style="color:#BDBDBD">online</span>`;
  }
  get totalOnline() {
    return this._totalOnline;
  }
}

const ws = new WebSocketInfo(io());

ws.socket.on('login', onLogin);
ws.socket.on('logout', onLogout);

function onLogin(data: LoginPayload) {
  ws.totalOnline = data.totalOnline;
}

function onLogout(data: LoginPayload) {
  ws.totalOnline = data.totalOnline;
}

const getBackgroundImageElement = () => <HTMLElement> document.getElementsByClassName("jm-background-img")[0];

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

class MarkdownFile {
  filename: string;
  content: Promise<string>

  constructor(filename: string) {
    this.filename = filename;
    this.content = (async () => (await fetch(filename)).text())();
  }
}

// preload text
const markdownFiles = {
  techInfo: new MarkdownFile("/text/tech-info.md")
};


window.onload = () => {
  handleBgImages();
  handleJmConsole();
};

let changeBg: () => void;

const handleBgImages = () => {
  const bgElement = getBackgroundImageElement();
  let bgIndex = 0;
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
          helpAvailableCmds += "<br>New commands are actively being developed!";
          setInstructions(helpAvailableCmds);
        }
      },
      "tech-info": {
        description: "read how jamieday.ca works",
        run: async () => {
          const techInfoContent = document.createElement('div');
          techInfoContent.innerHTML = markdownConverter.makeHtml(await markdownFiles.techInfo.content);

          replaceContent(techInfoContent, true);
          resetConsole();
        }
      },
      "blackboard": {
        description: "toggle the online blackboard",
        run: () => {
          const containerId = 'blackboard-container';
          const blackboardContainer = document.getElementById(containerId);
      
          if (blackboardContainer !== null) {
            collapseContent();
            setInstructions("Board of that! Type `help` for more.");
          } else {
            const blackboardContainer = document.createElement("div");
            blackboardContainer.id = containerId;
      
            const blackboard = new Blackboard(ws);
            blackboard.attachTo(blackboardContainer);
      
            replaceContent(blackboardContainer, true);
            resetConsole();
          }
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
      "github": {
        description: "open my github in a new tab",
        run: () => {
          window.open('https://github.con/jday370/', '_blank');
        }
      },
      "exit": {
        description: "reset console",
        run: () => {
          resetConsole();
        },
        aliases: ["logout", "reset"]
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
  
  const getContentContainerElement = () => <HTMLElement> document.getElementsByClassName("content-container")[0];

  const initialPadding = getContentContainerElement().style.padding;

  function collapseContent() {
    const contentContainer = getContentContainerElement();
    contentContainer.style.display = "none";
    contentContainer.innerHTML = '';
  }
  function replaceContent(element: HTMLElement, autoScroll = false) {
    const contentContainer = getContentContainerElement();
    contentContainer.style.display = "flex";
    contentContainer.innerHTML = '';

    contentContainer.appendChild(element);

    if (autoScroll) {
      contentContainer.scrollIntoView({
        behavior: "smooth",
        block: "end",
      });
    }
  }

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
