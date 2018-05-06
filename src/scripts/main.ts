declare const showdown: { Converter: Showdown.ConverterStatic };

import { J$, escapeHtml } from './util.js';
import { SocketEvent, Login, FloatingMsg, CommandEntered } from './shared/socket-payloads.js';
import Blackboard from './blackboard.js';
import { Showdown } from './modules/showdown/showdown.js';

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

ws.socket.on(SocketEvent.Login, onLogin);
ws.socket.on(SocketEvent.Logout, onLogout);

function onLogin(data: Login.Payload) {
  ws.totalOnline = data.totalOnline;
}

function onLogout(data: Login.Payload) {
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
  const setInstructions = (instruction: string, skipEscape: boolean = false) => {
    if (!skipEscape) {
      instruction = escapeHtml(instruction);
    }
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

  const processCmdLoggedIn = (cmd: string) => {
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
            helpAvailableCmds += `\`${escapeHtml(key)}${escapeHtml(aliasesStr)}\` - ${escapeHtml(commands[key].description)}<br>`;
          }
          helpAvailableCmds += "<br>New commands are actively being developed!";
          setInstructions(helpAvailableCmds, true);
        }
      },
      "resume": {
        description: "open my resume",
        run: () => {
          window.open('/resume.pdf', '_blank');
        },
        aliases: ["cv"]
      },
      "tech-info": {
        description: "read how jamieday.ca works",
        run: async () => {
          const techInfoContent = document.createElement('div');
          techInfoContent.className = 'markdown-content';
          techInfoContent.innerHTML = markdownConverter.makeHtml(await markdownFiles.techInfo.content);
          
          replaceContent(techInfoContent);
          techInfoContent.style.opacity = '1';
          
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
      
            replaceContent(blackboardContainer);
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
          window.open('https://github.com/jday370/', '_blank');
        }
      },
      "clear": {
        description: "clear command history",
        run: () => {
          commandHistory.clear();
        },
      },
      "exit": {
        description: "reset console",
        run: () => {
          collapseContent();
          resetConsole();
        },
        aliases: ["logout", "reset"]
      }
    };
    enum CommandError {
      UsedShift,
      UnrecognizedCommand
    }
    function findCommand(cmd: string) {
      if (commands.hasOwnProperty(cmd)) {
        return commands[cmd];
      }
      for (const key in commands) {
        const command = commands[key];
        if (cmd == key || (command.aliases && command.aliases.indexOf(cmd) !== -1)) {
          return command;
        } else if (cmd.toLowerCase() == key.toLowerCase() || (command.aliases && command.aliases.map(s => s.toLowerCase()).indexOf(cmd.toLowerCase()) !== -1)) {
          return CommandError.UsedShift;
        }
      }
      return CommandError.UnrecognizedCommand;
    }

    const commandResult = findCommand(cmd);
    
    if (typeof commandResult === "object") {
      commandResult.run();
      return true;
    } else {
      const cmdEscaped = escapeHtml(cmd);
      const errMessage = commandResult === CommandError.UsedShift
        ? `all lowercase please, this is a shift-unfriendly console..
        <br>\`${cmdEscaped}\` -> \`${cmdEscaped.toLowerCase()}\``
        : `\`${cmdEscaped}\` is not a recognized command 😢
        <br>If you want a list of available commands, try \`help\``;
      setInstructions(errMessage, true);
      return false;
    }
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
  function replaceContent(element: HTMLElement, autoscroll = true) {
    const contentContainer = getContentContainerElement();
    contentContainer.style.display = "flex";
    contentContainer.innerHTML = '';

    contentContainer.appendChild(element);

    if (autoscroll) {
      contentContainer.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }
  }

  const logListElement = <HTMLUListElement> J$('.history-log ul');
  function jLog(message: string) {
    const li = document.createElement('li');
    li.addEventListener('animationend', () => {
      logListElement.removeChild(li);
    });
    li.textContent = message;
    logListElement.appendChild(li);
  }

  ws.socket.on(SocketEvent.FloatingMsg, (data: FloatingMsg.Payload) => {
    addFloatingMessage(data);
  });

  ws.socket.on(SocketEvent.CommandEntered, (data: CommandEntered.Payload) => {
    onCommandEntered(data, false);
  });

  {
    // Logo animations
    const logoElement = <HTMLElement> document.getElementsByClassName('icon-circular')[0];
    
    // Click animation
    logoElement.addEventListener('click', () => {
      if (logoElement.classList.contains('bounce-in')) {
        logoElement.classList.remove('bounce-in');
      }
      logoElement.style.animation = `rotateFun${Math.random() > 0.5 ? 'Reverse' : ''} 1s`;
      setTimeout(() => {
        window.location.replace('/');
      }, 700);
    });
  }

  function onCommandEntered(data: CommandEntered.Payload, local: boolean) {
    if (local) {
      ws.socket.emit(SocketEvent.CommandEntered, data);
    }
    // someone entered a command - other things could be done here  
  }

  function addFloatingMessage(payload: FloatingMsg.Payload) {
    let commandContainer = document.getElementById('floating-msg-container');
    if (commandContainer === null) {
      commandContainer = document.createElement('div');
      commandContainer.id = 'floating-msg-container';
      document.body.appendChild(commandContainer);
    } 

    const commandIndicator = document.createElement('div');
    commandIndicator.className = `floating-msg ${payload.message}`;
    commandIndicator.textContent = payload.message;

    // initial size to pop out then shrink after
    commandIndicator.style.fontSize = '36px';
    
    commandIndicator.style.top = payload.position.top;
    commandIndicator.style.left = payload.position.left;
    commandIndicator.style.right = payload.position.right;

    commandIndicator.addEventListener('animationend', evt => {
      (<HTMLElement> commandContainer).removeChild(commandIndicator);
    });
    commandContainer.appendChild(commandIndicator);

    // see https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_Transitions/Using_CSS_transitions#JavaScript_examples
    setTimeout(() => {
      commandIndicator.style.fontSize = `${payload.fontSizePx}px`;
    }, 50);
  }

  class CommandHistory { 
    private static readonly historyStorageKey: string = 'JD_HISTORY_STORAGE';

    private readonly storage: Storage;

    private history: string[]; 
    private pointer: number = 0;

    constructor(storage: Storage) {
      this.storage = storage;
      this.history = this.load();
      this.pointer = this.history.length;
    }

    private load() {
      const existingHistoryJson = this.storage.getItem(CommandHistory.historyStorageKey);
      if (existingHistoryJson === null) {
        return [];
      }
      return <string[]> JSON.parse(existingHistoryJson);
    }

    save() {
      this.storage.setItem(CommandHistory.historyStorageKey, JSON.stringify(this.history));
    }

    get currentEntry() {
      if (this.pointer < 0 || this.pointer >= this.history.length) return null;
      return this.history[this.pointer];
    }

    addEntry(entry: string) {
      this.history.push(entry);
      this.pointer = this.history.length; // keep pointer after history
    }

    clear() {
      this.history = [];
      this.pointer = 0;
      this.save();
    }

    moveUp(currentInput: string) {
      if (this.history.length === 0) {
        this.addEntry(currentInput);
      }
      if (this.pointer > 0)
        this.pointer--;
      return this.currentEntry;
    }

    moveDown(currentInput: string) {
      if (this.pointer > this.history.length - 1)
        return currentInput;
      
      this.pointer++;
      return this.currentEntry;
    }
  }

  const commandHistory = new CommandHistory(localStorage);
  
  const processCmd = async (cmd: string) => {
    clearConsole();
    if (!cmd.trim()) return;
    switch (state) {
      case INIT:
        if (cmd === "CORRECT_PASSWORD") {
          setInstructions("Validating password...");
          consoleElement.disabled = true;
          await sleep(400 + Math.random()*300);
          setInstructions("Access unlocked.<br>"
           + " Try `help` to start off.", true);
           consoleElement.disabled = false;
           consoleElement.focus();
           state = LOGGED_IN;
        }
        break;
      case LOGGED_IN:
        commandHistory.addEntry(cmd);
        commandHistory.save();

        const success = processCmdLoggedIn(cmd);
        onCommandEntered(new CommandEntered.Payload(cmd, success), true);
        break;
    }
  };

  // Add key events for handling input
  consoleElement.onkeypress = e => {
    e = e || window.event;
    const keyCode = e.keyCode || e.which;

    if (keyCode == 13) { // press enter
      processCmd(consoleElement.value);
      return false;
    }
  };

  consoleElement.onkeydown = e => {
    e = e || window.event;
    const keyCode = e.keyCode || e.which;

    if (keyCode == 38) { // press up arrow
      consoleElement.value = commandHistory.moveUp(consoleElement.value) || '';
      return false;
    }
    if (keyCode == 40) { // press down arrow
      consoleElement.value = commandHistory.moveDown(consoleElement.value) || '';
      return false;
    }
  };

  // Focus console input if console is clicked
  (<HTMLElement> J$("#jm-console")).onclick = () => {
    consoleElement.focus();
  };
};
